import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import BuyerTrackingPanel from '../components/BuyerTrackingPanel';
import { io } from 'socket.io-client';
import { 
  LogOut, Leaf, ShoppingCart, List, 
  Plus, Minus, Check, Package, AlertTriangle, X, AlertCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  variety: string;
  unit: string;
  price: number;
  quantity: number;
  spoilageRisk: string;
  farmer: { name: string };
}

interface CartItem extends Product {
  orderQuantity: number;
}

interface OrderItem {
  quantityOrdered: number;
  priceAtOrder: number;
  product: {
    name: string;
    unit: string;
  };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

const BuyerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'orders' | 'complaints'>('marketplace');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // State for Complaint Form
  const [orderItemId, setOrderItemId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [manualRequired, setManualRequired] = useState(false);
  
  // Fallback states for Complaint
  const [manualCategory, setManualCategory] = useState('');
  const [manualSeverity, setManualSeverity] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchOrders();

    const token = localStorage.getItem('freshroute_token');
    const newSocket = io('http://localhost:3000', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    newSocket.on('order.updated', (data) => {
      setSuccessMsg(`Order Update: ${data.message}`);
      fetchOrders();
      setTimeout(() => setSuccessMsg(null), 5000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/all');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.orderQuantity >= product.quantity) return prev;
        return prev.map(item => item.id === product.id ? { ...item, orderQuantity: item.orderQuantity + 1 } : item);
      }
      return [...prev, { ...product, orderQuantity: 1 }];
    });
    setSuccessMsg(`Added ${product.name} to cart`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, Math.min(item.quantity, item.orderQuantity + delta));
        return { ...item, orderQuantity: newQty };
      }
      return item;
    }).filter(item => item.orderQuantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.orderQuantity), 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const payload = {
        deliveryAddress: "123 Buyer Street, City", // Hardcoded for demo
        deliveryNotes: "Leave at front door",
        items: cart.map(item => ({ productId: item.id, quantity: item.orderQuantity }))
      };
      await api.post('/orders', payload);
      setSuccessMsg('Order placed successfully!');
      setCart([]);
      setIsCartOpen(false);
      fetchOrders();
      fetchProducts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order');
      setTimeout(() => setError(null), 3000);
    }
  };

  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const response = await api.post('/complaints', {
        orderItemId,
        buyerId: user?.id || 'mock-buyer-id',
        description,
        ...(manualRequired && { defectCategory: manualCategory, severity: manualSeverity })
      });
      
      if (response.data.manualRequired) {
        setManualRequired(true);
        setMessage('AI Classification is offline. Please manually classify the defect.');
      } else {
        setMessage('Complaint submitted successfully!');
        setOrderItemId('');
        setDescription('');
        setManualRequired(false);
      }
    } catch (error) {
      console.error(error);
      setMessage('Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'var(--color-warning)';
      case 'CONFIRMED': return 'var(--color-primary)';
      case 'PACKED': return 'var(--color-accent)';
      case 'IN_TRANSIT': return 'var(--color-info)';
      case 'DELIVERED': return 'var(--color-success)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Leaf size={24} className="text-primary" style={{ stroke: 'var(--color-primary)' }} />
          Fresh<span>Route</span>
        </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <a href="#" className={`sidebar-link ${activeTab === 'marketplace' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('marketplace'); }}>
              <List size={18} />
              <span>Marketplace</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a href="#" className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('orders'); }}>
              <Package size={18} />
              <span>My Orders</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a href="#" className={`sidebar-link ${activeTab === 'complaints' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('complaints'); }}>
              <AlertCircle size={18} />
              <span>File Complaint</span>
            </a>
          </li>
        </ul>
        <div className="sidebar-user">
          <div className="user-profile">
            <div className="user-avatar">{user?.name ? user.name[0].toUpperCase() : 'B'}</div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary btn-block" style={{ gap: '8px' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content" style={{ padding: '40px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Buyer Marketplace & Traceability</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Welcome, <strong>{user?.name}</strong>!
        </p>

        <BuyerTrackingPanel />

        <div className="glass card" style={{ maxWidth: '600px', marginBottom: '30px' }}>
          <h3>Submit Quality Complaint</h3>
          <form onSubmit={submitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <div className="form-group">
              <label>Order Item ID</label>
              <input 
                type="text" 
                className="form-control" 
                value={orderItemId} 
                onChange={(e) => setOrderItemId(e.target.value)} 
                required 
                placeholder="Enter the item ID you received"
              />
            </div>
            <div className="form-group">
              <label>Complaint Description</label>
              <textarea 
                className="form-control" 
                rows={4} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                placeholder="Describe the defect in detail (e.g., 'The tomatoes arrived bruised and moldy')"
              />
            </div>

      {/* Main Content */}
      <main className="main-content">
        <header className="dashboard-header animate-fade">
          <div className="dashboard-title">
            {activeTab === 'marketplace' && 'Buyer Marketplace'}
            {activeTab === 'orders' && 'My Orders'}
            {activeTab === 'complaints' && 'Submit Complaint'}
            <span>
              {activeTab === 'marketplace' && 'Browse fresh produce from local farmers.'}
              {activeTab === 'orders' && 'Track your order deliveries in real-time.'}
              {activeTab === 'complaints' && 'Report issues with order items to local coordinators.'}
            </span>
          </div>
          {activeTab === 'marketplace' && (
            <button onClick={() => setIsCartOpen(true)} className="btn btn-primary" style={{ position: 'relative' }}>
              <ShoppingCart size={18} /> Cart
              {cart.reduce((sum, item) => sum + item.orderQuantity, 0) > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-accent)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {cart.reduce((sum, item) => sum + item.orderQuantity, 0)}
                </span>
              )}
            </button>
          )}
        </header>

        {successMsg && (
          <div className="alert alert-success animate-fade">
            <Check size={18} /> {successMsg}
          </div>
        )}
        {error && (
          <div className="alert alert-danger animate-fade">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {activeTab === 'marketplace' && (
          <section className="grid-3 animate-fade">
            {loading ? (
               <p>Loading marketplace...</p>
            ) : products.length === 0 ? (
               <p>No products available.</p>
            ) : (
               products.map(product => (
                 <div key={product.id} className="card glass">
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                     <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{product.name}</h3>
                     <span className="pill pill-success">${product.price.toFixed(2)} / {product.unit}</span>
                   </div>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                     Variety: {product.variety} <br/>
                     Farm: {product.farmer?.name || 'Unknown'} <br/>
                     Available: {product.quantity} {product.unit}
                   </p>
                   <button 
                     onClick={() => addToCart(product)} 
                     className="btn btn-primary btn-block"
                     disabled={product.quantity <= 0}
                   >
                     <Plus size={16} /> Add to Cart
                   </button>
                 </div>
               ))
            )}
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="animate-fade">
            {orders.length === 0 ? (
              <p>You have no orders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => (
                  <div key={order.id} className="card glass" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ margin: 0 }}>Order ID: {order.id.slice(0, 8)}...</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <h4 style={{ margin: 0 }}>${order.totalAmount.toFixed(2)}</h4>
                        <span className="pill" style={{ backgroundColor: getStatusColor(order.status), color: '#fff' }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <strong>Items:</strong>
                      <ul style={{ paddingLeft: '20px', margin: '8px 0', color: 'var(--text-secondary)' }}>
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.quantityOrdered}x {item.product.name} @ ${item.priceAtOrder.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="progress-bar-container" style={{ background: 'var(--bg-card)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          background: getStatusColor(order.status),
                          width: order.status === 'PENDING' ? '20%' : 
                                 order.status === 'CONFIRMED' ? '40%' : 
                                 order.status === 'PACKED' ? '60%' : 
                                 order.status === 'IN_TRANSIT' ? '80%' : 
                                 order.status === 'DELIVERED' ? '100%' : '0%',
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'complaints' && (
          <div className="glass card" style={{ maxWidth: '600px' }}>
            <h3>Submit Quality Complaint</h3>
            <form onSubmit={submitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div className="form-group">
                <label>Order Item ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={orderItemId} 
                  onChange={(e) => setOrderItemId(e.target.value)} 
                  required 
                  placeholder="Enter the item ID you received"
                />
              </div>
              <div className="form-group">
                <label>Complaint Description</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                  placeholder="Describe the defect in detail (e.g., 'The tomatoes arrived bruised and moldy')"
                />
              </div>

              {manualRequired && (
                <div className="alert alert-warning" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertCircle size={18} />
                    <strong>Manual Classification Required</strong>
                  </div>
                  <div className="form-group">
                    <label>Defect Category</label>
                    <select className="form-control" value={manualCategory} onChange={(e) => setManualCategory(e.target.value)} required>
                      <option value="">Select Category</option>
                      <option value="FRESHNESS">Freshness</option>
                      <option value="PACKAGING">Packaging</option>
                      <option value="CONTAMINATION">Contamination</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Severity</label>
                    <select className="form-control" value={manualSeverity} onChange={(e) => setManualSeverity(e.target.value)} required>
                      <option value="">Select Severity</option>
                      <option value="MINOR">Minor</option>
                      <option value="MAJOR">Major</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : (manualRequired ? 'Submit Manual Classification' : 'Submit to AI Classifier')}
              </button>
              {message && <div style={{ marginTop: '10px', color: manualRequired ? 'orange' : 'green' }}>{message}</div>}
            </form>
          </div>
        )}

        {isCartOpen && (
          <>
            <div className="drawer-overlay" onClick={() => setIsCartOpen(false)} />
            <div className="drawer glass">
              <div className="drawer-header">
                <h3>Shopping Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="modal-close"><X size={20} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                {cart.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>Your cart is empty.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.name}</h4>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>${item.price.toFixed(2)} / {item.unit}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => updateCartQty(item.id, -1)} className="btn btn-secondary" style={{ padding: '4px', minWidth: 'auto' }}><Minus size={14}/></button>
                        <span>{item.orderQuantity}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} className="btn btn-secondary" style={{ padding: '4px', minWidth: 'auto' }}><Plus size={14}/></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold' }}>Total:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={placeOrder} 
                  className="btn btn-primary btn-block"
                  disabled={cart.length === 0}
                >
                  <Check size={18} /> Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default BuyerDashboard;
