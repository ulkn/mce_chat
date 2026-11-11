import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Fotoğrafı tam ekranda gösterir; iki parmakla yakınlaştırılabilir.
export default function ImageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { url } = useLocalSearchParams<{ url: string }>();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        maximumZoomScale={4}
        minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        centerContent
        contentContainerStyle={styles.zoomContent}>
        {url ? (
          <Image source={{ uri: url }} style={{ width, height }} contentFit="contain" accessibilityLabel="Fotoğraf" />
        ) : null}
      </ScrollView>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={[styles.close, { top: insets.top + 8 }]}
        accessibilityLabel="Kapat">
        <Ionicons name="close" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  zoomContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  close: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
