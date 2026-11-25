const express = require('express');
const { getProductCatalog, addProduct, editProduct, removeProduct, getInventory, addBatch, sellProducts } = require('../controllers/inventoryController');
const { validateProduct } = require('../middleware/validate');
const { validateInventoryBatch, validateSale } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/products', getProductCatalog);
router.post('/products', validateProduct, addProduct);
router.put('/products/:productId', validateProduct, editProduct);
router.delete('/products/:productId', removeProduct);
router.get('/', getInventory);
router.post('/checkin', validateInventoryBatch, addBatch);
router.post('/sell', validateSale, sellProducts);

module.exports = router;
