import { useState } from 'react';
import { useBakery } from '../contexts/BakeryContext';

function OperationsPage() {
  const { products, inventory, addInventoryBatch, createProduct, updateProduct, deleteProduct, completeSale } = useBakery();
  const [message, setMessage] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showManageProduct, setShowManageProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', costPrice: '', sellingPrice: '' });
  const [addingBatch, setAddingBatch] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [cart, setCart] = useState([]);
  const [completingSale, setCompletingSale] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [editProduct, setEditProduct] = useState({ name: '', costPrice: '', sellingPrice: '' });
  const [form, setForm] = useState({
    productId: '',
    batchNumber: '',
    quantityAdded: '',
    costPrice: '',
    sellingPrice: '',
    expiryDate: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'productId') {
      const selected = products.find((item) => String(item.productId) === String(value));
      setForm((prev) => ({
        ...prev,
        productId: value,
        costPrice: selected ? String(selected.costPrice) : prev.costPrice,
        sellingPrice: selected ? String(selected.sellingPrice) : prev.sellingPrice,
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSelect = (event) => {
    const productId = event.target.value;
    const product = products.find((item) => String(item.productId) === productId);
    setSelectedProductId(productId);
    setEditProduct(product ? { name: product.name, costPrice: product.costPrice, sellingPrice: product.sellingPrice } : { name: '', costPrice: '', sellingPrice: '' });
  };

  const handleEditProductChange = (event) => {
    const { name, value } = event.target;
    setEditProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();
    if (!selectedProductId || updatingProduct) return;
    setUpdatingProduct(true);
    try {
      await updateProduct(selectedProductId, { ...editProduct, costPrice: Number(editProduct.costPrice), sellingPrice: Number(editProduct.sellingPrice) });
      setMessage('Product updated successfully.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update product.');
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProductId || deletingProduct) return;
    if (!window.confirm('Delete this product and its unused inventory details? Products with sales history cannot be deleted.')) return;
    setDeletingProduct(true);
    try {
      await deleteProduct(selectedProductId);
      setSelectedProductId('');
      setEditProduct({ name: '', costPrice: '', sellingPrice: '' });
      setMessage('Product deleted successfully.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete product.');
    } finally {
      setDeletingProduct(false);
    }
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    if (creatingProduct) return;
    setCreatingProduct(true);
    try {
      const product = await createProduct({ ...newProduct, costPrice: Number(newProduct.costPrice), sellingPrice: Number(newProduct.sellingPrice) });
      setForm((prev) => ({ ...prev, productId: String(product.productId) }));
      setNewProduct({ name: '', costPrice: '', sellingPrice: '' });
      setShowProductForm(false);
      setMessage('Product created. You can now add its inventory batch.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create product.');
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleAddBatch = async (event) => {
    event.preventDefault();
    if (addingBatch) return;
    setAddingBatch(true);

    try {
      await addInventoryBatch({
        ...form,
        quantityAdded: Number(form.quantityAdded),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
      });
      setMessage('New stock batch added successfully.');
      setForm({
        productId: '',
        batchNumber: '',
        quantityAdded: '',
        costPrice: '',
        sellingPrice: '',
        expiryDate: '',
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to add batch.');
    } finally {
      setAddingBatch(false);
    }
  };

  const addToCart = (productId) => {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.productId === productId);
      if (existing) return currentCart.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
      return [...currentCart, { productId, quantity: 1 }];
    });
    setMessage('Item added to current sale.');
  };

  const updateCartQuantity = (productId, quantity) => {
    setCart((currentCart) => currentCart.map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, Number(quantity)) } : item));
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
  };

  const handleCompleteSale = async () => {
    if (!cart.length || completingSale) return;
    setCompletingSale(true);
    try {
      const result = await completeSale(cart);
      setCart([]);
      setMessage(`Sale #${result.data.saleId} completed successfully.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Sale failed.');
    } finally {
      setCompletingSale(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Inbound stock & POS</h1>
        </div>
      </div>

      <div className="panel-grid two-columns">
        <section className="panel-card">
          <div className="panel-header panel-header-with-action">
            <h3>Inbound batch intake</h3>
            <button type="button" className="secondary-button" onClick={() => setShowManageProduct(true)}>Edit / Delete</button>
          </div>

          <form className="form-grid" onSubmit={handleAddBatch}>
            <label>
              Product
              <select name="productId" value={form.productId} onChange={handleChange} required>
                <option value="">Select a product</option>
                {products.map((product) => <option key={product.productId} value={product.productId}>{product.name}</option>)}
              </select>
            </label>
            <button type="button" className="secondary-button" onClick={() => setShowProductForm((visible) => !visible)}>{showProductForm ? 'Cancel new product' : 'Add new product'}</button>
            <label>
              Batch number
              <input name="batchNumber" value={form.batchNumber} onChange={handleChange} placeholder="BL-1001-A" required />
            </label>
            <label>
              Quantity added
              <input type="number" name="quantityAdded" value={form.quantityAdded} onChange={handleChange} placeholder="30" required />
            </label>
            <label>
              Cost price
              <input type="number" name="costPrice" value={form.costPrice} onChange={handleChange} placeholder="25" required />
            </label>
            <label>
              Selling price
              <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} placeholder="55" required />
            </label>
            <label>
              Expiry date
              <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} required />
            </label>

            <button type="submit" className="primary-button action-button" disabled={addingBatch} aria-busy={addingBatch}>
              {addingBatch ? 'Adding inventory...' : 'Add inventory'}
            </button>
          </form>

          {showProductForm && (
            <div className="product-modal-backdrop" role="presentation">
              <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="new-product-title">
                <div className="product-modal-header">
                  <h4 id="new-product-title">New product</h4>
                  <button type="button" className="modal-close-button" aria-label="Close new product form" onClick={() => setShowProductForm(false)}>X</button>
                </div>
                <form className="form-grid" onSubmit={handleCreateProduct}>
                  <label>Product name<input name="name" value={newProduct.name} onChange={handleProductChange} required /></label>
                  <label>Cost price<input type="number" name="costPrice" value={newProduct.costPrice} onChange={handleProductChange} required /></label>
                  <label>Selling price<input type="number" name="sellingPrice" value={newProduct.sellingPrice} onChange={handleProductChange} required /></label>
                  <button type="submit" className="primary-button action-button" disabled={creatingProduct} aria-busy={creatingProduct}>
                    {creatingProduct ? 'Creating product...' : 'Create product'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {showManageProduct && (
            <div className="product-modal-backdrop" role="presentation">
              <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="manage-product-title">
                <div className="product-modal-header">
                  <h4 id="manage-product-title">Manage existing product</h4>
                  <button type="button" className="modal-close-button" aria-label="Close product management" onClick={() => setShowManageProduct(false)}>X</button>
                </div>
                <form className="form-grid" onSubmit={handleUpdateProduct}>
                  <label>
                    Product
                    <select value={selectedProductId} onChange={handleProductSelect} required>
                      <option value="">Select a product to edit</option>
                      {products.map((product) => <option key={product.productId} value={product.productId}>{product.name}</option>)}
                    </select>
                  </label>
                  {selectedProductId && (
                    <>
                      <label>Product name<input name="name" value={editProduct.name} onChange={handleEditProductChange} required /></label>
                      <label>Cost price<input type="number" name="costPrice" value={editProduct.costPrice} onChange={handleEditProductChange} required /></label>
                      <label>Selling price<input type="number" name="sellingPrice" value={editProduct.sellingPrice} onChange={handleEditProductChange} required /></label>
                      <div className="product-actions">
                        <button type="submit" className="primary-button action-button" disabled={updatingProduct || deletingProduct}>
                          {updatingProduct ? 'Updating product...' : 'Update product'}
                        </button>
                        <button type="button" className="danger-button action-button" onClick={handleDeleteProduct} disabled={updatingProduct || deletingProduct}>
                          {deletingProduct ? 'Deleting product...' : 'Delete product'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          )}

          {message && <div className="info-banner">{message}</div>}
        </section>

        <section className="panel-card">
          <div className="panel-header">
            <h3>Quick POS</h3>
          </div>

          <div className="pos-list">
            {inventory.map((item) => (
              <div key={item.batchId} className="pos-row">
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.batchNumber} · {item.quantityRemaining} left</small>
                </div>
                <button type="button" className="action-button" onClick={() => addToCart(item.productId)} disabled={completingSale}>
                  Add
                </button>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="sale-cart">
              <div className="panel-header">
                <h4>Current sale</h4>
              </div>
              {cart.map((item) => {
                const product = products.find((entry) => String(entry.productId) === String(item.productId));
                return (
                  <div key={item.productId} className="cart-row">
                    <span>{product?.name || 'Product'}</span>
                    <input type="number" min="1" value={item.quantity} onChange={(event) => updateCartQuantity(item.productId, event.target.value)} disabled={completingSale} />
                    <button type="button" className="cart-remove" onClick={() => removeFromCart(item.productId)} disabled={completingSale}>Remove</button>
                  </div>
                );
              })}
              <button type="button" className="primary-button action-button" onClick={handleCompleteSale} disabled={completingSale} aria-busy={completingSale}>
                {completingSale ? 'Completing sale...' : 'Complete sale'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default OperationsPage;
