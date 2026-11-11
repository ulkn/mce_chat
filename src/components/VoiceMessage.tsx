import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration } from '@/lib/format';

type Props = {
  url: string;
  duration: number | null;
  color: string; // düğme ve dolan çubuk
  trackColor: string;
  textColor: string;
};

// Oynatıcı yalnızca dokununca oluşturulur; listede onlarca ses mesajı olsa da hafif kalır.
export function VoiceMessage({ url, duration, color, trackColor, textColor }: Props) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <ActivePlayer
        url={url}
        fallbackDuration={duration}
        color={color}
        trackColor={trackColor}
        textColor={textColor}
        onDone={() => setActive(false)}
      />
    );
  }

  return (
    <Layout
      icon="play"
      progress={0}
      label={formatDuration(duration ?? 0)}
      color={color}
      trackColor={trackColor}
      textColor={textColor}
      onPress={() => setActive(true)}
    />
  );
}

function ActivePlayer({
  url,
  fallbackDuration,
  color,
  trackColor,
  textColor,
  onDone,
}: {
  url: string;
  fallbackDuration: number | null;
  color: string;
  trackColor: string;
  textColor: string;
  onDone: () => void;
}) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const started = useRef(false);

  // Yüklenir yüklenmez bir kez kendiliğinden başlat.
  useEffect(() => {
    if (status.isLoaded && !started.current) {
      started.current = true;
      player.play();
    }
  }, [status.isLoaded, player]);

  useEffect(() => {
    if (status.didJustFinish) onDone();
  }, [status.didJustFinish, onDone]);

  const total = status.duration > 0 ? status.duration : fallbackDuration ?? 0;
  const progress = total > 0 ? Math.min(1, status.currentTime / total) : 0;

  return (
    <Layout
      icon={status.playing ? 'pause' : 'play'}
      progress={progress}
      label={formatDuration(status.playing || status.currentTime > 0 ? status.currentTime : total)}
      color={color}
      trackColor={trackColor}
      textColor={textColor}
      onPress={() => (status.playing ? player.pause() : player.play())}
    />
  );
}

function Layout({
  icon,
  progress,
  label,
  color,
  trackColor,
  textColor,
  onPress,
}: {
  icon: 'play' | 'pause';
  progress: number;
  label: string;
  color: string;
  trackColor: string;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityLabel={icon === 'play' ? 'Sesli mesajı oynat' : 'Duraklat'}
        style={[styles.button, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#FFFFFF" style={icon === 'play' ? styles.playNudge : undefined} />
      </Pressable>
      <View style={styles.right}>
        <View style={[styles.track, { backgroundColor: trackColor }]}>
          <View style={[styles.fill, { backgroundColor: color, width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', width: 210, gap: 10 },
  button: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  playNudge: { marginLeft: 3 },
  right: { flex: 1, gap: 6 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  label: { fontSize: 12 },
});
