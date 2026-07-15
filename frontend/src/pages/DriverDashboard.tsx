import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock3,
  Leaf,
  LogOut,
  MapPinned,
  MessageSquareText,
  Navigation,
  RefreshCw,
  Route,
  Truck,
  X,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import DeliveryMap from '../components/DeliveryMap';
import api, { API_ORIGIN } from '../utils/api';
import type { DeliveryStop, RouteProposal } from '../types/delivery';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [failureStopId, setFailureStopId] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [constraints, setConstraints] = useState('');
  const [proposal, setProposal] = useState<RouteProposal | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const loadStops = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/delivery/my-stops');
      setStops(response.data);
      setSelectedStop((current) => response.data.find((stop: DeliveryStop) => stop.orderId === current?.orderId) || response.data[0] || null);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to load your assigned stops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStops();
    const token = localStorage.getItem('freshroute_token');
    if (!token) return;
    const socket = io(`${API_ORIGIN}/delivery`, { auth: { token } });
    socket.on('delivery_assigned', () => void loadStops());
    return () => {
      socket.close();
    };
  }, []);

  const orderedStops = useMemo(
    () => [...stops].sort((a, b) => (a.stopSequence || 999) - (b.stopSequence || 999)),
    [stops],
  );
  const activeStops = orderedStops.filter((stop) => stop.stopStatus === 'ASSIGNED');
  const deliveredCount = stops.filter((stop) => stop.stopStatus === 'DELIVERED').length;
  const failedCount = stops.filter((stop) => stop.stopStatus === 'FAILED').length;

  const updateStatus = async (stop: DeliveryStop, status: 'DELIVERED' | 'FAILED') => {
    setUpdatingId(stop.orderId);
    setError('');
    setMessage('');
    try {
      await api.patch(`/delivery/stops/${stop.orderId}/status`, {
        status,
        ...(status === 'FAILED' && { failureReason }),
      });
      setMessage(status === 'DELIVERED' ? 'Stop marked as delivered. The buyer was notified.' : 'Failed attempt recorded and the buyer was notified.');
      setFailureStopId('');
      setFailureReason('');
      await loadStops();
    } catch (requestError: any) {
      const responseMessage = requestError.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage.join(', ') : responseMessage || 'Unable to update this stop.');
    } finally {
      setUpdatingId('');
    }
  };

  const optimizeRoute = async () => {
    setOptimizing(true);
    setError('');
    setProposal(null);
    try {
      const response = await api.post('/delivery/optimize-route', {
        constraints,
        orderIds: activeStops.map((stop) => stop.orderId),
      });
      setProposal(response.data);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to optimize this route.');
    } finally {
      setOptimizing(false);
    }
  };

  const acceptProposal = async () => {
    if (!proposal) return;
    setAccepting(true);
    setError('');
    try {
      await api.patch('/delivery/route-order', { orderedOrderIds: proposal.orderedOrderIds });
      setMessage('Optimized route accepted and saved.');
      setProposal(null);
      setConstraints('');
      await loadStops();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to save the proposed route.');
    } finally {
      setAccepting(false);
    }
  };

  const displayStops = proposal
    ? proposal.stops.map((routeStop) => {
        const original = stops.find((stop) => stop.orderId === routeStop.orderId)!;
        return { ...original, stopSequence: routeStop.sequence };
      })
    : orderedStops;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand"><Leaf size={24} style={{ stroke: 'var(--color-primary)' }} />Fresh<span>Route</span></div>
        <ul className="sidebar-menu">
          <li className="sidebar-item"><span className="sidebar-link active"><Route size={18} /> Route command</span></li>
          <li className="sidebar-item"><span className="sidebar-link"><Truck size={18} /> {activeStops.length} active stops</span></li>
        </ul>
        <div className="sidebar-user">
          <div className="user-profile">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'D'}</div>
            <div className="user-info"><span className="user-name">{user?.name}</span><span className="user-role">{user?.role}</span></div>
          </div>
          <button onClick={logout} className="btn btn-secondary btn-block"><LogOut size={16} /> Sign Out</button>
        </div>
      </aside>

      <main className="main-content driver-dashboard">
        <header className="dashboard-header">
          <div className="dashboard-title">Driver Route Command<span>Review assigned stops, report outcomes, and optimize today’s route.</span></div>
          <button className="btn btn-secondary" onClick={() => void loadStops()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
        </header>

        {error && <div className="alert alert-danger"><AlertTriangle size={18} /> {error}</div>}
        {message && <div className="alert alert-success"><Check size={18} /> {message}</div>}

        <section className="driver-metrics">
          <div className="glass card"><Navigation size={19} /><span>Active</span><strong>{activeStops.length}</strong></div>
          <div className="glass card"><Check size={19} /><span>Delivered</span><strong>{deliveredCount}</strong></div>
          <div className="glass card"><X size={19} /><span>Failed</span><strong>{failedCount}</strong></div>
        </section>

        {loading ? (
          <div className="glass card empty-state">Loading delivery run…</div>
        ) : stops.length === 0 ? (
          <div className="glass card empty-state"><MapPinned size={32} /><h3>No delivery stops assigned</h3><p>An administrator’s new assignment will appear here in real time.</p></div>
        ) : (
          <div className="driver-workspace">
            <section className="glass card map-panel">
              <div className="section-heading-row">
                <div><span className="eyebrow">OpenStreetMap route</span><h3>{proposal ? 'Proposed sequence' : 'Assigned stops'}</h3></div>
                {proposal && <span className={`pill ${proposal.isFallback ? 'pill-warning' : 'pill-success'}`}>{proposal.isFallback ? 'Distance fallback' : 'AI optimized'}</span>}
              </div>
              <DeliveryMap stops={displayStops} selectedOrderId={selectedStop?.orderId} onSelectStop={setSelectedStop} />
              <small className="map-note">Dashed estimates are used when an assignment has no saved coordinates.</small>
            </section>

            <section className="glass card stops-panel">
              <div className="section-heading-row"><div><span className="eyebrow">Stop manifest</span><h3>{orderedStops.length} scheduled stops</h3></div></div>
              <div className="stop-list">
                {orderedStops.map((stop) => (
                  <article key={stop.orderId} className={`stop-card ${selectedStop?.orderId === stop.orderId ? 'selected' : ''}`} onClick={() => setSelectedStop(stop)}>
                    <div className="stop-sequence">{stop.stopSequence || '—'}</div>
                    <div className="stop-main">
                      <div className="stop-title-row"><strong>{stop.buyer?.name || 'Buyer'}</strong><span className={`pill pill-${stop.stopStatus === 'DELIVERED' ? 'success' : stop.stopStatus === 'FAILED' ? 'danger' : 'warning'}`}>{stop.stopStatus}</span></div>
                      <p>{stop.deliveryAddress}</p>
                      <small><Clock3 size={13} /> {stop.scheduledDeliveryDate ? new Date(stop.scheduledDeliveryDate).toLocaleString() : 'Schedule pending'}</small>
                      {stop.deliveryNotes && <small>Notes: {stop.deliveryNotes}</small>}
                      {stop.failedReason && <small className="text-danger">Failure: {stop.failedReason}</small>}
                      {stop.stopStatus === 'ASSIGNED' && (
                        <div className="stop-actions" onClick={(event) => event.stopPropagation()}>
                          <button className="btn btn-primary" disabled={updatingId === stop.orderId} onClick={() => void updateStatus(stop, 'DELIVERED')}><Check size={15} /> Delivered</button>
                          <button className="btn btn-secondary failed-button" onClick={() => setFailureStopId((current) => current === stop.orderId ? '' : stop.orderId)}><X size={15} /> Failed</button>
                        </div>
                      )}
                      {failureStopId === stop.orderId && (
                        <div className="failure-form" onClick={(event) => event.stopPropagation()}>
                          <textarea className="form-control" rows={2} maxLength={500} value={failureReason} onChange={(event) => setFailureReason(event.target.value)} placeholder="Reason for failed delivery (required)" />
                          <button className="btn btn-secondary failed-button" disabled={!failureReason.trim() || updatingId === stop.orderId} onClick={() => void updateStatus(stop, 'FAILED')}>Record failed attempt</button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        <section className="glass card optimizer-panel">
          <div className="optimizer-heading"><MessageSquareText size={22} /><div><span className="eyebrow">Groq route assistant</span><h3>Tell the optimizer your constraints</h3></div></div>
          <textarea className="form-control" rows={3} value={constraints} onChange={(event) => setConstraints(event.target.value)} maxLength={1000} placeholder="Example: Deliver the Clifton stop before noon, then prioritize the frozen order." />
          <div className="optimizer-actions">
            <small>{activeStops.length} active stop(s) will be considered.</small>
            <button className="btn btn-accent" onClick={() => void optimizeRoute()} disabled={optimizing || activeStops.length === 0}><Route size={17} /> {optimizing ? 'Optimizing…' : 'Suggest best route'}</button>
          </div>
          {proposal && (
            <div className="route-proposal animate-fade">
              <div className={`alert ${proposal.isFallback ? 'alert-warning' : 'alert-success'}`}>{proposal.rationale}</div>
              <ol>{proposal.stops.map((stop) => <li key={stop.orderId}><strong>Stop {stop.sequence}</strong><span>{stop.address}</span></li>)}</ol>
              <div className="proposal-actions">
                <button className="btn btn-primary" onClick={() => void acceptProposal()} disabled={accepting}><Check size={17} /> {accepting ? 'Saving…' : 'Accept reordering'}</button>
                <button className="btn btn-secondary" onClick={() => setProposal(null)}>Ignore</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DriverDashboard;
