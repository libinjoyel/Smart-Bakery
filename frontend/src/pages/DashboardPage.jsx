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
  const { summary, inventory, loading, apiError, refresh, user } = useBakery();

  if (loading) {
    return <div className="page-shell"><h2>Loading dashboard...</h2></div>;
  }

  if (apiError || !summary) {
    return (
      <div className="page-shell">
        <div className="panel-card" style={{ textAlign: 'center', padding: '36px 20px', maxWidth: '520px', margin: '40px auto' }}>
          <h3 style={{ marginBottom: '10px' }}>Unable to load dashboard</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
            {apiError || 'Could not retrieve inventory overview from backend.'}
          </p>
          <button className="primary-button action-button" type="button" onClick={refresh}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{isAdmin ? 'Overview' : 'Operations'}</p>
          <h1>{isAdmin ? 'Bakery dashboard' : 'Staff inventory dashboard'}</h1>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total stock" value={summary.totalStock} tone="green" />
        <StatCard label="Critical" value={summary.criticalCount} tone="red" />
        <StatCard label="Warning" value={summary.warningCount} tone="yellow" />
        {isAdmin && (
          <StatCard label="Net profit" value={formatInr(summary.netProfit ?? 0)} tone="neutral" />
        )}
      </div>

      <div className={`panel-grid ${isAdmin ? 'two-columns' : ''}`}>
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

        {isAdmin && (
          <section className="panel-card">
            <div className="panel-header">
              <h3>Business snapshot</h3>
            </div>

            <div className="kpi-stack">
              <div className="kpi-row"><span>Gross revenue</span><strong>{formatInr(summary.grossRevenue ?? 0)}</strong></div>
              <div className="kpi-row"><span>COGS</span><strong>{formatInr(summary.cogs ?? 0)}</strong></div>
              {summary.wasteLoss !== undefined && (
                <div className="kpi-row"><span>Waste loss</span><strong style={{ color: 'var(--red)' }}>{formatInr(summary.wasteLoss)}</strong></div>
              )}
              <div className="kpi-row"><span>Net profit</span><strong>{formatInr(summary.netProfit ?? 0)}</strong></div>
            </div>
          </section>
        )}
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
