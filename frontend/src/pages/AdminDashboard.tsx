import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Leaf } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Leaf size={24} className="text-primary" style={{ stroke: 'var(--color-primary)' }} />
          Fresh<span>Route</span>
        </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <span className="sidebar-link active">Admin Panel</span>
          </li>
        </ul>
        <div className="sidebar-user">
          <div className="user-profile">
            <div className="user-avatar">{user?.name ? user.name[0].toUpperCase() : 'A'}</div>
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
      <main className="main-content">
        <div className="glass card animate-fade" style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Cooperative Administration & Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Welcome, <strong>{user?.name}</strong>! This module is assigned to <strong>Ilyan</strong> and <strong>Ammar</strong>.
          </p>
          <div className="alert alert-success" style={{ maxWidth: '500px', margin: '0 auto' }}>
            It will contain driver route assignments, quality dispute reviews, and the Admin Analytics charts.
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
