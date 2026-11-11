import {
  type DocumentData,
  type DocumentSnapshot,
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { db, storage } from './firebase';
import type { Chat, LastMessage, Message, MessageType, ReplyRef } from './types';
import { toMillis } from './users';

export const DELETED_TEXT = 'Bu mesaj silindi';

function numberMap(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const n = toMillis(v);
      if (n !== null) out[k] = n;
    }
  }
  return out;
}

function toChat(snap: DocumentSnapshot<DocumentData>): Chat | null {
  const d = snap.data({ serverTimestamps: 'estimate' });
  if (!d) return null;
  const lm = d.lastMessage as DocumentData | null | undefined;
  const lastMessage: LastMessage | null = lm
    ? {
        text: typeof lm.text === 'string' ? lm.text : '',
        type: (lm.type as MessageType) ?? 'text',
        senderId: typeof lm.senderId === 'string' ? lm.senderId : '',
        createdAt: toMillis(lm.createdAt) ?? Date.now(),
      }
    : null;
  return {
    id: snap.id,
    type: d.type === 'group' ? 'group' : 'direct',
    members: Array.isArray(d.members) ? (d.members as string[]) : [],
    admins: Array.isArray(d.admins) ? (d.admins as string[]) : [],
    name: typeof d.name === 'string' ? d.name : null,
    photoURL: typeof d.photoURL === 'string' ? d.photoURL : null,
    createdBy: typeof d.createdBy === 'string' ? d.createdBy : '',
    createdAt: toMillis(d.createdAt) ?? Date.now(),
    updatedAt: toMillis(d.updatedAt) ?? Date.now(),
    lastMessage,
    unread: numberMap(d.unread),
    lastRead: numberMap(d.lastRead),
    typing: numberMap(d.typing),
  };
}

function toMessage(snap: DocumentSnapshot<DocumentData>): Message | null {
  const d = snap.data({ serverTimestamps: 'estimate' });
  if (!d) return null;
  const r = d.replyTo as DocumentData | null | undefined;
  const replyTo: ReplyRef | null =
    r && typeof r.id === 'string'
      ? { id: r.id, senderId: String(r.senderId ?? ''), preview: String(r.preview ?? '') }
      : null;
  const num = (v: unknown) => (typeof v === 'number' ? v : null);
  const str = (v: unknown) => (typeof v === 'string' ? v : null);
  return {
    id: snap.id,
    senderId: String(d.senderId ?? ''),
    type: (d.type as MessageType) ?? 'text',
    text: typeof d.text === 'string' ? d.text : '',
    mediaUrl: str(d.mediaUrl),
    mediaPath: str(d.mediaPath),
    fileName: str(d.fileName),
    fileSize: num(d.fileSize),
    mimeType: str(d.mimeType),
    width: num(d.width),
    height: num(d.height),
    duration: num(d.duration),
    replyTo,
    createdAt: toMillis(d.createdAt) ?? Date.now(),
    editedAt: toMillis(d.editedAt),
    deleted: d.deleted === true,
    pending: snap.metadata.hasPendingWrites,
  };
}

export function directChatId(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export function previewText(m: { type: MessageType; text: string; fileName?: string | null }): string {
  switch (m.type) {
    case 'image':
      return m.text ? `📷 ${m.text}` : '📷 Fotoğraf';
    case 'audio':
      return '🎤 Sesli mesaj';
    case 'file':
      return `📎 ${m.fileName ?? 'Dosya'}`;
    default:
      return m.text;
  }
}

// Birebir sohbeti açar; yoksa oluşturur. Kendinle sohbet "Kayıtlı Mesajlar" olur.
export async function openDirectChat(me: string, other: string): Promise<string> {
  const id = directChatId(me, other);
  const chatRef = doc(db, 'chats', id);
  const existing = await getDoc(chatRef);
  if (!existing.exists()) {
    await setDoc(chatRef, {
      type: 'direct',
      members: me === other ? [me] : [me, other],
      admins: [],
      name: null,
      photoURL: null,
      createdBy: me,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      unread: {},
      lastRead: {},
      typing: {},
    });
  }
  return id;
}

export async function createGroup(me: string, name: string, memberIds: string[]): Promise<string> {
  const chatRef = doc(collection(db, 'chats'));
  const members = Array.from(new Set([me, ...memberIds]));
  await setDoc(chatRef, {
    type: 'group',
    members,
    admins: [me],
    name: name.trim(),
    photoURL: null,
    createdBy: me,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    unread: {},
    lastRead: {},
    typing: {},
  });
  return chatRef.id;
}

export function subscribeChats(
  uid: string,
  onChange: (chats: Chat[]) => void,
  onError: (e: Error) => void
): () => void {
  // Sıralama cihazda yapılır; böylece Firestore'da bileşik dizin kurmak gerekmez.
  const q = query(collection(db, 'chats'), where('members', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const chats = snap.docs.map(toChat).filter((c): c is Chat => c !== null);
      chats.sort((a, b) => b.updatedAt - a.updatedAt);
      onChange(chats);
    },
    onError
  );
}

export function subscribeChat(
  chatId: string,
  onChange: (chat: Chat | null) => void,
  onError: (e: Error) => void
): () => void {
  return onSnapshot(doc(db, 'chats', chatId), (snap) => onChange(toChat(snap)), onError);
}

// En yeni mesaj başta olacak şekilde son `count` mesajı canlı dinler.
export function subscribeMessages(
  chatId: string,
  count: number,
  onChange: (messages: Message[]) => void,
  onError: (e: Error) => void
): () => void {
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'desc'), limit(count));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => onChange(snap.docs.map(toMessage).filter((m): m is Message => m !== null)),
    onError
  );
}

export type OutgoingMessage = {
  type: MessageType;
  text?: string;
  mediaUrl?: string | null;
  mediaPath?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  replyTo?: ReplyRef | null;
};

export async function sendMessage(chat: Chat, senderId: string, out: OutgoingMessage): Promise<void> {
  const chatRef = doc(db, 'chats', chat.id);
  const msgRef = doc(collection(chatRef, 'messages'));
  const text = (out.text ?? '').trim();
  const batch = writeBatch(db);

  batch.set(msgRef, {
    senderId,
    type: out.type,
    text,
    mediaUrl: out.mediaUrl ?? null,
    mediaPath: out.mediaPath ?? null,
    fileName: out.fileName ?? null,
    fileSize: out.fileSize ?? null,
    mimeType: out.mimeType ?? null,
    width: out.width ?? null,
    height: out.height ?? null,
    duration: out.duration ?? null,
    replyTo: out.replyTo ?? null,
    createdAt: serverTimestamp(),
    editedAt: null,
    deleted: false,
  });

  const chatUpdate: Record<string, unknown> = {
    lastMessage: {
      text: previewText({ type: out.type, text, fileName: out.fileName }),
      type: out.type,
      senderId,
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
    [`lastRead.${senderId}`]: serverTimestamp(),
    [`typing.${senderId}`]: deleteField(),
  };
  for (const uid of chat.members) {
    if (uid !== senderId) chatUpdate[`unread.${uid}`] = increment(1);
  }
  batch.update(chatRef, chatUpdate);

  await batch.commit();
}

export async function markRead(chatId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), {
    [`lastRead.${uid}`]: serverTimestamp(),
    [`unread.${uid}`]: 0,
  });
}

export async function setTyping(chatId: string, uid: string, typing: boolean): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), {
    [`typing.${uid}`]: typing ? serverTimestamp() : deleteField(),
  });
}

export async function editMessage(chatId: string, messageId: string, text: string, isLast: boolean): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  const batch = writeBatch(db);
  batch.update(doc(chatRef, 'messages', messageId), { text: text.trim(), editedAt: serverTimestamp() });
  if (isLast) batch.update(chatRef, { 'lastMessage.text': text.trim() });
  await batch.commit();
}

// Mesajı herkes için siler: içerik boşaltılır, varsa dosyası depodan kaldırılır.
export async function deleteMessage(chatId: string, message: Message, isLast: boolean): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  const batch = writeBatch(db);
  batch.update(doc(chatRef, 'messages', message.id), {
    deleted: true,
    text: '',
    mediaUrl: null,
    mediaPath: null,
    fileName: null,
    replyTo: null,
  });
  if (isLast) batch.update(chatRef, { 'lastMessage.text': DELETED_TEXT, 'lastMessage.type': 'text' });
  await batch.commit();
  if (message.mediaPath) {
    try {
      await deleteObject(ref(storage, message.mediaPath));
    } catch {
      // Dosya zaten silinmiş olabilir; mesaj silindiği için sorun değil.
    }
  }
}

export async function renameGroup(chatId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), { name: name.trim() });
}

export async function setGroupPhoto(chatId: string, photoURL: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), { photoURL });
}

export async function addGroupMembers(chatId: string, uids: string[]): Promise<void> {
  if (uids.length === 0) return;
  await updateDoc(doc(db, 'chats', chatId), { members: arrayUnion(...uids) });
}

export async function removeGroupMember(chatId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), {
    members: arrayRemove(uid),
    admins: arrayRemove(uid),
    [`unread.${uid}`]: deleteField(),
    [`typing.${uid}`]: deleteField(),
  });
}

// Gruptan ayrılır. Ayrılan son yöneticiyse, kalan ilk üye yönetici olur.
export async function leaveGroup(chat: Chat, uid: string): Promise<void> {
  const remaining = chat.members.filter((m) => m !== uid);
  const remainingAdmins = chat.admins.filter((a) => a !== uid);
  const admins = remainingAdmins.length > 0 || remaining.length === 0 ? remainingAdmins : [remaining[0]];
  await updateDoc(doc(db, 'chats', chat.id), {
    members: remaining,
    admins,
    [`unread.${uid}`]: deleteField(),
    [`typing.${uid}`]: deleteField(),
  });
}
