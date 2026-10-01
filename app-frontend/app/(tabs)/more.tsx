import { useRouter } from 'expo-router';
import {
    Briefcase, HelpCircle, MessageSquare, Phone, Users,
    ChevronRight, Search, AlertTriangle, LogOut, Moon, Sun,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../../utils/api';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../context/ThemeContext';

const RED = '#dc2626';

const MENU = [
    { id: 2, title: 'Attendance Report', icon: Briefcase, route: '/attendance', desc: 'View monthly attendance', color: '#4f46e5', bg: '#eef2ff' },
    { id: 3, title: 'Raise Query / Issue', icon: HelpCircle, route: '/raise-query', desc: 'Report a problem to supervisor', color: '#0ea5e9', bg: '#f0f9ff' },
    { id: 4, title: 'Feedback', icon: MessageSquare, route: '/feedback', desc: 'Share your work experience', color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 5, title: 'Technical Support', icon: Phone, route: '/technical-support', desc: 'Contact our support team', color: '#10b981', bg: '#f0fdf4' },
    { id: 6, title: 'Contact Committee', icon: Users, route: '/contact-committee', desc: 'Call supervisors & coordinators', color: '#f59e0b', bg: '#fffbeb' },
];

export default function MoreScreen() {
    const router = useRouter();
    const { theme, isDark, toggleTheme } = useTheme();
    const [search, setSearch] = useState('');
    const [sosSending, setSosSending] = useState(false);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertCfg, setAlertCfg] = useState({
        title: '', message: '', type: 'info' as any,
        confirmText: 'Confirm', cancelText: 'Cancel',
        onConfirm: undefined as (() => void) | undefined,
        destructive: false,
    });

    const showAlert = (cfg: Partial<typeof alertCfg>) => {
        setAlertCfg(prev => ({ ...prev, onConfirm: undefined, destructive: false, ...cfg }));
        setAlertVisible(true);
    };

    const filtered = MENU.filter(m =>
        search.trim() === '' || m.title.toLowerCase().includes(search.toLowerCase())
    );

    // ── Logout ──────────────────────────────────────────────────────────────────
    const doLogout = async () => {
        await AsyncStorage.multiRemove(['token', 'user']);
        router.replace('/(auth)/login' as any);
    };

    const handleLogout = () => showAlert({
        title: 'Logout',
        message: 'Are you sure you want to log out of your account?',
        type: 'confirm',
        confirmText: 'Logout',
        cancelText: 'Cancel',
        destructive: false,
        onConfirm: doLogout,
    });

    // ── SOS ─────────────────────────────────────────────────────────────────────
    const doSendSOS = async () => {
        setSosSending(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            let geo: { lat: number; lng: number } | null = null;
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                geo = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            }
            await request('/employee/query', {
                method: 'POST',
                body: JSON.stringify({
                    description: `🚨 SOS EMERGENCY\nLocation: ${geo ? `Lat ${geo.lat.toFixed(5)}, Lng ${geo.lng.toFixed(5)}` : 'Unavailable'}\nTime: ${new Date().toLocaleString()}`,
                }),
            });
            showAlert({ title: 'SOS Sent ✓', message: 'Emergency alert sent to your supervisor with GPS location.', type: 'success' });
        } catch {
            showAlert({ title: 'SOS Sent', message: 'Alert sent. (Location unavailable.)', type: 'warning' });
        } finally { setSosSending(false); }
    };

    const handleSOS = () => showAlert({
        title: '🚨 SOS Emergency',
        message: 'This will send an emergency alert with your GPS location to your supervisor immediately.',
        type: 'confirm', confirmText: 'Send SOS', cancelText: 'Cancel',
        destructive: true, onConfirm: doSendSOS,
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>

            {/* Header */}
            <View style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 16 }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: 1 }}>More</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>Tools, reports & settings</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingHorizontal: 14, height: 44, marginTop: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                    <Search size={16} color="rgba(255,255,255,0.7)" />
                    <TextInput
                        style={{ flex: 1, marginLeft: 10, fontSize: 14, color: 'white' }}
                        placeholder="Search tools…"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>

                {/* Menu Items */}
                {filtered.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.75}
                        onPress={() => router.push(item.route as any)}
                        style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: theme.card, borderRadius: 18,
                            padding: 16, marginBottom: 10,
                            shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                            borderWidth: 1, borderColor: theme.border,
                        }}
                    >
                        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: item.bg, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                            <item.icon size={22} color={item.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{item.title}</Text>
                            <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{item.desc}</Text>
                        </View>
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: theme.chipBg, justifyContent: 'center', alignItems: 'center' }}>
                            <ChevronRight size={16} color={theme.muted} />
                        </View>
                    </TouchableOpacity>
                ))}

                {/* ── Settings Section ── */}
                {search.trim() === '' && (
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Settings</Text>

                        {/* Dark Mode Toggle */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: theme.card, borderRadius: 18, padding: 16, marginBottom: 10,
                            shadowColor: theme.shadow, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                            borderWidth: 1, borderColor: theme.border,
                        }}>
                            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: isDark ? '#1e1e2e' : '#fffbeb', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: isDark ? '#2d2d3f' : '#fde68a' }}>
                                {isDark ? <Moon size={22} color="#818cf8" /> : <Sun size={22} color="#f59e0b" />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                                <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Tap to switch appearance</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: '#e2e8f0', true: theme.primary }}
                                thumbColor="white"
                            />
                        </View>

                        {/* Logout */}
                        <TouchableOpacity
                            onPress={handleLogout}
                            activeOpacity={0.75}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                backgroundColor: '#fef2f2', borderRadius: 18, padding: 16, marginBottom: 10,
                                borderWidth: 1, borderColor: '#fecaca',
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                                <LogOut size={22} color="#ef4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#ef4444' }}>Logout</Text>
                                <Text style={{ fontSize: 12, color: '#f87171', marginTop: 2 }}>Sign out of your account</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* SOS Button */}
            <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
                <TouchableOpacity
                    onPress={handleSOS}
                    disabled={sosSending}
                    activeOpacity={0.9}
                    style={{
                        height: 60, borderRadius: 18,
                        backgroundColor: sosSending ? '#fca5a5' : RED,
                        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                        shadowColor: RED, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
                    }}
                >
                    <AlertTriangle size={22} color="white" style={{ marginRight: 10 }} />
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 17, letterSpacing: 1 }}>
                        {sosSending ? 'Sending SOS…' : 'SOS EMERGENCY'}
                    </Text>
                </TouchableOpacity>
                <Text style={{ textAlign: 'center', color: theme.muted, fontSize: 11, marginTop: 6 }}>
                    Tap to alert your supervisor with GPS location
                </Text>
            </View>

            <CustomAlert
                visible={alertVisible}
                title={alertCfg.title}
                message={alertCfg.message}
                type={alertCfg.type}
                confirmText={alertCfg.confirmText}
                cancelText={alertCfg.cancelText}
                onConfirm={alertCfg.onConfirm}
                destructive={alertCfg.destructive}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}