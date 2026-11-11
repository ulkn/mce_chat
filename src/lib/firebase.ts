import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { type Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { firebaseConfig } from './firebaseConfig';

const alreadyStarted = getApps().length > 0;
const app = alreadyStarted ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
let db: Firestore;

if (alreadyStarted) {
  // Geliştirme sırasında hızlı yenilemede ikinci kez başlatmayı önler.
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Oturum, uygulama kapanıp açılsa da telefonda saklanır.
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
}

const storage = getStorage(app);

export { app, auth, db, storage };
