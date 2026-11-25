const { getProducts, createProduct, updateProduct, deleteProduct, getInventoryLedger, addInventoryBatch, sellBatchByFEFO, sellTransaction } = require('../services/bakeryRepository');

const getProductCatalog = async (req, res) => {
  res.json(await getProducts());
};

const addProduct = async (req, res) => {
  const product = await createProduct(req.body);
  res.status(201).json({ success: true, message: 'Product created successfully.', data: product });
};

const editProduct = async (req, res) => {
  const product = await updateProduct(req.params.productId, req.body);
  res.json({ success: true, message: 'Product updated successfully.', data: product });
};

const removeProduct = async (req, res) => {
  await deleteProduct(req.params.productId);
  res.json({ success: true, message: 'Product deleted successfully.' });
};

const getInventory = async (req, res) => {
  const inventory = await getInventoryLedger();
  res.json(inventory);
};

const addBatch = async (req, res) => {
  const batch = await addInventoryBatch(req.body);
  res.status(201).json({
    success: true,
    message: 'Inventory batch added successfully.',
    data: batch,
  });
};

const sellProducts = async (req, res) => {
  const result = req.body.items ? await sellTransaction(req.body.items) : await sellBatchByFEFO(req.body);
  res.status(200).json({
    success: true,
    message: 'Sale completed using FEFO stock logic.',
    data: result,
  });
};

module.exports = { getProductCatalog, addProduct, editProduct, removeProduct, getInventory, addBatch, sellProducts };
