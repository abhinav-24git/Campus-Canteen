import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import StaffDashboard from './components/StaffDashboard';
import AdminPanel from './components/AdminPanel';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const socket = io(BACKEND_URL);

export default function App() {
  const [view, setView] = useState('staff');
  const [state, setState] = useState({ inventory: [], orders: [] });

  useEffect(() => {
    socket.on('state_sync', (serverState) => setState(serverState));
    
    socket.on('inventory_updated', (inv) => {
      setState(prev => ({ ...prev, inventory: inv }));
    });
    
    socket.on('orders_created', (newOrders) => {
      setState(prev => ({ ...prev, orders: [...prev.orders, ...newOrders] }));
    });
    
    socket.on('order_updated', (updatedOrder) => {
      setState(prev => ({ 
        ...prev, 
        orders: prev.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o) 
      }));
    });
    
    return () => {
      socket.off('state_sync');
      socket.off('inventory_updated');
      socket.off('orders_created');
      socket.off('order_updated');
    };
  }, []);

  return (
    <div>
      <div className="app-bar">
        <div className="app-bar-logo">Campus<span>Eats</span></div>
        <div className="nav-buttons">
          <button 
            className={`nav-btn ${view === 'staff' ? 'active' : ''}`} 
            onClick={() => setView('staff')}
          >Staff Dashboard</button>
          <button 
            className={`nav-btn ${view === 'admin' ? 'active' : ''}`} 
            onClick={() => setView('admin')}
          >Admin Panel</button>
        </div>
      </div>
      
      <div className="page">
        {view === 'staff' ? 
          <StaffDashboard socket={socket} orders={state.orders} inventory={state.inventory} /> 
          : 
          <AdminPanel socket={socket} orders={state.orders} inventory={state.inventory} />
        }
      </div>
    </div>
  );
}
