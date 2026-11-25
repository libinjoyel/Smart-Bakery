import { useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { useBakery } from '../contexts/BakeryContext';

function InventoryPage() {
  const { inventory } = useBakery();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredInventory = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return inventory.filter((batch) => {
      const matchesSearch = !normalizedSearch
        || (batch.name || '').toLowerCase().includes(normalizedSearch)
        || (batch.batchNumber || '').toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || batch.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchTerm, statusFilter]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Inventory ledger</h1>
        </div>
      </div>

      <section className="panel-card table-panel">
        <div className="inventory-filters">
          <label>
            Search product
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search product or batch"
            />
          </label>
          <label>
            Filter status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All statuses</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Safe">Safe</option>
            </select>
          </label>
        </div>
        <table>
          <thead>
            <tr>
              <th>Batch</th>
              <th>Product</th>
              <th>Added on</th>
              <th>Qty</th>
              <th>Expiry</th>
              <th>Days left</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((batch) => (
              <tr key={batch.batchId}>
                <td>{batch.batchNumber}</td>
                <td>{batch.name}</td>
                <td>{batch.createdAt ? new Date(batch.createdAt).toLocaleString() : '—'}</td>
                <td>{batch.quantityRemaining}</td>
                <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                <td>{batch.daysLeft}</td>
                <td><StatusBadge status={batch.status} /></td>
              </tr>
            ))}
            {!filteredInventory.length && (
              <tr>
                <td colSpan="7" className="empty-table-state">No matching inventory found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default InventoryPage;
