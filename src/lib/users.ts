import {
  type DocumentData,
  type QueryDocumentSnapshot,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from './firebase';
import type { UserProfile } from './types';

export function toMillis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return null;
}

function toUser(snap: QueryDocumentSnapshot<DocumentData>): UserProfile {
  const d = snap.data({ serverTimestamps: 'estimate' });
  return {
    uid: snap.id,
    displayName: typeof d.displayName === 'string' && d.displayName ? d.displayName : 'İsimsiz',
    email: typeof d.email === 'string' ? d.email : '',
    emailLower: typeof d.emailLower === 'string' ? d.emailLower : '',
    about: typeof d.about === 'string' ? d.about : '',
    photoURL: typeof d.photoURL === 'string' ? d.photoURL : null,
    online: d.online === true,
    lastSeen: toMillis(d.lastSeen),
  };
}

export async function createUserProfile(uid: string, email: string, displayName: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    displayName: displayName.trim(),
    email,
    emailLower: email.toLowerCase(),
    about: 'Merhaba! Yaren kullanıyorum.',
    photoURL: null,
    online: true,
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function updateUserProfile(
  uid: string,
  fields: Partial<Pick<UserProfile, 'displayName' | 'about' | 'photoURL'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), fields);
}

export async function setPresence(uid: string, online: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { online, lastSeen: serverTimestamp() });
}

// Küçük bir arkadaş çevresi için tüm kullanıcıları tek dinleyiciyle canlı takip eder.
export function subscribeUsers(
  onChange: (users: UserProfile[]) => void,
  onError: (e: Error) => void
): () => void {
  return onSnapshot(
    query(collection(db, 'users'), limit(500)),
    (snap) => onChange(snap.docs.map(toUser)),
    onError
  );
}
