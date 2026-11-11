import { setAudioModeAsync } from 'expo-audio';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { isFirebaseConfigured } from '@/lib/firebaseConfig';
import { SessionProvider, useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme';

export default function RootLayout() {
  if (!isFirebaseConfigured) return <SetupNeeded />;
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { ready, uid } = useSession();
  const theme = useTheme();

  useEffect(() => {
    // Telefon sessizdeyken de sesli mesajlar duyulsun.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const base = theme.dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: theme.primary,
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.background },
          headerBackTitle: 'Geri',
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Protected guard={uid !== null}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="chat-info/[id]" options={{ title: 'Bilgi' }} />
          <Stack.Screen name="new-chat" options={{ title: 'Yeni Sohbet' }} />
          <Stack.Screen name="select-members" options={{ title: 'Yeni Grup' }} />
          <Stack.Screen name="profile" options={{ title: 'Profil' }} />
          <Stack.Screen name="image" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={uid === null}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

// Firebase ayarları henüz girilmediyse uygulama bunu açıkça söyler.
function SetupNeeded() {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.setup}>
      <Text style={[styles.setupTitle, { color: theme.text }]}>Firebase ayarı eksik</Text>
      <Text style={[styles.setupText, { color: theme.textSecondary }]}>
        Uygulamanın çalışması için Firebase projenin ayarlarını{' '}
        <Text style={{ color: theme.text, fontWeight: '600' }}>src/lib/firebaseConfig.ts</Text> dosyasına
        yapıştırman gerekiyor. Adımlar README.md dosyasında.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  setup: { flexGrow: 1, justifyContent: 'center', padding: 28, gap: 12 },
  setupTitle: { fontSize: 24, fontWeight: '700' },
  setupText: { fontSize: 16, lineHeight: 23 },
});
