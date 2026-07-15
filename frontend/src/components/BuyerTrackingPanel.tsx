import { useEffect, useState } from 'react';
import { LocateFixed, Radio, Search } from 'lucide-react';
import { io } from 'socket.io-client';
import api, { API_ORIGIN } from '../utils/api';
import type { DeliveryStop } from '../types/delivery';
import DeliveryMap from './DeliveryMap';

const BuyerTrackingPanel = () => {
  const [orderId, setOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<DeliveryStop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trackOrder = async (id = orderId) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/delivery/track/${id.trim()}`);
      setTrackedOrder(response.data);
      setOrderId(id.trim());
    } catch (requestError: any) {
      setTrackedOrder(null);
      setError(requestError.response?.data?.message || 'Unable to track this order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('freshroute_token');
    if (!token) return;
    const socket = io(`${API_ORIGIN}/delivery`, { auth: { token } });
    socket.on('delivery_stop_updated', (stop: DeliveryStop) => {
      setTrackedOrder((current) => current?.orderId === stop.orderId
        ? { ...current, ...stop, driver: stop.driver ?? current.driver }
        : current);
    });
    return () => {
      socket.close();
    };
  }, []);

  return (
    <section className="glass card buyer-tracking-panel">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow"><Radio size={13} /> Live delivery tracking</span>
          <h3>Track an order</h3>
          <p>Enter one of your order IDs to view its latest driver stop status.</p>
        </div>
      </div>
      <form className="tracking-search" onSubmit={(event) => { event.preventDefault(); void trackOrder(); }}>
        <input className="form-control" value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order UUID" />
        <button className="btn btn-primary" disabled={loading || !orderId.trim()}>
          <Search size={17} /> {loading ? 'Locating…' : 'Track'}
        </button>
      </form>
      {error && <div className="alert alert-danger">{error}</div>}
      {trackedOrder && (
        <div className="tracking-result animate-fade">
          <DeliveryMap stops={[trackedOrder]} selectedOrderId={trackedOrder.orderId} compact />
          <div className="tracking-details">
            <span className={`pill pill-${trackedOrder.stopStatus === 'DELIVERED' ? 'success' : trackedOrder.stopStatus === 'FAILED' ? 'danger' : 'warning'}`}>
              {trackedOrder.stopStatus || trackedOrder.orderStatus}
            </span>
            <h4><LocateFixed size={18} /> {trackedOrder.deliveryAddress}</h4>
            <p>{trackedOrder.driver?.name ? `Driver: ${trackedOrder.driver.name}` : 'A driver has not been assigned yet.'}</p>
            {trackedOrder.scheduledDeliveryDate && <p>Scheduled: {new Date(trackedOrder.scheduledDeliveryDate).toLocaleString()}</p>}
            {trackedOrder.coordinatesAreApproximate && <small>The pin is an approximate location derived from the delivery address.</small>}
            {trackedOrder.failedReason && <div className="alert alert-danger">Failed attempt: {trackedOrder.failedReason}</div>}
          </div>
        </div>
      )}
    </section>
  );
};

export default BuyerTrackingPanel;
