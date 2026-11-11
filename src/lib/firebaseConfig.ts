// Firebase konsolundan aldığın ayarları buraya yapıştır.
// Konsol > Proje ayarları > Genel > "Uygulamalarınız" > Web uygulaması (</>) > "firebaseConfig"
// Bu değerler gizli değildir; güvenliği firestore.rules ve storage.rules dosyaları sağlar.
export const firebaseConfig = {
  apiKey: 'BURAYA_YAPISTIR',
  authDomain: 'BURAYA_YAPISTIR',
  projectId: 'BURAYA_YAPISTIR',
  storageBucket: 'BURAYA_YAPISTIR',
  messagingSenderId: 'BURAYA_YAPISTIR',
  appId: 'BURAYA_YAPISTIR',
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some(
  (v) => !v || v.startsWith('BURAYA')
);
