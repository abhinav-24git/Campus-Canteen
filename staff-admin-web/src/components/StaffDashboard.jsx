import React, { useState } from 'react';

const COUNTER_LABELS = { 1: 'Paneer Chapati', 2: 'Snacks', 3: 'Khichadi' };

export default function StaffDashboard({ socket, orders, inventory }) {
  const [activeCounter, setActiveCounter] = useState(1);

  // Robust filtering to ensure queues do not mix
  const counterOrders = orders
    .filter(o => o.counter === activeCounter && (o.status === 'preparing' || o.status === 'ready'))
    .sort((a, b) => a.timestamp - b.timestamp);

  const deliveredCount = orders.filter(o => o.counter === activeCounter && o.status === 'delivered').length;
  const totalStock = inventory.filter(i => i.counter === activeCounter).reduce((sum, item) => sum + item.qty, 0);

  const markReady = (id) => socket.emit('update_order_status', { orderId: id, status: 'ready' });
  const deliver = (id) => {
    const deliveredAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    socket.emit('update_order_status', { orderId: id, status: 'delivered', deliveredAt });
  };

  return (
    <div className="dashboard-container">
      <div className="section-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="section-label">Staff dashboard</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Real-time queue</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="dot" style={{ background: 'var(--green)' }}></div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>LIVE</div>
        </div>
      </div>

      <div className="counter-selector">
        {[1, 2, 3].map(c => (
          <div key={c} className={`counter-btn ${activeCounter === c ? 'active' : ''}`} onClick={() => setActiveCounter(c)}>
            <div className="counter-btn-num">{c}</div>
            <div className="counter-btn-label">{COUNTER_LABELS[c]}</div>
          </div>
        ))}
      </div>

      <div className="grid3" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">In queue</div>
          <div className={`stat-value ${counterOrders.length > 3 ? 'red' : 'accent'}`}>{counterOrders.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Delivered today</div>
          <div className="stat-value">{deliveredCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stock left</div>
          <div className={`stat-value ${totalStock < 10 ? 'red' : 'amber'}`}>{totalStock}</div>
        </div>
      </div>

      <div className="section-label" style={{ marginBottom: 8 }}>Order queue — Counter {activeCounter}</div>

      {counterOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
          Queue is clear — no pending orders
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {counterOrders.map((order, idx) => (
            <div key={order.id} className={`queue-item ${idx === 0 ? 'next' : ''}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="queue-id">
                  {idx === 0 && <span className="badge badge-accent" style={{ marginRight: 4 }}>NEXT</span>}
                  <strong style={{ color: idx === 0 ? 'var(--accent)' : 'var(--text)' }}>{order.code}</strong>
                </div>
                <div className="queue-name" style={{ fontSize: 16 }}>{order.studentName}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
                  {order.items.map(i => `${i.name} ×${i.qty}`).join(' · ')}
                </div>
                <div className="queue-time">Ordered {order.time}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                {order.status === 'preparing' && (
                  <button className="btn" style={{ fontSize: 11, padding: '5px 10px', borderColor: 'var(--amber)', color: 'var(--amber)' }} onClick={() => markReady(order.id)}>
                    Finish Prep → Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button className="btn-delivered" onClick={() => deliver(order.id)}>DELIVER TICKET</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
