import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../Theme';

export default function MenuScreen({ inventory, cart, setCart, activeOrders, user, onLogout, onCheckout }) {
  const updateCart = (id, delta) => {
    const item = inventory.find(i => i.id === id);
    if (!item || !item.available) return;
    const curr = cart[id] || 0;
    const updated = Math.max(0, curr + delta);
    if (updated > item.qty) return; 
    
    setCart(prev => {
      const nc = { ...prev, [id]: updated };
      if (nc[id] === 0) delete nc[id];
      return nc;
    });
  };

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const i = inventory.find(i => i.id === parseInt(id));
    return sum + (i ? i.price * qty : 0);
  }, 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topNav}>
        <Text style={{ color: Theme.accent, fontWeight: 'bold', fontSize: 16, fontFamily: 'monospace' }}>Campus<Text style={{ color: Theme.text3 }}>Eats</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ color: Theme.text3, fontSize: 12, fontFamily: 'monospace' }}>{user?.name || 'Student'}</Text>
          <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: Theme.bg3, borderRadius: 4, borderWidth: 1, borderColor: Theme.border }}>
            <Text style={{ color: Theme.text2, fontSize: 10 }}>out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, maxWidth: 800, alignSelf: 'center', width: '100%', paddingTop: 24 }}>
        <Text style={styles.headerTitle}>What are you having?</Text>
        <View style={{ height: 24 }} />
        {[1, 2, 3].map(c => {
          const counterItems = inventory.filter(i => i.counter === c);
          if(counterItems.length === 0) return null;
          return (
            <View key={c} style={{ marginBottom: 24 }}>
              <View style={styles.counterHeader}>
                <Text style={styles.counterBadge}>COUNTER {c}</Text>
              </View>
              {counterItems.map(item => {
                const qty = cart[item.id] || 0;
                const oos = !item.available || item.qty === 0;
                return (
                  <View key={item.id} style={[styles.card, qty > 0 && styles.cardActive, oos && styles.oos]}>
                    <View style={styles.cardMeta}>
                      <Text style={styles.itemEmoji}>{item.emoji || '🍽'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemStock}>{oos ? 'Out of stock' : `${item.qty} left`}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.controls}>
                      <Text style={styles.price}>₹{item.price}</Text>
                      {!oos && (
                        <View style={styles.qtyRow}>
                          {qty > 0 && (
                            <>
                              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCart(item.id, -1)}>
                                <Text style={styles.qtyText}>−</Text>
                              </TouchableOpacity>
                              <Text style={styles.qtyNum}>{qty}</Text>
                            </>
                          )}
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCart(item.id, 1)}>
                            <Text style={styles.qtyText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {activeOrders && activeOrders.length > 0 && (
        <View style={styles.trackerContainer}>
          <Text style={styles.trackerTitle}>🔥 Live Orders ({activeOrders.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingTop: 8 }}>
            {activeOrders.map(o => (
              <View key={o.id} style={styles.trackerCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.trackerCode}>{o.code}</Text>
                  <Text style={styles.trackerCounter}>C{o.counter}</Text>
                </View>
                <Text style={{ color: Theme.text, fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>
                  {o.status === 'preparing' ? '👩‍🍳 Preparing...' : '✅ Ready to Pick Up!'}
                </Text>
                <View style={styles.trackerBarContainer}>
                  <View style={[styles.trackerBarHalf, { backgroundColor: Theme.accent }]} />
                  <View style={[styles.trackerBarHalf, { backgroundColor: o.status === 'ready' ? Theme.green : Theme.bg3 }]} />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {cartCount > 0 && (
        <View style={styles.cartBarContainer}>
          <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout}>
            <Text style={styles.btnText}>Checkout {cartCount} items</Text>
            <Text style={styles.btnText}>₹{cartTotal}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: Theme.bg2, borderBottomWidth: 1, borderBottomColor: Theme.border },
  headerTitle: { color: Theme.text, fontSize: 24, fontWeight: 'bold' },
  counterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  counterBadge: { color: Theme.text3, backgroundColor: Theme.bg3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 10, fontFamily: 'monospace', borderWidth: 1, borderColor: Theme.border },
  card: { backgroundColor: Theme.bg2, borderWidth: 1, borderColor: Theme.border, borderRadius: 10, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardActive: { borderColor: Theme.accent },
  oos: { opacity: 0.5 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemEmoji: { fontSize: 24, marginRight: 10 },
  itemName: { color: Theme.text, fontSize: 14, fontWeight: 'bold' },
  itemStock: { color: Theme.text3, fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  controls: { alignItems: 'flex-end', gap: 6 },
  price: { color: Theme.accent, fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Theme.bg3, borderColor: Theme.border2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: Theme.text, fontSize: 16 },
  qtyNum: { color: Theme.text, fontWeight: 'bold', minWidth: 16, textAlign: 'center' },
  cartBarContainer: { padding: 16, paddingBottom: 24, backgroundColor: Theme.bg2, borderTopWidth: 1, borderTopColor: Theme.border },
  checkoutBtn: { backgroundColor: Theme.accent, borderRadius: 8, padding: 16, flexDirection: 'row', justifyContent: 'space-between' },
  btnText: { color: Theme.bg, fontWeight: 'bold', fontSize: 16 },
  
  trackerContainer: { backgroundColor: Theme.bg2, borderTopWidth: 1, borderTopColor: Theme.border, padding: 16, paddingBottom: 24 },
  trackerTitle: { color: Theme.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  trackerCard: { backgroundColor: Theme.bg3, borderRadius: 8, padding: 12, marginRight: 12, width: 200, borderWidth: 1, borderColor: Theme.border },
  trackerCode: { color: Theme.accent, fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12 },
  trackerCounter: { color: Theme.text2, fontSize: 10, fontFamily: 'monospace', backgroundColor: Theme.bg, paddingHorizontal: 4, borderRadius: 4 },
  trackerBarContainer: { flexDirection: 'row', gap: 4, height: 4, marginTop: 8 },
  trackerBarHalf: { flex: 1, borderRadius: 2 }
});
