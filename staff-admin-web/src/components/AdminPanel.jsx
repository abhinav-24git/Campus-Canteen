import React, { useState } from 'react';

const COUNTER_LABELS = { 1: 'Paneer Chapati', 2: 'Snacks', 3: 'Khichadi' };

export default function AdminPanel({ socket, inventory, orders }) {
  const [tab, setTab] = useState('inventory'); // inventory | analytics
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', emoji: '🍽', counter: 1, price: 20, qty: 30 });

  const handleQtyChange = (id, newQty) => {
    const newInv = inventory.map(i => i.id === id ? { ...i, qty: Math.max(0, parseInt(newQty) || 0) } : i);
    socket.emit('update_inventory', newInv);
  };

  const toggleActive = (id, checked) => {
    const newInv = inventory.map(i => i.id === id ? { ...i, available: checked } : i);
    socket.emit('update_inventory', newInv);
  };

  const changePrice = (id, newPrice) => {
    const newInv = inventory.map(i => i.id === id ? { ...i, price: Math.max(1, parseInt(newPrice) || 1) } : i);
    socket.emit('update_inventory', newInv);
  };

  const incQty = (id) => handleQtyChange(id, inventory.find(i => i.id === id).qty + 1);
  const decQty = (id) => handleQtyChange(id, inventory.find(i => i.id === id).qty - 1);

  const deleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this item completely?')) {
      socket.emit('delete_item', id);
    }
  };

  const addNewItem = () => {
    if (!newItem.name) return alert('Enter a name');
    socket.emit('add_item', { ...newItem, available: newItem.qty > 0 });
    setShowAddModal(false);
    setNewItem({ name: '', emoji: '🍽', counter: 1, price: 20, qty: 30 });
  };

  const renderAnalytics = () => {
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRev = deliveredOrders.reduce((s, o) => s + o.total, 0);
    const deliveredCount = deliveredOrders.length;
    
    // Rush Hour Graph bounds 6am to 7pm (19)
    const hrRange = [];
    for(let i=6; i<=19; i++) hrRange.push(i);
    let maxOrders = 1;
    const hourData = hrRange.map(h => {
      const count = deliveredOrders.filter(o => new Date(o.timestamp).getHours() === h).length;
      if(count > maxOrders) maxOrders = count;
      return { h, count };
    });

    return (
      <div>
        <div className="grid2" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value accent">₹{totalRev}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed Orders</div>
            <div className="stat-value">{deliveredCount}</div>
          </div>
        </div>
        
        <div className="section-label" style={{ marginBottom: 10 }}>Demand Surge Graph (6 AM - 7 PM)</div>
        <div className="card" style={{ display: 'flex', gap: 6, height: 160, alignItems: 'flex-end', paddingTop: 20, marginBottom: 24 }}>
          {hourData.map(({h, count}) => {
            const pct = (count / maxOrders) * 100;
            const isPeak = pct === 100 && count > 0;
            return (
              <div key={h} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end', background: 'var(--bg3)', borderRadius: 4 }}>
                  <div style={{ width: '100%', height: `${pct}%`, background: isPeak ? 'var(--red)' : 'var(--accent)', borderRadius: 4, transition: 'height 0.8s ease-out' }} />
                </div>
                <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: isPeak ? 'var(--red)' : 'var(--text3)', fontWeight: isPeak ? 'bold' : 'normal' }}>
                  {h > 12 ? h-12 : h}{h >= 12 ? 'p' : 'a'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-label" style={{ marginBottom: 10 }}>Revenue by Counter</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(c => {
            const cRev = deliveredOrders.filter(o => o.counter === c).reduce((s, o) => s + o.total, 0);
            const pct = totalRev > 0 ? Math.round((cRev / totalRev) * 100) : 0;
            return (
              <div key={c} className="card-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13 }}>Counter {c} — {COUNTER_LABELS[c]}</div>
                  <div style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>₹{cRev}</div>
                </div>
                <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, marginBottom: 4 }}>
                  <div style={{ height: 4, background: 'var(--accent)', width: `${pct}%`, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}% of revenue</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="section-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="section-label">Admin panel</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Canteen manager</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add item</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <button className={`btn ${tab === 'inventory' ? 'btn-primary' : ''}`} onClick={() => setTab('inventory')}>Inventory</button>
        <button className={`btn ${tab === 'analytics' ? 'btn-primary' : ''}`} onClick={() => setTab('analytics')}>Analytics</button>
      </div>

      {tab === 'inventory' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="inv-row inv-header" style={{ gridTemplateColumns: '2fr 80px 80px 100px 80px 60px' }}>
            <span>Item</span><span>Counter</span><span>Price(₹)</span><span>Qty</span><span>Active</span><span></span>
          </div>
          {inventory.map(item => (
            <div key={item.id} className={`inv-row ${!item.available ? 'oos-row' : ''}`} style={{ gridTemplateColumns: '2fr 80px 80px 100px 80px 60px' }}>
              <div style={{ fontWeight: 500 }}>{item.emoji} {item.name}</div>
              <div><span className="badge badge-gray">C{item.counter}</span></div>
              <div>
                <input 
                  type="number" 
                  value={item.price} 
                  onChange={(e) => changePrice(item.id, e.target.value)}
                  style={{ width: 50, background: 'var(--bg3)', color: 'var(--accent)', border: '1px solid var(--border)', borderRadius: 4, padding: 4, fontFamily: 'var(--mono)' }}
                />
              </div>
              <div className="qty-ctrl-row">
                <button className="qty-btn-sm" onClick={() => decQty(item.id)}>−</button>
                <span style={{ fontFamily: 'var(--mono)', width: 28, textAlign: 'center' }}>{item.qty}</span>
                <button className="qty-btn-sm" onClick={() => incQty(item.id)}>+</button>
              </div>
              <div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={item.available} onChange={(e) => toggleActive(item.id, e.target.checked)} />
                  <div className="toggle-track"></div>
                  <div className="toggle-thumb"></div>
                </label>
              </div>
              <div>
                <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => deleteItem(item.id)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'analytics' && renderAnalytics()}

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <div className="section-label" style={{ color: 'var(--text)' }}>// ADD NEW ITEM</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Item Name</div>
                <input style={{ width: '100%', padding: 8, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4 }} 
                  placeholder="e.g. Masala Dosa" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="grid2">
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Emoji</div>
                  <input style={{ width: '100%', padding: 8, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4 }} 
                    value={newItem.emoji} onChange={e => setNewItem({...newItem, emoji: e.target.value})} maxLength={2} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Counter Route</div>
                  <select 
                    style={{ width: '100%', padding: 8, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4 }}
                    value={newItem.counter} onChange={e => setNewItem({...newItem, counter: parseInt(e.target.value)})}>
                    <option value={1}>1 - {COUNTER_LABELS[1]}</option>
                    <option value={2}>2 - {COUNTER_LABELS[2]}</option>
                    <option value={3}>3 - {COUNTER_LABELS[3]}</option>
                  </select>
                </div>
              </div>
              <div className="grid2">
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Price (₹)</div>
                  <input type="number" style={{ width: '100%', padding: 8, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4 }} 
                    value={newItem.price} onChange={e => setNewItem({...newItem, price: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Initial Run Qty</div>
                  <input type="number" style={{ width: '100%', padding: 8, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4 }} 
                    value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 0})} />
                </div>
              </div>
            </div>
            <div className="grid2">
              <button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addNewItem}>Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
