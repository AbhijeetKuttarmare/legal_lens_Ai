import { useEffect, useState } from 'react';
import { AdminReview, ApiError, fetchReviews } from '../api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

function stars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function ownerLabel(r: AdminReview) {
  return r.user.name || r.user.email || r.user.phone || 'Unknown';
}

export default function Reviews() {
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews({ page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        setReviews(res.data);
        setTotal(res.total);
        setAverageRating(res.averageRating);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account doesn't have admin access.");
        } else {
          setError('Failed to load reviews.');
        }
      });
  }, [page, search]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!reviews) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading reviews…
      </div>
    );
  }

  return (
    <div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="value">{averageRating ? averageRating.toFixed(1) : '—'} / 5</div>
          <div className="label">Average rating</div>
        </div>
        <div className="stat-card">
          <div className="value">{total}</div>
          <div className="label">Total reviews</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>All reviews</h3>
          <span className="hint">{total} total</span>
        </div>
        <div className="panel-toolbar">
          <input
            className="search-input"
            placeholder="Search by reviewer or comment…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {reviews.length === 0 ? (
          <div className="empty-state">
            {search
              ? 'No reviews match.'
              : "No reviews yet — the mobile app doesn't have a review submission flow wired up yet."}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>{ownerLabel(r)}</td>
                  <td>
                    <span className="stars">{stars(r.rating)}</span>
                  </td>
                  <td>{r.comment || '—'}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
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
