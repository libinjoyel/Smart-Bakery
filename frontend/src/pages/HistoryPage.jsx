import { useBakery } from '../contexts/BakeryContext';

const formatInr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

function HistoryPage() {
  const { historyReport } = useBakery();
  const { monthSummary, dailyHistory } = historyReport;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">History</p>
          <h1>Daily sales history</h1>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <p>Monthly revenue</p>
          <strong>{formatInr(monthSummary.totalRevenue || 0)}</strong>
        </div>
        <div className="stat-card neutral">
          <p>Items sold</p>
          <strong>{monthSummary.totalProductsSold || 0}</strong>
        </div>
      </div>

      <section className="panel-card">
        <div className="panel-header">
          <h3>Daily sales breakdown</h3>
        </div>

        <div className="history-stack">
          {dailyHistory.map((day) => (
            <div key={day.date} className="history-day">
              <div className="history-day-header">
                <strong>{new Date(day.date).toLocaleDateString()}</strong>
                <span>{day.totalProductsSold} items • {formatInr(day.totalRevenue)}</span>
              </div>

              <div className="history-items">
                  {(day.transactions || [{ saleId: day.date, items: day.items }]).map((transaction, saleIndex) => (
                    <div key={transaction.saleId} className="history-transaction">
                      <div className="history-transaction-header">
                        <strong>Sale #{saleIndex + 1}</strong>
                        {transaction.saleTime && <span>{new Date(transaction.saleTime).toLocaleTimeString()}</span>}
                      </div>
                      {transaction.items.map((item) => (
                        <div key={`${transaction.saleId}-${item.productId}-${item.batchId}`} className="history-row">
                          <div className="history-item-meta"><strong>{item.name}</strong><small>{item.batchNumber}</small></div>
                          <div className="history-values">
                            <span>{item.quantity} pcs</span>
                            <strong>{formatInr(item.total)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HistoryPage;
