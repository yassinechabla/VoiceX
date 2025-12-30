import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { reservationsApi, Reservation } from '../api/reservations';
import { format } from 'date-fns';
import './Dashboard.css';

function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    loadReservations();
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io('https://localhost:3443', {
      auth: { token },
      transports: ['websocket'],
      rejectUnauthorized: false, // Allow self-signed certs
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('reservation:created', (data: Reservation) => {
      setReservations((prev) => [data, ...prev]);
      showToast('New reservation received!');
    });

    socket.on('reservation:updated', (data: Reservation) => {
      setReservations((prev) =>
        prev.map((r) => (r._id === data._id ? data : r))
      );
    });

    socket.on('reservation:cancelled', (data: Reservation) => {
      setReservations((prev) =>
        prev.map((r) => (r._id === data._id ? data : r))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationsApi.getAll({
        date: selectedDate,
        ...(statusFilter && { status: statusFilter }),
      });
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: Reservation['status']) => {
    try {
      const updated = await reservationsApi.updateStatus(id, status);
      setReservations((prev) =>
        prev.map((r) => (r._id === id ? updated : r))
      );
      setSelectedReservation(null);
    } catch (error) {
      console.error('Failed to update reservation:', error);
    }
  };

  const getStatusBadge = (status: Reservation['status']) => {
    const classes: Record<string, string> = {
      HOLD: 'badge-hold',
      CONFIRMED: 'badge-confirmed',
      CANCELLED: 'badge-cancelled',
      NO_SHOW: 'badge-no-show',
    };
    return <span className={`badge ${classes[status]}`}>{status}</span>;
  };

  const showToast = (message: string) => {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  if (loading) {
    return <div className="loading">Loading reservations...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Reservations</h1>
        <div className="filters">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="filter-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="HOLD">Hold</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>
      </div>

      <div className="reservations-list">
        {reservations.length === 0 ? (
          <div className="empty-state">No reservations found</div>
        ) : (
          reservations.map((reservation) => (
            <div
              key={reservation._id}
              className="reservation-card"
              onClick={() => setSelectedReservation(reservation)}
            >
              <div className="reservation-header">
                <h3>{reservation.customerName}</h3>
                {getStatusBadge(reservation.status)}
              </div>
              <div className="reservation-details">
                <p>
                  <strong>Time:</strong>{' '}
                  {format(new Date(reservation.startAt), 'PPp')}
                </p>
                <p>
                  <strong>Party Size:</strong> {reservation.partySize}
                </p>
                <p>
                  <strong>Phone:</strong> {reservation.customerPhone}
                </p>
                <p>
                  <strong>Source:</strong> {reservation.source}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedReservation && (
        <div className="modal-overlay" onClick={() => setSelectedReservation(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reservation Details</h2>
            <div className="modal-content">
              <p><strong>Customer:</strong> {selectedReservation.customerName}</p>
              <p><strong>Phone:</strong> {selectedReservation.customerPhone}</p>
              <p><strong>Party Size:</strong> {selectedReservation.partySize}</p>
              <p><strong>Date/Time:</strong> {format(new Date(selectedReservation.startAt), 'PPp')}</p>
              <p><strong>Status:</strong> {getStatusBadge(selectedReservation.status)}</p>
              {selectedReservation.notes && (
                <p><strong>Notes:</strong> {selectedReservation.notes}</p>
              )}
            </div>
            <div className="modal-actions">
              {selectedReservation.status === 'HOLD' && (
                <button
                  onClick={() => handleStatusChange(selectedReservation._id, 'CONFIRMED')}
                  className="btn-confirm"
                >
                  Confirm
                </button>
              )}
              {selectedReservation.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleStatusChange(selectedReservation._id, 'CANCELLED')}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              )}
              {selectedReservation.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleStatusChange(selectedReservation._id, 'NO_SHOW')}
                  className="btn-no-show"
                >
                  Mark No Show
                </button>
              )}
              <button onClick={() => setSelectedReservation(null)} className="btn-close">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #27ae60;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 4px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;

