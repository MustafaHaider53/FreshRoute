import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Leaf, AlertTriangle } from 'lucide-react';
import { io } from 'socket.io-client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar, ResponsiveContainer
} from 'recharts';
import api from '../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch initial dashboard data
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/analytics/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };
    fetchDashboardData();

    // Setup WebSocket connection
    const newSocket = io('http://localhost:3000'); // Assuming backend is on port 3000

    newSocket.on('critical_complaint', (complaint: any) => {
      setAlerts((prev) => [complaint, ...prev]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

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
      <main className="main-content" style={{ overflowY: 'auto', padding: '20px' }}>
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Cooperative Administration & Analytics</h2>
        </div>

        {alerts.length > 0 && (
          <div className="alerts-container" style={{ marginBottom: '20px' }}>
            {alerts.map((alert, index) => (
              <div key={index} className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} />
                <span>
                  <strong>CRITICAL COMPLAINT!</strong> Category: {alert.defectCategory}. "{alert.description}"
                </span>
              </div>
            ))}
          </div>
        )}

        {dashboardData ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* 1. Waste Rates */}
            <div className="glass card">
              <h3>Waste vs Good Product</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboardData.wasteRate} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {dashboardData.wasteRate.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Forecast Accuracy */}
            <div className="glass card">
              <h3>Demand Forecast Accuracy</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.forecastAccuracy}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" stroke="#8884d8" name="Predicted Vol" />
                    <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="Actual Vol" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Top Buyers */}
            <div className="glass card">
              <h3>Top Buyers by Revenue</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.topBuyers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalSpent" fill="#8884d8" name="Total Spent ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Driver Success Rates */}
            <div className="glass card">
              <h3>Driver Delivery Success Rates</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={20} data={dashboardData.driverSuccessRates}>
                    <RadialBar label={{ position: 'insideStart', fill: '#fff' }} background dataKey="successRate" name="Success Rate (%)" />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        ) : (
          <div>Loading analytics...</div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
