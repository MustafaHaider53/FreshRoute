import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, RefreshCw, Truck } from 'lucide-react';
import api from '../utils/api';

interface Driver {
  id: string;
  name: string;
  email: string;
}

interface UnassignedOrder {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  buyer: { id: string; name: string; email: string };
  items: Array<{ id: string; quantityOrdered: number; product: { name: string; unit: string } }>;
}

function tomorrowAtNine() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

const DeliveryAssignmentPanel = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<UnassignedOrder[]>([]);
  const [driverId, setDriverId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState(tomorrowAtNine());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [driverResponse, orderResponse] = await Promise.all([
        api.get('/delivery/drivers'),
        api.get('/delivery/unassigned-orders'),
      ]);
      setDrivers(driverResponse.data);
      setOrders(orderResponse.data);
      setDriverId((current) => current || driverResponse.data[0]?.id || '');
      setSelectedIds((current) => current.filter((id) => orderResponse.data.some((order: UnassignedOrder) => order.id === id)));
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Unable to load delivery assignments.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedTotal = useMemo(
    () => orders.filter((order) => selectedIds.includes(order.id)).reduce((total, order) => total + order.totalAmount, 0),
    [orders, selectedIds],
  );

  const toggleOrder = (orderId: string) => {
    setSelectedIds((current) => current.includes(orderId)
      ? current.filter((id) => id !== orderId)
      : [...current, orderId]);
  };

  const assignOrders = async () => {
    if (!driverId || selectedIds.length === 0) {
      setMessage({ type: 'danger', text: 'Select a driver and at least one confirmed order.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/delivery/assign', {
        driverId,
        orderIds: selectedIds,
        scheduledDeliveryDate: new Date(scheduledDate).toISOString(),
      });
      const assignedCount = selectedIds.length;
      setSelectedIds([]);
      await loadData();
      setMessage({ type: 'success', text: `${assignedCount} order(s) assigned successfully.` });
    } catch (error: any) {
      const responseMessage = error.response?.data?.message;
      setMessage({
        type: 'danger',
        text: Array.isArray(responseMessage) ? responseMessage.join(', ') : responseMessage || 'Assignment failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass card delivery-assignment-panel">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">Delivery operations</span>
          <h3>Assemble a delivery run</h3>
          <p>Assign confirmed orders to a driver and set the run schedule.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.type === 'success' && <CheckCircle2 size={18} />}{message.text}</div>}

      <div className="assignment-controls">
        <label className="form-group">
          <span className="form-label"><Truck size={14} /> Driver</span>
          <select className="form-control" value={driverId} onChange={(event) => setDriverId(event.target.value)}>
            <option value="">Select a driver</option>
            {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} — {driver.email}</option>)}
          </select>
        </label>
        <label className="form-group">
          <span className="form-label"><CalendarClock size={14} /> Scheduled time</span>
          <input className="form-control" type="datetime-local" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} />
        </label>
        <div className="assignment-summary">
          <span>{selectedIds.length} stops</span>
          <strong>${selectedTotal.toFixed(2)}</strong>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading confirmed orders…</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">No confirmed, unassigned orders are available.</div>
      ) : (
        <div className="assignment-order-grid">
          {orders.map((order) => (
            <button
              type="button"
              key={order.id}
              className={`assignment-order ${selectedIds.includes(order.id) ? 'selected' : ''}`}
              onClick={() => toggleOrder(order.id)}
            >
              <span className="assignment-order-check">{selectedIds.includes(order.id) ? '✓' : ''}</span>
              <span>
                <strong>{order.buyer.name}</strong>
                <small>{order.deliveryAddress}</small>
                <small>{order.items.length} item(s) · {order.status}</small>
              </span>
              <b>${order.totalAmount.toFixed(2)}</b>
            </button>
          ))}
        </div>
      )}

      <button className="btn btn-primary assignment-submit" onClick={() => void assignOrders()} disabled={saving || selectedIds.length === 0 || !driverId}>
        <Truck size={18} /> {saving ? 'Assigning run…' : 'Assign selected orders'}
      </button>
    </section>
  );
};

export default DeliveryAssignmentPanel;
