import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Leaf, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import BuyerTrackingPanel from '../components/BuyerTrackingPanel';

const BuyerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // State for Complaint Form
  const [orderItemId, setOrderItemId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [manualRequired, setManualRequired] = useState(false);
  
  // Fallback states
  const [manualCategory, setManualCategory] = useState('');
  const [manualSeverity, setManualSeverity] = useState('');

  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const response = await api.post('/complaints', {
        orderItemId,
        buyerId: user?.id || 'mock-buyer-id', // In a real app, from context
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

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Leaf size={24} className="text-primary" style={{ stroke: 'var(--color-primary)' }} />
          Fresh<span>Route</span>
        </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <span className="sidebar-link active">Buyer Panel</span>
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
          <button onClick={logout} className="btn btn-secondary btn-block">
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
      </main>
    </div>
  );
};

export default BuyerDashboard;
