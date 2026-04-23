import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../Theme';

export default function HistoryScreen({ historyOrders, onBack }) {
  const { Theme } = useTheme();
  const styles = getStyles(Theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {historyOrders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🧾</Text>
            <Text style={styles.emptyText}>No past orders found.</Text>
          </View>
        ) : (
          historyOrders.sort((a, b) => b.timestamp - a.timestamp).map(order => (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.code}>{order.code}</Text>
                <Text style={styles.date}>{new Date(order.timestamp).toLocaleDateString()} {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
              </View>
              
              <View style={styles.items}>
                {order.items.map((i, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName}>{i.name} ×{i.qty}</Text>
                    <Text style={styles.itemPrice}>₹{i.price * i.qty}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>₹{order.items.reduce((sum, i) => sum + (i.price * i.qty), 0)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: Theme.bg2, borderBottomWidth: 1, borderBottomColor: Theme.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.bg3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.border },
  backText: { color: Theme.text, fontSize: 18, fontWeight: 'bold' },
  title: { color: Theme.text, fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  scroll: { padding: 20 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Theme.text3, fontFamily: 'monospace' },
  card: { backgroundColor: Theme.bg2, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Theme.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Theme.border, paddingBottom: 12, marginBottom: 12 },
  code: { color: Theme.accent, fontWeight: 'bold', fontFamily: 'monospace', fontSize: 16 },
  date: { color: Theme.text3, fontSize: 12, fontFamily: 'monospace' },
  items: { gap: 8, marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { color: Theme.text, fontSize: 14 },
  itemPrice: { color: Theme.text2, fontFamily: 'monospace' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Theme.border, paddingTop: 12 },
  totalLabel: { color: Theme.text2, fontWeight: 'bold' },
  totalValue: { color: Theme.accent, fontWeight: 'bold', fontSize: 16 }
});
