# AUTH_AND_ENCRYPTION.md

Privy ile Web3 girişini nasıl bağlarsın, "şifremi unuttum" ihtiyacını Privy'nin
neresi karşılar, ve notların diskten/ağdan **hiçbir zaman düz metin çıkmaması**
(AES-256, sıfır-bilgi) mimarisini nasıl kurarsın — hepsi burada, sıfırdan
anlatılmış. `ARCHITECTURE.md`'nin yanına konur; kodun gerçek şekli değiştikçe
bu dosya da güncellenmeli.

Bu dokümanın teknik iddiaları Privy'nin ve Tauri'nin güncel (Eylül 2026)
resmi dokümantasyonundan doğrulanmıştır — kaynaklar en altta. Hook isimleri
gibi küçük API detayları minor sürümlerde değişebildiği için, kod yazarken
`docs.privy.io` üzerinden bir kez daha teyit et; mimari kararlar (anahtar
türetimi, kurtarma ayrımı, CSP) sağlam.

---

## 0. Önce kavramlar — hiç bilmiyorsan buradan başla

| Terim | Ne demek |
| --- | --- |
| **Cüzdan (wallet)** | Bir özel anahtar (private key) çiftinin sahibi. Bu anahtarla "ben buyum" diye imza atabilir, işlem onaylayabilirsin. |
| **12 kelime (seed phrase / mnemonic)** | Özel anahtarın insan-okunur yedeği. Bu 12 kelimeyi bilen, cüzdanın sahibi demektir — başka hiçbir şey gerekmez. |
| **Harici cüzdan (external wallet)** | MetaMask, Trust Wallet gibi — kullanıcı anahtarı **kendi** cihazında/uygulamasında tutar, TxtNote hiç görmez. |
| **Gömülü cüzdan (embedded wallet)** | Kullanıcı e-posta/Google gibi sıradan bir yöntemle giriş yapar, cüzdanı **arka planda Privy oluşturur ve saklar** (parçalı/MPC olarak — aşağıda). Kullanıcı "cüzdan" kelimesini hiç duymayabilir. |
| **Privy** | Bir "auth + cüzdan altyapısı" servisi. E-posta/OTP, Google/X/Apple/GitHub/Discord girişini VE gömülü cüzdan oluşturup saklamayı VE harici cüzdan bağlamayı (MetaMask, WalletConnect) tek bir SDK altında toplar. |
| **MPC (multi-party computation) / parçalı anahtar** | Gömülü cüzdanın özel anahtarı tek parça halinde hiçbir yerde durmaz; "cihaz payı" + "kimlik doğrulama payı" + (varsa) "kurtarma payı" gibi parçalara bölünür. İmza atarken bu parçalar geçici olarak bir araya gelir. Privy tek başına bu parçaların hepsine sahip değildir — bu yüzden "Privy sunucusu çökse/ele geçirilse bile cüzdanına tek başına giremez" denir. |
| **WalletConnect** | MetaMask/Trust Wallet gibi cüzdanları, tarayıcı eklentisi OLMAYAN ortamlara (masaüstü uygulaman, mobil) QR kod veya derin bağlantı (deep link) ile bağlamanın standart yolu. **Kritik:** aşağıda ayrıca anlatılıyor. |
| **SIWE (Sign-In With Ethereum)** | "Bu adres gerçekten bu cihazdaki kullanıcıya ait" demenin yolu: kullanıcı bir mesajı imzalar, sunucu (ya da senin uygulaman) imzayı doğrular. Şifre yerine imza kullanılır. |
| **AES-256-GCM** | Simetrik şifreleme algoritması. Aynı anahtar hem şifreler hem çözer. GCM kısmı, veri değiştirilirse fark edilmesini sağlar (authentication tag). |
| **KDF (key derivation function)** — HKDF / PBKDF2 / Argon2id | Elindeki bir "girdi"den (bir imza, bir şifre) sabit uzunlukta, kriptografik olarak güçlü bir anahtar üretme yöntemi. Bu dokümanda **HKDF** kullanacağız çünkü girdimiz (imza) zaten yüksek entropili — parola gibi tahmin edilebilir değil. |
| **"Zero-knowledge" (bu bağlamda)** | ⚠️ Kripto dünyasında bu terim genelde "ZK-proof" (matematiksel ispat sistemleri) için kullanılır — o, burada anlattığımız şey **değil**. Senin kastettiğin, Proton Mail / Bitwarden tarzı **"sıfır-erişim" (zero-access) şifreleme**: sunucu şifreli veriyi taşır ama çözemez, çünkü anahtar hiç sunucuya gitmez. Dokümanın geri kalanında bu ikinci anlamı kullanıyorum. |

---

## 1. Uygulamadaki üç giriş yolu, gerçekte ne demek

`frontend/src/features/auth/RegisterPage.tsx` şu an tamamen sahte (mock)
zamanlayıcılarla çalışıyor ve içinde zaten `TODO: BACKEND INTEGRATION (Privy /
Web3Auth / WalletConnect)` notları var (satır ~387, ~892, ~945, ~1005, ~1054).
Bu, bu dokümanın planladığı entegrasyonun kod tarafında zaten beklendiği
anlamına geliyor.

| Ekrandaki buton | Fonksiyon | Kimlik kaynağı | Anahtarı kim tutar | Kaybedilirse kurtarılır mı? |
| --- | --- | --- | --- | --- |
| Google / X / Apple / GitHub / Discord | `handleSocial` | Privy OAuth → **gömülü cüzdan** | Privy (parçalı/MPC) + cihaz | ✅ Evet — Privy'nin kurtarma faktörüyle |
| E-posta (+ şifre alanı) | `handleJoin` | Privy e-posta girişi → **gömülü cüzdan** | Privy (parçalı/MPC) + cihaz | ✅ Evet (aşağıda önemli bir düzeltme var) |
| MetaMask / Trust Wallet | `handleWallet` | Kullanıcının **kendi harici cüzdanı** | Sadece kullanıcı | ❌ Hayır — Privy'nin haberi bile olmaz |
| "Yeni 12 kelime oluştur" | `handleGenerate` / `handleCreateVault` | Privy'siz, tamamen yerel **self-custody** | Sadece kullanıcı | ❌ Hayır |
| "12 kelime ile kurtar" (import) | `handleRecover` | Yukarıdakinin geri yüklenmesi | Sadece kullanıcı | (zaten kendi yedeği) |

Ekrandaki uyarı metinleri ("kaybedersen kimse geri getiremez...") **zaten
doğru yazılmış** — bunlar MetaMask/Trust/12-kelime yoluna ait ve
değiştirilmemeli. Asıl kafa karışıklığı şurada: **e-posta + şifre** alanı da
şu an aynı ekranda, aynı "geri dönüşü yok" havasında duruyor. Aşağıda bunu
düzelteceğiz.

---

## 2. En kritik gerçek: masaüstü uygulamanda tarayıcı cüzdanı YOK

TxtNote bir Tauri uygulaması — pencere bir web sitesi değil, **kendi
WebView'ı**. MetaMask ve Trust Wallet normalde Chrome'a eklenti olarak kurulur
ve sayfaya `window.ethereum` nesnesini enjekte eder. Tauri'nin WebView'ında
(Windows'ta WebView2) **eklenti çalışmaz**, dolayısıyla `window.ethereum`
diye bir şey olmaz.

Çözüm — ve zaten hem MetaMask hem Trust Wallet'ın mobil/masaüstü senaryoda
resmi yolu — **WalletConnect**: uygulaman ekranda bir QR kod (veya masaüstünde
"derin bağlantı") gösterir, kullanıcı telefonundaki MetaMask/Trust Wallet
uygulamasıyla o kodu okutur, imza isteği telefona gider, kullanıcı orada
onaylar. Privy'nin cüzdan bağlama akışı bunu otomatik sağlıyor — sen
"MetaMask'a bağlan" dediğinde arkada hem "tarayıcıda enjekte edilmiş cüzdan
var mı?" hem "yoksa WalletConnect QR'ı göster" mantığı zaten kurulu geliyor.
Bunu senin elle yazman gerekmiyor; sadece bunun **neden gerekli** olduğunu
bilmen, "neden QR kodu çıktı, MetaMask direkt açılmadı" sorusuna şaşırmaman
için önemli.

---

## 3. Privy hesabı kurulumu — adım adım (dashboard)

1. **dashboard.privy.io** üzerinden bir hesap aç, yeni bir **App** oluştur
   (TxtNote için ayrı bir "Test" app, bir de ileride "Production" app —
   ikisinin App ID'si farklı olacak).
2. **Allowed origins / domains** kısmına geliştirme ortamının adresini ekle:
   `http://localhost:5173` (Vite dev server). Tauri penceresi prod'da içerik
   dosyadan (`tauri://localhost` ya da Windows'ta `https://tauri.localhost`)
   yüklendiği için, prod App'ine bu origin'i de eklemen gerekecek — build'i
   aldıktan sonra pencere hangi origin'den şikayet ederse (tarayıcı konsolunda
   görünür) onu ekle.
3. **Login methods**: Email, Google, Twitter/X, Apple, GitHub, Discord'u aç —
   bunlar zaten `RegisterPage.tsx`'teki beş sosyal buton ve e-posta alanıyla
   bire bir eşleşiyor. Ayrıca **Wallet** (MetaMask + WalletConnect)
   yöntemini de aç.
4. **Embedded Wallets**: "Create on login" → yalnızca cüzdanı olmayan
   kullanıcılar için otomatik oluştur, ağ olarak Ethereum (ileride not
   şifreleme anahtarını türetirken zincirin kendisi önemli değil, sadece imza
   atma yeteneği kullanılacak).
5. **Recovery** (Embedded Wallets → Recovery): burada **"User-managed
   password"** seçeneğini aç. Privy'nin resmi dokümantasyonuna göre parola,
   kullanıcının yeni bir cihazda cüzdanını yeniden "monte edebilmesi" için
   kullanılan bir **kurtarma faktörüdür** — Google Drive / iCloud yedeği de
   alternatif bir faktör olarak sunulabiliyor. Önemli: Privy'nin kendi
   dokümantasyonu şunu açıkça yazıyor — *kullanıcı tüm cihazlarını ve
   kurtarma faktörünü kaybederse hesabından kalıcı olarak kilitlenir.* Yani
   parola girişini kaldırıyoruz ama "kurtarma parolası" hâlâ var; sadece adı
   ve rolü farklı (bkz. §8).
6. **App ID**'yi not al — bu, istemci tarafında (frontend) kullanılacak,
   gizli değil. Eğer bir **App Secret** üretirsen bu **asla** frontend koduna
   veya repoya girmemeli; sadece ileride bir backend doğrulaması yaparsan
   orada kullanılır (TxtNote'un şu anki mimarisinde buna gerek yok).

---

## 4. Paket kurulumu

```bash
cd frontend
npm install @privy-io/react-auth
npm install @scure/bip39 @noble/hashes
```

- `@privy-io/react-auth` — Privy'nin resmi React SDK'sı (bu isim Privy'nin
  güncel dokümantasyonunda ve npm'de doğrulandı).
- `@scure/bip39` — self-custody 12-kelime yolunda (Privy'siz) gerçek,
  checksum'lı bir mnemonic üretmek/doğrulamak için. Şu an `RegisterPage.tsx`
  içindeki `WORD_POOL` sadece 128 kelimelik sahte bir liste — kodun kendi
  yorumu bunu zaten söylüyor (satır ~384-389).
- `@noble/hashes` — HKDF (§9'daki anahtar türetimi) için.

Eğer harici cüzdan bağlantısını Privy'nin kendi hook'ları yerine `wagmi` ile
daha ince kontrollü yapmak istersen (`RegisterPage.tsx`'teki TODO yorumu bunu
öneriyor), ek olarak `wagmi`, `viem`, `@tanstack/react-query` gerekir — ama
bu **opsiyonel**; Privy'nin kendi cüzdan-bağlama hook'ları çoğu durumda
yeterli ve daha azdır. İlk sürümde wagmi'siz başlamanı öneririm.

---

## 5. Provider'ı bağlama

`frontend/src/main.jsx` uygulamanın kökü. `PrivyProvider`'ı en dışa
sarmalısın (App Router değil, düz React olduğu için basit):

```jsx
// main.jsx
import { PrivyProvider } from "@privy-io/react-auth";

<PrivyProvider
  appId={import.meta.env.VITE_PRIVY_APP_ID}
  config={{
    loginMethods: ["email", "google", "twitter", "apple", "github", "discord", "wallet"],
    embeddedWallets: { createOnLogin: "users-without-wallets" },
    appearance: { theme: "light" }, // uygulamanın kendi tema anahtarıyla senkronla
  }}
>
  <App />
</PrivyProvider>
```

`VITE_PRIVY_APP_ID` için proje kökünde bir `frontend/.env.local` dosyası aç
(bu dosya **repoya girmemeli** — `.gitignore`'da `*.local` zaten varsa
otomatik hariç kalır, yoksa ekle):

```
VITE_PRIVY_APP_ID=clxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 6. Tauri tarafında izin ayarları (CSP)

Privy'nin gömülü cüzdanı bir **iframe** içinde çalışıyor (`auth.privy.io`) ve
WalletConnect ayrı bir relay sunucusuna WebSocket ile bağlanıyor. Tauri
varsayılan olarak sıkı bir CSP uygular; bu domainlere izin vermezsen gömülü
cüzdan ya da WalletConnect QR'ı sessizce çalışmaz.

Privy'nin **resmi CSP kılavuzuna** göre eklemen gerekenler (`src-tauri/tauri.conf.json`
içindeki `app.security.csp` alanı — bu dosyayı sana göndermedim, projendeki
gerçek hâline bakıp aşağıdaki domainleri ilgili yönergelere ekle):

```
frame-src:    https://auth.privy.io
              https://verify.walletconnect.com
              https://verify.walletconnect.org
              https://challenges.cloudflare.com   (Privy'nin bot-koruması)

connect-src:  https://auth.privy.io
              wss://relay.walletconnect.com
              wss://relay.walletconnect.org
              wss://www.walletlink.org            (Coinbase Wallet kullanılırsa)
              https://*.rpc.privy.systems
              https://explorer-api.walletconnect.com

script-src:   https://challenges.cloudflare.com
```

Sosyal girişlerden Telegram da eklenecekse `frame-src`'ye
`https://oauth.telegram.org`, `script-src`'ye `https://telegram.org` eklenir
(TxtNote'ta Telegram şu an yok, atlanabilir).

`src-tauri/capabilities/default.json` içindeki ağ izinlerinin de (varsa bir
`http` veya `shell-open` kapasitesi) bu domainlere izin verecek şekilde
olduğunu kontrol et — WalletConnect QR kodunun altında genelde "veya bağlantıyı
kopyala / cüzdan uygulamasında aç" seçeneği de olur, bu bir `shell.open`
çağrısı gerektirebilir.

---

## 7. `RegisterPage.tsx`'teki her TODO'nun karşılığı

### 7.1 Sosyal butonlar — `handleSocial` (satır ~892-905)

```tsx
import { usePrivy } from "@privy-io/react-auth";

const { login } = usePrivy();

const handleSocial = (providerKey: SocialKey) => {
  // Privy'nin kendi modal'ı açılır; kullanıcı Google/X/Apple/GitHub/Discord
  // seçse de seçmese de, `onSuccess` ile tek bir noktadan devam edersin.
  login({ loginMethods: [providerKey] });
};
```

`usePrivy()`'nin `login` fonksiyonunun dönüş şekli ve `onSuccess` callback'i
minor sürümler arasında değişebiliyor — kod yazarken
`docs.privy.io/basics/react/quickstart` sayfasındaki güncel örneğe bak,
buradaki iskelet doğru ama imza detayını teyit et.

### 7.2 E-posta + şifre — `handleJoin` (satır ~906-940) — **en önemli düzeltme**

Şu anki UI'da e-posta yanında bir de "şifre" alanı var. Privy'nin **e-posta
girişi parola tabanlı değil, OTP (tek kullanımlık kod) tabanlıdır** — resmi
dokümantasyonda kullanılan hook `useLoginWithEmail`, iki adımlı:

```tsx
import { useLoginWithEmail } from "@privy-io/react-auth";

const { sendCode, loginWithCode } = useLoginWithEmail();

// 1. adım — "Katıl" butonuna basınca
await sendCode({ email });

// 2. adım — kullanıcı e-postasına gelen 6 haneli kodu girince
await loginWithCode({ code });
```

**Bunun anlamı:** şifre alanını tamamen kaldırmanı öneririm. Sebep basit —
Privy zaten parolasız bir giriş sunuyor ve bu, "şifremi unuttum" sorununu
**kökünden** ortadan kaldırıyor (unutulacak bir şifre yok). Şifre alanını
tutarsan iki seçeneğin var: (a) onu sadece kozmetik bırakıp hiçbir yerde
kullanmamak — kafa karıştırır, önerilmez; (b) gerçek bir "email+password"
sağlayıcısı (Privy bunu da destekliyor ama ek kurulum ister) kurmak — bu
dokümanın kapsamının dışında ve OTP'ye göre kazanımı yok. **(a) ve (b)'yi
atla, OTP'ye geç.**

### 7.3 MetaMask / Trust Wallet — `handleWallet` (satır ~945-960)

```tsx
import { useConnectWallet } from "@privy-io/react-auth";

const { connectWallet } = useConnectWallet({
  onSuccess: ({ wallet }) => completeAuth({ method: wallet.walletClientType, displayName: wallet.address }),
});

const handleWallet = (_walletKey: WalletKey) => {
  // Privy hangi cüzdanın kurulu olduğunu (ya da olmadığını, o zaman
  // WalletConnect QR'ını) kendi belirler — sen tek bir çağrı yaparsın.
  connectWallet();
};
```

Not: Privy'nin cüzdan seçim modalı kendi listesini gösterir (MetaMask, Trust
Wallet, Coinbase, WalletConnect QR...); ekrandaki iki özel logolu buton
(`WALLET_LOGOS.metamask`, `.trust`) sadece kısayol niyetine — tıklanınca
`connectWallet()` çağırıp Privy'nin modalının o cüzdana odaklanmasını
sağlayan bir parametre olup olmadığını (varsa) quickstart'tan teyit et; yoksa
iki buton da aynı genel modalı açar, bu da kabul edilebilir bir başlangıç.

### 7.4 "Yeni 12 kelime oluştur" — `handleGenerate` / `handleCreateVault` (satır ~962, ~1005-1010)

Bu yol **bilerek Privy'yi devre dışı bırakıyor** — ekrandaki uyarı metni
zaten bunu söylüyor. Gerçek, checksum'lı bir mnemonic üretmek için:

```js
import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

const mnemonic = generateMnemonic(wordlist, 128); // 128 bit = 12 kelime
```

Şu anki `WORD_POOL` + `generateMnemonic()` (dosyanın kendi yorumunda da
belirtildiği gibi) sadece demo amaçlı — gerçek BIP-39 checksum'ı yok, prod'a
girmeden önce mutlaka değişmeli.

### 7.5 "12 kelime ile kurtar" — `handleRecover` (satır ~1041-1059)

```js
import { validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

if (!validateMnemonic(importWords.join(" "), wordlist)) {
  setSeedError(...); // checksum tutmuyor — yanlış kelime/sıra
}
```

Bu yolda kullanıcı isterse bu cüzdanı Privy hesabına da bağlayabilir
(Privy'nin "harici cüzdan içe aktarma" akışı ayrıdır) — ama bu **opsiyonel
bir ekstra adım**, zorunlu değil. Zorunlu olan tek şey: mnemonic'ten türeyen
özel anahtarın **hiçbir zaman** ağa gitmemesi, sadece bellekte tutulup
§9'daki anahtar türetiminde kullanılması.

---

## 8. "Şifremi unuttum" — gerçekte iki farklı senaryo

Buradaki en büyük kavram karmaşası şu: **"hesaba giriş yapamama" (Privy'nin
işi) ile "şifreleme anahtarını kaybetme" (senin AES anahtarının işi) iki
ayrı şeydir.** §9'daki tasarım bu ikisini kasıtlı olarak birbirine bağlıyor
ki Privy hesabını kurtarabilen biri notlarını da otomatik kurtarabilsin.

**Senaryo A — kullanıcı Google/e-posta ile kaydoldu (gömülü cüzdan):**
Yeni bir cihazda `login()` yeniden e-posta OTP'siyle kimliğini doğrular →
Privy, o kullanıcının **kurtarma faktörünü** (kurulumda belirlediği parola,
ya da Google Drive/iCloud yedeği) ister → doğrulanınca gömülü cüzdanın
parçaları yeniden bir araya gelir → **aynı** genel adres, **aynı** imza
yeteneği geri gelir → §9'daki anahtar türetimi deterministik olduğu için AES
anahtarı da otomatik geri gelir, kullanıcıya ekstra bir şey sorulmaz. Bunun
tek koşulu: kurulumda belirlediği kurtarma parolasını (ya da Drive/iCloud
erişimini) unutmamış olması — Privy'nin kendi belgelerinde net: *tüm
cihazlarını ve kurtarma faktörünü kaybeden kullanıcı kalıcı olarak
kilitlenir.* Yani "şifremi unuttum" ekranı aslında "**kurtarma faktörünü**
gir" ekranıdır — arkadaki mekanizma Privy'de hazır, sen sadece UI'da bunu
tetikleyen bir link/akış eklersin.

**Senaryo B — kullanıcı MetaMask/Trust/12-kelime ile bağlandı:**
Privy'nin bu cüzdanla hiçbir ilgisi yok, hiçbir parça saklamıyor. Kurtarma
**yoktur** — ekrandaki mevcut Türkçe metin ("kaybedersen sonsuza dek
kaybolur, hiçbir sunucu ya da mahkeme kararı geri getiremez") zaten doğru ve
buna dokunma. "Şifremi unuttum" linkini sadece e-posta/sosyal (Web2 sekmesi)
tarafında göster; Web3 sekmesinde hiç gösterme — bu, kullanıcıya yanlış bir
umut vermemek için önemli.

---

## 9. Yerel sıfır-erişim (zero-access) şifreleme mimarisi

**İlke:** Backend/relay/bulut hiçbir zaman şunları görmez: özel anahtar,
12 kelime, düz metin not içeriği. Gördüğü tek şey zaten `types/index.ts`
içinde tanımlı olan `NoteSyncPayload` — ve bu payload'ın `content` alanı
**şifreli** olacak.

### 9.1 Anahtar nereden gelir?

Parola değil, **imza**dan türetiyoruz — nedeni: kimlik doğrulama yöntemi
değişse bile (Senaryo A'da kurtarma faktörüyle yeniden giriş), Privy **aynı**
cüzdanı/aynı genel anahtarı geri getiriyor, dolayısıyla aynı imzayı ve aynı
AES anahtarını üretebiliyoruz. Parola tabanlı bir türetim seçseydik, "parolayı
sıfırla" akışı yeni bir parola demek olurdu ve eski notların şifresi
**asla** çözülemezdi.

```
1. Kullanıcı giriş yapar (gömülü ya da harici cüzdan — ikisi de "mesaj
   imzalama" yeteneği sağlar, tek ortak nokta bu).
2. Sabit bir mesaj imzalatılır:
      "TxtNote Vault Key v1 — bu mesajı başka hiçbir uygulamada imzalama"
3. İmza (65 byte'lık ECDSA imzası) HKDF-SHA256'dan geçirilir → 32 byte
   (256 bit) simetrik anahtar çıkar.
4. Bu anahtar SADECE bellekte (bir React ref/context) tutulur — asla
   localStorage'a, SQLite'a ya da buluta yazılmaz.
5. Kilit ekranı (mevcut `autoLock` ayarı) tetiklendiğinde ya da pencere
   kapandığında anahtar bellekten silinir; bir sonraki açılışta imza
   tekrar istenir.
```

```js
// frontend/src/lib/vaultKey.js
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";

const VAULT_MESSAGE = "TxtNote Vault Key v1 — bu mesajı başka hiçbir uygulamada imzalama";

/**
 * `signMessage` — hem Privy'nin gömülü cüzdanından hem harici bir cüzdandan
 * (wagmi/viem ile) aynı imzayı üretecek şekilde enjekte edilir; bu fonksiyon
 * hangi cüzdan olduğunu bilmez, sadece imza ister.
 */
export async function deriveVaultKey(signMessage) {
  const signatureHex = await signMessage(VAULT_MESSAGE); // "0x..." 65 byte
  const signatureBytes = hexToBytes(signatureHex);
  const keyBytes = hkdf(sha256, signatureBytes, undefined, "txtnote-vault-key-v1", 32);
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function hexToBytes(hex) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}
```

Gömülü cüzdanda imza atarken Privy varsayılan olarak bir onay ekranı
gösterebilir; bunu her not kaydında değil, **sadece oturum başına bir kez**
(kilidi açarken) çağıracaksın, o yüzden kullanıcı deneyimini bozmaz. Privy
dashboard'ında gömülü cüzdanlar için "otomatik onay / arayüzsüz imza" gibi
bir ayar olup olmadığını entegrasyon sırasında kontrol et — olmasa bile tek
seferlik bir onay kabul edilebilir bir maliyet.

### 9.2 Notu şifrelemek / çözmek

```js
// frontend/src/lib/vaultCrypto.js

/** Şifreli metnin diskte/ağda duracağı şekil. */
export async function encryptText(plainText, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // her yazımda YENİ
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    v: 1,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuf)),
  };
}

export async function decryptText(blob, key) {
  const iv = base64ToBytes(blob.iv);
  const cipherBytes = base64ToBytes(blob.ciphertext);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
  return new TextDecoder().decode(plainBuf);
}

const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
```

**Nereye bağlanır:**

- `services/local/index.ts` — SQLite'a bir notu **yazan** fonksiyonun
  girişinde `encryptText(note.content, vaultKey)` çağır, dönen `{v, iv,
  ciphertext}` nesnesini diske yaz. **Okuyan** fonksiyonun çıkışında
  `decryptText(...)` ile geri çevir. Not başlığı da aynı muameleyi
  görmeli — sidebar'daki satır önizlemesi bile şifreli metinden
  türetilemez, bu yüzden başlık şifre çözülene kadar sidebar'da "🔒" gibi
  bir yer tutucu göstermek gerekebilir (`ARCHITECTURE.md`'deki "bir Tab,
  bir ContentItem'ın projeksiyonudur" kuralı burada devrede — başlık
  alanı şifreliyken UI'nin buna nasıl davranacağını ayrıca tasarlaman
  gerekecek).
- `frontend/src/features/sync/payload.js` (`buildNotePayload`) — buluta
  giden `NoteSyncPayload.content` alanı **zaten şifreli** olan veriyi
  taşımalı; yani şifreleme SQLite yazımında bir kere yapılır, sync bunu
  olduğu gibi yollar, ikinci bir şifreleme katmanına gerek yok.
- `services/mock/sync.ts` / ileride `services/http` — bu katmanın
  gördüğü her şey zaten şifreli metin olduğu için burada **hiçbir ek iş
  yok**; sıfır-erişim garantisinin doğası bu.

### 9.3 Kim neyi görüyor — kısa özet tablo

| Yer | Görür mü? |
| --- | --- |
| Cihazdaki SQLite dosyası | Şifreli blob (`{v, iv, ciphertext}`) — düz metin yok |
| TxtNote bulut sunucusu | Aynı şifreli blob + hash + deviceId — düz metin yok |
| Privy | Kimlik bilgisi (e-posta/OAuth) + gömülü cüzdanın parçalı anahtarı — **not içeriğini asla görmez**, çünkü ona hiç gönderilmiyor |
| WalletConnect relay | Sadece imza isteği/sonucu trafiği — not içeriğiyle hiç temas etmez |

---

## 10. Yayına almadan önce kontrol listesi

- [ ] Şifre alanı e-posta akışından kaldırıldı, yerine OTP geldi (§7.2)
- [ ] `.env.local` (App ID) `.gitignore`'da; bir App Secret üretildiyse
      hiçbir zaman frontend koduna girmedi
- [ ] CSP'de sadece §6'daki gerekli domainler açık, `unsafe-inline` gibi
      gevşetmeler yok
- [ ] `vaultKey` hiçbir zaman `console.log`'a, crash/hata raporlama
      servisine (varsa) düşmüyor
- [ ] Buluta giden her `NoteSyncPayload` gövdesi otomatik bir testle
      kontrol ediliyor: `content` alanı düz metin başlık/gövde
      **içermiyor** (ör. testte bilinen bir kelimeyi ararsın, bulunmamalı)
- [ ] 12-kelime ekranında panoya kopyalanan mnemonic bir süre sonra
      otomatik temizleniyor (UI zaten "panoyu temizle" diyor, `handleCopy`
      fonksiyonuna gerçek bir clipboard-temizleme timer'ı eklendi)
- [ ] Kurtarma faktörü (parola/Drive/iCloud) kullanıcıya kurulumda **açıkça**
      anlatılıyor: bunu kaybederse gömülü cüzdanı da, notları da kalıcı
      olarak kaybeder
- [ ] Web3 sekmesinde (MetaMask/Trust/12-kelime) hiçbir "şifremi unuttum"
      linki yok — bu yolun kurtarması yok, UI bunu iması bile etmemeli

---

## 11. Önerilen uygulama sırası

1. Privy dashboard'da bir **test** App kur, sadece e-posta OTP + Google'ı aç.
2. `PrivyProvider`'ı bağla, `handleJoin`'i OTP'ye geçir — şifre alanını kaldır.
3. `vaultKey.js` + `vaultCrypto.js`'i yaz, henüz sync yokken bile **yerel**
   SQLite yazımını şifrelemeye başla (bu tek başına büyük bir kazanım).
4. Kalan sosyal butonları bağla (`handleSocial`).
5. MetaMask/Trust Wallet'ı `connectWallet()` ile bağla, CSP'yi güncelle,
   gerçek bir telefonla WalletConnect QR'ını test et.
6. `@scure/bip39` ile gerçek 12-kelime üretim/doğrulamasına geç.
7. Bulut senkronizasyonunu aç (`services/mock/sync.ts` → `services/http`),
   §10'daki "düz metin sızmadı" testini otomatikleştir.
8. Senaryo A'daki kurtarma akışını **gerçekten** uçtan uca dene: bir hesabı
   yeni bir cihazda (ya da uygulamayı silip yeniden kurarak) kurtarma
   faktörüyle geri getir, notların gerçekten çözüldüğünü doğrula.

---

## 12. Sık sorulanlar

**Privy ücretsiz mi?** Fiyatlandırma zamanla değişebiliyor — entegrasyona
başlamadan önce `privy.io` üzerindeki güncel fiyatlandırma sayfasına bak, bu
dokümanda kesin bir rakam vermiyorum.

**Gömülü cüzdan gerçekten "self-custody" sayılır mı?** Kısmen — MPC
sayesinde Privy tek başına anahtarın tamamına sahip değil, ama tamamen
kullanıcının tek başına kontrolünde olan MetaMask/12-kelime yoluyla aynı
şey değil. Privy'nin kendi belgelerinde gömülü cüzdanın özel anahtarının
**dışa aktarılabildiği** ("kullanıcı istediği an Privy'den ayrılabilir")
belirtiliyor — bu, tam kilitlenmeyi önleyen bir "kaçış kapısı".

**WalletConnect ücretsiz mi?** Relay altyapısı ücretsiz kullanılabiliyor
ama kendi projen için WalletConnect Cloud'da bir Project ID alman
gerekiyor (Privy'yi kullanırsan bunu Privy senin için hallediyor olabilir —
teyit et).

---

## Kaynaklar

Bu dokümandaki Privy ve Tauri ile ilgili teknik iddialar şu sayfalardan
doğrulandı (Eylül 2026):

- [Privy React Quickstart](https://docs.privy.io/basics/react/quickstart)
- [Privy — Password-based recovery](https://docs.privy.io/guide/react/wallets/embedded/recovery/passwords)
- [Privy — User Account Recovery](https://docs.privy.io/guide/troubleshooting/recovery)
- [Privy — Content Security Policy guidance](https://docs.privy.io/security/implementation-guide/content-security-policy)
- [Privy — Embedded wallets overview](https://docs.privy.io/wallets/overview/embedded)
- [@privy-io/react-auth on npm](https://www.npmjs.com/package/@privy-io/react-auth)
- [Tauri v2 — Content Security Policy](https://v2.tauri.app/security/csp/)
- [Tauri v2 — Capabilities](https://v2.tauri.app/security/capabilities/)
