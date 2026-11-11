import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { initialsOf } from '@/lib/format';
import { colorFor, useTheme } from '@/lib/theme';

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
  online?: boolean;
  icon?: keyof typeof Ionicons.glyphMap; // isim yerine simge (grup, kayıtlı mesajlar)
};

export function Avatar({ name, uri, size = 48, online = false, icon }: Props) {
  const theme = useTheme();
  const radius = size / 2;
  const dot = Math.max(10, Math.round(size * 0.26));

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.surface }}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: radius, backgroundColor: colorFor(name) },
          ]}>
          {icon ? (
            <Ionicons name={icon} size={size * 0.5} color="#FFFFFF" />
          ) : (
            <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
          )}
        </View>
      )}
      {online ? (
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: theme.online,
              borderColor: theme.background,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '600' },
  dot: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2 },
});
