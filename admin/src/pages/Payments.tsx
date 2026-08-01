import { useEffect, useState } from 'react';
import { AdminPayment, ApiError, fetchPayments } from '../api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function ownerLabel(p: AdminPayment) {
  return p.user.name || p.user.email || p.user.phone || 'Unknown';
}

export default function Payments() {
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [total, setTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments({ page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        setPayments(res.data);
        setTotal(res.total);
        setTotalRevenue(res.totalRevenue);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account doesn't have admin access.");
        } else {
          setError('Failed to load payments.');
        }
      });
  }, [page, search]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!payments) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading payments…
      </div>
    );
  }

  return (
    <div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="value">{formatInr(totalRevenue)}</div>
          <div className="label">Total revenue collected</div>
        </div>
        <div className="stat-card">
          <div className="value">{total}</div>
          <div className="label">Total orders</div>
        </div>
        <div className="stat-card">
          <div className="value">{payments.filter((p) => p.status === 'PAID').length}</div>
          <div className="label">Paid (this page)</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>All transactions</h3>
          <span className="hint">{total} total</span>
        </div>
        <div className="panel-toolbar">
          <input
            className="search-input"
            placeholder="Search by order id, customer name, email or phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {payments.length === 0 ? (
          <div className="empty-state">{search ? 'No payments match.' : 'No payments yet.'}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.razorpayOrderId}</td>
                  <td>{ownerLabel(p)}</td>
                  <td>
                    <span className={`badge badge-${p.plan.toLowerCase()}`}>{p.plan}</span>
                  </td>
                  <td>{formatInr(p.amount)}</td>
                  <td>
                    <span
                      className={`badge ${
                        p.status === 'PAID' ? 'badge-ready' : p.status === 'FAILED' ? 'badge-failed' : 'badge-uploaded'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
