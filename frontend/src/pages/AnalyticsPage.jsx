import { useMemo } from 'react';
import { useBakery } from '../contexts/BakeryContext';

const formatInr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

function AnalyticsPage() {
  const { summary, ledger } = useBakery();
  const dailyLedger = useMemo(() => {
    const grouped = new Map();
    ledger.forEach((sale) => {
      const date = new Date(sale.timestamp).toISOString().slice(0, 10);
      if (!grouped.has(date)) grouped.set(date, { date, total: 0, sales: [] });
      const day = grouped.get(date);
      day.total += Number(sale.total);
      day.sales.push(sale);
    });
    grouped.forEach((day) => day.sales.sort((first, second) => new Date(first.timestamp) - new Date(second.timestamp)));
    return Array.from(grouped.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [ledger]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Financial analytics</h1>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <p>Gross revenue</p>
          <strong>{formatInr(summary?.grossRevenue || 0)}</strong>
        </div>
        <div className="stat-card red">
          <p>COGS</p>
          <strong>{formatInr(summary?.cogs || 0)}</strong>
        </div>
        <div className="stat-card neutral">
          <p>Net profit</p>
          <strong>{formatInr(summary?.netProfit || 0)}</strong>
        </div>
      </div>

      <section className="panel-card table-panel">
        <div className="panel-header">
          <h3>Daily sales ledger</h3>
        </div>

        <div className="analytics-days">
          {dailyLedger.map((day) => (
            <div key={day.date} className="analytics-day">
              <div className="analytics-day-header">
                <strong>{new Date(day.date).toLocaleDateString()}</strong>
                <span>Daily total: {formatInr(day.total)}</span>
              </div>
              <table>
                <thead>
                  <tr><th>Sale</th><th>Products</th><th>Total</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {day.sales.map((sale, saleIndex) => (
                    <tr key={sale.saleId}>
                      <td>Sale #{saleIndex + 1}</td>
                      <td><div className="analytics-sale-items">{sale.items.map((item) => <div key={`${sale.saleId}-${item.productId}`}>{item.itemName} × {item.quantitySold} → {formatInr(item.salePriceTotal)}</div>)}</div></td>
                      <td>{formatInr(sale.total)}</td>
                      <td>{new Date(sale.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AnalyticsPage;
