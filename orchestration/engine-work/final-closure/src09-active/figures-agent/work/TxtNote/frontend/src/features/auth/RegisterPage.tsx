"use client";

/* ==========================================================================================
 *  TxtNote — Authentication & Onboarding  (v3)
 *  Single-file, standalone Next.js (App Router) page component.
 *
 *  Stack        : React 18+/19, Next.js App Router, Tailwind CSS, lucide-react
 *  Aesthetic    : Pure monochrome, hairline borders, rounded-3xl, mature Web3 SaaS
 *  Typography   : Bricolage Grotesque (display) · Inter (body) · JetBrains Mono (labels/data)
 *
 *  v3 changelog
 *    · Web2 — removed the top "Continue" button entirely (container + handler + copy).
 *    · Web2 — rebuilt the X glyph with a correct, clean path; added GitHub + Discord.
 *    · Web2 — five circular social buttons in a single row.
 *    · Web2 — added a password field with a reveal/hide toggle and its own validation.
 *    · Web3 — "Popular wallets" now uses the same centered rule-label as "12-word key".
 *    · Web3 — the "Generate new" tab mints a phrase on the spot instead of dead-ending.
 *
 *  Install      : npm i lucide-react
 *  Assets       : import metamask.svg + trustwallet.png from src/assets/auth
 * ========================================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TxtNoteWordmark } from "../../brand/TxtNoteWordmark.jsx";
import metamaskLogo from "../../assets/auth/metamask.svg";
import trustwalletLogo from "../../assets/auth/trustwallet.png";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  Moon,
  RefreshCw,
  ShieldAlert,
  Sun,
  Trash2,
  X as XIcon,
} from "lucide-react";

/* ------------------------------------------------------------------------------------------
 * PREVIEW ESCAPE HATCH
 * Set to `true` only when rendering this file in an isolated sandbox with no Tailwind build
 * step. Leave `false` inside a real Next.js project — the CDN runtime isn't for production.
 * ---------------------------------------------------------------------------------------- */
const ENABLE_TAILWIND_CDN_FOR_PREVIEW = false;

/* Bundled locally so Tauri/desktop never 404s /auth/* public URLs. */
const WALLET_LOGOS = {
  metamask: metamaskLogo,
  trust: trustwalletLogo,
} as const;

/* ==========================================================================================
 * 1. TYPES
 * ========================================================================================== */

type Lang = "tr" | "en" | "es";
type Theme = "light" | "dark";
type Mode = "web2" | "web3";
type SeedTab = "generate" | "import";
type ToastTone = "neutral" | "danger";
type SocialKey = "google" | "x" | "apple" | "github" | "discord";
type WalletKey = "metamask" | "trust";

/* ==========================================================================================
 * 2. LOCALIZATION DICTIONARY  (TR / EN / ES)
 *    Every visible string lives here. No hardcoded copy in JSX.
 * ========================================================================================== */

const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "tr", label: "TR", native: "Türkçe" },
  { code: "en", label: "EN", native: "English" },
  { code: "es", label: "ES", native: "Español" },
];

const DICT = {
  en: {
    brand: {
      slogan: "Easy access to privacy is everyone's right, and TxtNote is on a mission to deliver it.",
    },
    nav: {
      toLight: "Switch to light",
      toDark: "Switch to dark",
      language: "Language",
    },
    web2: {
      socialAria: "Continue with {provider}",
      google: "Google",
      x: "X",
      apple: "Apple",
      github: "GitHub",
      discord: "Discord",
      orEmail: "or use email and password",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "At least 8 characters",
      passwordShow: "Show password",
      passwordHide: "Hide password",
      join: "Join",
      legalPre: "By joining you agree to the",
      legalTerms: "Terms",
      legalAnd: "and",
      legalPrivacy: "Privacy Notice",
      errEmailRequired: "Enter your email address to continue.",
      errEmailInvalid: "That email address isn't valid. Check the spelling.",
      errPasswordRequired: "Enter a password to continue.",
      errPasswordShort: "Passwords need at least 8 characters.",
      okSocial: "Opening {provider} — finish in the pop-up window.",
      okEmail: "Check {email} for your one-time code.",
    },
    web3: {
      infoCta: "Click here to learn what you need to know about signing up with Crypto",
      infoHide: "Hide this",
      noticeParagraphs: [
        "When signing up with crypto, central servers are completely bypassed. This mathematically guarantees that no entity can ever access your data. While your privacy is permanently protected at the highest mathematical level, it also means that password resets or account recovery options are impossible.",
        "If you lose your 12-word recovery phrase or wallet key, your notes are lost forever. Neither TxtNote, nor any server, state law, or court order can recover them. By proceeding, it is assumed that you accept absolute privacy with full awareness of this fact.",
      ],
      noticeMotto: "You rely not on us or a server, but entirely on mathematics and AES-256 encryption.",
      walletsLabel: "Popular wallets",
      metamask: "MetaMask",
      trust: "Trust Wallet",
      seedLabel: "12-word key",
      tabGenerate: "Generate new",
      tabImport: "Enter phrase",
      generateCta: "Generate new 12-word key",
      generateBlurb: "Made on your device. Written down by you, nowhere else.",
      regenerate: "Again",
      copy: "Copy",
      copied: "Copied",
      reveal: "Reveal",
      hide: "Hide",
      hiddenNotice: "Reveal it somewhere no camera can see.",
      confirm: "I wrote these 12 words down offline. Nobody can recover them for me.",
      createVault: "Create my vault",
      importHint: "Paste all 12 words into the first box — they'll split themselves.",
      clear: "Clear",
      recover: "Recover my notes",
      errIncomplete: "All 12 boxes need a word. {count} still empty.",
      errLetters: "Seed words use lowercase letters only. Fix box {index}.",
      errConfirm: "Tick the box to confirm you've written your 12 words down.",
      okCopied: "12 words copied. Clear your clipboard when you're done.",
      okVault: "Vault created. Your key never touched a server.",
      okRecover: "Key accepted. Unlocking your notes.",
      okWallet: "Opening {wallet} — approve the signature request.",
    },
    swap: {
      toWeb3Caption: "Prefer wallets and seed phrases?",
      toWeb3: "Join via Crypto methods",
      toWeb2Caption: "Prefer email and social login?",
      toWeb2: "Join via Traditional methods",
    },
    legal: {
      close: "Close",
      termsTitle: "Terms of Service",
      termsBody:
        "TxtNote is a decentralized tool. Notes are encrypted locally via AES-256 before leaving your device. You hold your own keys. Losing your seed phrase or password means losing access forever—no admin or recovery mechanism exists.",
      privacyTitle: "Privacy Notice",
      privacyRelayTitle: "Zero-Knowledge Relay",
      privacyRelayBody:
        "Your notes may pass through our servers during multi-device synchronization; however, all data is encrypted locally via AES-256 before leaving your device. Since we do not hold your decryption keys, we can never read or access your content. Our servers act merely as a blind relay.",
      privacyStorageTitle: "Web Browser Storage",
      privacyStorageBody:
        "If you use TxtNote via a web browser without downloading the desktop client, your notes are stored locally inside your browser's IndexedDB encryption vault. Unencrypted notes are NEVER stored on our web servers.",
      footerLink: "Read full legal terms →",
    },
    test: {
      bypass: "Skip to notes (test)",
      bypassHint: "Temporary test shortcut — skip sign-in",
    },
  },

  tr: {
    brand: {
      slogan: "Gizliliğe kolay ulaşım herkesin hakkıdır ve TxtNote bunu misyon edinmiştir.",
    },
    nav: {
      toLight: "Açık temaya geç",
      toDark: "Koyu temaya geç",
      language: "Dil",
    },
    web2: {
      socialAria: "{provider} ile devam et",
      google: "Google",
      x: "X",
      apple: "Apple",
      github: "GitHub",
      discord: "Discord",
      orEmail: "veya e-posta ve şifre",
      emailLabel: "E-posta adresi",
      emailPlaceholder: "sen@ornek.com",
      passwordLabel: "Şifre",
      passwordPlaceholder: "En az 8 karakter",
      passwordShow: "Şifreyi göster",
      passwordHide: "Şifreyi gizle",
      join: "Katıl",
      legalPre: "Katılarak",
      legalTerms: "Kullanım Koşulları",
      legalAnd: "ve",
      legalPrivacy: "Gizlilik Bildirimi",
      errEmailRequired: "Devam etmek için e-posta adresini gir.",
      errEmailInvalid: "Bu e-posta adresi geçerli değil. Yazımını kontrol et.",
      errPasswordRequired: "Devam etmek için bir şifre gir.",
      errPasswordShort: "Şifre en az 8 karakter olmalı.",
      okSocial: "{provider} açılıyor — işlemi açılan pencerede tamamla.",
      okEmail: "Tek kullanımlık kodun için {email} adresine bak.",
    },
    web3: {
      infoCta: "Kripto ile kayıt olurken bilmen gerekenleri öğrenmek için buraya tıkla",
      infoHide: "Gizle",
      noticeParagraphs: [
        "Kripto ile kayıt olurken merkezi sunucular tamamen devre dışı kalır. Bu, matematiksel olarak hiçbir gücün verilerinize asla erişemeyeceği anlamına gelir. Gizliliğiniz üst düzeyde ve sonsuza dek korunurken, bu durum şifre sıfırlama veya hesap kurtarma seçeneklerinin de imkansız olması demektir.",
        "12 kelimelik kurtarma ifadenizi ya da cüzdan anahtarınızı kaybederseniz notlarınız sonsuza dek kaybolur. Bunu ne TxtNote, ne bir sunucu, ne herhangi bir devlet yasası ne de bir mahkeme kararı geri getirebilir. Bunun bilincinde olarak mutlak mahremiyeti kabul ettiğiniz varsayılmıştır.",
      ],
      noticeMotto: "Bize ya da bir sunucuya değil; tamamen matematiğe ve AES-256 şifrelemesine emanetsiniz.",
      walletsLabel: "Popüler cüzdanlar",
      metamask: "MetaMask",
      trust: "Trust Wallet",
      seedLabel: "12 kelimelik anahtar",
      tabGenerate: "Yeni oluştur",
      tabImport: "Anahtarı kendin yaz",
      generateCta: "Yeni 12 kelimelik anahtar oluştur",
      generateBlurb: "Cihazında üretildi. Yalnızca senin yazdığın yerde durur.",
      regenerate: "Yenile",
      copy: "Kopyala",
      copied: "Kopyalandı",
      reveal: "Göster",
      hide: "Gizle",
      hiddenNotice: "Kameraların görmediği bir yerde göster.",
      confirm: "Bu 12 kelimeyi çevrimdışı yazdım. Kimse benim için kurtaramaz.",
      createVault: "Kasamı oluştur",
      importHint: "12 kelimenin tamamını ilk kutuya yapıştır — kendiliğinden dağılır.",
      clear: "Temizle",
      recover: "Notlarımı kurtar",
      errIncomplete: "12 kutunun hepsi dolmalı. {count} kutu hâlâ boş.",
      errLetters: "Kurtarma kelimeleri yalnızca küçük harf içerir. {index}. kutuyu düzelt.",
      errConfirm: "12 kelimeni yazdığını onaylamak için kutuyu işaretle.",
      okCopied: "12 kelime kopyalandı. İşin bitince panoyu temizle.",
      okVault: "Kasa oluşturuldu. Anahtarın hiçbir sunucuya değmedi.",
      okRecover: "Anahtar kabul edildi. Notların açılıyor.",
      okWallet: "{wallet} açılıyor — imza isteğini onayla.",
    },
    swap: {
      toWeb3Caption: "Cüzdan ve kurtarma ifadesini mi tercih edersin?",
      toWeb3: "Kripto yöntemleriyle katıl",
      toWeb2Caption: "E-posta ve sosyal girişi mi tercih edersin?",
      toWeb2: "Geleneksel yöntemlerle katıl",
    },
    legal: {
      close: "Kapat",
      termsTitle: "Kullanım Koşulları",
      termsBody:
        "TxtNote merkezi olmayan bir araçtır. Notlarınız cihazınızdan çıkmadan önce yerel olarak AES-256 ile şifrelenir. Anahtarlarınızın sahibi yalnızca sizsiniz. Kurtarma ifadenizi veya şifrenizi kaybetmeniz, erişiminizi sonsuza dek kaybetmeniz anlamına gelir — hiçbir yönetici veya kurtarma mekanizması bulunmamaktadır.",
      privacyTitle: "Gizlilik Bildirimi",
      privacyRelayTitle: "Sıfır Bilgi Aktarımı",
      privacyRelayBody:
        "Notlarınız, çoklu cihaz senkronizasyonu sırasında sunucularımızdan geçebilir; ancak tüm veriler cihazınızdan çıkmadan önce yerel olarak AES-256 ile şifrelenir. Şifre çözme anahtarlarınızı elimizde bulundurmadığımız için içeriğinize asla erişemez veya onu okuyamayız. Sunucularımız yalnızca kör bir aktarıcı görevi görür.",
      privacyStorageTitle: "Web Tarayıcısı Depolaması",
      privacyStorageBody:
        "TxtNote'u masaüstü istemcisini indirmeden bir web tarayıcısı üzerinden kullanıyorsanız notlarınız tarayıcınızın IndexedDB şifreli kasasında yerel olarak saklanır. Şifrelenmemiş notlar web sunucularımızda ASLA saklanmaz.",
      footerLink: "Tam hukuki metni okuyun →",
    },
    test: {
      bypass: "Notlara geç (test)",
      bypassHint: "Geçici test kısayolu — kaydı atla",
    },
  },

  es: {
    brand: {
      slogan: "El acceso fácil a la privacidad es un derecho de todos, y TxtNote tiene como misión ofrecerlo.",
    },
    nav: {
      toLight: "Cambiar a claro",
      toDark: "Cambiar a oscuro",
      language: "Idioma",
    },
    web2: {
      socialAria: "Continuar con {provider}",
      google: "Google",
      x: "X",
      apple: "Apple",
      github: "GitHub",
      discord: "Discord",
      orEmail: "o usa correo y contraseña",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@ejemplo.com",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "Mínimo 8 caracteres",
      passwordShow: "Mostrar contraseña",
      passwordHide: "Ocultar contraseña",
      join: "Únete",
      legalPre: "Al unirte aceptas los",
      legalTerms: "Términos",
      legalAnd: "y el",
      legalPrivacy: "Aviso de privacidad",
      errEmailRequired: "Escribe tu correo para continuar.",
      errEmailInvalid: "Ese correo no es válido. Revisa cómo está escrito.",
      errPasswordRequired: "Escribe una contraseña para continuar.",
      errPasswordShort: "La contraseña necesita al menos 8 caracteres.",
      okSocial: "Abriendo {provider}: termina en la ventana emergente.",
      okEmail: "Revisa {email} para encontrar tu código de un solo uso.",
    },
    web3: {
      infoCta: "Haz clic aquí para saber lo que necesitas antes de registrarte con cripto",
      infoHide: "Ocultar",
      noticeParagraphs: [
        "Al registrarse con cripto, los servidores centrales quedan completamente desactivados. Esto garantiza matemáticamente que ninguna entidad podrá acceder jamás a sus datos. Si bien su privacidad queda protegida permanentemente al más alto nivel matemático, esto también significa que las opciones de restablecimiento de contraseña o recuperación de cuenta son imposibles.",
        "Si pierde su frase de recuperación de 12 palabras o la clave de su billetera, sus notas se perderán para siempre. Ni TxtNote, ni ningún servidor, ley estatal o resolución judicial pueden recuperarlas. Al continuar, se asume que acepta la privacidad absoluta siendo totalmente consciente de este hecho.",
      ],
      noticeMotto: "No depende de nosotros ni de un servidor, sino enteramente de las matemáticas y del cifrado AES-256.",
      walletsLabel: "Billeteras populares",
      metamask: "MetaMask",
      trust: "Trust Wallet",
      seedLabel: "Clave de 12 palabras",
      tabGenerate: "Generar nueva",
      tabImport: "Ingresar clave",
      generateCta: "Generar nueva clave de 12 palabras",
      generateBlurb: "Creada en tu dispositivo. Anotada por ti y en ningún otro lugar.",
      regenerate: "Otra vez",
      copy: "Copiar",
      copied: "Copiado",
      reveal: "Mostrar",
      hide: "Ocultar",
      hiddenNotice: "Muéstrala donde ninguna cámara alcance.",
      confirm: "Anoté estas 12 palabras sin conexión. Nadie puede recuperarlas por mí.",
      createVault: "Crear mi bóveda",
      importHint: "Pega las 12 palabras en la primera casilla: se reparten solas.",
      clear: "Borrar",
      recover: "Recuperar mis notas",
      errIncomplete: "Las 12 casillas necesitan una palabra. Faltan {count}.",
      errLetters: "Las palabras semilla solo usan minúsculas. Corrige la casilla {index}.",
      errConfirm: "Marca la casilla para confirmar que anotaste tus 12 palabras.",
      okCopied: "12 palabras copiadas. Limpia el portapapeles al terminar.",
      okVault: "Bóveda creada. Tu clave nunca tocó un servidor.",
      okRecover: "Clave aceptada. Desbloqueando tus notas.",
      okWallet: "Abriendo {wallet}: aprueba la solicitud de firma.",
    },
    swap: {
      toWeb3Caption: "¿Prefieres billeteras y frases semilla?",
      toWeb3: "Únete con métodos cripto",
      toWeb2Caption: "¿Prefieres correo e inicio de sesión social?",
      toWeb2: "Únete con métodos tradicionales",
    },
    legal: {
      close: "Cerrar",
      termsTitle: "Términos del servicio",
      termsBody:
        "TxtNote es una herramienta descentralizada. Las notas se cifran localmente mediante AES-256 antes de salir de su dispositivo. Usted conserva sus propias claves. Perder su frase semilla o contraseña significa perder el acceso para siempre: no existe ningún mecanismo de administrador ni de recuperación.",
      privacyTitle: "Aviso de privacidad",
      privacyRelayTitle: "Relé de conocimiento cero",
      privacyRelayBody:
        "Sus notas pueden pasar por nuestros servidores durante la sincronización entre varios dispositivos; sin embargo, todos los datos se cifran localmente mediante AES-256 antes de salir de su dispositivo. Como no poseemos sus claves de descifrado, nunca podemos leer ni acceder a su contenido. Nuestros servidores actúan simplemente como un relé ciego.",
      privacyStorageTitle: "Almacenamiento en el navegador web",
      privacyStorageBody:
        "Si utiliza TxtNote a través de un navegador web sin descargar el cliente de escritorio, sus notas se almacenan localmente dentro de la bóveda cifrada IndexedDB de su navegador. Las notas sin cifrar NUNCA se almacenan en nuestros servidores web.",
      footerLink: "Leer términos legales completos →",
    },
    test: {
      bypass: "Ir a las notas (prueba)",
      bypassHint: "Atajo temporal de prueba — omitir el registro",
    },
  },
} as const;

/** NOTE: named `Dict` (not `Copy`) so it can't collide with the lucide `Copy` icon import. */
type Dict = (typeof DICT)["en"];

/** Tiny interpolation helper: fill("Hi {name}", { name: "Ada" }) */
function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

const MIN_PASSWORD_LENGTH = 8;

/* ==========================================================================================
 * 3. MOCK BIP-39 WORD POOL
 *    A 128-word slice of the real English BIP-39 list — enough for a convincing demo.
 *    TODO: BACKEND INTEGRATION (Privy / Web3Auth / WalletConnect)
 *          Replace with a real BIP-39 implementation (`@scure/bip39` + `wordlists/english`)
 *          so the phrase carries a valid checksum. Never generate mnemonics on a server.
 * ========================================================================================== */

const WORD_POOL = [
  "abandon", "ability", "absent", "absorb", "abstract", "access", "accident", "account",
  "acoustic", "across", "action", "actor", "adapt", "addict", "address", "advance",
  "aerobic", "afford", "again", "agent", "agree", "ahead", "alarm", "album",
  "alien", "alley", "almost", "alpha", "amber", "amount", "anchor", "ancient",
  "angle", "animal", "ankle", "answer", "antenna", "anxiety", "apple", "april",
  "arctic", "armor", "arrive", "arrow", "artist", "aspect", "assist", "atom",
  "auction", "august", "aunt", "author", "autumn", "avocado", "awake", "aware",
  "balance", "balcony", "bamboo", "banner", "barely", "basket", "battle", "beacon",
  "beauty", "before", "behind", "believe", "bench", "beyond", "bicycle", "binary",
  "biology", "birth", "bitter", "blanket", "blossom", "border", "bottom", "boulder",
  "bracket", "brave", "breeze", "bridge", "bright", "bronze", "bubble", "bundle",
  "cabin", "cactus", "camera", "candle", "canvas", "canyon", "capital", "carbon",
  "castle", "casual", "cattle", "caution", "cement", "census", "cereal", "certain",
  "chapter", "charge", "cherry", "chimney", "circle", "citizen", "clarify", "clever",
  "climate", "cluster", "coconut", "collect", "column", "combine", "comfort", "compass",
  "concert", "conduct", "copper", "coral", "corner", "cotton", "coyote", "crystal",
] as const;

/** Cryptographically-random pick, with a graceful fallback for non-secure contexts. */
function generateMnemonic(length = 12): string[] {
  const buf = new Uint32Array(length);
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(buf);
  } else {
    for (let i = 0; i < length; i += 1) buf[i] = Math.floor(Math.random() * 0xffffffff);
  }
  return Array.from(buf, (n) => WORD_POOL[n % WORD_POOL.length]);
}

/* ==========================================================================================
 * 4. BASE CSS + GOOGLE FONTS (injected at runtime so the file is fully self-contained)
 * ========================================================================================== */

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap";

/** Applied inline on .tx-root so theme tokens never desync from the shell background. */
const LIGHT_TX = {
  ["--tx-bg"]: "#e5e7eb",
  ["--tx-bg-glow"]: "#d1d5db",
  ["--tx-surface"]: "#ffffff",
  ["--tx-surface-2"]: "#f3f4f6",
  ["--tx-fg"]: "#0a0a0a",
  ["--tx-fg-soft"]: "#262626",
  ["--tx-muted"]: "#525252",
  ["--tx-border"]: "#d4d4d4",
  ["--tx-border-strong"]: "#a3a3a3",
  ["--tx-hover"]: "#f5f5f5",
  ["--tx-inverse-bg"]: "#0a0a0a",
  ["--tx-inverse-fg"]: "#ffffff",
  ["--tx-dot"]: "rgba(10, 10, 10, 0.2)",
  ["--tx-sheen"]: "rgba(255, 255, 255, 0.22)",
  ["--tx-shadow"]: "0 1px 2px rgba(10,10,10,.06), 0 24px 64px -36px rgba(10,10,10,.4)",
} as const;

const DARK_TX = {
  ["--tx-bg"]: "#0a0a0a",
  ["--tx-bg-glow"]: "#1a1a1a",
  ["--tx-surface"]: "#171717",
  ["--tx-surface-2"]: "#262626",
  ["--tx-fg"]: "#fafafa",
  ["--tx-fg-soft"]: "#e5e5e5",
  ["--tx-muted"]: "#a3a3a3",
  ["--tx-border"]: "#404040",
  ["--tx-border-strong"]: "#525252",
  ["--tx-hover"]: "#262626",
  ["--tx-inverse-bg"]: "#fafafa",
  ["--tx-inverse-fg"]: "#0a0a0a",
  ["--tx-dot"]: "rgba(255, 255, 255, 0.16)",
  ["--tx-sheen"]: "rgba(0, 0, 0, 0.14)",
  ["--tx-shadow"]: "0 1px 2px rgba(0,0,0,.55), 0 24px 64px -36px rgba(0,0,0,.85)",
} as const;

const BASE_CSS = `
/* Fallback only — live tokens come from LIGHT_TX / DARK_TX on .tx-root. */
[data-tx-theme="light"] {
  --tx-bg:            #e5e7eb;
  --tx-bg-glow:       #d1d5db;
  --tx-surface:       #ffffff;
  --tx-surface-2:     #f3f4f6;
  --tx-fg:            #0a0a0a;
  --tx-fg-soft:       #262626;
  --tx-muted:         #525252;
  --tx-border:        #d4d4d4;
  --tx-border-strong: #a3a3a3;
  --tx-hover:         #f5f5f5;
  --tx-inverse-bg:    #0a0a0a;
  --tx-inverse-fg:    #ffffff;
  --tx-dot:           rgba(10, 10, 10, 0.2);
  --tx-sheen:         rgba(255, 255, 255, 0.22);
  --tx-shadow:        0 1px 2px rgba(10,10,10,.06), 0 24px 64px -36px rgba(10,10,10,.4);
}

[data-tx-theme="dark"] {
  --tx-bg:            #0a0a0a;
  --tx-bg-glow:       #1a1a1a;
  --tx-surface:       #171717;
  --tx-surface-2:     #262626;
  --tx-fg:            #fafafa;
  --tx-fg-soft:       #e5e5e5;
  --tx-muted:         #a3a3a3;
  --tx-border:        #404040;
  --tx-border-strong: #525252;
  --tx-hover:         #262626;
  --tx-inverse-bg:    #fafafa;
  --tx-inverse-fg:    #0a0a0a;
  --tx-dot:           rgba(255, 255, 255, 0.16);
  --tx-sheen:         rgba(0, 0, 0, 0.14);
  --tx-shadow:        0 1px 2px rgba(0,0,0,.55), 0 24px 64px -36px rgba(0,0,0,.85);
}

html[data-tx-theme="light"] { color-scheme: light; background: #e5e7eb !important; }
html[data-tx-theme="dark"]  { color-scheme: dark;  background: #0a0a0a !important; }

.tx-root {
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-feature-settings: "cv02", "cv03", "cv04", "ss01";
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.tx-display {
  font-family: "Bricolage Grotesque", "Inter", ui-sans-serif, system-ui, sans-serif;
  font-optical-sizing: auto;
  letter-spacing: -0.03em;
}
.tx-wordmark {
  display: block;
  width: min(220px, 64vw);
  height: auto;
  max-height: 64px;
  object-fit: contain;
  border-radius: 8px;
}
[data-tx-theme="light"] .tx-wordmark {
  filter: invert(1);
}
.tx-mono {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  font-variant-ligatures: none;
}

.tx-tint {
  transition-property: background-color, border-color, color, fill, box-shadow;
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(.4, 0, .2, 1);
}

.tx-atmosphere {
  background:
    radial-gradient(ellipse 80% 55% at 50% -10%, var(--tx-bg-glow) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 100% 100%, var(--tx-bg-glow) 0%, transparent 55%),
    radial-gradient(ellipse 45% 35% at 0% 80%, var(--tx-bg-glow) 0%, transparent 50%);
}

.tx-field {
  background-image: radial-gradient(var(--tx-dot) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: -1px -1px;
  -webkit-mask-image: radial-gradient(ellipse 72% 60% at 50% 42%, #000 8%, transparent 78%);
  mask-image: radial-gradient(ellipse 72% 60% at 50% 42%, #000 8%, transparent 78%);
}

@keyframes tx-rise   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes tx-in     { from { opacity: 0; transform: translateY(4px) scale(.985); } to { opacity: 1; transform: none; } }
@keyframes tx-toast  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes tx-fade   { from { opacity: 0; } to { opacity: 1; } }
@keyframes tx-modal  { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }

.tx-rise   { animation: tx-rise .5s cubic-bezier(.16,1,.3,1) both; }
.tx-in     { animation: tx-in .3s cubic-bezier(.16,1,.3,1) both; }
.tx-toast  { animation: tx-toast .28s cubic-bezier(.16,1,.3,1) both; }
.tx-fade   { animation: tx-fade .25s ease both; }
.tx-modal  { animation: tx-modal .32s cubic-bezier(.16,1,.3,1) both; }

.tx-root input::selection,
.tx-root textarea::selection { background: var(--tx-fg); color: var(--tx-bg); }
.tx-root input::placeholder { color: var(--tx-muted); opacity: 1; }
.tx-root input:-webkit-autofill,
.tx-root input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--tx-fg);
  box-shadow: 0 0 0 1000px var(--tx-surface) inset;
  caret-color: var(--tx-fg);
}

.tx-redacted { filter: blur(6px); user-select: none; pointer-events: none; opacity: .85; }
.tx-plate    { transition: filter .32s cubic-bezier(.16,1,.3,1), opacity .32s ease; }

@media (prefers-reduced-motion: reduce) {
  .tx-rise, .tx-in, .tx-toast, .tx-fade, .tx-modal { animation: none !important; }
  .tx-root *, .tx-root *::before, .tx-root *::after {
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
  }
}
`;

/* ==========================================================================================
 * 5. BRAND GLYPHS  (monochrome, currentColor, no external assets)
 *    All five share a 24×24 viewBox and are optically sized so they read at the same weight.
 * ========================================================================================== */

type GlyphProps = { className?: string };

const GoogleGlyph = ({ className = "h-[17px] w-[17px]" }: GlyphProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);

/**
 * X (formerly Twitter). Rebuilt from the official mark — a single closed path with an
 * even-odd fill so the two counters inside the strokes punch out correctly at any size.
 */
/**
 * X (formerly Twitter). Rendered as the bold mathematical double-struck "𝕏" glyph rather
 * than an SVG path — this renders identically in every browser and can never come out
 * blank the way a malformed path can.
 */
const XGlyph = ({ className = "text-base font-bold" }: GlyphProps) => (
  <span aria-hidden="true" className={`select-none leading-none text-[var(--tx-fg)] ${className}`}>
    𝕏
  </span>
);

const AppleGlyph = ({ className = "h-[17px] w-[17px]" }: GlyphProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
  </svg>
);

const GithubGlyph = ({ className = "h-[17px] w-[17px]" }: GlyphProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3-.405c1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z" />
  </svg>
);

const DiscordGlyph = ({ className = "h-[18px] w-[18px]" }: GlyphProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.618-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.128c-.598.349-1.22.65-1.873.891a.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.661a.06.06 0 0 0-.031-.029zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

/* ==========================================================================================
 * 6. SHARED CLASS TOKENS
 * ========================================================================================== */

const FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-neutral-100 dark:focus-visible:ring-offset-neutral-900";

const BTN_QUIET =
  `group inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white text-neutral-900 transition-colors duration-200 hover:bg-neutral-100 hover:border-neutral-400 disabled:opacity-40 disabled:pointer-events-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800 dark:hover:border-neutral-500 ${FOCUS}`;

const BTN_SOLID =
  `group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-neutral-700 active:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white ${FOCUS}`;

const LABEL_MONO =
  "tx-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-700 dark:text-neutral-300";

const SECTION_LABEL =
  "tx-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400";

const FIELD_SHELL =
  "mt-2 flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-3 focus-within:border-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:focus-within:border-neutral-100";

const RuleLabel = ({ children, className = "my-4" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <span className="h-px flex-1 bg-neutral-300 dark:bg-neutral-600" />
    <span className={`${SECTION_LABEL} shrink-0 text-center`}>{children}</span>
    <span className="h-px flex-1 bg-neutral-300 dark:bg-neutral-600" />
  </div>
);

/* ==========================================================================================
 * 6b. LEGAL MODAL — Terms of Service / Privacy Notice
 *     Frosted-glass overlay, centered scale/fade card, closes on backdrop click, the X
 *     button, or Escape (wired in the page component below).
 * ========================================================================================== */

type LegalSection = { heading?: string; text: string };

const LegalModal = ({
  title,
  sections,
  footerLabel,
  closeLabel,
  onClose,
}: {
  title: string;
  sections: LegalSection[];
  footerLabel: string;
  closeLabel: string;
  onClose: () => void;
}) => (
  <div
    className="tx-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-md dark:bg-zinc-900/40"
    onClick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
      className="tx-modal tx-tint relative w-full max-w-sm rounded-3xl border border-[var(--tx-border)] bg-[var(--tx-surface)] p-6 shadow-[var(--tx-shadow)]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        title={closeLabel}
        className={`absolute right-4 top-4 rounded-lg p-1.5 text-[var(--tx-muted)] transition-colors duration-200 hover:bg-[var(--tx-hover)] hover:text-[var(--tx-fg)] ${FOCUS}`}
      >
        <XIcon className="h-4 w-4" />
      </button>

      <h2 className="tx-display pr-8 text-lg font-bold leading-snug tracking-[-0.02em] text-[var(--tx-fg)]">
        {title}
      </h2>

      <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {sections.map((section, i) => (
          <div key={i}>
            {section.heading && (
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {section.heading}
              </h3>
            )}
            <p className="text-sm leading-relaxed text-[var(--tx-fg-soft)]">{section.text}</p>
          </div>
        ))}
      </div>

      <a
        href="#"
        className={`tx-tint mt-5 inline-block border-t border-[var(--tx-border)] pt-4 text-sm font-medium text-[var(--tx-muted)] underline underline-offset-2 hover:text-[var(--tx-fg)] ${FOCUS}`}
      >
        {footerLabel}
      </a>
    </div>
  </div>
);

/* ==========================================================================================
 * 7. PAGE
 * ========================================================================================== */

type AuthSuccess = {
  method: string;
  email?: string;
  displayName?: string;
  bypass?: boolean;
};

export default function TxtNoteAuthPage({
  onAuthenticated,
}: {
  onAuthenticated?: (session: AuthSuccess) => void;
}) {
  /* ---------------------------------- global chrome ---------------------------------- */
  // Always start light — OS dark was pairing pale text with a white WebView shell.
  const [theme, setTheme] = useState<Theme>("light");
  const [lang, setLang] = useState<Lang>("tr");
  const [mode, setMode] = useState<Mode>("web2");
  const [langOpen, setLangOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: ToastTone } | null>(null);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);

  const t: Dict = DICT[lang] as unknown as Dict;
  const langRef = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------------ web2 state ----------------------------------- */
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  /* ------------------------------------ web3 state ----------------------------------- */
  const [infoOpen, setInfoOpen] = useState(false);
  const [seedTab, setSeedTab] = useState<SeedTab>("generate");
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [backedUp, setBackedUp] = useState(false);
  const [importWords, setImportWords] = useState<string[]>(() => Array(12).fill(""));
  const [seedError, setSeedError] = useState<string | null>(null);

  /* ----------------------- one-time asset injection (fonts + css) --------------------- */
  useEffect(() => {
    const nodes: HTMLElement[] = [];
    const addOnce = (id: string, build: () => HTMLElement) => {
      if (document.getElementById(id)) return;
      const el = build();
      el.id = id;
      document.head.appendChild(el);
      nodes.push(el);
    };

    addOnce("tx-gf-pre-1", () => {
      const l = document.createElement("link");
      l.rel = "preconnect";
      l.href = "https://fonts.googleapis.com";
      return l;
    });
    addOnce("tx-gf-pre-2", () => {
      const l = document.createElement("link");
      l.rel = "preconnect";
      l.href = "https://fonts.gstatic.com";
      l.crossOrigin = "anonymous";
      return l;
    });
    addOnce("tx-gf-css", () => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = FONT_HREF;
      return l;
    });

    if (ENABLE_TAILWIND_CDN_FOR_PREVIEW) {
      addOnce("tx-tw-cdn", () => {
        const s = document.createElement("script");
        s.src = "https://cdn.tailwindcss.com";
        return s;
      });
    }

    return () => {
      nodes.forEach((n) => n.remove());
      document.documentElement.removeAttribute("data-tx-theme");
    };
  }, []);

  /* --------------------------- reflect theme on <html> ------------------------------- */
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-tx-theme", theme);
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
    return () => {
      root.removeAttribute("data-tx-theme");
      root.classList.remove("dark");
      root.style.colorScheme = "";
    };
  }, [theme]);

  /* OS preference no longer auto-switches — it left dark text on a white shell in Tauri. */

  /* -------------------------- close the language menu on outside click ---------------- */
  useEffect(() => {
    if (!langOpen) return;
    const onDown = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLangOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [langOpen]);

  /* ------------------------ legal modal: escape-to-close + scroll lock --------------- */
  useEffect(() => {
    if (!legalModal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLegalModal(null);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [legalModal]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const say = useCallback((text: string, tone: ToastTone = "neutral") => {
    setToast({ text, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const completeAuth = useCallback(
    (session: AuthSuccess) => {
      onAuthenticated?.(session);
    },
    [onAuthenticated],
  );

  /* --------------------------------- derived values ---------------------------------- */
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim()), [email]);
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH;
  const filledCount = useMemo(() => importWords.filter((w) => w.trim().length > 0).length, [importWords]);

  /* ==========================================================================
   * WEB2 ACTIONS
   * TODO: BACKEND INTEGRATION (Privy / Web3Auth / WalletConnect)
   *   const { login } = usePrivy();
   *   Social   -> login({ loginMethods: ["google" | "twitter" | "apple" | "github" | "discord"] })
   *   Password -> your own credential endpoint, or swap for Privy's email OTP flow.
   *   Privy's `login` already unifies signup + signin — keep the single "Join" CTA.
   * ========================================================================== */

  const handleSocial = (providerKey: SocialKey) => {
    setBusy(providerKey);
    // TODO: BACKEND INTEGRATION (Privy / Web3Auth / WalletConnect) — replace the timer.
    setTimeout(() => {
      setBusy(null);
      completeAuth({ method: providerKey, displayName: t.web2[providerKey] });
    }, 850);
  };

  const handleJoin = () => {
    const value = email.trim();

    if (!value) {
      setEmailError(t.web2.errEmailRequired);
      return;
    }
    if (!emailValid) {
      setEmailError(t.web2.errEmailInvalid);
      return;
    }
    setEmailError(null);

    if (!password) {
      setPasswordError(t.web2.errPasswordRequired);
      return;
    }
    if (!passwordValid) {
      setPasswordError(t.web2.errPasswordShort);
      return;
    }
    setPasswordError(null);

    setBusy("email");
    // TODO: BACKEND INTEGRATION (Privy / Web3Auth / WalletConnect) — create the account here.
    setTimeout(() => {
      setBusy(null);
      completeAuth({
        method: "email",
        email: value,
        displayName: value.split("@")[0] || value,
      });
    }, 900);
  };

  /* ==========================================================================
   * WEB3 ACTIONS
   * TODO: BACKEND INTEGRATION (Privy / Web3Auth / WalletConnect)
   *   Wallets -> wagmi `useConnect` with the injected + WalletConnect connectors,
   *              then SIWE (EIP-4361) for the session.
   *   Seed    -> derive the vault key with @scure/bip39 + PBKDF2/Argon2id and keep it
   *              in memory only. The phrase must never be transmitted or logged.
   * ========================================================================== */

  const handleWallet = (walletKey: WalletKey) => {
    setBusy(walletKey);
    // TODO: BACKEND INTEGRATION (Privy / Web3Auth / WalletConnect) — connect + sign here.
    setTimeout(() => {
      setBusy(null);
      completeAuth({ method: walletKey, displayName: t.web3[walletKey] });
    }, 850);
  };

  const handleGenerate = useCallback(() => {
    setMnemonic(generateMnemonic(12));
    setRevealed(false);
    setCopied(false);
    setBackedUp(false);
    setSeedError(null);
  }, []);

  /**
   * Tab switch. Picking "Generate new" now mints a phrase immediately instead of
   * landing on an empty panel — the tab itself is the action.
   */
  const handleSeedTab = (next: SeedTab) => {
    setSeedTab(next);
    setSeedError(null);
    if (next === "generate" && mnemonic.length === 0) handleGenerate();
  };

  const handleCopy = async () => {
    const phrase = mnemonic.join(" ");
    try {
      await navigator.clipboard.writeText(phrase);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = phrase;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    say(t.web3.okCopied);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCreateVault = () => {
    if (!backedUp) {
      setSeedError(t.web3.errConfirm);
      return;
    }
    setSeedError(null);
    setBusy("vault");
    // TODO: BACKEND INTEGRATION (Privy / Web3Auth / WalletConnect) — derive keys locally.
    setTimeout(() => {
      setBusy(null);
      completeAuth({ method: "vault" });
    }, 900);
  };

  const handleSeedInput = (index: number, raw: string) => {
    const clean = raw.toLowerCase().replace(/[^a-z]/g, "");
    setImportWords((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (seedError) setSeedError(null);
  };

  const handleSeedPaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const words = e.clipboardData
      .getData("text")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z]/g, ""))
      .filter(Boolean);
    if (words.length < 2) return;
    e.preventDefault();
    const start = words.length >= 12 ? 0 : index;
    setImportWords((prev) => {
      const next = [...prev];
      for (let i = 0; i < words.length && start + i < 12; i += 1) next[start + i] = words[i];
      return next;
    });
    setSeedError(null);
  };

  const handleRecover = () => {
    const empty = importWords.filter((w) => !w.trim()).length;
    if (empty > 0) {
      setSeedError(fill(t.web3.errIncomplete, { count: empty }));
      return;
    }
    const badIndex = importWords.findIndex((w) => !/^[a-z]{3,}$/.test(w));
    if (badIndex !== -1) {
      setSeedError(fill(t.web3.errLetters, { index: badIndex + 1 }));
      return;
    }
    setSeedError(null);
    setBusy("recover");
    // TODO: BACKEND INTEGRATION (Privy / Web3Auth / WalletConnect) — validate the checksum.
    setTimeout(() => {
      setBusy(null);
      completeAuth({ method: "recover" });
    }, 900);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setEmailError(null);
    setPasswordError(null);
    setSeedError(null);
    setBusy(null);
  };

  /* ------------------------------- render-time config -------------------------------- */
  const SOCIALS: { key: SocialKey; node: React.ReactNode; label: string }[] = [
    { key: "google", node: <GoogleGlyph />, label: t.web2.google },
    { key: "x", node: <XGlyph />, label: t.web2.x },
    { key: "apple", node: <AppleGlyph />, label: t.web2.apple },
    { key: "github", node: <GithubGlyph />, label: t.web2.github },
    { key: "discord", node: <DiscordGlyph />, label: t.web2.discord },
  ];

  const WALLETS: { key: WalletKey; src: string; label: string }[] = [
    { key: "metamask", src: WALLET_LOGOS.metamask, label: t.web3.metamask },
    { key: "trust", src: WALLET_LOGOS.trust, label: t.web3.trust },
  ];

  /* ==========================================================================================
   * RENDER
   * ========================================================================================== */

  return (
    <div
      data-tx-theme={theme}
      className={
        theme === "dark"
          ? "tx-root relative min-h-screen w-full overflow-x-hidden bg-neutral-950 text-neutral-50 antialiased"
          : "tx-root relative min-h-screen w-full overflow-x-hidden bg-neutral-200 text-neutral-900 antialiased"
      }
    >
      <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(0,0,0,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,255,255,0.06),transparent_70%)]" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 sm:px-8">
        <header className="relative flex items-center justify-center py-6">
          <div className="flex max-w-[380px] flex-col items-center text-center">
            <TxtNoteWordmark className="tx-wordmark" />
            <span className="mt-3 max-w-[34ch] text-sm font-medium leading-relaxed text-neutral-600 sm:text-[15px] dark:text-neutral-400">
              {t.brand.slogan}
            </span>
          </div>

          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {/* theme toggle */}
            <button
              type="button"
              onClick={() => setTheme((p) => (p === "light" ? "dark" : "light"))}
              aria-label={theme === "light" ? t.nav.toDark : t.nav.toLight}
              title={theme === "light" ? t.nav.toDark : t.nav.toLight}
              className={`${BTN_QUIET} h-9 w-9`}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* language selector */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen((p) => !p)}
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label={t.nav.language}
                className={`${BTN_QUIET} h-9 gap-1.5 px-2.5`}
              >
                <Globe className="h-[15px] w-[15px]" />
                <span className="tx-mono text-[11.5px] font-medium tracking-[0.08em]">
                  {lang.toUpperCase()}
                </span>
                <ChevronDown
                  className={`h-[13px] w-[13px] text-[var(--tx-muted)] transition-transform duration-200 ${
                    langOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {langOpen && (
                <ul
                  role="listbox"
                  aria-label={t.nav.language}
                  className="tx-in tx-tint absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-2xl border border-[var(--tx-border)] bg-[var(--tx-surface)] p-1.5 shadow-[var(--tx-shadow)]"
                >
                  {LANGS.map((l) => (
                    <li key={l.code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={lang === l.code}
                        onClick={() => {
                          setLang(l.code);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[13px] transition-colors duration-200 hover:bg-[var(--tx-hover)] ${FOCUS} ${
                          lang === l.code ? "text-[var(--tx-fg)]" : "text-[var(--tx-fg-soft)]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="tx-mono text-[10.5px] tracking-[0.1em] text-[var(--tx-muted)]">
                            {l.label}
                          </span>
                          <span>{l.native}</span>
                        </span>
                        {lang === l.code && <Check className="h-[14px] w-[14px]" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </header>

        {/* ==================================================================================
         * MAIN
         * ================================================================================== */}
        <main className="flex flex-1 flex-col items-center justify-center py-6">
          <div className="w-full max-w-[364px]">
            {/* ------------------------------ AUTH CARD ------------------------------ */}
            <section
              key={mode}
              className="tx-rise rounded-3xl border border-neutral-300 bg-white p-5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40"
            >
              {mode === "web2" ? (
                /* ==================================================================
                 * MODE 1 — WEB2 / TRADITIONAL
                 * ================================================================== */
                <div className="tx-in">
                  {/* social pills — icon only, five across */}
                  <div className="flex items-center justify-center gap-2.5">
                    {SOCIALS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handleSocial(p.key)}
                        disabled={busy !== null}
                        aria-label={fill(t.web2.socialAria, { provider: p.label })}
                        title={p.label}
                        className={`${BTN_QUIET} h-11 w-11 shrink-0 rounded-full`}
                      >
                        {busy === p.key ? (
                          <Loader2 className="h-[16px] w-[16px] animate-spin" />
                        ) : (
                          <span className="transition-transform duration-200 group-hover:-translate-y-[1px]">
                            {p.node}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* divider */}
                  <RuleLabel>{t.web2.orEmail}</RuleLabel>

                  {/* email */}
                  <label htmlFor="tx-email" className={`${LABEL_MONO} block`}>
                    {t.web2.emailLabel}
                  </label>
                  <div
                    className={`${FIELD_SHELL} ${
                      emailError ? "border-[var(--tx-border-strong)]" : "border-[var(--tx-border)]"
                    }`}
                  >
                    <Mail className="h-[15px] w-[15px] shrink-0 text-neutral-400" />
                    <input
                      id="tx-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      placeholder={t.web2.emailPlaceholder}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? "tx-email-error" : undefined}
                      className="w-full bg-transparent text-base font-normal text-neutral-900 outline-none dark:text-neutral-50"
                    />
                    {email.length > 0 && emailValid && (
                      <Check className="h-[15px] w-[15px] shrink-0 text-[var(--tx-fg)]" />
                    )}
                  </div>

                  {emailError && (
                    <p
                      id="tx-email-error"
                      role="alert"
                      className="tx-in mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-[var(--tx-fg-soft)]"
                    >
                      <AlertCircle className="mt-[1px] h-[13px] w-[13px] shrink-0" />
                      {emailError}
                    </p>
                  )}

                  {/* password */}
                  <label htmlFor="tx-password" className={`${LABEL_MONO} mt-3.5 block`}>
                    {t.web2.passwordLabel}
                  </label>
                  <div
                    className={`${FIELD_SHELL} ${
                      passwordError ? "border-[var(--tx-border-strong)]" : "border-[var(--tx-border)]"
                    }`}
                  >
                    <Lock className="h-[15px] w-[15px] shrink-0 text-neutral-400" />
                    <input
                      id="tx-password"
                      type={passwordVisible ? "text" : "password"}
                      autoComplete="new-password"
                      spellCheck={false}
                      value={password}
                      placeholder={t.web2.passwordPlaceholder}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      aria-invalid={Boolean(passwordError)}
                      aria-describedby={passwordError ? "tx-password-error" : undefined}
                      className="w-full bg-transparent text-base font-normal text-neutral-900 outline-none dark:text-neutral-50"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((p) => !p)}
                      aria-label={passwordVisible ? t.web2.passwordHide : t.web2.passwordShow}
                      title={passwordVisible ? t.web2.passwordHide : t.web2.passwordShow}
                      aria-pressed={passwordVisible}
                      className={`-mr-1 shrink-0 rounded-lg p-1 text-[var(--tx-muted)] transition-colors duration-200 hover:text-[var(--tx-fg)] ${FOCUS}`}
                    >
                      {passwordVisible ? (
                        <EyeOff className="h-[15px] w-[15px]" />
                      ) : (
                        <Eye className="h-[15px] w-[15px]" />
                      )}
                    </button>
                  </div>

                  {passwordError && (
                    <p
                      id="tx-password-error"
                      role="alert"
                      className="tx-in mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-[var(--tx-fg-soft)]"
                    >
                      <AlertCircle className="mt-[1px] h-[13px] w-[13px] shrink-0" />
                      {passwordError}
                    </p>
                  )}

                  {/* unified join — signup + login in one */}
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={busy !== null}
                    className={`${BTN_SOLID} mt-3.5`}
                  >
                    {busy === "email" ? (
                      <Loader2 className="h-[16px] w-[16px] animate-spin" />
                    ) : (
                      <>
                        {t.web2.join}
                        <ArrowRight className="h-[15px] w-[15px] transition-transform duration-200 group-hover:translate-x-[3px]" />
                      </>
                    )}
                  </button>

                  {/* legal — pinned to the very bottom of the card */}
                  <p className="mt-5 border-t border-neutral-200 pt-3 text-center text-[10.5px] leading-relaxed text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                    {t.web2.legalPre}{" "}
                    <button
                      type="button"
                      onClick={() => setLegalModal("terms")}
                      className={`underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 ${FOCUS}`}
                    >
                      {t.web2.legalTerms}
                    </button>{" "}
                    {t.web2.legalAnd}{" "}
                    <button
                      type="button"
                      onClick={() => setLegalModal("privacy")}
                      className={`underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 ${FOCUS}`}
                    >
                      {t.web2.legalPrivacy}
                    </button>
                    .
                  </p>
                </div>
              ) : (
                /* ==================================================================
                 * MODE 2 — WEB3 / CRYPTO
                 * ================================================================== */
                <div className="tx-in">
                  {/* crypto info button — expands the honest transparency notice.
                      TODO: BACKEND INTEGRATION — or route to /learn/crypto-onboarding instead. */}
                  <button
                    type="button"
                    onClick={() => setInfoOpen((p) => !p)}
                    aria-expanded={infoOpen}
                    aria-controls="tx-crypto-notice"
                    className={`${BTN_QUIET} w-full justify-start gap-2.5 px-3.5 py-3 text-left`}
                  >
                    <ShieldAlert className="h-[15px] w-[15px] shrink-0" />
                    <span className="flex-1 text-[12px] font-medium leading-[1.35] text-[var(--tx-fg-soft)]">
                      {infoOpen ? t.web3.infoHide : t.web3.infoCta}
                    </span>
                    <ChevronDown
                      className={`h-[14px] w-[14px] shrink-0 text-[var(--tx-muted)] transition-transform duration-300 ${
                        infoOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* accordion — animates height via grid-template-rows so it always mounts
                      (screen readers see it) but only takes visual space when open. No max-h
                      anywhere in this chain: the grid row sizes to the content's natural
                      height, and the parent card (no fixed height of its own) grows with it. */}
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: infoOpen ? "1fr" : "0fr" }}
                  >
                    {/* overflow-hidden only clips during the 0fr collapsed state so the close
                        animation still works — once open, it flips to visible so wrapped text
                        and the rounded border never get cropped. */}
                    <div className={infoOpen ? "overflow-visible" : "overflow-hidden"}>
                      <div
                        id="tx-crypto-notice"
                        className="tx-tint mt-2.5 space-y-4 rounded-2xl border border-[var(--tx-border-strong)] bg-[var(--tx-surface-2)] p-6"
                      >
                        {t.web3.noticeParagraphs.map((paragraph) => (
                          <p
                            key={paragraph}
                            className="text-sm leading-relaxed text-[var(--tx-fg-soft)]"
                          >
                            {paragraph}
                          </p>
                        ))}
                        <p className="tx-mono tx-tint border-t border-[var(--tx-border)] pt-4 text-sm font-medium leading-relaxed text-[var(--tx-fg)]">
                          {t.web3.noticeMotto}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* --- wallets (centered rule-label, same geometry as the seed header) --- */}
                  <RuleLabel>{t.web3.walletsLabel}</RuleLabel>

                  <div className="flex items-center justify-center gap-3">
                    {WALLETS.map((w) => (
                      <button
                        key={w.key}
                        type="button"
                        onClick={() => handleWallet(w.key)}
                        disabled={busy !== null}
                        aria-label={w.label}
                        title={w.label}
                        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 transition-transform duration-200 hover:scale-105 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-800 ${FOCUS}`}
                      >
                        {busy === w.key ? (
                          <Loader2 className="h-5 w-5 animate-spin text-[var(--tx-muted)]" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.src}
                            alt={w.label}
                            className="h-7 w-7 object-contain"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* --- seed section header --- */}
                  <RuleLabel>{t.web3.seedLabel}</RuleLabel>

                  {/* --- seed tool tabs --- */}
                  <div
                    role="tablist"
                    aria-label={t.web3.seedLabel}
                    className="tx-tint grid grid-cols-2 gap-1 rounded-2xl border border-[var(--tx-border)] bg-[var(--tx-surface-2)] p-1"
                  >
                    {([
                      { key: "generate" as const, label: t.web3.tabGenerate },
                      { key: "import" as const, label: t.web3.tabImport },
                    ]).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={seedTab === tab.key}
                        onClick={() => handleSeedTab(tab.key)}
                        className={`rounded-xl px-2 py-2 text-[12.5px] font-medium transition-colors duration-300 ${FOCUS} ${
                          seedTab === tab.key
                            ? "bg-[var(--tx-inverse-bg)] text-[var(--tx-inverse-fg)]"
                            : "text-[var(--tx-muted)] hover:text-[var(--tx-fg)]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ----------------------- GENERATE ----------------------- */}
                  {seedTab === "generate" && (
                    <div className="tx-in mt-3">
                      {mnemonic.length === 0 ? (
                        <>
                          <button type="button" onClick={handleGenerate} className={BTN_SOLID}>
                            <RefreshCw className="h-[15px] w-[15px] transition-transform duration-300 group-hover:rotate-90" />
                            {t.web3.generateCta}
                          </button>
                          <p className="mt-2.5 text-center text-[11.5px] leading-snug text-[var(--tx-muted)]">
                            {t.web3.generateBlurb}
                          </p>
                        </>
                      ) : (
                        <>
                          {/* ===== the key plate — signature element ===== */}
                          <div className="tx-tint relative overflow-hidden rounded-2xl border border-[var(--tx-border-strong)] bg-[var(--tx-surface-2)] p-2.5">
                            <div
                              className={`tx-plate grid grid-cols-3 gap-1.5 ${revealed ? "" : "tx-redacted"}`}
                            >
                              {mnemonic.map((word, i) => (
                                <div
                                  key={`${word}-${i}`}
                                  className="tx-tint flex items-baseline gap-1.5 rounded-xl border border-[var(--tx-border)] bg-[var(--tx-surface)] px-2 py-1.5"
                                >
                                  <span className="tx-mono w-[13px] shrink-0 text-[9.5px] tabular-nums text-[var(--tx-muted)]">
                                    {String(i + 1).padStart(2, "0")}
                                  </span>
                                  <span className="tx-mono truncate text-[11px] font-medium">{word}</span>
                                </div>
                              ))}
                            </div>

                            {!revealed && (
                              <button
                                type="button"
                                onClick={() => setRevealed(true)}
                                className={`absolute inset-0 grid place-items-center rounded-2xl bg-[var(--tx-surface-2)]/50 backdrop-blur-[2px] ${FOCUS}`}
                              >
                                <span className="tx-tint flex items-center gap-1.5 rounded-full border border-[var(--tx-border-strong)] bg-[var(--tx-surface)] px-3.5 py-1.5 text-[12px] font-medium shadow-[var(--tx-shadow)]">
                                  <Eye className="h-[13px] w-[13px]" />
                                  {t.web3.reveal}
                                </span>
                              </button>
                            )}
                          </div>

                          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-[var(--tx-muted)]">
                            <Lock className="mt-[1px] h-[11px] w-[11px] shrink-0" />
                            {t.web3.hiddenNotice}
                          </p>

                          {/* plate controls */}
                          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRevealed((p) => !p)}
                              className={`${BTN_QUIET} gap-1.5 px-1.5 py-2 text-[11.5px] font-medium`}
                            >
                              {revealed ? <EyeOff className="h-[13px] w-[13px]" /> : <Eye className="h-[13px] w-[13px]" />}
                              {revealed ? t.web3.hide : t.web3.reveal}
                            </button>
                            <button
                              type="button"
                              onClick={handleCopy}
                              className={`${BTN_QUIET} gap-1.5 px-1.5 py-2 text-[11.5px] font-medium`}
                            >
                              {copied ? <Check className="h-[13px] w-[13px]" /> : <Copy className="h-[13px] w-[13px]" />}
                              {copied ? t.web3.copied : t.web3.copy}
                            </button>
                            <button
                              type="button"
                              onClick={handleGenerate}
                              className={`${BTN_QUIET} gap-1.5 px-1.5 py-2 text-[11.5px] font-medium`}
                            >
                              <RefreshCw className="h-[13px] w-[13px]" />
                              {t.web3.regenerate}
                            </button>
                          </div>

                          {/* backup confirmation */}
                          <label className="tx-tint mt-3 flex cursor-pointer items-start gap-2 rounded-2xl border border-[var(--tx-border)] p-3 hover:bg-[var(--tx-hover)]">
                            <input
                              type="checkbox"
                              checked={backedUp}
                              onChange={(e) => {
                                setBackedUp(e.target.checked);
                                if (seedError) setSeedError(null);
                              }}
                              className="sr-only"
                            />
                            <span
                              className={`mt-[1px] grid h-[16px] w-[16px] shrink-0 place-items-center rounded-md border transition-colors duration-200 ${
                                backedUp
                                  ? "border-[var(--tx-inverse-bg)] bg-[var(--tx-inverse-bg)] text-[var(--tx-inverse-fg)]"
                                  : "border-[var(--tx-border-strong)]"
                              }`}
                            >
                              {backedUp && <Check className="h-[11px] w-[11px]" />}
                            </span>
                            <span className="text-[11.5px] leading-[1.45] text-[var(--tx-fg-soft)]">
                              {t.web3.confirm}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={handleCreateVault}
                            disabled={busy !== null}
                            className={`${BTN_SOLID} mt-2.5`}
                          >
                            {busy === "vault" ? (
                              <Loader2 className="h-[16px] w-[16px] animate-spin" />
                            ) : (
                              <>
                                {t.web3.createVault}
                                <ArrowRight className="h-[15px] w-[15px] transition-transform duration-200 group-hover:translate-x-[3px]" />
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* ------------------------ IMPORT ------------------------ */}
                  {seedTab === "import" && (
                    <div className="tx-in mt-3">
                      <div className="grid grid-cols-3 gap-1.5">
                        {importWords.map((word, i) => (
                          <div
                            key={i}
                            className="tx-tint flex items-center gap-1 rounded-xl border border-[var(--tx-border)] bg-[var(--tx-surface-2)] px-2 py-1.5 focus-within:border-[var(--tx-fg)] focus-within:bg-[var(--tx-surface)]"
                          >
                            <span className="tx-mono w-[13px] shrink-0 text-[9.5px] tabular-nums text-[var(--tx-muted)]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <input
                              type="text"
                              value={word}
                              onChange={(e) => handleSeedInput(i, e.target.value)}
                              onPaste={(e) => handleSeedPaste(e, i)}
                              aria-label={`${t.web3.seedLabel} ${i + 1}`}
                              autoComplete="off"
                              autoCapitalize="none"
                              spellCheck={false}
                              className="tx-mono w-full min-w-0 bg-transparent text-[11px] font-medium outline-none"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-2.5 flex items-start justify-between gap-2">
                        <p className="text-[11px] leading-snug text-[var(--tx-muted)]">
                          {t.web3.importHint}
                        </p>
                        {filledCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setImportWords(Array(12).fill(""));
                              setSeedError(null);
                            }}
                            className={`inline-flex shrink-0 items-center gap-1 rounded-lg text-[11px] text-[var(--tx-muted)] transition-colors duration-200 hover:text-[var(--tx-fg)] ${FOCUS}`}
                          >
                            <Trash2 className="h-[11px] w-[11px]" />
                            {t.web3.clear}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleRecover}
                        disabled={busy !== null}
                        className={`${BTN_SOLID} mt-3`}
                      >
                        {busy === "recover" ? (
                          <Loader2 className="h-[16px] w-[16px] animate-spin" />
                        ) : (
                          <>
                            {t.web3.recover}
                            <ArrowRight className="h-[15px] w-[15px] transition-transform duration-200 group-hover:translate-x-[3px]" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {seedError && (
                    <p
                      role="alert"
                      className="tx-in mt-2.5 flex items-start gap-1.5 text-[12px] leading-snug text-[var(--tx-fg-soft)]"
                    >
                      <AlertCircle className="mt-[1px] h-[13px] w-[13px] shrink-0" />
                      {seedError}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* ==========================================================================
             * MODE SWITCH — one merged primary button, outside and below the card
             * ========================================================================== */}
            <button
              type="button"
              onClick={() => switchMode(mode === "web2" ? "web3" : "web2")}
              className={`group relative mt-3.5 w-full overflow-hidden rounded-2xl bg-neutral-900 px-4 py-3 text-white shadow-lg shadow-neutral-900/15 transition-colors duration-200 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white ${FOCUS}`}
            >
              {/* subtle sheen sweep on hover — monochrome, no glow */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-[130%] bg-[linear-gradient(115deg,transparent_38%,var(--tx-sheen)_50%,transparent_62%)] transition-transform duration-700 ease-out group-hover:translate-x-[130%]"
              />
              <span className="relative flex items-center justify-between gap-3">
                {mode === "web3" && (
                  <ArrowLeft className="h-[16px] w-[16px] shrink-0 transition-transform duration-200 group-hover:-translate-x-[3px]" />
                )}
                <span className="flex flex-1 flex-col items-start text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70 dark:text-neutral-900/70">
                    {mode === "web2" ? t.swap.toWeb3Caption : t.swap.toWeb2Caption}
                  </span>
                  <span className="mt-1 text-[13.5px] font-semibold leading-none">
                    {mode === "web2" ? t.swap.toWeb3 : t.swap.toWeb2}
                  </span>
                </span>
                {mode === "web2" && (
                  <ArrowRight className="h-[16px] w-[16px] shrink-0 transition-transform duration-200 group-hover:translate-x-[3px]" />
                )}
              </span>
            </button>

            {/* Temporary test hatch — remove when real auth is wired. */}
            <button
              type="button"
              onClick={() => completeAuth({ method: "bypass", bypass: true, displayName: "Test" })}
              className={`${BTN_QUIET} mt-8 w-full border-dashed py-2.5 text-[11.5px] font-medium text-[var(--tx-muted)]`}
            >
              {t.test.bypass}
            </button>
            <p className="mt-1.5 text-center text-[10.5px] leading-snug text-[var(--tx-muted)]">
              {t.test.bypassHint}
            </p>
          </div>
        </main>
      </div>

      {/* ============================== TOAST ============================== */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="tx-toast tx-tint fixed inset-x-4 bottom-5 z-50 mx-auto flex max-w-[364px] items-start gap-2.5 rounded-2xl border border-[var(--tx-border-strong)] bg-[var(--tx-surface)] px-3.5 py-3 shadow-[var(--tx-shadow)]"
        >
          {toast.tone === "danger" ? (
            <AlertCircle className="mt-[1px] h-[14px] w-[14px] shrink-0" />
          ) : (
            <Check className="mt-[1px] h-[14px] w-[14px] shrink-0" />
          )}
          <p className="flex-1 text-[12.5px] leading-snug text-[var(--tx-fg-soft)]">{toast.text}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className={`-mr-0.5 -mt-0.5 rounded-lg p-1 text-[var(--tx-muted)] transition-colors duration-200 hover:text-[var(--tx-fg)] ${FOCUS}`}
          >
            <XIcon className="h-[13px] w-[13px]" />
          </button>
        </div>
      )}

      {legalModal === "terms" && (
        <LegalModal
          title={t.legal.termsTitle}
          sections={[{ text: t.legal.termsBody }]}
          footerLabel={t.legal.footerLink}
          closeLabel={t.legal.close}
          onClose={() => setLegalModal(null)}
        />
      )}

      {legalModal === "privacy" && (
        <LegalModal
          title={t.legal.privacyTitle}
          sections={[
            { heading: t.legal.privacyRelayTitle, text: t.legal.privacyRelayBody },
            { heading: t.legal.privacyStorageTitle, text: t.legal.privacyStorageBody },
          ]}
          footerLabel={t.legal.footerLink}
          closeLabel={t.legal.close}
          onClose={() => setLegalModal(null)}
        />
      )}
    </div>
  );
}