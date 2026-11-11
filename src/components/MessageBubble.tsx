import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DELETED_TEXT } from '@/lib/chats';
import { formatClock, formatFileSize } from '@/lib/format';
import { colorFor, useTheme } from '@/lib/theme';
import type { Message } from '@/lib/types';

import { VoiceMessage } from './VoiceMessage';

export type DeliveryState = 'pending' | 'sent' | 'read';

type Props = {
  message: Message;
  mine: boolean;
  senderName: string | null; // grup sohbetinde, gelen mesajın üstünde gösterilir
  replyAuthor: string | null;
  delivery: DeliveryState;
  grouped: boolean; // aynı kişinin art arda mesajı: aradaki boşluk daralır
  onLongPress: (message: Message) => void;
  onPressImage: (message: Message) => void;
  onPressFile: (message: Message) => void;
};

const MAX_IMAGE_WIDTH = 240;
const MAX_IMAGE_HEIGHT = 300;

function imageSize(width: number | null, height: number | null) {
  if (!width || !height) return { width: MAX_IMAGE_WIDTH, height: 180 };
  const scale = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height, 1);
  return { width: Math.max(120, Math.round(width * scale)), height: Math.max(90, Math.round(height * scale)) };
}

function MessageBubbleBase({
  message,
  mine,
  senderName,
  replyAuthor,
  delivery,
  grouped,
  onLongPress,
  onPressImage,
  onPressFile,
}: Props) {
  const theme = useTheme();
  const bubbleColor = mine ? theme.bubbleOut : theme.bubbleIn;
  const textColor = mine ? theme.bubbleOutText : theme.bubbleInText;
  const metaColor = mine ? theme.tick : theme.textSecondary;
  const accent = theme.primary;

  let content: React.ReactNode;
  if (message.deleted) {
    content = (
      <View style={styles.deletedRow}>
        <Ionicons name="ban" size={15} color={metaColor} />
        <Text style={[styles.deleted, { color: metaColor }]}>{DELETED_TEXT}</Text>
      </View>
    );
  } else if (message.type === 'image' && message.mediaUrl) {
    const size = imageSize(message.width, message.height);
    content = (
      <View>
        <Pressable onPress={() => onPressImage(message)} onLongPress={() => onLongPress(message)}>
          <Image
            source={{ uri: message.mediaUrl }}
            style={[styles.image, size, { backgroundColor: theme.surface }]}
            contentFit="cover"
            transition={150}
            accessibilityLabel="Fotoğraf"
          />
        </Pressable>
        {message.text ? <Text style={[styles.text, styles.caption, { color: textColor }]}>{message.text}</Text> : null}
      </View>
    );
  } else if (message.type === 'audio' && message.mediaUrl) {
    content = (
      <VoiceMessage
        url={message.mediaUrl}
        duration={message.duration}
        color={accent}
        trackColor={theme.dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)'}
        textColor={metaColor}
      />
    );
  } else if (message.type === 'file' && message.mediaUrl) {
    content = (
      <Pressable style={styles.fileRow} onPress={() => onPressFile(message)} onLongPress={() => onLongPress(message)}>
        <View style={[styles.fileIcon, { backgroundColor: accent }]}>
          <Ionicons name="document-text" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.fileBody}>
          <Text style={[styles.fileName, { color: textColor }]} numberOfLines={2}>
            {message.fileName ?? 'Dosya'}
          </Text>
          <Text style={[styles.fileMeta, { color: metaColor }]}>{formatFileSize(message.fileSize)}</Text>
        </View>
      </Pressable>
    );
  } else {
    content = <Text style={[styles.text, { color: textColor }]}>{message.text}</Text>;
  }

  return (
    <View style={[styles.wrap, mine ? styles.wrapMine : styles.wrapTheirs, grouped ? styles.grouped : styles.spaced]}>
      <Pressable
        onLongPress={() => onLongPress(message)}
        delayLongPress={280}
        style={[
          styles.bubble,
          { backgroundColor: bubbleColor },
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          !mine && !theme.dark ? styles.shadow : null,
        ]}>
        {senderName ? (
          <Text style={[styles.sender, { color: colorFor(senderName) }]} numberOfLines={1}>
            {senderName}
          </Text>
        ) : null}
        {message.replyTo && !message.deleted ? (
          <View style={[styles.reply, { borderLeftColor: accent, backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <Text style={[styles.replyAuthor, { color: accent }]} numberOfLines={1}>
              {replyAuthor ?? 'Mesaj'}
            </Text>
            <Text style={[styles.replyText, { color: textColor }]} numberOfLines={1}>
              {message.replyTo.preview}
            </Text>
          </View>
        ) : null}
        {content}
        <View style={styles.meta}>
          {message.editedAt && !message.deleted ? (
            <Text style={[styles.metaText, { color: metaColor }]}>düzenlendi</Text>
          ) : null}
          <Text style={[styles.metaText, { color: metaColor }]}>{formatClock(message.createdAt)}</Text>
          {mine && !message.deleted ? (
            <Ionicons
              name={delivery === 'pending' ? 'time-outline' : delivery === 'read' ? 'checkmark-done' : 'checkmark'}
              size={15}
              color={delivery === 'read' ? theme.tickRead : metaColor}
              accessibilityLabel={
                delivery === 'pending' ? 'Gönderiliyor' : delivery === 'read' ? 'Okundu' : 'Gönderildi'
              }
            />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleBase);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, flexDirection: 'row' },
  wrapMine: { justifyContent: 'flex-end' },
  wrapTheirs: { justifyContent: 'flex-start' },
  grouped: { marginTop: 2 },
  spaced: { marginTop: 8 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 10, paddingTop: 7, paddingBottom: 5 },
  bubbleMine: { borderBottomRightRadius: 5 },
  bubbleTheirs: { borderBottomLeftRadius: 5 },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sender: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  text: { fontSize: 16, lineHeight: 21 },
  caption: { marginTop: 6 },
  image: { borderRadius: 10 },
  deletedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deleted: { fontSize: 15, fontStyle: 'italic' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: 220 },
  fileIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  fileBody: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '500' },
  fileMeta: { fontSize: 12, marginTop: 2 },
  reply: { borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 5 },
  replyAuthor: { fontSize: 13, fontWeight: '700' },
  replyText: { fontSize: 13, opacity: 0.8 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  metaText: { fontSize: 11 },
});
