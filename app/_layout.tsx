// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import FlashMessage from 'react-native-flash-message';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    finalStatus = newStatus;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Permisos requeridos', 'Se requieren permisos para enviar notificaciones.');
    return;
  }
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

export default function RootLayout() {
  const segments = useSegments();
  const isAuthPage =
    Array.isArray(segments) &&
    segments[0] === '(auth)' &&
    (segments[1] === 'login' || segments[1] === 'register');

  const router = useRouter();
  const [upcomingEventMsg, setUpcomingEventMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!user && !inAuthGroup) {
        router.replace('/login');
      } else if (user && segments[0] === '+not-found') {
        router.replace('/events');
      } else if (user) {
        registerForPushNotificationsAsync();
        checkUpcomingEvents();
      }
    });

    return unsubscribe;
  }, [segments]);

  const checkUpcomingEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'events'));
      const now = new Date();
      const upcomingMessages: string[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.date?.seconds) {
          const eventDate = new Date(data.date.seconds * 1000);
          const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays >= 0 && diffDays <= 3) {
            const msg = `📅 "${data.title}" será el ${eventDate.toLocaleDateString('es-ES')}`;
            upcomingMessages.push(msg);
            sendEventReminder(data.title, eventDate);
          }
        }
      });

      if (upcomingMessages.length > 0 && Platform.OS === 'web') {
        const msg = upcomingMessages.join('\n');
        setUpcomingEventMsg(msg);
        setTimeout(() => setUpcomingEventMsg(null), 5000);
      }
    } catch (error) {
      console.error('Error al verificar eventos próximos:', error);
    }
  };

  const sendEventReminder = async (title: string, date: Date) => {
    try {
      const message = `El evento "${title}" es el ${date.toLocaleDateString('es-ES')}`;
      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Evento cercano 📅',
            body: message,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error('❌ Error enviando recordatorio:', error);
    }
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <FlashMessage position="top" />

      {upcomingEventMsg && (
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerText}>{upcomingEventMsg}</Text>
        </View>
      )}

      {!isAuthPage && (
        <TouchableOpacity style={styles.floatingStatsButton} onPress={() => router.push('/events/my_events')}>
          <Text style={styles.floatingStatsButtonText}>📊 Estadísticas</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#fffae6',
    borderLeftWidth: 5,
    borderLeftColor: '#ff9500',
    padding: 12,
    borderRadius: 10,
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bannerText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingStatsButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.5,
  },
  floatingStatsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
});
