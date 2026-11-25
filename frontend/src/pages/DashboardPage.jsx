import { useBakery } from '../contexts/BakeryContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

const formatInr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

function DashboardPage() {
  const { summary, inventory, loading } = useBakery();

  if (loading || !summary) {
    return <div className="page-shell"><h2>Loading dashboard...</h2></div>;
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Bakery dashboard</h1>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total stock" value={summary.totalStock} tone="green" />
        <StatCard label="Critical" value={summary.criticalCount} tone="red" />
        <StatCard label="Warning" value={summary.warningCount} tone="yellow" />
        <StatCard label="Net profit" value={formatInr(summary.netProfit)} tone="neutral" />
      </div>

      <div className="panel-grid two-columns">
        <section className="panel-card">
          <div className="panel-header">
            <h3>Inventory status</h3>
          </div>

          <div className="mini-list">
            {inventory.filter((batch) => batch.status !== 'Safe').slice(0, 5).map((batch) => (
                <div key={batch.batchId} className="mini-row">
                  <div>
                    <strong>{batch.name}</strong>
                    <small>{batch.quantityRemaining} units left</small>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
              ))}
            {!inventory.some((batch) => batch.status !== 'Safe') && (
              <p className="empty-state">No critical or warning stock.</p>
            )}
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-header">
            <h3>Business snapshot</h3>
          </div>

          <div className="kpi-stack">
            <div className="kpi-row"><span>Gross revenue</span><strong>{formatInr(summary.grossRevenue)}</strong></div>
            <div className="kpi-row"><span>COGS</span><strong>{formatInr(summary.cogs)}</strong></div>
            <div className="kpi-row"><span>Net profit</span><strong>{formatInr(summary.netProfit)}</strong></div>
          </div>
        </section>
      </div>

      <section className="panel-card stock-breakdown-panel">
        <div className="panel-header">
          <h3>Remaining stock by batch</h3>
          <small>Current quantities from inventory</small>
        </div>

        <div className="stock-breakdown-list">
          {inventory.length ? inventory.map((batch) => (
            <div key={batch.batchId} className="stock-breakdown-row">
              <span>{batch.name} <strong>{batch.batchNumber}</strong></span>
              <strong>{batch.quantityRemaining}</strong>
            </div>
          )) : (
            <p className="empty-state">No inventory batches yet.</p>
          )}
        </div>

        <div className="stock-breakdown-total">
          <span>Total remaining stock</span>
          <strong>{inventory.reduce((total, batch) => total + Number(batch.quantityRemaining || 0), 0)}</strong>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
