import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  MapPin,
  Clock,
  AlertTriangle,
  RefreshCw,
  Info,
  Circle,
} from 'lucide-react-native';
import { request } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await request('/notifications?limit=50');
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    // 1. Mark as read on backend if unread
    if (!item.isRead) {
      try {
        await request(`/notifications/${item._id}/read`, { method: 'PATCH' });
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // 2. Navigate based on data payload
    if (item.data?.screen) {
      try {
        router.push(item.data.screen as any);
      } catch {}
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await request('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ROUTE_ASSIGNED':
        return <MapPin size={20} color="#3b82f6" />;
      case 'ATTENDANCE':
        return <Clock size={20} color="#10b981" />;
      case 'ISSUE_UPDATE':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'SYNC_COMPLETE':
        return <RefreshCw size={20} color="#8b5cf6" />;
      case 'SYSTEM':
      default:
        return <Info size={20} color="#6B5BFF" />;
    }
  };

  const getIconBackground = (type: string) => {
    switch (type) {
      case 'ROUTE_ASSIGNED':
        return '#eff6ff';
      case 'ATTENDANCE':
        return '#ecfdf5';
      case 'ISSUE_UPDATE':
        return '#fffbeb';
      case 'SYNC_COMPLETE':
        return '#f5f3ff';
      case 'SYSTEM':
      default:
        return '#eef2ff';
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: theme.chipBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <ArrowLeft size={20} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>Notifications</Text>
            <Text style={{ fontSize: 12, color: theme.muted }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: theme.chipBg,
            }}
          >
            <CheckCheck size={16} color={theme.primary} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary }}>Read All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.muted, marginTop: 12, fontSize: 14 }}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.chipBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Bell size={36} color={theme.muted} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, textAlign: 'center' }}>
            No Notifications Yet
          </Text>
          <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
            You will receive push updates here for route assignments, attendance records, and supervisor updates.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 60 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => handleNotificationPress(item)}
              style={{
                flexDirection: 'row',
                backgroundColor: item.isRead ? theme.card : theme.dark ? '#1a1836' : '#f5f3ff',
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: item.isRead ? theme.border : theme.primary + '40',
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: item.isRead ? 1 : 2,
              }}
            >
              {/* Type Icon */}
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: getIconBackground(item.type),
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                {getNotificationIcon(item.type)}
              </View>

              {/* Text Body */}
              <View style={{ flex: 1, marginRight: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: item.isRead ? '600' : '800',
                      color: theme.text,
                      flex: 1,
                      marginRight: 8,
                    }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.muted, fontWeight: '500' }}>
                    {formatTimestamp(item.createdAt)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: item.isRead ? theme.muted : theme.subtext,
                    lineHeight: 18,
                  }}
                  numberOfLines={2}
                >
                  {item.message}
                </Text>
              </View>

              {/* Unread Dot */}
              {!item.isRead && (
                <View style={{ justifyContent: 'center', paddingLeft: 4 }}>
                  <Circle size={8} color={theme.primary} fill={theme.primary} />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
