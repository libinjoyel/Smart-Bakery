const validateInventoryBatch = (req, res, next) => {
  const { productId, batchNumber, quantityAdded, costPrice, sellingPrice, expiryDate } = req.body;

  if (!productId || !batchNumber || !quantityAdded || !costPrice || !sellingPrice || !expiryDate) {
    return res.status(400).json({ message: 'All inventory fields are required.' });
  }

  const date = new Date(expiryDate);
  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    return res.status(400).json({ message: 'Expiry date must be a future date.' });
  }

  if (Number(quantityAdded) <= 0 || Number(costPrice) <= 0 || Number(sellingPrice) <= 0) {
    return res.status(400).json({ message: 'Quantity and price values must be positive numbers.' });
  }

  next();
};

const validateSale = (req, res, next) => {
  if (Array.isArray(req.body.items)) {
    if (!req.body.items.length || req.body.items.some((item) => !item.productId || Number(item.quantity) <= 0)) {
      return res.status(400).json({ message: 'A sale must contain products with positive quantities.' });
    }
    return next();
  }

  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({ message: 'Product and quantity are required.' });
  }

  if (Number(quantity) <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero.' });
  }

  next();
};

const validateProduct = (req, res, next) => {
  const { name, costPrice, sellingPrice } = req.body;

  if (!name?.trim() || !costPrice || !sellingPrice) {
    return res.status(400).json({ message: 'Product name, cost price, and selling price are required.' });
  }

  if (Number(costPrice) <= 0 || Number(sellingPrice) <= 0) {
    return res.status(400).json({ message: 'Product prices must be positive numbers.' });
  }

  next();
};

module.exports = { validateInventoryBatch, validateSale, validateProduct };
