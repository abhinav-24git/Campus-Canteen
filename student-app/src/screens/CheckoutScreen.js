import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../Theme';

export default function CheckoutScreen({ cart, inventory, user, onBack, onComplete }) {
  const { Theme } = useTheme();
  const styles = getStyles(Theme);
  const [status, setStatus] = useState('summary'); // summary | processing | success | failed
  const [orders, setOrders] = useState([]);
  const [failMsg, setFailMsg] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const item = inventory.find(i => i.id === parseInt(id));
    return item ? { ...item, qty } : null;
  }).filter(Boolean);

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handlePayment = async () => {
    setStatus('processing');
    try {
      const backendUrl = Platform.OS === 'web' ? 'http://localhost:8080' : 'http://10.0.2.2:8080';
      
      // 1. Fetch valid RZP Order ID from backend
      const rzpRes = await fetch(`${backendUrl}/payments/create-rzp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total })
      });
      const rzpData = await rzpRes.json();
      
      if (!rzpData.success) {
        alert('Gateway Error: ' + rzpData.error);
        return setStatus('summary');
      }

      // 2. Open Razorpay Interface
      const options = {
        key: 'rzp_test_SaM287esiEe6Sd', // Real Test Key from backend!
        amount: total * 100,
        currency: 'INR',
        name: 'Campus Eats',
        description: 'Canteen Order',
        order_id: rzpData.order.id,
        handler: async function (response) {
          if (response.razorpay_payment_id) {
            // 3. Payment Success - Trigger standard split order backend Logic!
            try {
              const res = await fetch(`${backendUrl}/orders/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentName: user.name,
                  phone: user.phone,
                  cartItems: cartItems.map(i => ({ id: i.id, qty: i.qty }))
                })
              });
              const data = await res.json();
              if (data.status === 'SUCCESS') {
                setOrders(data.orders);
                setStatus('success');
                onComplete();
              } else {
                alert('Internal Checkout Failed: ' + data.error);
                setStatus('summary');
              }
            } catch (postPayErr) {
              alert('Sync Error. Please report to admin.');
              setStatus('summary');
            }
          }
        },
        prefill: {
          name: user.name,
          contact: user.phone
        },
        theme: {
          color: Theme.accent
        }
      };

      if (Platform.OS === 'web') {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
           setFailMsg(response.error.description);
           setStatus('failed');
           rzp.close(); // Forcefully destroy the Razorpay SDK popup on failure
        });
        rzp.open();
      }
    } catch (e) {
      console.error(e);
      setFailMsg('Network Error: Could not reach gateway.');
      setStatus('failed');
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.container}>
         <ScrollView style={{ padding: 24, paddingTop: 60 }}>
          <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>✅</Text>
          <Text style={{ fontFamily: 'monospace', color: Theme.green, textAlign: 'center', marginBottom: 24 }}>PAYMENT CONFIRMED</Text>
          <Text style={{ color: Theme.text3, textAlign: 'center', marginBottom: 16 }}>Your order has been split by counter:</Text>
          {orders.map(o => (
            <View key={o.id} style={styles.orderCard}>
              <Text style={styles.orderCode}>{o.code}</Text>
              <View style={styles.hr} />
            </View>
          ))}
          <TouchableOpacity style={styles.btnPrimary} onPress={onBack}>
            <Text style={styles.btnText}>Return to Menu</Text>
          </TouchableOpacity>
         </ScrollView>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.container}>
         <View style={{ padding: 24, paddingTop: 60, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 50, marginBottom: 16 }}>❌</Text>
          <Text style={{ fontFamily: 'monospace', color: '#ff4444', textAlign: 'center', marginBottom: 12, fontSize: 20, fontWeight: 'bold' }}>PAYMENT FAILED</Text>
          <Text style={{ color: Theme.text3, textAlign: 'center', marginBottom: 32 }}>
            {failMsg || 'The transaction was declined by the bank or gateway.'}
          </Text>
          <TouchableOpacity style={[styles.btnPrimary, { width: '100%', backgroundColor: Theme.bg3, borderWidth: 1, borderColor: '#ff4444' }]} onPress={() => setStatus('summary')}>
            <Text style={{ color: '#ff4444', fontWeight: 'bold', fontSize: 16 }}>Try Again</Text>
          </TouchableOpacity>
         </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scrollable content */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 16 }} style={{ flex: 1 }}>
        <Text style={styles.label}>// CHECKOUT</Text>

        <View style={styles.razorpayMock}>
          <Text style={styles.rzpLogo}>⚡ Razorpay <Text style={{ fontSize: 10, color: Theme.text3 }}>SECURE</Text></Text>
          <Text style={{ color: Theme.text3, fontSize: 11 }}>Total Amount</Text>
          <Text style={{ color: Theme.text, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' }}>₹{total}</Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          {cartItems.map(i => (
            <View key={i.id} style={styles.summaryRow}>
              <Text style={{ color: Theme.text }}>{i.emoji || '🍽'} {i.name} ×{i.qty}</Text>
              <Text style={{ color: Theme.text, fontFamily: 'monospace' }}>₹{i.price * i.qty}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, { borderBottomWidth: 0, marginTop: 10 }]}>
            <Text style={{ color: Theme.accent, fontWeight: 'bold' }}>TOTAL</Text>
            <Text style={{ color: Theme.accent, fontWeight: 'bold', fontFamily: 'monospace' }}>₹{total}</Text>
          </View>
        </View>

        <Text style={styles.securityText}>
          🔒 Payments powered securely via Razorpay standard 2FA routing.
        </Text>
      </ScrollView>

      {/* Fixed footer — flex layout, no absolute positioning */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.btn} onPress={onBack}>
          <Text style={{ color: Theme.text }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnPrimary, { flex: 1, flexDirection: 'row', justifyContent: 'center' }]}
          onPress={handlePayment}
          disabled={status === 'processing'}
        >
          {status === 'processing' ? (
            <ActivityIndicator color={Theme.bg} />
          ) : (
            <Text style={styles.btnText}>Pay ₹{total} via Razorpay</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  label: { color: Theme.text2, fontFamily: 'monospace', marginBottom: 16 },
  razorpayMock: { backgroundColor: Theme.bg3, padding: 20, borderRadius: 10, borderColor: Theme.border, borderWidth: 1, marginBottom: 16 },
  rzpLogo: { color: '#528FF0', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.border },
  securityText: { backgroundColor: Theme.greenDim, color: Theme.green, padding: 10, borderRadius: 6, fontSize: 11, fontFamily: 'monospace', borderWidth: 1, borderColor: 'rgba(77,255,155,0.2)' },
  // Footer action bar — flex layout, NOT absolute, so it stays within the 844px shell
  actionBar: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: Theme.bg2, borderTopWidth: 1, borderTopColor: Theme.border },
  btn: { padding: 16, borderRadius: 8, backgroundColor: Theme.bg3, borderWidth: 1, borderColor: Theme.border, flex: 0.5, alignItems: 'center' },
  btnPrimary: { padding: 16, borderRadius: 8, backgroundColor: Theme.accent, alignItems: 'center' },
  btnText: { color: Theme.bg, fontWeight: 'bold', fontSize: 16 },
  orderCard: { backgroundColor: Theme.bg3, borderColor: Theme.accent, borderWidth: 1, borderRadius: 10, padding: 20, marginBottom: 16, alignItems: 'center' },
  orderCode: { fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace', color: Theme.accent, letterSpacing: 4 },
  hr: { height: 1, backgroundColor: Theme.accent, width: '100%', opacity: 0.3, marginVertical: 12 },
  orderMeta: { color: Theme.text2, fontSize: 14 }
});
