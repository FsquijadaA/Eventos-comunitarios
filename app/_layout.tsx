import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import FlashMessage from 'react-native-flash-message';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!user && !inAuthGroup) {
        router.replace('/login');
      } else if (user && segments[0] === '+not-found') {
        router.replace('/events');
      }
    });

    return unsubscribe;
  }, [segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Aquí puedes declarar pantallas específicas si quieres */}
        <Stack.Screen name="+not-found" />
      </Stack>

      {/* Componente de flash messages */}
      <FlashMessage position="top" />
    </>
  );
}
