import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Platform, View, useWindowDimensions } from 'react-native';
import { io } from 'socket.io-client';
import LoginScreen from './src/screens/LoginScreen';
import MenuScreen from './src/screens/MenuScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { ThemeProvider, useTheme } from './src/Theme';

const localBackend = Platform.OS === 'web' ? 'http://localhost:8080' : 'http://10.0.2.2:8080';
const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || localBackend;
const socket = io(backendUrl);

// ─── Web-only styles injected once ────────────────────────────────────────────
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    /* Page reset — DO NOT set display:flex on html/body, that breaks RN root */
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #0a0b0a;
      overflow: hidden;
    }

    #root {
      width: 100%;
      height: 100%;
      background: #0a0b0a;
      display: flex;
    }
    
    /* Global scrollbar hiding for clean app feel */
    *::-webkit-scrollbar { display: none; }
    * { scrollbar-width: none; -ms-overflow-style: none; }
  `;
  document.head.appendChild(style);
}
// ──────────────────────────────────────────────────────────────────────────────

/**
 * PhoneFrame — on web, wraps children in a cosmetic phone shell div AND
 * an explicit RN View (390×844) so that all flex:1 children measure against
 * phone dimensions instead of the browser viewport.
 * On native it is a transparent passthrough.
 */
function PhoneFrame({ children, bg, phoneViewStyle }) {
  if (Platform.OS !== 'web') {
    return children;
  }

  // Detect real mobile browsers specifically (Android, iOS) so we strip the desktop skin
  const isMobileClient = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobileClient) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        {children}
      </View>
    );
  }

  return (
    <div id="phone-shell" style={{ background: bg }}>
      {/* This View is the TRUE layout root — flex:1 children measure against it */}
      <View style={phoneViewStyle}>
        {children}
      </View>
    </div>
  );
}

function MainApp() {
  const { Theme, isLight } = useTheme();
  
  const styles = getStyles(Theme);
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState('Menu'); // Menu | Checkout
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    socket.on('state_sync', state => {
      setInventory(state.inventory);
      setOrders(state.orders);
    });
    socket.on('inventory_updated', inv => setInventory(inv));
    socket.emit('request_state');

    socket.on('orders_created', newOrders => {
      setOrders(prev => [...prev, ...newOrders]);
    });

    socket.on('order_updated', updatedOrder => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => {
      socket.off('state_sync');
      socket.off('inventory_updated');
      socket.off('orders_created');
      socket.off('order_updated');
    };
  }, []);

  const activeUserOrders = user
    ? orders.filter(o => o.userId === user.phone && o.status !== 'delivered')
    : [];

  const historyUserOrders = user
    ? orders.filter(o => o.userId === user.phone && o.status === 'delivered')
    : [];

  const appContent = !user ? (
    <View style={styles.fill}>
      <StatusBar barStyle={isLight ? "dark-content" : "light-content"} backgroundColor={Theme.bg} />
      <LoginScreen onLogin={(userObj) => setUser(userObj)} />
    </View>
  ) : (
    <View style={styles.fill}>
      <StatusBar barStyle={isLight ? "dark-content" : "light-content"} backgroundColor={Theme.bg} />
      {route === 'Menu' && (
        <MenuScreen
          inventory={inventory}
          cart={cart}
          setCart={setCart}
          activeOrders={activeUserOrders}
          user={user}
          onLogout={() => { setUser(null); setCart({}); }}
          onCheckout={() => setRoute('Checkout')}
          onHistory={() => setRoute('History')}
        />
      )}
      {route === 'Checkout' && (
        <CheckoutScreen
          cart={cart}
          inventory={inventory}
          user={user}
          onBack={() => setRoute('Menu')}
          onComplete={() => {
            setCart({});
            setRoute('Menu');
          }}
        />
      )}
      {route === 'History' && (
        <HistoryScreen 
          historyOrders={historyUserOrders}
          onBack={() => setRoute('Menu')}
        />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      {appContent}
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const getStyles = (Theme) => StyleSheet.create({
  // Used as the app root
  fill: {
    flex: 1,
    backgroundColor: Theme.bg,
  },
});
