import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  Mic,
  MicOff,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  X,
  Scale,
  Trash2,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Radio,
  Clock,
  Send,
  Zap,
} from 'lucide-react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useTheme } from '../context/ThemeContext';
import { request } from '../utils/api';
import {
  parseVoiceCollection,
  detectWakeWord,
  detectCancelCommand,
  stripWakeWord,
} from '../utils/voiceParser';

const PRIMARY = '#6B5BFF';
const GREEN = '#22c55e';
const ORANGE = '#F59E0B';
const RED = '#EF4444';
const COUNTDOWN_SECONDS = 3;

interface VoiceCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialHandsFree?: boolean;
}

export default function VoiceCollectionModal({
  visible,
  onClose,
  onSuccess,
  initialHandsFree = true,
}: VoiceCollectionModalProps) {
  const { theme } = useTheme();

  // Modal lifecycle states: 'listening' | 'confirming' | 'submitting' | 'error' | 'success'
  const [modalState, setModalState] = useState<
    'listening' | 'confirming' | 'submitting' | 'error' | 'success'
  >('listening');

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mode toggles
  const [isHandsFree, setIsHandsFree] = useState(initialHandsFree);
  const [isPocketMode, setIsPocketMode] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [wakeWordHeard, setWakeWordHeard] = useState(false);

  // Editable confirmation card values
  const [dustbinId, setDustbinId] = useState('');
  const [weight, setWeight] = useState('');
  const [action, setAction] = useState<'collected' | 'issue'>('collected');

  // 3-second auto-submission countdown
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 4-second auto-dismiss recovery timer on errors
  const [errorCountdown, setErrorCountdown] = useState(4);
  const errorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated pulse for microphone ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Helper for Text-To-Speech audio feedback
  const speakFeedback = useCallback((text: string) => {
    if (!ttsEnabled) return;
    try {
      Speech.stop();
      Speech.speak(text, {
        language: 'en-IN',
        rate: 0.95,
        pitch: 1.0,
      });
    } catch (e) {
      console.log('TTS Speak error:', e);
    }
  }, [ttsEnabled]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const clearCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const clearErrorCountdown = () => {
    if (errorTimerRef.current) {
      clearInterval(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  };

  // Keep-Awake management
  useEffect(() => {
    if (visible) {
      activateKeepAwakeAsync('voice-collection').catch(() => {});
    } else {
      deactivateKeepAwake('voice-collection').catch(() => {});
      Speech.stop();
      clearCountdown();
      clearSilenceTimer();
      clearErrorCountdown();
    }
    return () => {
      deactivateKeepAwake('voice-collection').catch(() => {});
      Speech.stop();
      clearCountdown();
      clearSilenceTimer();
      clearErrorCountdown();
    };
  }, [visible]);

  // Mic pulse animation
  useEffect(() => {
    if (isRecognizing) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseLoop.current?.stop();
  }, [isRecognizing]);

  // ── Auto-Recovery on Voice / Bin Error (4-Second Auto Dismiss) ────────
  const triggerErrorWithAutoRecovery = useCallback(
    (msg: string) => {
      clearSilenceTimer();
      clearCountdown();
      clearErrorCountdown();
      stopSpeechRecognition();

      setErrorMessage(msg);
      setModalState('error');
      setErrorCountdown(4);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      speakFeedback(`${msg}. Resuming in 4 seconds.`);

      let remaining = 4;
      errorTimerRef.current = setInterval(() => {
        remaining -= 1;
        setErrorCountdown(remaining);
        if (remaining <= 0) {
          clearErrorCountdown();
          resetAndStartListening(false);
          speakFeedback('Listening for next bin.');
        }
      }, 1000);
    },
    [speakFeedback]
  );

  // ── Speech Recognition Event Listeners ───────────────────────
  useSpeechRecognitionEvent('start', () => {
    setIsRecognizing(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecognizing(false);
    // If modal is listening and we have captured transcript, parse and trigger auto-confirmation
    if (visible && modalState === 'listening') {
      if (transcript.trim()) {
        const parsed = parseVoiceCollection(transcript);
        if (parsed.isValid && parsed.dustbinId) {
          triggerAutoConfirmation(parsed);
          return;
        }
      }
      restartListeningSafe();
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const speechText = event.results[0]?.transcript || '';
    if (speechText) {
      setTranscript(speechText);
      handleLiveSpeechResult(speechText, event.isFinal);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsRecognizing(false);
    console.log('Speech Recognition Error:', event.error, event.message);
    if (modalState === 'listening' && visible) {
      setTimeout(() => {
        if (visible && modalState === 'listening') restartListeningSafe();
      }, 1000);
    }
  });

  // Automatically trigger confirmation & auto-submit countdown
  const triggerAutoConfirmation = useCallback((parsed: any) => {
    clearSilenceTimer();
    clearCountdown();
    clearErrorCountdown();
    stopSpeechRecognition();

    const binId = parsed.dustbinId || '';
    const parsedWeight = parsed.weight ? String(parsed.weight) : '';
    const parsedAction = parsed.action || 'collected';

    setDustbinId(binId);
    setWeight(parsedWeight);
    setAction(parsedAction);
    setModalState('confirming');

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const weightSpeech = parsedWeight ? `${parsedWeight} kilograms` : '';
    const actionSpeech = parsedAction === 'issue' ? 'Issue reported' : 'Collected';
    speakFeedback(`Bin ${binId}, ${actionSpeech} ${weightSpeech}. Submitting in 3 seconds. Say cancel to abort.`);

    startAutoSubmitCountdown({
      dustbinId: binId,
      weight: parsedWeight,
      action: parsedAction,
    });
  }, [speakFeedback]);

  // Handle incoming live speech stream
  const handleLiveSpeechResult = (spokenText: string, isFinal: boolean) => {
    const lower = spokenText.toLowerCase();

    // 1. Check for spoken cancellation during confirmation countdown
    if (modalState === 'confirming') {
      if (detectCancelCommand(lower)) {
        clearCountdown();
        clearSilenceTimer();
        clearErrorCountdown();
        setModalState('listening');
        setTranscript('');
        setWakeWordHeard(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        speakFeedback('Cancelled. Listening for next bin.');
        restartListeningSafe();
        return;
      }
    }

    // 2. Process in listening mode
    if (modalState === 'listening') {
      const hasWake = detectWakeWord(lower);
      if (hasWake && !wakeWordHeard) {
        setWakeWordHeard(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Check for spoken cancellation in listening mode
      if (detectCancelCommand(lower)) {
        clearSilenceTimer();
        setTranscript('');
        speakFeedback('Cancelled.');
        return;
      }

      const parsed = parseVoiceCollection(spokenText);

      // If user ONLY said "Hey Eco" without payload
      if (parsed.wakeWordDetected && !parsed.isValid && !parsed.dustbinId) {
        clearSilenceTimer();
        speakFeedback('Listening. Please say bin number and weight.');
        return;
      }

      // If user spoke a complete valid collection command (e.g. "been 7907 collected with 5 kg waste")
      if (parsed.isValid && parsed.dustbinId) {
        clearSilenceTimer();
        if (isFinal) {
          triggerAutoConfirmation(parsed);
        } else {
          // Debounce 900ms of silence after speaking full command before auto-submitting
          silenceTimerRef.current = setTimeout(() => {
            triggerAutoConfirmation(parsed);
          }, 900);
        }
        return;
      }

      // If speech is ongoing but not yet fully parsed, wait for 1.4s pause to evaluate
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        const endParsed = parseVoiceCollection(spokenText);
        if (endParsed.isValid && endParsed.dustbinId) {
          triggerAutoConfirmation(endParsed);
        }
      }, 1400);
    }
  };

  const startAutoSubmitCountdown = (dataToSubmit?: {
    dustbinId?: string;
    weight?: string;
    action?: 'collected' | 'issue';
  }) => {
    clearCountdown();
    setCountdown(COUNTDOWN_SECONDS);

    let current = COUNTDOWN_SECONDS;
    countdownTimerRef.current = setInterval(() => {
      current -= 1;
      setCountdown(current);

      if (current <= 0) {
        clearCountdown();
        executeSubmission(dataToSubmit);
      }
    }, 1000);
  };

  // Start speech recognition when modal opens (in standby without speaking prompt)
  useEffect(() => {
    if (visible) {
      setIsPocketMode(false);
      clearCountdown();
      clearSilenceTimer();
      clearErrorCountdown();
      setModalState('listening');
      setTranscript('');
      setErrorMessage('');
      setDustbinId('');
      setWeight('');
      setAction('collected');
      setWakeWordHeard(false);
      startSpeechRecognitionQuietly();
    } else {
      stopSpeechRecognition();
      clearCountdown();
      clearSilenceTimer();
      clearErrorCountdown();
      Speech.stop();
    }
  }, [visible]);

  const startSpeechRecognitionQuietly = async () => {
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) return;
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        continuous: true,
      });
      setIsRecognizing(true);
    } catch {
      // Quiet start
    }
  };

  const stopSpeechRecognition = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch {
      // Ignore if not running
    }
    setIsRecognizing(false);
  };

  const restartListeningSafe = async () => {
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        continuous: true,
      });
      setIsRecognizing(true);
    } catch {
      // Retrying silently
    }
  };

  const resetAndStartListening = async (speakGreeting = false) => {
    clearCountdown();
    clearSilenceTimer();
    clearErrorCountdown();
    setModalState('listening');
    setTranscript('');
    setErrorMessage('');
    setDustbinId('');
    setWeight('');
    setAction('collected');
    setWakeWordHeard(false);

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        triggerErrorWithAutoRecovery('Microphone permission is required.');
        return;
      }

      await ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        continuous: true,
      });
      setIsRecognizing(true);

      if (speakGreeting) {
        speakFeedback('Hands-free mode active. Say Hey Eco to record.');
      }
    } catch (err: any) {
      console.log('Start Recognition Error:', err);
      triggerErrorWithAutoRecovery('Speech recognition service is unavailable.');
    }
  };

  // User explicitly enters pocket mode
  const enterPocketMode = () => {
    setIsPocketMode(true);
    clearErrorCountdown();
    clearSilenceTimer();
    clearCountdown();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    speakFeedback('Hands-free mode active. Say Hey Eco to record.');
    resetAndStartListening(false);
  };

  // Manual trigger if user taps Done Speaking
  const handleManualStopAndParse = async () => {
    clearSilenceTimer();
    await stopSpeechRecognition();
    if (transcript.trim()) {
      const parsed = parseVoiceCollection(transcript);
      if (parsed.isValid && parsed.dustbinId) {
        triggerAutoConfirmation(parsed);
      } else {
        triggerErrorWithAutoRecovery(parsed.errorMessage || 'Could not understand details. Please repeat.');
      }
    } else {
      triggerErrorWithAutoRecovery('No speech detected. Please try speaking again.');
    }
  };

  // Cancel during confirmation
  const handleCancelCountdown = () => {
    clearCountdown();
    clearSilenceTimer();
    clearErrorCountdown();
    setModalState('listening');
    setTranscript('');
    setWakeWordHeard(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    speakFeedback('Cancelled. Listening for next bin.');
    restartListeningSafe();
  };

  // Submit collection to backend
  const executeSubmission = async (overrideData?: {
    dustbinId?: string;
    weight?: string;
    action?: 'collected' | 'issue';
  }) => {
    clearCountdown();
    clearSilenceTimer();
    clearErrorCountdown();

    const targetBinId = (overrideData?.dustbinId ?? dustbinId).trim();
    const targetAction = overrideData?.action ?? action;
    const targetWeight = (overrideData?.weight !== undefined ? String(overrideData.weight) : weight).trim();

    if (!targetBinId) {
      triggerErrorWithAutoRecovery('Invalid dustbin number.');
      return;
    }
    if (targetAction === 'collected' && (!targetWeight || isNaN(Number(targetWeight)) || Number(targetWeight) <= 0)) {
      triggerErrorWithAutoRecovery('Please provide valid waste weight.');
      return;
    }

    setModalState('submitting');

    try {
      // 1. Get GPS Location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        triggerErrorWithAutoRecovery('Location access is required.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});

      // 2. Get Labour Auth Info
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        triggerErrorWithAutoRecovery('Session expired. Please log in again.');
        return;
      }
      const user = JSON.parse(userStr);

      // 3. Step 1: POST /attendance/scan
      const scanRes = await request('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          labourId: user.id,
          dustbinId: targetBinId,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        }),
      });

      const scanData = await scanRes.json();
      if (!scanRes.ok) {
        triggerErrorWithAutoRecovery(scanData.message || 'Dustbin scan validation failed.');
        return;
      }

      // 4. Step 2: PUT /attendance/update-action
      const actionRes = await request('/attendance/update-action', {
        method: 'PUT',
        body: JSON.stringify({
          scanId: scanData.scanId,
          action: targetAction,
          issueDescription: targetAction === 'issue' ? 'Voice reported issue' : '',
          estimatedWeight: targetAction === 'collected' ? targetWeight : undefined,
        }),
      });

      const actionData = await actionRes.json();
      if (!actionRes.ok) {
        triggerErrorWithAutoRecovery(actionData.message || 'Failed to update collection record.');
        return;
      }

      // Success & Dual Audio-Haptic Feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
      speakFeedback(`Bin ${targetBinId} collection recorded successfully!`);

      setModalState('success');

      // Auto-refresh and either reset for next bin (if in hands-free route) or close
      setTimeout(() => {
        onSuccess();
        if (isHandsFree && isPocketMode) {
          // Reset to listening for next bin automatically without pulling phone out
          resetAndStartListening(false);
        } else {
          onClose();
        }
      }, 1800);
    } catch (error: any) {
      console.error('Voice Collection Submit Error:', error);
      triggerErrorWithAutoRecovery(error.message || 'Network error occurred.');
    }
  };

  const handleClose = async () => {
    clearCountdown();
    clearSilenceTimer();
    clearErrorCountdown();
    Speech.stop();
    await stopSpeechRecognition();
    onClose();
  };

  // ── POCKET MODE (AMOLED Black Screen for Battery & Zero Accidental Touches) ──
  if (isPocketMode) {
    return (
      <Modal animationType="fade" transparent={false} visible={visible} onRequestClose={handleClose}>
        <Pressable
          style={styles.pocketContainer}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={styles.pocketCenter}>
            <View style={styles.pocketPulsingIcon}>
              <Radio size={48} color={PRIMARY} />
            </View>
            <Text style={styles.pocketTitle}>🎧 Hands-Free Mode Active</Text>
            <Text style={styles.pocketSubtitle}>
              Listening for <Text style={{ color: PRIMARY, fontWeight: '800' }}>"Hey Eco"</Text>
            </Text>
            <Text style={styles.pocketHint}>Phone in pocket · Zero touches needed</Text>

            {/* Quick Status */}
            {modalState === 'confirming' && (
              <View style={styles.pocketStatusBadge}>
                <Clock size={16} color={ORANGE} />
                <Text style={styles.pocketStatusText}>
                  Bin {dustbinId} ({weight}kg) · Submitting in {countdown}s
                </Text>
              </View>
            )}

            {modalState === 'submitting' && (
              <View style={styles.pocketStatusBadge}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.pocketStatusText}>Uploading collection...</Text>
              </View>
            )}

            {modalState === 'success' && (
              <View style={[styles.pocketStatusBadge, { backgroundColor: '#15803d' }]}>
                <CheckCircle size={16} color="white" />
                <Text style={styles.pocketStatusText}>Recorded Successfully!</Text>
              </View>
            )}

            {modalState === 'error' && (
              <View style={[styles.pocketStatusBadge, { backgroundColor: '#991b1b', borderWidth: 1, borderColor: '#ef4444' }]}>
                <AlertTriangle size={18} color="#fca5a5" />
                <Text style={styles.pocketStatusText}>
                  {errorMessage || 'Wrong bin number'} · Resuming in {errorCountdown}s
                </Text>
              </View>
            )}
          </View>

          {/* Button to Exit Pocket Mode */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              clearErrorCountdown();
              setIsPocketMode(false);
            }}
            style={styles.pocketExitButton}
          >
            <Eye size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.pocketExitText}>Show Screen Interface</Text>
          </TouchableOpacity>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {/* Top Bar / Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <View style={styles.sparkleIconContainer}>
                <Sparkles size={18} color={PRIMARY} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  Hey Eco Voice Mode
                </Text>
                <Text style={[styles.headerSub, { color: theme.muted }]}>
                  {isHandsFree ? '🎧 Hands-Free Listening' : 'Standard Voice Input'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Pocket Mode Toggle */}
              <TouchableOpacity
                onPress={enterPocketMode}
                style={[styles.headerIconBtn, { backgroundColor: theme.dark ? '#1e293b' : '#f1f5f9' }]}
                accessibilityLabel="Enter Pocket Mode"
              >
                <EyeOff size={18} color={PRIMARY} />
              </TouchableOpacity>

              {/* TTS Voice Audio Toggle */}
              <TouchableOpacity
                onPress={() => setTtsEnabled(!ttsEnabled)}
                style={[
                  styles.headerIconBtn,
                  { backgroundColor: ttsEnabled ? '#ede9fe' : (theme.dark ? '#1e293b' : '#f1f5f9') },
                ]}
              >
                {ttsEnabled ? (
                  <Volume2 size={18} color={PRIMARY} />
                ) : (
                  <VolumeX size={18} color={theme.muted} />
                )}
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={20} color={theme.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {/* ── STATE: LISTENING ───────────────────────────── */}
            {modalState === 'listening' && (
              <View style={styles.stateCenterContainer}>
                {/* Wake Word Badge */}
                <View style={styles.wakeWordBanner}>
                  <Radio size={16} color={PRIMARY} />
                  <Text style={styles.wakeWordBannerText}>
                    Say <Text style={{ fontWeight: '800', color: PRIMARY }}>"Hey Eco"</Text> to begin
                  </Text>
                </View>

                <Text style={[styles.stateSubtitle, { color: theme.subtext }]}>
                  Example spoken command:
                </Text>
                <Text style={[styles.exampleText, { color: PRIMARY }]}>
                  "Hey Eco, Bin 123 collected 3 kg"
                </Text>

                {/* Animated Mic Ring */}
                <View style={styles.micRingWrapper}>
                  <Animated.View
                    style={[
                      styles.micPulseRing,
                      {
                        transform: [{ scale: pulseAnim }],
                        borderColor: isRecognizing ? PRIMARY : '#cbd5e1',
                      },
                    ]}
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleManualStopAndParse}
                    style={[
                      styles.micMainButton,
                      { backgroundColor: isRecognizing ? PRIMARY : '#94a3b8' },
                    ]}
                  >
                    {isRecognizing ? (
                      <Mic size={36} color="white" />
                    ) : (
                      <MicOff size={36} color="white" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Live Status indicator */}
                <View style={styles.statusIndicatorRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isRecognizing ? GREEN : ORANGE },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: theme.muted }]}>
                    {wakeWordHeard
                      ? '⚡ Wake word detected! Listening...'
                      : isRecognizing
                      ? 'Listening for "Hey Eco"...'
                      : 'Connecting microphone...'}
                  </Text>
                </View>

                {/* Live Transcript Box */}
                <View
                  style={[
                    styles.transcriptBox,
                    {
                      backgroundColor: theme.dark ? '#1e1e2d' : '#f8fafc',
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.transcriptText,
                      { color: transcript ? theme.text : theme.muted },
                    ]}
                  >
                    {transcript || 'Listening for speech in English...'}
                  </Text>
                </View>

                {/* Pocket Mode Button Promo */}
                <TouchableOpacity
                  onPress={enterPocketMode}
                  style={[styles.pocketLaunchBtn, { borderColor: PRIMARY }]}
                >
                  <EyeOff size={18} color={PRIMARY} />
                  <Text style={[styles.pocketLaunchBtnText, { color: PRIMARY }]}>
                    Lock & Put Phone in Pocket 🕶️
                  </Text>
                </TouchableOpacity>

                {/* Done Speaking Button */}
                <TouchableOpacity
                  onPress={handleManualStopAndParse}
                  style={[styles.actionBtn, { backgroundColor: PRIMARY, marginTop: 10 }]}
                >
                  <Text style={styles.actionBtnText}>Done Speaking</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STATE: CONFIRMING (3s Auto-Submit Countdown) ── */}
            {modalState === 'confirming' && (
              <View style={styles.confirmationContainer}>
                {/* Countdown Auto-Submit Banner */}
                <View style={styles.countdownBanner}>
                  <Clock size={20} color="white" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.countdownBannerTitle}>
                      Auto-Submitting in {countdown}s
                    </Text>
                    <Text style={styles.countdownBannerSub}>
                      Say <Text style={{ fontWeight: '800' }}>"Cancel"</Text> into mic or tap Cancel to abort
                    </Text>
                  </View>
                  <View style={styles.countdownCircle}>
                    <Text style={styles.countdownNumber}>{countdown}</Text>
                  </View>
                </View>

                {/* Extracted Details Card */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Dustbin ID:
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: theme.dark ? '#1e1e2d' : '#f8fafc',
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Trash2 size={18} color={PRIMARY} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: theme.text }]}
                      value={dustbinId}
                      onChangeText={setDustbinId}
                      placeholder="e.g. 123 or B-102"
                      placeholderTextColor={theme.muted}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Action Selector */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Action / Status:
                  </Text>
                  <View style={styles.actionToggleRow}>
                    <TouchableOpacity
                      onPress={() => setAction('collected')}
                      style={[
                        styles.togglePill,
                        action === 'collected'
                          ? { backgroundColor: GREEN, borderColor: GREEN }
                          : {
                              backgroundColor: theme.dark ? '#1e1e2d' : '#f1f5f9',
                              borderColor: theme.border,
                            },
                      ]}
                    >
                      <CheckCircle
                        size={16}
                        color={action === 'collected' ? 'white' : theme.muted}
                      />
                      <Text
                        style={[
                          styles.togglePillText,
                          { color: action === 'collected' ? 'white' : theme.muted },
                        ]}
                      >
                        Collected
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setAction('issue')}
                      style={[
                        styles.togglePill,
                        action === 'issue'
                          ? { backgroundColor: ORANGE, borderColor: ORANGE }
                          : {
                              backgroundColor: theme.dark ? '#1e1e2d' : '#f1f5f9',
                              borderColor: theme.border,
                            },
                      ]}
                    >
                      <AlertTriangle
                        size={16}
                        color={action === 'issue' ? 'white' : theme.muted}
                      />
                      <Text
                        style={[
                          styles.togglePillText,
                          { color: action === 'issue' ? 'white' : theme.muted },
                        ]}
                      >
                        Report Issue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weight Input (Only for collected) */}
                {action === 'collected' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>
                      Waste Weight (kg):
                    </Text>
                    <View
                      style={[
                        styles.inputBox,
                        {
                          backgroundColor: theme.dark ? '#1e1e2d' : '#f8fafc',
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Scale size={18} color={PRIMARY} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.textInput, { color: theme.text }]}
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="e.g. 3 or 4.5"
                        placeholderTextColor={theme.muted}
                        keyboardType="numeric"
                      />
                      <Text style={[styles.unitText, { color: theme.muted }]}>kg</Text>
                    </View>
                  </View>
                )}

                {/* Transcript snippet */}
                {transcript ? (
                  <Text style={[styles.transcriptSnippet, { color: theme.muted }]}>
                    Heard: "{transcript}"
                  </Text>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={handleCancelCountdown}
                    style={[styles.retryBtn, { borderColor: RED }]}
                  >
                    <X size={18} color={RED} />
                    <Text style={[styles.retryBtnText, { color: RED }]}>
                      Cancel (Abort)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => executeSubmission()}
                    style={[styles.confirmBtn, { backgroundColor: PRIMARY }]}
                  >
                    <Send size={18} color="white" />
                    <Text style={styles.confirmBtnText}>Submit Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── STATE: SUBMITTING ──────────────────────────── */}
            {modalState === 'submitting' && (
              <View style={styles.stateCenterContainer}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={[styles.submittingTitle, { color: theme.text }]}>
                  Submitting Collection...
                </Text>
                <Text style={[styles.submittingSubtitle, { color: theme.muted }]}>
                  Syncing GPS location and bin {dustbinId} data
                </Text>
              </View>
            )}

            {/* ── STATE: SUCCESS ─────────────────────────────── */}
            {modalState === 'success' && (
              <View style={styles.stateCenterContainer}>
                <View style={styles.successIconCircle}>
                  <CheckCircle size={44} color="white" />
                </View>
                <Text style={[styles.successTitle, { color: theme.text }]}>
                  Collection Recorded!
                </Text>
                <Text style={[styles.successSubtitle, { color: theme.subtext }]}>
                  Bin {dustbinId} logged as {action} ({weight ? `${weight} kg` : ''})
                </Text>
              </View>
            )}

            {/* ── STATE: ERROR (4-Second Auto Dismiss & Recovery) ── */}
            {modalState === 'error' && (
              <View style={styles.stateCenterContainer}>
                <View style={styles.errorIconCircle}>
                  <AlertTriangle size={36} color={RED} />
                </View>
                <Text style={[styles.errorTitle, { color: theme.text }]}>
                  Voice Notice
                </Text>
                <Text style={[styles.errorMessageText, { color: theme.subtext }]}>
                  {errorMessage || 'An error occurred during voice recognition.'}
                </Text>
                {transcript ? (
                  <Text style={[styles.transcriptSnippet, { color: theme.muted, marginTop: 4 }]}>
                    Heard: "{transcript}"
                  </Text>
                ) : null}

                {/* Auto-Recovery Countdown Banner */}
                <View style={styles.errorAutoRecoveryBanner}>
                  <Clock size={15} color="#ef4444" />
                  <Text style={styles.errorAutoRecoveryText}>
                    Auto-resuming in <Text style={{ fontWeight: '800', color: '#b91c1c' }}>{errorCountdown}s</Text>...
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={[styles.cancelBtn, { borderColor: theme.border }]}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.muted }]}>
                      Close
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      clearErrorCountdown();
                      resetAndStartListening(false);
                    }}
                    style={[styles.retryBtnFilled, { backgroundColor: PRIMARY }]}
                  >
                    <RotateCcw size={16} color="white" />
                    <Text style={styles.retryBtnFilledText}>Try Again Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    minHeight: '58%',
    maxHeight: '88%',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sparkleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  stateCenterContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  wakeWordBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  wakeWordBannerText: {
    color: '#4338ca',
    fontSize: 13,
    fontWeight: '600',
  },
  stateSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  micRingWrapper: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  micPulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    backgroundColor: 'rgba(107, 91, 255, 0.08)',
  },
  micMainButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  transcriptBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: 'center',
    marginBottom: 14,
  },
  transcriptText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  pocketLaunchBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(107, 91, 255, 0.05)',
    marginBottom: 8,
  },
  pocketLaunchBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  confirmationContainer: {
    paddingVertical: 6,
  },
  countdownBanner: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
  },
  countdownBannerTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  countdownBannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  countdownCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  actionToggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  togglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  togglePillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  transcriptSnippet: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  confirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  submittingTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 18,
  },
  submittingSubtitle: {
    fontSize: 13,
    marginTop: 6,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: GREEN,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  errorMessageText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  errorAutoRecoveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  errorAutoRecoveryText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  retryBtnFilled: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryBtnFilledText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },

  // Pocket Mode Styles
  pocketContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    padding: 30,
    paddingVertical: 60,
  },
  pocketCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  pocketPulsingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(107, 91, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(107, 91, 255, 0.4)',
  },
  pocketTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  pocketSubtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 6,
  },
  pocketHint: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  pocketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  pocketStatusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pocketExitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pocketExitText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});
