# Kurulum rehberi (adım adım)

Bu rehber, uygulamayı sıfırdan iPhone'una kurana kadar yapman gereken her şeyi sırayla anlatır.

**Gerekenler:** bir Google hesabı, bir Apple hesabı, bir kredi/banka kartı, iPhone. Bilgisayar şart değil.

**İki yol var:**

- **Bilgisayarsız (telefondan):** A → B → E → aşağıdaki "Telefondan kurulum" bölümü → G.
- **Bilgisayarla:** A → B → C → D → E → F → G.

> Firebase, Expo ve Apple ekranlarındaki düğme adları zamanla küçük değişiklikler gösterebilir. Bir adımda takılırsan ekranda ne gördüğünü Claude'a yaz.

---

## Telefondan kurulum (bilgisayarsız)

Önce A, B ve E adımları tamam olmalı (Firebase hazır, ayarlar kodda, Apple Developer üyeliği onaylı). Ayrıca <https://expo.dev/signup> adresinden ücretsiz bir Expo hesabı aç.

### 1. yol: Expo Launch (tarayıcıdan, terminal yok)

Expo Launch, GitHub deposunu alıp imzalama, derleme ve TestFlight'a gönderme işini tarayıcıdan yapar.

1. iPhone'da Safari ile şu bağlantıyı aç:

   <https://launch.expo.dev/?github=https://github.com/ulkn/mce_chat&projectName=mce-chat&appName=MCE+Chat&appBundleId=com.ulkn.mcechat>

2. Hedef olarak **App Store** (TestFlight) seç.
3. Expo hesabınla giriş yap.
4. Apple hesabınla giriş yap; telefona gelen 6 haneli kodu gir.
5. Uygulama adı ve kimliği dolu gelir (`MCE Chat`, `com.ulkn.mcechat`). "Bu ad kullanılıyor" derse adı değiştir (örn. sonuna bir kelime ekle); bu ad yalnızca App Store Connect'te görünür, telefondaki simgenin altında yine "Yaren" yazar.
6. **Launch** de ve bitmesini bekle. Bitince G adımına geç.

**Depo özel olduğu için okuyamazsa:** Expo Launch belgelerinde yalnızca herkese açık depolar anlatılıyor. Erişemediğini söylerse GitHub'da **Settings > General > Danger Zone > Change repository visibility > Public** yap, Launch'ı tekrar dene, derleme bitince aynı yerden **Private**'a geri al. Depoda şifre ya da gizli anahtar yok; Firebase ayarları zaten her uygulamanın içinde açık duran türdendir. Yine de açık kaldığı sürece kodu herkes görebilir.

### 2. yol: Tarayıcıda terminal (Launch olmazsa)

GitHub Codespaces, tarayıcıda çalışan hazır bir bilgisayar verir (kişisel hesaplarda aylık ücretsiz kota var). Telefonda ekran dar ama yazılacak tek bir komut var.

1. Safari ile <https://codespaces.new/ulkn/mce_chat> adresini aç, **Create codespace** de. Açılması ve kurulumun bitmesi birkaç dakika sürer.
2. Altta **Terminal** bölümü görünür (görünmezse sol üstteki menü > Terminal > New Terminal). Şunu yaz:

   ```
   npm run yayinla
   ```

3. Sırayla: Expo kullanıcı adı ve şifren, "create a project" sorusuna `y`, sonra F3'teki tabloda yazan Apple soruları gelir.
4. Derleme sıraya girince sekmeyi kapatabilirsin; derleme Expo'nun sunucularında sürer. İş bitince <https://github.com/codespaces> adresinden codespace'i **Delete** ile sil ki kotanı harcamasın.

### Bilgisayarsız yolda atlananlar

- **D adımı (Expo Go ile ücretsiz deneme) yapılamaz;** uygulamayı ilk kez TestFlight'tan kurunca göreceksin. Bir hata çıkarsa Claude düzeltir, sen aynı yolu tekrar çalıştırırsın.
- 90 günlük yenilemede de aynı yolu (Launch bağlantısı ya da `npm run yayinla`) tekrar kullanırsın.

---

## A. Firebase projesini kur

Firebase, mesajların saklandığı ve anında iletildiği sunucu. Bu bölüm tarayıcıdan yapılır (telefondan da olur, bilgisayar daha rahat).

### A1. Proje oluştur

1. <https://console.firebase.google.com> adresine git, Google hesabınla giriş yap.
2. **Proje oluştur** (Create a project) düğmesine bas.
3. Proje adı yaz (örn. `mce-chat`), devam et.
4. Google Analytics sorulursa **kapat** (gerekmiyor), **Proje oluştur** de.
5. "Projeniz hazır" yazınca **Devam** de.

### A2. E-posta ile girişi aç

1. Sol menüde **Build (Derleme) > Authentication**'a gir, **Başlayın** (Get started) de.
2. **Sign-in method** sekmesinde **E-posta/Şifre** (Email/Password) satırına bas.
3. İlk anahtarı (**Etkinleştir**) aç. İkinci anahtar ("e-posta bağlantısı") kapalı kalsın.
4. **Kaydet**.

### A3. Veritabanını aç (Firestore)

1. Sol menüde **Build > Firestore Database**, **Veritabanı oluştur** (Create database).
2. Sürüm sorulursa **Standard** seç.
3. Konum: Avrupa'dan birini seç (örn. `eur3` ya da `europe-west3`). **Sonradan değiştirilemez.**
4. **Üretim modunda başlat** (Start in production mode) seç, **Oluştur**.
5. Veritabanı açılınca üstteki **Kurallar** (Rules) sekmesine geç.
6. Kutudaki her şeyi sil. Bu depodaki [`firestore.rules`](firestore.rules) dosyasının **tamamını** kopyalayıp yapıştır.
7. **Yayınla** (Publish).

### A4. Dosya depolamayı aç (Storage)

Fotoğraf, dosya, sesli mesaj ve profil fotoğrafı için gerekir. Bu adım kart ister.

1. Sol menünün en altında plan adı yazar (**Spark**). Yanındaki **Yükselt** (Upgrade) düğmesine bas, **Blaze**'i seç.
2. Bir faturalandırma hesabı oluştur: ülke, ad, kart bilgisi. Google kartı doğrulamak için küçük bir geçici provizyon çekebilir.
3. Bütçe uyarısı sorulursa küçük bir tutar gir (örn. 5 USD). Bu bir **uyarıdır, harcama sınırı değildir**; aşılırsa e-posta gelir.
4. Sol menüde **Build > Storage**, **Başlayın**.
5. Konum sorusunda dikkat: Google'ın ücretsiz depolama kotası yalnızca **US-CENTRAL1, US-EAST1, US-WEST1** bölgelerindeki bucket'larda geçerli. Sıfır maliyet istiyorsan bunlardan birini seç. Avrupa seçersen kullanım kadar (küçük bir grup için kuruş düzeyinde) ücret yansır.
6. **Üretim modu**nu seç, **Bitti**.
7. **Kurallar** sekmesine geç, kutuyu boşalt, [`storage.rules`](storage.rules) dosyasının tamamını yapıştır, **Yayınla**.

Kart tanımlamak istemezsen A4'ü atla: yazılı mesajlaşma çalışır; fotoğraf, dosya, sesli mesaj ve profil fotoğrafı gönderimi hata verir. Sonradan açabilirsin.

### A5. Uygulama ayarlarını al

1. Sol üstte **Project Overview** yanındaki **dişli > Proje ayarları**.
2. **Genel** sekmesinde aşağı in, **Uygulamalarınız** (Your apps) bölümünde **`</>`** (Web) simgesine bas.
3. Takma ad yaz (örn. `mce-chat`). "Firebase Hosting" kutusunu **işaretleme**. **Uygulamayı kaydet**.
4. Ekrana şuna benzer bir blok gelir:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "mce-chat-xxxx.firebaseapp.com",
     projectId: "mce-chat-xxxx",
     storageBucket: "mce-chat-xxxx.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef..."
   };
   ```

5. Bu altı değeri kopyala. (Sonradan aynı sayfadan tekrar görebilirsin.)

---

## B. Ayarları koda yapıştır

İki yoldan biri:

**Kolay yol:** Altı değeri Claude'a bu sohbette gönder; dosyaya o yazar. Bu değerler gizli değildir (her uygulamanın içinde açık durur); güvenliği A3 ve A4'te yapıştırdığın kurallar sağlar.

**Kendin yapmak istersen:**

1. GitHub'da `ulkn/mce_chat` deposunu aç, `src/lib/firebaseConfig.ts` dosyasına gir.
2. Sağ üstteki **kalem** simgesine bas.
3. Altı `'BURAYA_YAPISTIR'` değerinin her birini Firebase'den aldığın karşılığıyla değiştir. Tırnak işaretleri kalsın.
4. **Commit changes** düğmesine bas.

---

## C. Bilgisayarı hazırla (bir kereye mahsus)

1. <https://nodejs.org> adresinden **LTS** sürümünü indirip kur (hep "İleri").
2. <https://git-scm.com/download/win> adresinden Git'i indirip kur (hep "İleri").
3. Başlat menüsünden **PowerShell**'i aç.
4. Kodu indir:

   ```powershell
   git clone https://github.com/ulkn/mce_chat.git
   cd mce_chat
   npm install
   ```

   - `git clone` sırasında tarayıcıda GitHub girişi istenir; depo özel olduğu için gerekli.
   - `npm install` birkaç dakika sürer. `warn` satırları normaldir; `ERR!` görürsen dur ve sor.

Sonraki bütün komutlar bu `mce_chat` klasörünün içinde çalıştırılır.

---

## D. Önce ücretsiz dene (önerilir)

Apple'a ödeme yapmadan önce uygulamanın telefonunda çalıştığını gör.

1. iPhone'a App Store'dan **Expo Go** uygulamasını kur.
2. Bilgisayar ve telefon **aynı Wi-Fi**'da olsun.
3. PowerShell'de:

   ```powershell
   npx expo start
   ```

4. Ekranda bir QR kod çıkar. iPhone'un **Kamera** uygulamasıyla okut, çıkan bağlantıya bas; Expo Go açılır ve uygulama yüklenir.
   - Bağlanmazsa (şirket ağı, misafir Wi-Fi vb.) komutu `npx expo start --tunnel` olarak çalıştır.
5. Kayıt ol, ikinci bir e-postayla (ya da bir arkadaşının telefonundan) ikinci hesap aç, mesajlaşmayı dene.
6. Bitince PowerShell'de `Ctrl + C` ile durdur.

Bu yöntem bilgisayar açıkken çalışır; kalıcı kurulum için E, F, G adımları gerekir. Burada bir hata görürsen Apple üyeliğine geçmeden Claude'a ilet.

---

## E. Apple Developer Program üyeliği

1. Apple hesabında **iki adımlı doğrulama** açık olmalı (iPhone: Ayarlar > adın > Giriş ve Güvenlik).
2. En kolayı iPhone'dan: App Store'dan **Apple Developer** uygulamasını kur, **Account (Hesap)** sekmesinde giriş yap, **Enroll Now** de. (Bilgisayardan: <https://developer.apple.com/programs/enroll/>.)
3. **Individual (Bireysel)** seç. Adını kimliğindeki gibi yaz; takma ad onayı geciktirir.
4. Yıllık üyelik ücretini öde (99 USD; bölgeye göre yerel para biriminde gösterilebilir).
5. Onay e-postasını bekle. Bireysel başvurular çoğunlukla 48 saat içinde onaylanır.
6. Onaydan sonra <https://appstoreconnect.apple.com> adresine bir kez giriş yap, sözleşme onayı isterse kabul et.

---

## F. Derle ve TestFlight'a gönder

### F1. Expo hesabı

1. <https://expo.dev/signup> adresinden ücretsiz hesap aç.
2. PowerShell'de:

   ```powershell
   npx eas-cli@latest login
   ```

   İlk seferde "Ok to proceed?" sorusuna `y` de, sonra Expo kullanıcı adı ve şifreni gir.

### F2. Projeyi Expo'ya bağla

```powershell
npx eas-cli@latest init
```

"Would you like to create a project…" sorusuna `y` de. Bu komut `app.json` dosyasına bir proje kimliği ekler. Değişikliği depoya kaydet:

```powershell
git add app.json
git commit -m "EAS proje kimliği"
git push
```

### F3. Derlemeyi başlat

```powershell
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

Sırayla şuna benzer sorular gelir:

| Soru | Yanıt |
| --- | --- |
| Do you want to log in to your Apple account? | `Y`, sonra Apple e-postan, şifren ve telefonuna gelen 6 haneli kod |
| Takım seçimi | Kendi adını seç |
| Generate a new Apple Distribution Certificate? | `Y` |
| Generate a new Apple Provisioning Profile? | `Y` |
| Push Notifications kurulumu sorulursa | `N` (şimdilik yok) |
| App Store Connect'te uygulama oluşturma / API Key sorusu | `Y` |

- Uygulama kimliği `com.ulkn.mcechat` olarak ayarlı (`app.json`). İlk derlemeden sonra **değiştirme**.
- Sorular bitince derleme Expo'nun bulut Mac'lerinde sıraya girer. Ücretsiz planda sıra beklemesi olabilir; toplam süre yarım saat ile bir saatten fazla arasında değişir. Ekrandaki bağlantıdan ilerlemeyi izleyebilirsin.
- Derleme bitince dosya kendiliğinden App Store Connect'e yüklenir. Apple işlemeyi bitirince e-posta gönderir (genelde 5-30 dakika).

Derleme hata verirse ekrandaki bağlantıyı açıp kırmızı hata satırını Claude'a gönder.

---

## G. iPhone'a kur

1. <https://appstoreconnect.apple.com> > **Uygulamalar (Apps)** > **Yaren** > **TestFlight** sekmesi.
2. Sol tarafta **Internal Testing (Dahili Test)** yanındaki **+**'ya bas, gruba bir ad ver (örn. `Ben`).
3. Grubun içinde **Testers** yanındaki **+** ile kendini ekle.
4. iPhone'a App Store'dan **TestFlight** uygulamasını kur, Apple hesabınla aç. Yaren listede görünür; **Yükle (Install)** de. (Görünmezse gelen davet e-postasındaki **View in TestFlight** bağlantısına telefondan bas.)
5. Uygulamayı aç, kayıt ol. Mikrofon ve fotoğraf izinlerini sorduğunda izin ver.

### Arkadaşlarını eklemek

- **Dahili (hemen, 100 kişiye kadar):** App Store Connect > **Kullanıcılar ve Erişim (Users and Access)** > **+** ile arkadaşının Apple hesabı e-postasını ekle (rol: Marketing yeterli). Daveti kabul edince G2'deki gruba ekle. Bu kişiler App Store Connect hesabına sınırlı erişim de kazanır.
- **Harici (yalnızca e-posta ile, 10.000 kişiye kadar):** TestFlight sekmesinde **External Testing** yanındaki **+** ile grup oluştur, e-postaları ekle. İlk sürüm Apple'ın kısa bir beta incelemesinden geçer; test bilgisi alanlarını doldurman istenir.

### 90 günde bir yenile

TestFlight sürümü 90 gün sonra açılmaz olur. Süre dolmadan F3'teki komutu tekrar çalıştır (bu sefer soruların çoğu sorulmaz), telefonda TestFlight'tan **Güncelle** de. Mesajlar sunucuda durduğu için kaybolmaz.

---

## Bilmen gerekenler

**Maliyet.** Apple üyeliği yıllık ücretlidir. Expo'nun ücretsiz planı ayda sınırlı sayıda derleme verir; 90 günde bir yenileme için yeter. Firebase'de Authentication ve Firestore küçük bir grup için ücretsiz kotada kalır. Storage, Blaze planı ister; A4'teki konum notuna göre ücretsiz ya da kuruş düzeyinde olur.

**Anlık bildirim yok.** Uygulama açıkken mesajlar anında düşer ve okunmamış sayacı görünür. Uygulama kapalıyken ya da arka plandayken telefona bildirim gelmez; yeni mesajı görmek için uygulamayı açman gerekir. Eklenebilir: Apple'dan bildirim anahtarı, Firebase Cloud Functions ve bir miktar kod gerekir.

**Uçtan uca şifreleme yok.** Mesajlar telefon ile Firebase arasında şifreli taşınır ve güvenlik kuralları sayesinde yalnızca sohbetin üyeleri okuyabilir. Ancak Firebase projesinin sahibi olarak sen (ve Google) veritabanındaki içeriği görebilirsin. WhatsApp'taki gibi "sunucu bile okuyamaz" düzeyi yoktur.

**Kayıt herkese açık, liste ortak.** Uygulamayı kuran herkes kayıt olabilir ve kayıtlı herkes "Kişiler" listesinde birbirini görür. Uygulama yalnızca TestFlight davetiyle kurulabildiği için pratikte senin davet ettiklerinle sınırlıdır.

**Gerçek iPhone'da ilk kez sen deneyeceksin.** Mesajlaşma mantığı ve güvenlik kuralları test edildi, ekranlar tarayıcıda denendi; ama ses kaydı, kamera, dosya yükleme ve klavye davranışı ancak telefonda görülebilir. İlk denemede pürüz çıkarsa ne yaptığını ve ne olduğunu yaz, düzeltilir.

**Hesap silme / veri.** Bir kullanıcıyı ya da mesajı tamamen silmek için Firebase konsolundaki Authentication ve Firestore ekranlarını kullanabilirsin.
