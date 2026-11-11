# Yaren

Arkadaş çevresi için mesajlaşma uygulaması. Expo (React Native) + Firebase ile yazıldı; iPhone'a TestFlight üzerinden kurulur, Mac gerekmez.

## Neler var

- E-posta + şifre ile kayıt ve giriş, şifre sıfırlama
- Birebir sohbet, grup sohbeti, kendine not için "Kayıtlı Mesajlar"
- Fotoğraf (galeri ya da kamera), dosya ve sesli mesaj gönderme
- Mesajı yanıtlama, düzenleme, herkes için silme, kopyalama
- Okundu tikleri, okunmamış sayacı, "yazıyor…", çevrimiçi / son görülme
- Grup yönetimi: üye ekleme/çıkarma, ad ve fotoğraf değiştirme, gruptan ayrılma
- Profil fotoğrafı, ad, hakkında yazısı
- Açık ve koyu tema (telefonun ayarını izler)

## Henüz olmayanlar

- **Anlık bildirim yok.** Mesajlar uygulama açıkken anında gelir; uygulama kapalıyken bildirim düşmez. Eklenebilir (Apple bildirim anahtarı ve Firebase Cloud Functions gerekir).
- **Uçtan uca şifreleme yok.** Mesajlar aktarılırken şifrelidir ve yalnızca sohbet üyeleri okuyabilir, ama Firebase projesinin sahibi (sen) veritabanında görebilir.
- Sesli/görüntülü arama, kanallar, mesaj iletme, emoji tepkileri yok.
- Kayıtlı herkes birbirini "Kişiler" listesinde görür. Küçük, davetli bir çevre için tasarlandı.

---

## Kurulum

**Her adımın tek tek anlatıldığı ayrıntılı rehber: [KURULUM.md](KURULUM.md).** Bilgisayar olmadan, yalnızca telefondan kurmanın yolu da orada. Aşağısı kısa özettir.

Sırayla üç iş var: Firebase projesini aç, ayarları koda yapıştır, uygulamayı derleyip TestFlight'a gönder.

### 1. Firebase projesi

1. <https://console.firebase.google.com> adresinde **Proje ekle** ile yeni proje oluştur (Analytics'i kapatabilirsin).
2. **Authentication > Sign-in method > E-posta/Şifre** seçeneğini etkinleştir.
3. **Firestore Database > Veritabanı oluştur** (üretim modu; konum olarak Avrupa bölgelerinden birini seç, sonradan değiştirilemez). Sonra **Kurallar** sekmesine `firestore.rules` dosyasının içeriğini yapıştırıp **Yayınla**.
4. **Storage > Başlayın.** Firebase, Storage için projenin **Blaze (kullandıkça öde) planına** geçirilmesini ister; kredi kartı tanımlamak gerekir. Ücretsiz kullanım kotası Blaze'de de geçerlidir, küçük bir grup için fatura çıkması beklenmez; yine de Google Cloud'da bütçe uyarısı kurmanı öneririm. Açıldıktan sonra **Kurallar** sekmesine `storage.rules` içeriğini yapıştırıp **Yayınla**.
   - Kart tanımlamak istemezsen bu adımı atla: yazılı mesajlaşma çalışır; fotoğraf, dosya, sesli mesaj ve profil fotoğrafı yüklemeleri hata verir.
5. **Proje ayarları (dişli) > Genel > Uygulamalarınız > Web (`</>`)** ile bir web uygulaması kaydet. Ekrana gelen `firebaseConfig` değerlerini kopyala.

### 2. Ayarları koda yapıştır

- `src/lib/firebaseConfig.ts` dosyasındaki `BURAYA_YAPISTIR` değerlerini Firebase'den kopyaladıklarınla değiştir.
- Uygulama kimliği `app.json` içinde `com.ulkn.mcechat` olarak ayarlı. Bu kimlik Apple tarafında benzersiz olmalı ve ilk derlemeden sonra değiştirilmemeli.
- Uygulamanın adını değiştirmek istersen `app.json` içindeki `"name"` alanı yeterli.

### 3. Derle ve iPhone'a kur

Gerekenler: Apple Developer Program üyeliği (yıllık ücretli), ücretsiz bir Expo hesabı (<https://expo.dev>), Node.js kurulu herhangi bir bilgisayar (Windows olur).

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

- İlk derlemede EAS, Apple hesabınla giriş yapmanı ister ve imzalama sertifikalarını senin yerine oluşturur. Sorulara varsayılan yanıtları vermen yeterli.
- Derleme Expo'nun bulut Mac'lerinde yapılır ve bitince App Store Connect'e yüklenir. Birkaç dakika sonra **App Store Connect > TestFlight** bölümünde görünür.
- iPhone'a **TestFlight** uygulamasını kur, aynı Apple hesabıyla aç; Yaren orada çıkar.
- Arkadaşların için iki yol var: App Store Connect'e kullanıcı olarak eklediğin kişiler (iç test, 100 kişiye kadar) hemen kurabilir. E-posta ya da bağlantıyla dışarıdan davet etmek için Apple'ın kısa bir beta incelemesinden geçmek gerekir.
- TestFlight sürümleri 90 gün geçerlidir. Süre dolmadan aynı `build` komutunu yeniden çalıştırman yeterli.

### Derlemeden hızlıca denemek (isteğe bağlı)

iPhone'a App Store'dan **Expo Go** uygulamasını kur, bilgisayarda `npx expo start` çalıştır ve çıkan QR kodu kamerayla okut. Telefon ve bilgisayar aynı Wi-Fi'da olmalı. Apple Developer üyeliği gerekmez; arayüzü ve mesajlaşmayı denemek için en kısa yol budur.

---

## Proje yapısı

```
src/app/            Ekranlar (dosya adı = adres)
  _layout.tsx         Giriş durumuna göre yönlendirme
  login.tsx, register.tsx
  (tabs)/index.tsx    Sohbet listesi
  (tabs)/settings.tsx Ayarlar
  chat/[id].tsx       Sohbet ekranı
  chat-info/[id].tsx  Kişi / grup bilgisi
  new-chat.tsx        Kişi seçip sohbet başlatma
  select-members.tsx  Yeni grup ve gruba üye ekleme
  profile.tsx         Profil düzenleme
  image.tsx           Tam ekran fotoğraf
src/components/     Mesaj balonu, yazma alanı, avatar vb.
src/lib/            Firebase bağlantısı, veri işlemleri, tema
firestore.rules     Veritabanı güvenlik kuralları
storage.rules       Dosya depolama güvenlik kuralları
```

Renkleri değiştirmek için `src/lib/theme.ts` dosyasındaki `light` ve `dark` paletleri yeterli.

## Veri modeli (Firestore)

- `users/{uid}`: ad, e-posta, hakkında, fotoğraf, çevrimiçi bilgisi
- `chats/{chatId}`: tür (`direct` / `group`), üyeler, yöneticiler, son mesaj, kişi başı okunmamış sayısı ve son okuma zamanı
- `chats/{chatId}/messages/{id}`: gönderen, tür (`text` / `image` / `file` / `audio`), metin, dosya bağlantısı, yanıt bilgisi

Güvenlik kuralları özetle: sohbeti ve mesajlarını yalnızca üyeleri okur ve yazar; mesajı yalnızca göndereni düzenler/siler; grupta üye ve yönetici listesini yalnızca yönetici değiştirir (üye sadece kendini çıkarabilir); herkes yalnızca kendi profilini ve kendi dosya klasörünü yazar.

## Geliştirme komutları

```bash
npx expo start        # geliştirme sunucusu
npx tsc --noEmit      # tip denetimi
npx expo lint         # kod denetimi
npx expo-doctor       # bağımlılık ve ayar kontrolü
```
