import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../Theme';

export default function LoginScreen({ onLogin }) {
  const { Theme } = useTheme();
  const styles = getStyles(Theme);
  const [step, setStep] = useState('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const handlePhone = () => {
    if (name.length > 2 && phone.length === 10) setStep('otp');
    else alert('Enter a valid Name and 10-digit Phone.');
  };

  const handleOtp = () => {
    if (otp === '4218') {
      onLogin({ id: 's' + phone, name, phone });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Campus<Text style={{color: Theme.text3}}>Eats</Text></Text>
      <Text style={styles.subtitle}>// student login</Text>
      
      <View style={styles.card}>
        {step === 'phone' ? (
          <>
            <Text style={styles.label}>YOUR NAME</Text>
            <TextInput 
              style={styles.inputFull} 
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              placeholderTextColor={Theme.text3}
            />
            <Text style={styles.label}>ENTER PHONE</Text>
            <View style={styles.inputRow}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit number"
                placeholderTextColor={Theme.text3}
              />
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={handlePhone}>
              <Text style={styles.btnText}>Send OTP</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Demo OTP is 4218</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
              placeholder="0 0 0 0"
              placeholderTextColor={Theme.text3}
              textAlign="center"
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={handleOtp}>
              <Text style={styles.btnText}>Verify</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const getStyles = (Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg, justifyContent: 'center', padding: 24 },
  logo: { color: Theme.accent, fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center' },
  subtitle: { color: Theme.text3, fontSize: 13, fontFamily: 'monospace', textAlign: 'center', marginBottom: 32 },
  card: { backgroundColor: Theme.bg2, borderRadius: 10, padding: 20, borderWidth: 1, borderColor: Theme.border },
  label: { color: Theme.text3, fontSize: 11, fontFamily: 'monospace', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  prefix: { backgroundColor: Theme.bg3, color: Theme.text2, padding: 12, borderRadius: 6, borderWidth: 1, borderColor: Theme.border },
  inputFull: { backgroundColor: Theme.bg3, color: Theme.text, padding: 12, borderRadius: 6, borderWidth: 1, borderColor: Theme.border, marginBottom: 16 },
  input: { flex: 1, backgroundColor: Theme.bg3, color: Theme.text, padding: 12, borderRadius: 6, borderWidth: 1, borderColor: Theme.border, marginBottom: 16 },
  btnPrimary: { backgroundColor: Theme.accent, padding: 14, borderRadius: 6, alignItems: 'center' },
  btnText: { color: Theme.bg, fontWeight: 'bold' }
});
