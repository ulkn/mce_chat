// Firebase projesinin (mce-chat-1) ayarları.
// Konsol > Proje ayarları > Genel > "Uygulamalarınız" > Web uygulaması (</>) > "firebaseConfig"
// Bu değerler gizli değildir; güvenliği firestore.rules ve storage.rules dosyaları sağlar.
export const firebaseConfig = {
  apiKey: 'AIzaSyCyxeNtMMKO-T30o0XE70rtH8-he1FGw0U',
  authDomain: 'mce-chat-1.firebaseapp.com',
  projectId: 'mce-chat-1',
  storageBucket: 'mce-chat-1.firebasestorage.app',
  messagingSenderId: '1080586315846',
  appId: '1:1080586315846:web:928cd4198255db2314c247',
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some(
  (v) => !v || v.startsWith('BURAYA')
);
