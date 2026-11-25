import { useBakery } from '../contexts/BakeryContext';

const formatInr = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value);

function WasteReportsPage() {
  const { wasteReport } = useBakery();
  const dailyWaste = wasteReport?.data || [];

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Forecasting</p>
          <h1>Waste & replenishment reports</h1>
        </div>
      </div>

      <section className="panel-card">
        <div className="panel-header">
          <h3>Daily waste breakdown</h3>
        </div>

        <div className="history-stack">
          {dailyWaste.map((day) => (
            <div key={day.date} className="history-day">
              <div className="history-day-header">
                <strong>{new Date(day.date).toLocaleDateString()}</strong>
                <span>{day.totalQuantityWasted} items · {formatInr(day.totalWasteAmount)}</span>
              </div>

              <div className="history-items">
                {day.items.map((item) => (
                  <div key={item.wasteId} className="history-row">
                    <div className="waste-item-meta">
                      <strong>{item.productName}</strong>
                      <small>{item.batchNumber} · {item.reason}</small>
                    </div>
                    <div className="history-values">
                      <span>{item.quantityWasted} wasted</span>
                      <strong>{formatInr(item.amount)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!dailyWaste.length && <p className="empty-state">No expired waste recorded.</p>}
        </div>
      </section>
    </div>
  );
}

export default WasteReportsPage;
