const { pool } = require('../config/database');

function getDaysRemaining(expiryDate) {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
}

function getStatus(daysLeft) {
  if (daysLeft < 14) return { label: 'Critical', color: 'red' };
  if (daysLeft <= 30) return { label: 'Warning', color: 'yellow' };
  return { label: 'Safe', color: 'green' };
}

function enrichBatch(batch) {
  const daysLeft = batch.daysLeft ?? getDaysRemaining(batch.expiryDate);
  const status = getStatus(daysLeft);
  return {
    ...batch,
    daysLeft,
    status: batch.status || status.label,
    statusColor: status.color,
    quantityAdded: batch.quantityAdded ?? batch.quantityRemaining,
    category: batch.category || 'General',
  };
}

async function getNextId(client, table, column) {
  const { rows } = await client.query(`SELECT COALESCE(MAX(${column}), 0) + 1 AS next_id FROM ${table}`);
  return Number(rows[0].next_id);
}

async function processExpiredWaste() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(481905)');
    const { rows: expiredBatches } = await client.query(`
      SELECT batch_id AS "batchId", product_id AS "productId", quantity
      FROM batch
      WHERE expiry_date <= CURRENT_DATE AND quantity > 0
      FOR UPDATE
    `);

    for (const batch of expiredBatches) {
      const existingWaste = await client.query('SELECT waste_id FROM waste WHERE batch_id = $1 AND reason = $2 LIMIT 1', [batch.batchId, 'Expired']);
      if (!existingWaste.rowCount) {
        const wasteId = await getNextId(client, 'waste', 'waste_id');
        await client.query('INSERT INTO waste (waste_id, prod_id, batch_id, quantity_wasted, waste_date, reason) VALUES ($1, $2, $3, $4, NOW(), $5)', [wasteId, batch.productId, batch.batchId, batch.quantity, 'Expired']);
      }
      await client.query('UPDATE batch SET quantity = 0 WHERE batch_id = $1', [batch.batchId]);
      await client.query('UPDATE inventory SET days_left = 0, status = $1 WHERE batch_id = $2', ['Expired', batch.batchId]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getProducts() {
  const { rows } = await pool.query('SELECT prod_id AS "productId", product_name AS name, cost_price AS "costPrice", selling_price AS "sellingPrice" FROM product ORDER BY product_name ASC');
  return rows;
}

async function createProduct({ name, costPrice, sellingPrice }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(481902)');
    const productId = await getNextId(client, 'product', 'prod_id');
    const { rows } = await client.query('INSERT INTO product (prod_id, product_name, cost_price, selling_price) VALUES ($1, $2, $3, $4) RETURNING prod_id AS "productId", product_name AS name, cost_price AS "costPrice", selling_price AS "sellingPrice"', [productId, name.trim(), Number(costPrice), Number(sellingPrice)]);
    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateProduct(productId, { name, costPrice, sellingPrice }) {
  const { rows } = await pool.query(`
    UPDATE product
    SET product_name = $2, cost_price = $3, selling_price = $4
    WHERE prod_id = $1
    RETURNING prod_id AS "productId", product_name AS name, cost_price AS "costPrice", selling_price AS "sellingPrice"
  `, [Number(productId), name.trim(), Number(costPrice), Number(sellingPrice)]);
  if (!rows.length) throw Object.assign(new Error('Product not found.'), { statusCode: 404 });
  return rows[0];
}

async function deleteProduct(productId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const product = await client.query('SELECT prod_id FROM product WHERE prod_id = $1 FOR UPDATE', [Number(productId)]);
    if (!product.rowCount) throw Object.assign(new Error('Product not found.'), { statusCode: 404 });
    const sales = await client.query('SELECT 1 FROM history WHERE prod_id = $1 LIMIT 1', [Number(productId)]);
    if (sales.rowCount) {
      throw Object.assign(new Error('This product cannot be deleted because it has sales history.'), { statusCode: 409 });
    }
    await client.query('DELETE FROM analytics WHERE product_id = $1', [Number(productId)]);
    await client.query('DELETE FROM inventory WHERE prod_id = $1', [Number(productId)]);
    await client.query('DELETE FROM batch WHERE product_id = $1', [Number(productId)]);
    await client.query('DELETE FROM product WHERE prod_id = $1', [Number(productId)]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getInventoryLedger({ includeExpired = false } = {}) {
  await processExpiredWaste();
  const { rows } = await pool.query(`
    SELECT b.batch_id AS "batchId", b.product_id AS "productId", b.batch_number AS "batchNumber",
      b.quantity AS "quantityRemaining", b.expiry_date AS "expiryDate", b.time_of_stamps AS "createdAt", i.days_left AS "daysLeft",
      i.status, p.product_name AS name, p.cost_price AS "productCost", p.selling_price AS "sellingPrice"
    FROM batch b
    JOIN product p ON p.prod_id = b.product_id
    LEFT JOIN inventory i ON i.batch_id = b.batch_id AND i.prod_id = b.product_id
    WHERE ($1 OR b.expiry_date > CURRENT_DATE)
    ORDER BY b.expiry_date ASC
  `, [includeExpired]);
  return rows.map(enrichBatch);
}

async function getDashboardOverview() {
  const [inventory, sales, wasteResult] = await Promise.all([
    getInventoryLedger(),
    pool.query('SELECT h.quantity_sold AS quantity, p.selling_price AS selling_price, p.cost_price AS cost_price FROM history h JOIN product p ON p.prod_id = h.prod_id'),
    pool.query('SELECT COALESCE(SUM(w.quantity_wasted * p.cost_price), 0) AS "wasteLoss" FROM waste w JOIN product p ON p.prod_id = w.prod_id'),
  ]);
  const grossRevenue = sales.rows.reduce((sum, sale) => sum + Number(sale.quantity) * Number(sale.selling_price), 0);
  const cogs = sales.rows.reduce((sum, sale) => sum + Number(sale.quantity) * Number(sale.cost_price), 0);
  const wasteLoss = Number(wasteResult.rows[0]?.wasteLoss || 0);
  return {
    totalStock: inventory.reduce((sum, batch) => sum + Number(batch.quantityRemaining), 0),
    criticalCount: inventory.filter((batch) => batch.statusColor === 'red').length,
    warningCount: inventory.filter((batch) => batch.statusColor === 'yellow').length,
    safeCount: inventory.filter((batch) => batch.statusColor === 'green').length,
    grossRevenue,
    cogs,
    wasteLoss,
    netProfit: grossRevenue - cogs - wasteLoss,
    inventory,
  };
}

async function addInventoryBatch(payload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const product = await client.query('SELECT prod_id FROM product WHERE prod_id = $1 FOR SHARE', [Number(payload.productId)]);
    if (!product.rowCount) throw Object.assign(new Error('Product not found.'), { statusCode: 404 });
    await client.query('SELECT pg_advisory_xact_lock(481903)');
    const batchId = await getNextId(client, 'batch', 'batch_id');
    const inventoryId = await getNextId(client, 'inventory', 'inventory_id');
    const expiryDate = new Date(payload.expiryDate);
    const daysLeft = getDaysRemaining(expiryDate);
    const status = getStatus(daysLeft).label;
    await client.query('INSERT INTO batch (batch_id, product_id, batch_number, quantity, expiry_date, time_of_stamps) VALUES ($1, $2, $3, $4, $5, NOW())', [batchId, Number(payload.productId), payload.batchNumber, Number(payload.quantityAdded), expiryDate]);
    await client.query('INSERT INTO inventory (inventory_id, prod_id, batch_id, days_left, status) VALUES ($1, $2, $3, $4, $5)', [inventoryId, Number(payload.productId), batchId, daysLeft, status]);
    await client.query('COMMIT');
    return (await getInventoryLedger()).find((batch) => batch.batchId === batchId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function sellTransaction(items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(481904)');
    const saleId = await getNextId(client, 'sale', 'sale_id');
    await client.query('INSERT INTO sale (sale_id, sale_time) VALUES ($1, NOW())', [saleId]);
    let saleTotal = 0;
    const sales = [];

    for (const item of items) {
      const productId = Number(item.productId);
      let remainingToSell = Number(item.quantity);
      const { rows: batches } = await client.query(`
        SELECT b.batch_id AS "batchId", b.quantity AS "quantityRemaining", p.selling_price AS "sellingPrice"
        FROM batch b JOIN product p ON p.prod_id = b.product_id
        WHERE b.product_id = $1 AND b.quantity > 0 AND b.expiry_date >= CURRENT_DATE
        ORDER BY b.expiry_date ASC FOR UPDATE
      `, [productId]);
      if (!batches.length) throw Object.assign(new Error('No active batch found for product ID ' + productId + '.'), { statusCode: 404 });

      for (const batch of batches) {
        if (remainingToSell <= 0) break;
        const soldNow = Math.min(Number(batch.quantityRemaining), remainingToSell);
        const salePriceTotal = soldNow * Number(batch.sellingPrice);
        const historyId = await getNextId(client, 'history', 'history_id');
        const analyticsId = await getNextId(client, 'analytics', 'analytics_id');
        await client.query('UPDATE batch SET quantity = quantity - $1 WHERE batch_id = $2', [soldNow, batch.batchId]);
        await client.query('INSERT INTO history (history_id, prod_id, batch_id, quantity_sold, curr_date, sale_id) VALUES ($1, $2, $3, $4, NOW(), $5)', [historyId, productId, batch.batchId, soldNow, saleId]);
        await client.query('INSERT INTO analytics (analytics_id, product_id, batch_id, last_sold_at) VALUES ($1, $2, $3, NOW())', [analyticsId, productId, batch.batchId]);
        sales.push({ saleId, historyId, batchId: batch.batchId, productId, quantitySold: soldNow, salePriceTotal, timestamp: new Date().toISOString() });
        saleTotal += salePriceTotal;
        remainingToSell -= soldNow;
      }

      if (remainingToSell > 0) throw Object.assign(new Error('Requested quantity exceeds available stock for product ID ' + productId + '.'), { statusCode: 400 });
    }

    await client.query('COMMIT');
    return { saleId, saleTotal, sales };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function sellBatchByFEFO({ productId, quantity }) {
  return sellTransaction([{ productId, quantity }]);
}

async function getSalesLedger() {
  const { rows } = await pool.query(`
    SELECT COALESCE(h.sale_id, h.history_id) AS "saleId",
      COALESCE(s.sale_time, h.curr_date) AS timestamp,
      h.prod_id AS "productId", h.batch_id AS "batchId", b.batch_number AS "batchNumber", p.product_name AS "itemName",
      SUM(h.quantity_sold)::INTEGER AS "quantitySold",
      SUM(h.quantity_sold * p.selling_price)::NUMERIC AS "salePriceTotal"
    FROM history h
    JOIN product p ON p.prod_id = h.prod_id
    JOIN batch b ON b.batch_id = h.batch_id
    LEFT JOIN sale s ON s.sale_id = h.sale_id
    GROUP BY COALESCE(h.sale_id, h.history_id), COALESCE(s.sale_time, h.curr_date), h.prod_id, h.batch_id, b.batch_number, p.product_name
    ORDER BY timestamp DESC, "saleId" DESC, p.product_name ASC
  `);
  const transactions = new Map();
  rows.forEach((row) => {
    if (!transactions.has(row.saleId)) {
      transactions.set(row.saleId, { saleId: row.saleId, timestamp: row.timestamp, total: 0, items: [] });
    }
    const transaction = transactions.get(row.saleId);
    const item = {
      productId: row.productId,
      batchId: row.batchId,
      batchNumber: row.batchNumber,
      itemName: row.itemName,
      quantitySold: Number(row.quantitySold),
      salePriceTotal: Number(row.salePriceTotal),
    };
    transaction.items.push(item);
    transaction.total += item.salePriceTotal;
  });
  return Array.from(transactions.values());
}

async function getSalesHistoryReport() {
  const { rows } = await pool.query(`
    SELECT COALESCE(h.sale_id, h.history_id) AS "saleId", COALESCE(s.sale_time, h.curr_date) AS "saleTime", TO_CHAR(COALESCE(s.sale_time, h.curr_date), 'YYYY-MM-DD') AS date,
      p.prod_id AS "productId", h.batch_id AS "batchId", b.batch_number AS "batchNumber", p.product_name AS name,
      SUM(h.quantity_sold)::INTEGER AS quantity, SUM(h.quantity_sold * p.selling_price)::NUMERIC AS total
    FROM history h
    JOIN product p ON p.prod_id = h.prod_id
    JOIN batch b ON b.batch_id = h.batch_id
    LEFT JOIN sale s ON s.sale_id = h.sale_id
    GROUP BY COALESCE(h.sale_id, h.history_id), COALESCE(s.sale_time, h.curr_date), date, p.prod_id, h.batch_id, b.batch_number, p.product_name ORDER BY date DESC, "saleTime" DESC, total DESC
  `);
  const grouped = new Map();
  rows.forEach((row) => {
    if (!grouped.has(row.date)) grouped.set(row.date, { date: row.date, totalProductsSold: 0, totalRevenue: 0, items: [], transactions: [] });
    const day = grouped.get(row.date);
    day.totalProductsSold += Number(row.quantity);
    day.totalRevenue += Number(row.total);
    let transaction = day.transactions.find((entry) => entry.saleId === row.saleId);
    if (!transaction) {
      transaction = { saleId: row.saleId, saleTime: row.saleTime, totalProductsSold: 0, totalRevenue: 0, items: [] };
      day.transactions.push(transaction);
    }
    const item = { productId: row.productId, batchId: row.batchId, batchNumber: row.batchNumber, name: row.name, quantity: Number(row.quantity), total: Number(row.total) };
    transaction.items.push(item);
    transaction.totalProductsSold += item.quantity;
    transaction.totalRevenue += item.total;
    const dailyItem = day.items.find((entry) => entry.productId === row.productId);
    if (dailyItem) {
      dailyItem.quantity += item.quantity;
      dailyItem.total += item.total;
    } else {
      day.items.push({ ...item });
    }
  });
  grouped.forEach((day) => day.transactions.sort((first, second) => new Date(first.saleTime) - new Date(second.saleTime)));
  const dailyHistory = Array.from(grouped.values());
  return { monthSummary: dailyHistory.reduce((s, d) => ({ totalRevenue: s.totalRevenue + d.totalRevenue, totalProductsSold: s.totalProductsSold + d.totalProductsSold }), { totalRevenue: 0, totalProductsSold: 0 }), dailyHistory };
}

async function getMonthlyProfit() {
  const [salesResult, wasteResult] = await Promise.all([
    pool.query('SELECT COALESCE(SUM(h.quantity_sold * p.selling_price), 0) AS revenue, COALESCE(SUM(h.quantity_sold * p.cost_price), 0) AS cogs FROM history h JOIN product p ON p.prod_id = h.prod_id'),
    pool.query('SELECT COALESCE(SUM(w.quantity_wasted * p.cost_price), 0) AS "wasteLoss" FROM waste w JOIN product p ON p.prod_id = w.prod_id'),
  ]);
  const grossRevenue = Number(salesResult.rows[0]?.revenue || 0);
  const cogs = Number(salesResult.rows[0]?.cogs || 0);
  const wasteLoss = Number(wasteResult.rows[0]?.wasteLoss || 0);
  return { grossRevenue, cogs, wasteLoss, netProfit: grossRevenue - cogs - wasteLoss };
}

async function getWasteReports() {
  await processExpiredWaste();
  const { rows } = await pool.query(`
    SELECT w.waste_id AS "wasteId", w.prod_id AS "productId", w.batch_id AS "batchId",
      w.quantity_wasted AS "quantityWasted", w.waste_date AS "wasteDate",
      TO_CHAR(w.waste_date, 'YYYY-MM-DD') AS date, w.reason,
      p.product_name AS "productName", p.cost_price AS "costPrice", b.batch_number AS "batchNumber"
    FROM waste w
    JOIN product p ON p.prod_id = w.prod_id
    JOIN batch b ON b.batch_id = w.batch_id
    WHERE w.reason = 'Expired'
    ORDER BY w.waste_date DESC, w.waste_id DESC
  `);
  const grouped = new Map();
  rows.forEach((row) => {
    if (!grouped.has(row.date)) {
      grouped.set(row.date, { date: row.date, totalQuantityWasted: 0, totalWasteAmount: 0, items: [] });
    }
    const day = grouped.get(row.date);
    const quantityWasted = Number(row.quantityWasted);
    const amount = quantityWasted * Number(row.costPrice);
    day.totalQuantityWasted += quantityWasted;
    day.totalWasteAmount += amount;
    day.items.push({
      wasteId: row.wasteId,
      productId: row.productId,
      batchId: row.batchId,
      productName: row.productName,
      batchNumber: row.batchNumber,
      quantityWasted,
      amount,
      wasteDate: row.wasteDate,
      reason: row.reason,
    });
  });
  return Array.from(grouped.values());
}

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, getDashboardOverview, getInventoryLedger, addInventoryBatch, sellBatchByFEFO, sellTransaction, getSalesLedger, getSalesHistoryReport, getMonthlyProfit, getWasteReports };