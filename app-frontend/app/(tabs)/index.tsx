import { MapPin, User, CheckCircle, Clock, Zap, TrendingUp, Mic } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import {
  ScrollView, Switch, Text, TextInput, TouchableOpacity, View,
  ActivityIndicator, StatusBar, Animated, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import CustomAlert from '../../components/CustomAlert';
import VoiceCollectionModal from '../../components/VoiceCollectionModal';
import { request } from '../../utils/api';
import { useTheme } from '../../context/ThemeContext';

const PRIMARY = '#6B5BFF';
const PRIMARY_LIGHT = '#8B7DFF';
const GREEN = '#22c55e';
const ORANGE = '#F59E0B';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('Employee');
  const [employeeRole, setEmployeeRole] = useState('Garbage Collector');
  const [displayLocation, setDisplayLocation] = useState('Loading...');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });
  const [stats, setStats] = useState({ location: 'Loading...', ward: '', wards: [] as string[], total: 0, completed: 0, pending: 0, onDuty: true });
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  // Leave reason dialog
  const [leaveDialogVisible, setLeaveDialogVisible] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');

  const handleToggleDuty = async (val: boolean) => {
    if (!val) {
      // Turning OFF — show reason dialog first
      setLeaveReason('');
      setLeaveDialogVisible(true);
      return;
    }
    // Turning ON
    try {
      setIsAvailable(true);
      const res = await request('/attendance/availability', { method: 'PUT', body: JSON.stringify({ available: true }) });
      if (!res.ok) setIsAvailable(false);
    } catch { setIsAvailable(false); }
  };

  const submitLeaveReason = async () => {
    if (!leaveReason.trim()) return;
    setLeaveDialogVisible(false);
    try {
      setIsAvailable(false);
      const res = await request('/attendance/availability', {
        method: 'PUT',
        body: JSON.stringify({ available: false, leaveReason: leaveReason.trim() }),
      });
      if (!res.ok) setIsAvailable(true);
    } catch { setIsAvailable(true); }
  };

  const cancelLeaveDialog = () => {
    setLeaveDialogVisible(false);
    // Keep toggle ON since user cancelled
    setIsAvailable(true);
  };

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo?.length) {
        const a = geo[0];
        setDisplayLocation([a.name, a.district, a.city].filter(Boolean).join(', ') || stats.location);
      }
    } catch { setDisplayLocation(stats.location); }
  };

  const fetchStats = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setEmployeeName(u.name || 'Employee');
        setEmployeeRole(u.role || 'Garbage Collector');
      }
      const res = await request('/attendance/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        // Default to ON DUTY if no record yet (new day)
        setIsAvailable(data.onDuty ?? true);
        if (displayLocation === 'Loading...') setDisplayLocation(data.location || 'Panchayat Area');
      }
    } catch { } finally { setLoading(false); }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
      fetchLocation();
    }, [])
  );

  const pct = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const RADIUS = 42;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct) / 100;

  const initials = employeeName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Hero Header ─────────────────────────────── */}
        <View style={{
          backgroundColor: PRIMARY, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36,
          borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        }}>
          {/* Location */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <MapPin size={16} color="rgba(255,255,255,0.8)" />
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginLeft: 6, flex: 1 }} numberOfLines={1}>
              {displayLocation}
            </Text>
          </View>

          {/* Avatar + Name */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
              marginRight: 14,
            }}>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' }}>{greeting()},</Text>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>{employeeName}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                {employeeRole} · {stats.wards && stats.wards.length > 1 ? `Wards ${stats.wards.join(', ')}` : `Ward ${stats.wards?.[0] || stats.ward || '—'}`}
              </Text>
            </View>
            {/* Duty badge */}
            <View style={{
              backgroundColor: isAvailable ? '#22c55e' : 'rgba(255,255,255,0.2)',
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
            }}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                {isAvailable ? '● ON DUTY' : '○ OFF'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Duty Toggle Card ────────────────────────── */}
        <View style={{ marginHorizontal: 20, marginTop: -18 }}>
          <View style={{
            backgroundColor: theme.card, borderRadius: 16, padding: 18,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            shadowColor: '#6B5BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
          }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Available On Duty</Text>
              <Text style={{ fontSize: 13, color: isAvailable ? GREEN : theme.muted, marginTop: 2, fontWeight: '500' }}>
                {isAvailable ? '✓ Clocked in' : 'Toggle to start your shift'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: PRIMARY }}
              thumbColor="white"
              onValueChange={handleToggleDuty}
              value={isAvailable}
            />
          </View>
        </View>

        {/* ── Start Scanning CTA ──────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <TouchableOpacity
            onPress={() => {
              if (!isAvailable) {
                setAlertConfig({ title: 'Off Duty', message: "Toggle 'Available On Duty' to start scanning bins.", type: 'error' });
                setAlertVisible(true);
              } else {
                router.push('/(tabs)/scan' as any);
              }
            }}
            activeOpacity={0.9}
            style={{
              backgroundColor: isAvailable ? PRIMARY : '#94A3B8',
              borderRadius: 16, height: 58,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
            }}
          >
            <Zap size={22} color="white" fill="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 }}>
              {isAvailable ? 'Start Scanning Bins' : 'Go On Duty to Scan'}
            </Text>
          </TouchableOpacity>

          {/* ── Voice Record Collection CTA ──────────────── */}
          <TouchableOpacity
            onPress={() => {
              if (!isAvailable) {
                setAlertConfig({ title: 'Off Duty', message: "Toggle 'Available On Duty' to record collection.", type: 'error' });
                setAlertVisible(true);
              } else {
                setVoiceModalVisible(true);
              }
            }}
            activeOpacity={0.9}
            style={{
              backgroundColor: isAvailable ? (theme.dark ? '#1e1b4b' : '#ede9fe') : (theme.dark ? '#1e293b' : '#f1f5f9'),
              borderRadius: 16,
              padding: 16,
              marginTop: 12,
              borderWidth: 1.5,
              borderColor: isAvailable ? PRIMARY : '#cbd5e1',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isAvailable ? PRIMARY : '#94a3b8',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Mic size={22} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>
                    Hands-Free Voice Mode
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#22c55e',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>"Hey Eco"</Text>
                  </View>
                </View>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                  Say "Hey Eco" · 3s Auto-Submit · Earphone Ready
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Performance Section ─────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <TrendingUp size={18} color={PRIMARY} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginLeft: 8 }}>Today's Performance</Text>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={{ color: theme.muted, marginTop: 12, fontSize: 13, fontWeight: '500' }}>Loading performance data...</Text>
            </View>
          ) : (
            <>
              {/* Stat Cards Row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                {/* Collected */}
                <View style={{
                  flex: 1, backgroundColor: '#eef2ff', borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: '#c7d2fe',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Collected</Text>
                  <Text style={{ fontSize: 32, fontWeight: '800', color: '#4338ca' }}>{stats.completed}</Text>
                  <Text style={{ fontSize: 12, color: '#818cf8', marginTop: 2 }}>of {stats.total} bins</Text>
                </View>

                {/* Pending */}
                <View style={{
                  flex: 1, backgroundColor: '#fffbeb', borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: '#fde68a',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Pending</Text>
                  <Text style={{ fontSize: 32, fontWeight: '800', color: '#b45309' }}>{stats.pending}</Text>
                  <Text style={{ fontSize: 12, color: '#fbbf24', marginTop: 2 }}>bins remaining</Text>
                </View>
              </View>

              {/* Progress Card */}
              <View style={{
                backgroundColor: theme.card, borderRadius: 20, padding: 20,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
                borderWidth: 1, borderColor: theme.border,
              }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Completion Status</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <CheckCircle size={18} color={GREEN} />
                    <Text style={{ fontSize: 14, color: theme.subtext, marginLeft: 10, fontWeight: '500' }}>
                      {stats.completed} Bins Collected
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Clock size={18} color={ORANGE} />
                    <Text style={{ fontSize: 14, color: theme.subtext, marginLeft: 10, fontWeight: '500' }}>
                      {stats.pending} Bins Pending
                    </Text>
                  </View>
                  {/* Progress bar */}
                  <View style={{ marginTop: 14, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: PRIMARY, borderRadius: 3 }} />
                  </View>
                </View>

                {/* Donut */}
                <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
                  <Svg width={100} height={100} viewBox="0 0 100 100">
                    <G transform="rotate(-90 50 50)">
                      <Circle cx="50" cy="50" r={RADIUS} stroke="#e2e8f0" strokeWidth="10" fill="none" />
                      <Circle cx="50" cy="50" r={RADIUS} stroke={PRIMARY} strokeWidth="10" fill="none"
                        strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset} strokeLinecap="round" />
                    </G>
                  </Svg>
                  <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: PRIMARY }}>{Math.round(pct)}%</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

      </ScrollView>

      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message}
        type={alertConfig.type} onClose={() => setAlertVisible(false)} />

      <VoiceCollectionModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSuccess={() => {
          fetchStats();
        }}
      />

      {/* ── Leave Reason Dialog ──────────────────────────── */}
      <Modal transparent animationType="none" visible={leaveDialogVisible} onRequestClose={cancelLeaveDialog}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 28 }}
        >
          {/* Accent strip */}
          <View style={{
            backgroundColor: 'white', width: '100%', maxWidth: 360,
            borderRadius: 24, overflow: 'hidden',
            shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 28, elevation: 20,
          }}>
            <View style={{ height: 5, backgroundColor: '#F59E0B' }} />
            <View style={{ padding: 28 }}>
              {/* Icon */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: '#fffbeb', borderWidth: 2, borderColor: '#fde68a',
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <Clock size={28} color="#F59E0B" />
                </View>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 6 }}>
                Going Off Duty?
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
                Please enter your reason for absence or leave. This will be visible to your admin.
              </Text>
              <TextInput
                value={leaveReason}
                onChangeText={setLeaveReason}
                placeholder="e.g. Sick leave, personal emergency…"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1.5,
                  borderColor: leaveReason.trim() ? '#F59E0B' : '#e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 14,
                  color: '#1e293b',
                  textAlignVertical: 'top',
                  minHeight: 80,
                  backgroundColor: '#fafafa',
                  marginBottom: 20,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={cancelLeaveDialog}
                  style={{
                    flex: 1, height: 46, borderRadius: 14,
                    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 15 }}>Stay On Duty</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitLeaveReason}
                  disabled={!leaveReason.trim()}
                  style={{
                    flex: 1, height: 46, borderRadius: 14,
                    backgroundColor: leaveReason.trim() ? '#F59E0B' : '#e2e8f0',
                    justifyContent: 'center', alignItems: 'center',
                    shadowColor: '#F59E0B', shadowOpacity: leaveReason.trim() ? 0.3 : 0, shadowRadius: 8, elevation: 4,
                  }}
                >
                  <Text style={{ color: leaveReason.trim() ? 'white' : '#94a3b8', fontWeight: '800', fontSize: 15 }}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}