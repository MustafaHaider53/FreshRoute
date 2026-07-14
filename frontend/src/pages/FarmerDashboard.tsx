import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Plus, Trash2, Edit3, Sparkles, LogOut, Leaf, 
  Package, Calendar, Check, X, AlertTriangle, RefreshCw
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  variety: string;
  unit: string;
  price: number;
  quantity: number;
  harvestDate: string;
  shelfLifeDays: number;
  daysSinceHarvest: number;
  spoilageRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface PricingSuggestion {
  pricingSuggestionId: string;
  suggestedPrice: number;
  rationale: string;
  isFallback: boolean;
}

const FarmerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal control states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [shelfLifeDays, setShelfLifeDays] = useState('');

  // AI Drawer states
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<PricingSuggestion | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/inventory');
      setProducts(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch inventory. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        name,
        variety,
        unit,
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        harvestDate,
        shelfLifeDays: parseInt(shelfLifeDays),
      };
      await api.post('/inventory', payload);
      setSuccessMsg('Product added successfully!');
      setIsAddModalOpen(false);
      // Reset form
      setName('');
      setVariety('');
      setUnit('kg');
      setPrice('');
      setQuantity('');
      setHarvestDate('');
      setShelfLifeDays('');
      
      fetchProducts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to add product');
    }
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setError(null);
    try {
      await api.put(`/inventory/${selectedProduct.id}`, {
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      });
      setSuccessMsg('Product updated successfully!');
      setIsEditModalOpen(false);
      fetchProducts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setError(null);
    try {
      await api.delete(`/inventory/${productId}`);
      setSuccessMsg('Product deleted successfully');
      fetchProducts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete product.');
    }
  };

  // Trigger Dynamic Pricing AI
  const handleGetAiPricing = async (product: Product) => {
    setSelectedProduct(product);
    setAiSuggestion(null);
    setAiLoading(true);
    setIsAiDrawerOpen(true);
    setError(null);

    try {
      const response = await api.post(`/inventory/${product.id}/suggest-price`);
      setAiSuggestion(response.data);
    } catch (err: any) {
      console.error(err);
      setIsAiDrawerOpen(false);
      setError('AI Pricing service is offline or returned an error.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAiPrice = async () => {
    if (!aiSuggestion || !selectedProduct) return;
    setError(null);
    try {
      await api.post('/inventory/accept-price', {
        pricingSuggestionId: aiSuggestion.pricingSuggestionId,
      });
      setSuccessMsg('AI Price recommendation accepted successfully!');
      setIsAiDrawerOpen(false);
      fetchProducts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to apply AI pricing.');
    }
  };

  // Calculate metrics
  const totalListings = products.length;
  const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
  const highRiskCount = products.filter(p => p.spoilageRisk === 'HIGH').length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Leaf size={24} className="text-primary" style={{ stroke: 'var(--color-primary)' }} />
          Fresh<span>Route</span>
        </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <a href="#" className="sidebar-link active">
              <Package size={18} />
              <span>Inventory Manager</span>
            </a>
          </li>
          {/* Placeholders for teammates' modules (disabled/readonly for Mustafa) */}
          <li className="sidebar-item" style={{ opacity: 0.4 }}>
            <span className="sidebar-link">
              <Calendar size={18} />
              <span>Farmer Orders</span>
            </span>
          </li>
        </ul>
        <div className="sidebar-user">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.name ? user.name[0].toUpperCase() : 'F'}
            </div>
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

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="dashboard-header animate-fade">
          <div className="dashboard-title">
            Farmer Inventory Dashboard
            <span>Manage listings, monitor perishable products, and optimize margins with Groq AI.</span>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Add Produce Listing
          </button>
        </header>

        {/* Global Notifications */}
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

        {/* Core Metrics Cards */}
        <section className="grid-3 animate-fade">
          <div className="card glass">
            <div className="comparison-label">Active Listings</div>
            <div className="stat-value">{totalListings}</div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Individual SKUs listed online</span>
          </div>
          <div className="card glass">
            <div className="comparison-label">Total Stock Weight</div>
            <div className="stat-value">{totalStock.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>Units</span></div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sum of all current listings</span>
          </div>
          <div className="card glass" style={{ borderLeft: highRiskCount > 0 ? '3px solid var(--color-danger)' : '1px solid var(--glass-border)' }}>
            <div className="comparison-label">High Spoilage Alerts</div>
            <div className="stat-value" style={{ color: highRiskCount > 0 ? 'var(--color-danger)' : 'var(--color-primary)' }}>{highRiskCount}</div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Requires immediate price clearance</span>
          </div>
        </section>

        {/* Produce Catalogue Table */}
        <section className="glass animate-fade" style={{ borderRadius: 'var(--border-radius-md)', padding: '4px' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <RefreshCw className="shimmer" size={24} style={{ animation: 'spin 2s linear infinite' }} /> Loading inventory...
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No products found. Click "Add Produce Listing" to make your first offer!
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variety</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Harvested</th>
                    <th>Spoilage Risk</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td>{product.variety}</td>
                      <td>${product.price.toFixed(2)} / {product.unit}</td>
                      <td>{product.quantity} {product.unit}</td>
                      <td>
                        {new Date(product.harvestDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {product.daysSinceHarvest} days ago
                        </span>
                      </td>
                      <td>
                        <span className={`pill ${
                          product.spoilageRisk === 'HIGH' ? 'pill-danger' : 
                          product.spoilageRisk === 'MEDIUM' ? 'pill-warning' : 'pill-success'
                        }`}>
                          {product.spoilageRisk}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleGetAiPricing(product)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--color-accent)', color: 'var(--color-accent)', gap: '4px' }}
                            title="AI Price Optimization"
                          >
                            <Sparkles size={13} /> AI Price
                          </button>
                          <button 
                            onClick={() => handleOpenEditModal(product)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px' }}
                            title="Edit Listing"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', color: 'var(--color-danger)' }}
                            title="Delete Listing"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal: Add Product */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content glass">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.4rem' }}>Add Produce Listing</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="modal-close"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Produce Name</label>
                    <input type="text" className="form-control" placeholder="Tomatoes" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Variety</label>
                    <input type="text" className="form-control" placeholder="Roma" value={variety} onChange={e => setVariety(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Base Unit</label>
                    <input type="text" className="form-control" placeholder="kg, box, box (10kg)" value={unit} onChange={e => setUnit(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price per Unit ($)</label>
                    <input type="number" step="0.01" className="form-control" placeholder="3.50" value={price} onChange={e => setPrice(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Available Qty</label>
                    <input type="number" step="0.1" className="form-control" placeholder="50" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Harvest Date</label>
                    <input type="date" className="form-control" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shelf Life (Days)</label>
                    <input type="number" className="form-control" placeholder="7" value={shelfLifeDays} onChange={e => setShelfLifeDays(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">List Produce</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Product */}
        {isEditModalOpen && selectedProduct && (
          <div className="modal-overlay">
            <div className="modal-content glass">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.4rem' }}>Edit Listing: {selectedProduct.name}</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="modal-close"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditProduct}>
                <div className="form-group">
                  <label className="form-label">Price per {selectedProduct.unit} ($)</label>
                  <input type="number" step="0.01" className="form-control" value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Available Quantity ({selectedProduct.unit}s)</label>
                  <input type="number" step="0.1" className="form-control" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Side Drawer: Dynamic Pricing AI */}
        {isAiDrawerOpen && selectedProduct && (
          <>
            <div className="drawer-overlay" onClick={() => setIsAiDrawerOpen(false)} />
            <div className="drawer glass">
              <div className="drawer-header">
                <div>
                  <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} style={{ color: 'var(--color-accent)' }} /> Pricing Assistant
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>AI-driven market recommendation</span>
                </div>
                <button onClick={() => setIsAiDrawerOpen(false)} className="modal-close"><X size={20} /></button>
              </div>

              {aiLoading ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', gap: '16px' }}>
                  <RefreshCw className="shimmer" size={32} style={{ animation: 'spin 2s linear infinite' }} />
                  <span>Analyzing freshness, shelf-life risk, and surplus metrics...</span>
                </div>
              ) : aiSuggestion ? (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {aiSuggestion.isFallback && (
                    <div className="alert alert-danger" style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', padding: '8px 12px', marginBottom: '16px' }}>
                      <AlertTriangle size={16} /> <strong>AI Engine Offline:</strong> Fallback pricing applied.
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <div className="ai-pill">
                      Grok Llama-3.3 Analysis
                    </div>
                    <h4 style={{ marginTop: '12px', fontSize: '1.1rem' }}>{selectedProduct.name} ({selectedProduct.variety})</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Days since harvest: <strong>{selectedProduct.daysSinceHarvest} days</strong> | Shelf Life: <strong>{selectedProduct.shelfLifeDays} days</strong>
                    </p>
                  </div>

                  <div className="comparison-box">
                    <div className="comparison-grid">
                      <div className="comparison-card">
                        <div className="comparison-label">Current Price</div>
                        <div className="comparison-value">${selectedProduct.price.toFixed(2)}</div>
                      </div>
                      <div className="comparison-card">
                        <div className="comparison-label">Suggested Price</div>
                        <div className="comparison-value suggested">${aiSuggestion.suggestedPrice.toFixed(2)}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      {aiSuggestion.suggestedPrice < selectedProduct.price ? (
                        <span className="pill pill-danger" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                          Clearance Markdown: -{(((selectedProduct.price - aiSuggestion.suggestedPrice) / selectedProduct.price) * 100).toFixed(0)}%
                        </span>
                      ) : aiSuggestion.suggestedPrice > selectedProduct.price ? (
                        <span className="pill pill-success" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                          Surplus Markup: +{(((aiSuggestion.suggestedPrice - selectedProduct.price) / selectedProduct.price) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="pill pill-success" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                          Price Optimized (No change)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label className="form-label">AI Rationale</label>
                    <div className="ai-rationale">
                      {aiSuggestion.rationale}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button onClick={handleAcceptAiPrice} className="btn btn-accent btn-block" style={{ gap: '8px' }}>
                      <Check size={16} /> Accept Recommended Price
                    </button>
                    <button onClick={() => setIsAiDrawerOpen(false)} className="btn btn-secondary btn-block">
                      Keep Original Price
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default FarmerDashboard;
