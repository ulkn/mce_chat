import {
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { subscribeChats } from './chats';
import { auth } from './firebase';
import type { Chat, UserProfile } from './types';
import { createUserProfile, setPresence, subscribeUsers } from './users';

const HEARTBEAT_MS = 3 * 60 * 1000;

type Session = {
  ready: boolean; // oturum durumu öğrenildi mi
  uid: string | null;
  email: string | null;
  me: UserProfile | null;
  users: UserProfile[];
  userById: (uid: string) => UserProfile | undefined;
  chats: Chat[];
  chatsLoaded: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  // Veriler hangi kullanıcıya aitse onunla birlikte tutulur; hesap değişince eskisi kendiliğinden geçersiz kalır.
  const [usersState, setUsersState] = useState<{ uid: string; list: UserProfile[] } | null>(null);
  const [chatsState, setChatsState] = useState<{ uid: string; list: Chat[] } | null>(null);
  // Kayıt sırasında profil belgesi yazılana kadar çevrimiçi bilgisini yazmayı bekletir.
  const profileReady = useRef(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setReady(true);
      }),
    []
  );

  const uid = user?.uid ?? null;

  // Kullanıcılar ve sohbetler: giriş yapılınca dinle, çıkınca bırak.
  useEffect(() => {
    if (!uid) return;
    const stopUsers = subscribeUsers(
      (list) => setUsersState({ uid, list }),
      (e) => console.warn('Kullanıcılar okunamadı', e)
    );
    const stopChats = subscribeChats(
      uid,
      (list) => setChatsState({ uid, list }),
      (e) => {
        console.warn('Sohbetler okunamadı', e);
        setChatsState({ uid, list: [] });
      }
    );
    return () => {
      stopUsers();
      stopChats();
    };
  }, [uid]);

  const users = useMemo(() => (uid && usersState?.uid === uid ? usersState.list : []), [uid, usersState]);
  const chats = useMemo(() => (uid && chatsState?.uid === uid ? chatsState.list : []), [uid, chatsState]);
  const chatsLoaded = uid !== null && chatsState?.uid === uid;

  // Çevrimiçi / son görülme: uygulama öndeyken düzenli aralıkla, arka plana geçince bir kez yazılır.
  useEffect(() => {
    if (!uid) return;
    const write = (online: boolean) => {
      if (!profileReady.current) return;
      setPresence(uid, online).catch(() => {});
    };
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      write(true);
      if (!timer) timer = setInterval(() => write(true), HEARTBEAT_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
      write(false);
    };
    if (AppState.currentState === 'active') start();
    const sub = AppState.addEventListener('change', (state) => (state === 'active' ? start() : stop()));
    return () => {
      sub.remove();
      if (timer) clearInterval(timer);
    };
  }, [uid]);

  const userMap = useMemo(() => new Map(users.map((u) => [u.uid, u])), [users]);
  const userById = useCallback((id: string) => userMap.get(id), [userMap]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    profileReady.current = false;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await createUserProfile(cred.user.uid, cred.user.email ?? email.trim(), name);
    } finally {
      profileReady.current = true;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (auth.currentUser) {
      await setPresence(auth.currentUser.uid, false).catch(() => {});
    }
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo<Session>(
    () => ({
      ready,
      uid,
      email: user?.email ?? null,
      me: uid ? userMap.get(uid) ?? null : null,
      users,
      userById,
      chats,
      chatsLoaded,
      signIn,
      signUp,
      signOut,
    }),
    [ready, uid, user, userMap, users, userById, chats, chatsLoaded, signIn, signUp, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession, SessionProvider içinde kullanılmalı.');
  return ctx;
}

// Giriş yapılmış ekranlar için kullanıcı kimliği. Çıkış anında kısa süreliğine boş dönebilir.
export function useUid(): string {
  return useSession().uid ?? '';
}
