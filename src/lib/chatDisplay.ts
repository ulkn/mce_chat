import { formatLastSeen } from './format';
import type { Chat, UserProfile } from './types';

const TYPING_WINDOW_MS = 7000;

export type ChatDisplay = {
  title: string;
  photoURL: string | null;
  isSaved: boolean; // kendinle sohbet: Kayıtlı Mesajlar
  isGroup: boolean;
  peer: UserProfile | null; // birebir sohbetteki karşı taraf
};

export function describeChat(
  chat: Chat,
  me: string,
  userById: (uid: string) => UserProfile | undefined
): ChatDisplay {
  if (chat.type === 'group') {
    return { title: chat.name || 'Grup', photoURL: chat.photoURL, isSaved: false, isGroup: true, peer: null };
  }
  const otherId = chat.members.find((m) => m !== me);
  if (!otherId) {
    return { title: 'Kayıtlı Mesajlar', photoURL: null, isSaved: true, isGroup: false, peer: null };
  }
  const peer = userById(otherId) ?? null;
  return {
    title: peer?.displayName ?? 'Kullanıcı',
    photoURL: peer?.photoURL ?? null,
    isSaved: false,
    isGroup: false,
    peer,
  };
}

export function typingUserIds(chat: Chat, me: string, now = Date.now()): string[] {
  return Object.entries(chat.typing)
    .filter(([uid, at]) => uid !== me && chat.members.includes(uid) && now - at < TYPING_WINDOW_MS)
    .map(([uid]) => uid);
}

// Sohbet başlığının altındaki satır: yazıyor…, çevrimiçi / son görülme ya da üye sayısı.
export function chatSubtitle(
  chat: Chat,
  display: ChatDisplay,
  me: string,
  userById: (uid: string) => UserProfile | undefined,
  now = Date.now()
): string {
  const typing = typingUserIds(chat, me, now);
  if (typing.length > 0) {
    if (!display.isGroup) return 'yazıyor…';
    const names = typing.map((uid) => userById(uid)?.displayName.split(' ')[0] ?? 'Biri');
    return names.length === 1 ? `${names[0]} yazıyor…` : `${names.length} kişi yazıyor…`;
  }
  if (display.isSaved) return 'kendine notlar';
  if (display.isGroup) return `${chat.members.length} üye`;
  if (!display.peer) return '';
  return formatLastSeen(display.peer.online, display.peer.lastSeen, now);
}

// Benim gönderdiğim bir mesajı diğer herkes okudu mu?
export function isReadByOthers(chat: Chat, me: string, createdAt: number): boolean {
  const others = chat.members.filter((m) => m !== me);
  if (others.length === 0) return true;
  return others.every((uid) => (chat.lastRead[uid] ?? 0) >= createdAt);
}
