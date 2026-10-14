/**
 * The Yardım ve destek screen: a start-to-finish guide with small UI figures.
 * Haritalandırmalı Not yardımı ayrı bir modalda tutulur (MindmapHelp.jsx).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  FileText,
  Folder,
  GraduationCap,
  HelpCircle,
  History,
  Keyboard,
  LayoutPanelTop,
  ListTodo,
  MessageSquare,
  Monitor,
  Palette,
  PanelLeft,
  PenLine,
  Shield,
  Sparkles,
  Waypoints,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";
import { cn } from "../../lib/cn";
import {
  AppShellFigure,
  CodeFigure,
  FormatFigure,
  HistoryFigure,
  IntroFigure,
  IrysFigure,
  MathFigure,
  MindmapTeaserFigure,
  NetworkToastFigure,
  NoteTypesFigure,
  PlansFigure,
  SearchFigure,
  SecurityFigure,
  ShortcutsFigure,
  SidebarToolsFigure,
  SplitPanesFigure,
  SyncFigure,
  ThemeFigure,
  TrashFigure,
} from "./HelpFigures";

const articleClass =
  "text-[14px] leading-[1.75] text-neutral-700 dark:text-neutral-300";

const NAV_GROUPS = [
  {
    label: "Başlangıç",
    items: [
      { id: "intro", label: "TxtNote nedir" },
      { id: "start", label: "Başlarken" },
      { id: "note-types", label: "Not türleri" },
    ],
  },
  {
    label: "Yazmak",
    items: [
      { id: "sidebar", label: "Kenar çubuğu" },
      { id: "workarea", label: "Sekmeler ve bölme" },
      { id: "writing", label: "Yazı, formül, kod" },
      { id: "shortcuts", label: "Kısayollar" },
      { id: "mindmap", label: "Haritalandırmalı not" },
    ],
  },
  {
    label: "Veri ve hesap",
    items: [
      { id: "appearance", label: "Görünüm ve ayarlar" },
      { id: "security", label: "Verilerin güvende" },
      { id: "ag", label: "Ağ nedir" },
      { id: "sync", label: "Senkronizasyon" },
      { id: "network", label: "Ağ bağlantısı" },
      { id: "history", label: "Geçmiş ve çöp" },
      { id: "plans", label: "Üyelik paketleri" },
    ],
  },
  {
    label: "Destek",
    items: [
      { id: "faq", label: "Sık sorulan sorular" },
      { id: "contact", label: "Bize ulaşın" },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

const NOTE_TYPE_CARDS = [
  {
    icon: FileText,
    label: "Standart Not",
    tint: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
    body: "Başlık ve serbest yazı. Toplantı, taslak, uzun metin.",
  },
  {
    icon: ListTodo,
    label: "To-Do",
    tint: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300",
    body: "Her satır bir görev. Görevde daireye tıkla. Süreçte günlük hedef yaz; sayı yetince halka dolar. Günlük To-Do’da tarih çubuğuyla gün değiştir; sağdaki işaret görevleri bütün günlere taşır.",
  },
  {
    icon: CalendarDays,
    label: "Günlük",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
    body: "Her güne ayrı sayfa. Alttaki tarih çubuğuyla gez; sağdaki takvimden herhangi bir günü aç. Yazı olan günlerde küçük bir nokta görünür.",
  },
  {
    icon: Waypoints,
    label: "Haritalandırmalı Not",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
    body: "2D tuval. Kartları sürükle, oklarla bağla. Ayrıntı tuvaldeki yardım düğmesinde.",
  },
  {
    icon: GraduationCap,
    label: "Akademik Yazı",
    tint: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
    body: "Makale ve tez, A4 belge. Sağ çubuktan «Kaynakça olsun» ile alanı aç; kaynakları sayfanın altına yaz. PDF / Word içe-dışa aktarma.",
  },
  {
    icon: Folder,
    label: "Dosya",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
    body: "Not tutmaz, notları gruplar. Listeden bir notu sürükleyip klasörün üzerine bırak.",
  },
];

const START_STEPS = [
  {
    n: "1",
    title: "Ortam seç",
    body: "Sol üstteki çalışma ortamı adına tıkla. İş, okul veya kişisel gibi ayrı dünyalar açabilirsin. Ortama sağ tıklayınca adını, resmini değiştirir veya sabitleyebilirsin.",
  },
  {
    n: "2",
    title: "Not ekle",
    body: "Kenar çubuğundaki «Ekle» ile türü seç. Yeni not üstte bir sekme olarak açılır.",
  },
  {
    n: "3",
    title: "Aç ve yaz",
    body: "Soldaki listeden bir nota tıklayınca o not açılır. Kenar çubuğunu gizleyebilir veya sağ kenarından sürükleyerek genişliğini ayarlayabilirsin.",
  },
];

const PLAN_CARDS = [
  {
    name: "Freemium",
    price: "Ücretsiz",
    points: ["Sınırsız not", "5 cihaza kadar senkron", "1 GB depolama"],
    featured: false,
  },
  {
    name: "Lite Premium",
    price: "Daha fazla alan",
    points: ["Sınırsız not", "10 cihaz", "50 GB alan"],
    featured: false,
  },
  {
    name: "Premium",
    price: "Tam kapasite",
    points: ["Sınırsız cihaz", "250 GB", "Daha hızlı eşleşme ve daha sık yedek"],
    featured: true,
  },
];

const FAQ_ITEMS = [
  {
    q: "İnternet olmadan çalışabilir miyim?",
    a: "Evet. Tüm not türlerini çevrimdışı yazarsın; yazdıkların anında cihazına kaydolur. Bağlantı gelince senkron ve ağ yedeği kaldığı yerden devam eder.",
  },
  {
    q: "Bulutta mı saklanıyor?",
    a: "Hayır. Kullanım olarak buluttan farksızdır; arka planda Irys ağı ve AES-256 şifreleme vardır. Ayrıntı «Ağ nedir» bölümünde.",
  },
  {
    q: "Notun içinde nasıl ararım?",
    a: "Açık notun sağ üstündeki «Notta ara» kutusunu kullan veya Ctrl+F (⌘F) bas. Kenar çubuğundaki arama yalnızca başlıklara bakar.",
  },
  {
    q: "İki notu aynı anda nasıl görürüm?",
    a: "Notu sağ tıkla ve «Yanında aç» de, ya da soldaki listeden yazma alanına sürükle.",
  },
  {
    q: "Sildiğim bir notu geri alabilir miyim?",
    a: "Hemen ardından Ctrl+Z (⌘Z) bas: silme, taşıma, kalın yazı ve yazdığın metin aynı yığından geri gelir. Çöp kutusu açıksa notlar orada da otuz gün durur. Kapalıysa Ctrl+Z bu oturumda hâlâ geri alabilir; yığın dolunca veya uygulama kapanınca kalıcı silinmiş sayılır.",
  },
];

const Kbd = ({ children }) => (
  <kbd className="inline-flex min-h-[1.35rem] min-w-[1.35rem] items-center justify-center rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[11px] font-medium text-neutral-800 shadow-[0_1px_0_rgb(0,0,0,0.04)] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
    {children}
  </kbd>
);

const isComboKeys = (keys) =>
  /^(Ctrl|⌘|Shift|Alt|Enter|F2|Delete|Tab|↑|↓)/.test(keys) && !keys.includes("**");

const KeyCombo = ({ keys }) => {
  if (!isComboKeys(keys)) {
    return (
      <span className="inline-flex max-w-full items-center rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
        {keys}
      </span>
    );
  }

  const alternatives = keys.split(" / ");
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {alternatives.map((combo, altIndex) => (
        <span key={combo} className="inline-flex items-center gap-0.5">
          {altIndex > 0 ? <span className="px-0.5 text-[11px] text-neutral-400">/</span> : null}
          {combo.split("+").map((part, partIndex) => (
            <span key={`${combo}-${part}`} className="inline-flex items-center gap-0.5">
              {partIndex > 0 ? <span className="text-[10px] text-neutral-400">+</span> : null}
              <Kbd>{part.trim()}</Kbd>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
};

const ShortcutRow = ({ keys, meaning }) => (
  <div className="grid grid-cols-1 gap-1.5 border-b border-neutral-100 py-2.5 last:border-0 sm:grid-cols-[minmax(0,13.5rem)_1fr] sm:items-center sm:gap-3 dark:border-neutral-800/80">
    <dt>
      <KeyCombo keys={keys} />
    </dt>
    <dd className="text-[13px] leading-snug text-neutral-600 dark:text-neutral-400">{meaning}</dd>
  </div>
);

const ShortcutGroup = ({ title, rows }) => (
  <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900/40">
    <h3 className="border-b border-neutral-100 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      {title}
    </h3>
    <dl>
      {rows.map((row) => (
        <ShortcutRow key={row.keys} keys={row.keys} meaning={row.meaning} />
      ))}
    </dl>
  </div>
);

const SectionHeader = ({ icon: Icon, title, lead }) => (
  <div className="flex items-start gap-3">
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </span>
    <div className="min-w-0">
      <h2 className="text-[16px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        {title}
      </h2>
      {lead ? (
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">{lead}</p>
      ) : null}
    </div>
  </div>
);

const Callout = ({ children }) => (
  <p className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px] leading-relaxed text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
    {children}
  </p>
);

const ContactCard = ({ icon: Icon, title, description }) => (
  <div className="flex flex-1 flex-col rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900/40">
    <span
      aria-hidden="true"
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
    <h3 className="mt-3 text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">{title}</h3>
    <p className="mt-1 flex-1 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
      {description}
    </p>
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="mt-4 w-full cursor-not-allowed rounded-lg border border-neutral-200 py-2 text-[13px] font-medium text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
    >
      Yakında
    </button>
  </div>
);

const FaqItem = ({ item, isOpen, onToggle }) => (
  <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/40">
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
    >
      <span className="text-[14px] font-medium text-neutral-900 dark:text-neutral-50">{item.q}</span>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
        strokeWidth={2}
      />
    </button>
    {isOpen ? (
      <p className={`border-t border-neutral-100 px-4 py-3 dark:border-neutral-800 ${articleClass}`}>
        {item.a}
      </p>
    ) : null}
  </div>
);

const Section = ({ id, sectionRefs, children }) => (
  <section
    id={`help-${id}`}
    ref={(node) => {
      sectionRefs.current[id] = node;
    }}
    className="scroll-mt-8"
  >
    {children}
  </section>
);

export const HelpView = ({ focusSection = null }) => {
  const [activeId, setActiveId] = useState(focusSection ?? NAV_ITEMS[0]?.id ?? null);
  const [openFaq, setOpenFaq] = useState(0);
  const sectionRefs = useRef({});
  const scrollerRef = useRef(null);
  const skipObserverUntil = useRef(0);

  const scrollToSection = useCallback((id) => {
    setActiveId(id);
    skipObserverUntil.current = Date.now() + 700;
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToSectionRef = useRef(scrollToSection);
  scrollToSectionRef.current = scrollToSection;

  useEffect(() => {
    if (!focusSection) return;
    const frame = window.requestAnimationFrame(() => {
      scrollToSectionRef.current(focusSection);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusSection]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < skipObserverUntil.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target?.id?.replace(/^help-/, "");
        if (id) setActiveId(id);
      },
      { root, rootMargin: "0px 0px -65% 0px", threshold: [0.1, 0.25] },
    );

    NAV_ITEMS.forEach((item) => {
      const node = sectionRefs.current[item.id];
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={scrollerRef} className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8 sm:py-10">
        <header className="overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 px-5 py-6 sm:px-8 sm:py-7 dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700"
            >
              <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                Yardım ve destek
              </h1>
              <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                TxtNote&apos;u baştan sona, kısa adımlarla. Soldan konuyu seç; her bölümün altında
                küçük bir görsel var.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <nav
            aria-label="Hızlı erişim"
            className="lg:sticky lg:top-8 lg:w-56 lg:shrink-0"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              İçindekiler
            </p>
            <div className="mt-3 space-y-5">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {group.label}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(item.id)}
                          aria-current={activeId === item.id ? "true" : undefined}
                          className={cn(
                            "w-full rounded-lg px-3 py-1.5 text-left text-[13px] leading-snug transition-colors duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
                            activeId === item.id
                              ? "bg-neutral-200/80 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100",
                          )}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <article className="min-w-0 flex-1 space-y-14">
            <Section id="intro" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={Sparkles}
                title="TxtNote nedir"
                lead="Düşünceler, görevler, günlükler ve fikir haritaları tek yerde."
              />
              <p className={`mt-4 ${articleClass}`}>
                Yazdığın her şey önce senin cihazında saklanır; ardından arka planda diğer
                cihazlarına ve ağa gider. Kaydet düğmesi yoktur — yazmayı bıraktığın anda kayıt
                başlamış demektir.
              </p>
              <IntroFigure />
            </Section>

            <Section id="start" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={LayoutPanelTop}
                title="Başlarken"
                lead="Üç adım: ortam, not, yazı."
              />
              <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                {START_STEPS.map((step) => (
                  <li
                    key={step.n}
                    className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-[12px] font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                      {step.n}
                    </span>
                    <p className="mt-3 text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                      {step.title}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
              <AppShellFigure />
            </Section>

            <Section id="note-types" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={FileText}
                title="Not türleri"
                lead="Her tür farklı bir işe yarar. Hangisini seçeceğini «Ekle» menüsü söyler."
              />
              <NoteTypesFigure />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {NOTE_TYPE_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          card.tint,
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                          {card.label}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {card.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section id="sidebar" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={PanelLeft}
                title="Kenar çubuğu"
                lead="Notlarını burada arar, sabitler, klasörlersin. Yüklediğin dosyalar da aynı listede durur."
              />
              <SidebarToolsFigure />
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Başlık ara",
                    body: "Listenin üstündeki arama, not ve klasör adlarını süzgeçler.",
                  },
                  {
                    title: "Sağ tık",
                    body: "Sabitle, yeniden adlandır, not geçmişi, sil. Klasörün içindeyse «Çıkart».",
                  },
                  {
                    title: "Yükle",
                    body: "Dosya veya klasör yükle. ZIP açılır, klasör ağacı korunur. Kod dosyaları sözdizimi renkli açılır; büyük ikili dosyalar yalnızca bilgisiyle saklanır.",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
                  >
                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="workarea" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={LayoutPanelTop}
                title="Sekmeler ve bölünmüş görünüm"
                lead="Açtığın her not üstte bir sekmedir. Sekmeyi kapatmak notu silmez."
              />
              <p className={`mt-4 ${articleClass}`}>
                İki notu yan yana görmek için soldaki bir öğeye sağ tıkla ve «Yanında aç» de; ya da
                öğeyi yazma alanına sürükle. Sekmeleri üst çubukta sürükleyerek sırasını
                değiştirebilirsin. Ortadaki çizgiyi sürükleyerek boyutu değiştir. En fazla dokuz
                panel açılır.
              </p>
              <SplitPanesFigure />
            </Section>

            <Section id="writing" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={PenLine}
                title="Yazı, formül ve kod"
                lead="Standart not ve günlükte yazıyı seçip sağ tıkla. Matematik ve kod ayrı kutularda çizilir."
              />
              <p className={`mt-4 ${articleClass}`}>
                Boyutu (başlık, alt başlık, normal), hizayı (sola, ortaya, sağa), rengi ve stili
                (kalın, italik, üstü çizili) tek tek uygularsın.
              </p>
              <FormatFigure />

              <h3 className="mt-8 text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                Akademik yazı
              </h3>
              <p className={`mt-2 ${articleClass}`}>
                Ekle menüsünden «Akademik Yazı» seç. Sayfa A4 makaledir: başlık, yazarlar,
                kurum, anahtar kelimeler, özet ve metin. Uygulama bu alanları tanır. Sağ
                «Şablonlar» makale, tez, rapor veya tarama iskeletini gerçek başlıklarla
                (Başlık 1–3) yazar. Araçlar
                biçim, görsel ve PDF / Word içe-dışa aktarmayı da içerir. Var olan bir PDF veya Word dosyasını içe
                aktarıp düzeltebilir, sonra yeniden dışa aktarabilirsin.
              </p>

              <h3 className="mt-8 text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                Matematik (LaTeX)
              </h3>
              <p className={`mt-2 ${articleClass}`}>
                Formülü yazınca gri kutuda çizilir. Kutuya tıklayınca LaTeX’i düzenlersin; dışarı
                çıkınca yine çizilir. Sol üstteki «Formül ara» alanından hazır formül seçersin.
                {" "}
                <Kbd>##math##</Kbd>
                {" "}yazıp Enter’a basınca boş kutu açılır.
              </p>
              <MathFigure />

              <h3 className="mt-8 text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                Kod
              </h3>
              <p className={`mt-2 ${articleClass}`}>
                <Kbd>##code##</Kbd>
                {" "}yazıp Enter’a bas veya kod yapıştır. Dil seçilmezse «seçilmedi» kalır;
                bulunursa «oto-Js» gibi görünür. Bloğa tıklayınca düzenlersin.
              </p>
              <CodeFigure />

              <h3 className="mt-8 text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                Notta ara
              </h3>
              <p className={`mt-2 ${articleClass}`}>
                Notun sağ üstündeki «Notta ara» alanına bir sözcük yaz; listeden seçince metinde
                yanıp söner. Sayfanın altında kelime, paragraf ve harf sayısı durur.
              </p>
              <SearchFigure />
              <Callout>
                Ctrl+Z bir önceki eylemi geri alır — kalınlaştırmayı, bir paragrafı veya sildiğin
                dosyayı. Mac&apos;te ⌘Z.
              </Callout>
            </Section>

            <Section id="shortcuts" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={Keyboard}
                title="Kısayollar"
                lead="Mac’te Ctrl yerine ⌘ kullan. Yazarken işaretlerin kapanışını yazdığın anda biçim uygulanır."
              />
              <ShortcutsFigure />
              <ShortcutGroup
                title="Yazarken işaretle"
                rows={[
                  { keys: "**metin**", meaning: "Kalın" },
                  { keys: "*metin*  veya  _metin_", meaning: "İtalik" },
                  { keys: "~~metin~~", meaning: "Üstü çizili" },
                  { keys: "[TAB]", meaning: "Girinti (sekme)" },
                  { keys: "$$formül$$", meaning: "Ekran formülü (LaTeX)" },
                  { keys: "$formül$", meaning: "Satır içi formül" },
                  { keys: "\\[formül\\]", meaning: "Ekran formülü" },
                  { keys: "\\(formül\\)", meaning: "Satır içi formül" },
                  { keys: "\\begin{align}…\\end{align}", meaning: "Hizalı denklem ortamı" },
                  { keys: "\\ce{H2O}", meaning: "Kimyasal formül" },
                  { keys: "##math##  Enter", meaning: "Boş matematik kutusu aç" },
                  { keys: "##code##  Enter", meaning: "Kod bloğu aç" },
                  { keys: "iki boşluk", meaning: "Cümle sonu: nokta ve bir boşluk" },
                ]}
              />
              <ShortcutGroup
                title="Yazarken tuşlar"
                rows={[
                  { keys: "Ctrl+B", meaning: "Kalın" },
                  { keys: "Ctrl+I", meaning: "İtalik" },
                  { keys: "Ctrl+Shift+X", meaning: "Üstü çizili" },
                  { keys: "Enter", meaning: "Yeni paragraf" },
                  { keys: "Shift+Enter", meaning: "Aynı paragrafta yeni satır" },
                  { keys: "Ctrl+A", meaning: "Tümünü seç (sağ tık biçimi için)" },
                  { keys: "Ctrl+Z", meaning: "Geri al: yazı, kalın/italik, silinen dosya, taşıma" },
                  { keys: "Ctrl+Y", meaning: "Yinele (Ctrl+Shift+Z de olur)" },
                  { keys: "Ctrl+F", meaning: "Notta ara" },
                  { keys: "Enter / Tab / ↓", meaning: "Başlıkta: yazı alanına geç" },
                  { keys: "↑ veya Backspace", meaning: "Yazının en başında: başlığa dön" },
                ]}
              />
              <ShortcutGroup
                title="Liste ve sekmeler"
                rows={[
                  { keys: "F2", meaning: "Seçili öğeyi yeniden adlandır" },
                  { keys: "Delete", meaning: "Seçili öğeyi sil" },
                  { keys: "Sürükle", meaning: "Klasöre koy, klasörden çıkar veya yeni panel aç" },
                ]}
              />
            </Section>

            <Section id="mindmap" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={Waypoints}
                title="Haritalandırmalı not"
                lead="Fikirleri kart, görsel, dosya ve oklarla bir tuvale yerleştirirsin."
              />
              <p className={`mt-4 ${articleClass}`}>
                Sol paletten tıkla veya sürükle; öğeyi tuvale bırak. Ok aracıyla iki öğeyi bağla.
                İğne oku yazının etrafından dolandırır.
              </p>
              <p className={`mt-3 ${articleClass}`}>
                Hassas görseller buğulu gelir; tıklayınca onay istenir. İşaret yazının rengi
                içeriğini anlatır: nötr not, mavi dış bağlantı, kırmızı hassas içerik.
              </p>
              <MindmapTeaserFigure />
              <Callout>
                Adım adım rehber, tuvalin sol üstündeki yardım düğmesindedir. Burada tekrarlanmaz.
              </Callout>
            </Section>

            <Section id="appearance" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={Palette}
                title="Görünüm ve ayarlar"
                lead="Beyaz, siyah veya karanlık. İstersen tema saate göre değişir."
              />
              <ThemeFigure />
              <p className={`mt-4 ${articleClass}`}>
                Ayarlar&apos;da güncelleme bildirimlerini, hareketsizlikte otomatik kilidi ve
                senkron hızını değiştirirsin. Dil şimdilik yalnızca Türkçe.
              </p>
            </Section>

            <Section id="security" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={Shield}
                title="Verilerin güvende"
                lead="Her kelime, yazmayı bırakmadan cihazına yazılır."
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                  <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                    Anında yerel kayıt
                  </p>
                  <p className={`mt-1.5 ${articleClass}`}>
                    Elektrik kesilse veya sekme kapansa bile son hali durur. Bu kayıt tüm
                    kullanıcılarda açıktır; ayar istemez.
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                  <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                    Uçtan uca şifre
                  </p>
                  <p className={`mt-1.5 ${articleClass}`}>
                    TxtNote önce senin cihazında çalışır, sonra ağa gider — uygulamayı silmediğin
                    sürece notların yerelde kalır.
                  </p>
                </div>
              </div>
              <SecurityFigure />
            </Section>

            <Section id="ag" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={Wifi}
                title="Ağ nedir"
                lead="Kullanım olarak bildiğin buluttan farksızdır. Tek fark, TxtNote’un bu kadar ucuz ve güvenilir olabilmesidir."
              />
              <p className={`mt-4 ${articleClass}`}>
                Arka planda Irys adlı bir kripto blokzinciri çalışır. Verilerin AES-256 ile
                şifrelenerek orada saklanır. Şifre sende olduğu sürece bize bile bağımlı kalmadan
                verilerini blokzincirden teslim alabilirsin.
              </p>
              <IrysFigure />
            </Section>

            <Section id="sync" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={Monitor}
                title="Cihazlar arası senkronizasyon"
                lead="Telefonda başladığın not, kısa süre sonra bilgisayarında durur."
              />
              <p className={`mt-4 ${articleClass}`}>
                Değişmeyen notlar tekrar gönderilmez. Ağ yedeğinin sıklığı not geçmişini de besler.
              </p>
              <SyncFigure />
              <Callout>
                Hızı Ayarlar&apos;dan seç. Bağlı cihazlar ve son senkron zamanı Profil&apos;de görünür.
              </Callout>
            </Section>

            <Section id="network" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={WifiOff}
                title="Ağ bağlantısı"
                lead="Sağ altta küçük bir uyarı belirebilir: son güncelleme sunucuya ulaşamamış demektir."
              />
              <p className={`mt-4 ${articleClass}`}>
                Çoğu zaman kopuk Wi-Fi veya geçici bir aksaklıktır. Yazdıkların cihazında durur.
                Bağlantı gelince TxtNote kalanı kendiliğinden gönderir. Sürmeye devam ederse bu
                sayfanın altındaki teknik destekten yaz.
              </p>
              <NetworkToastFigure />
            </Section>

            <Section id="history" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={History}
                title="Not geçmişi ve çöp kutusu"
                lead="Yanlışlıkla sildiğin bir paragrafı Ctrl+Z ile geri al."
              />
              <p className={`mt-4 ${articleClass}`}>
                Daha eski bir sürüme dönmek için kenar çubuğunda nota sağ tıkla ve «Not Geçmişi»ni
                aç. Bir sürüme tıklaman yeter. Geçmiş, ağ yedeklemeleriyle oluşur; çok yeni bir
                notta henüz görünmeyebilir.
              </p>
              <HistoryFigure />
              <TrashFigure />
            </Section>

            <Section id="plans" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={Sparkles}
                title="Üyelik paketleri"
                lead="Freemium ücretsizdir. Ayrıntı «Premium’a geç» ekranında."
              />
              <PlansFigure />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {PLAN_CARDS.map((plan) => (
                  <div
                    key={plan.name}
                    className={cn(
                      "rounded-xl border bg-white p-4 dark:bg-neutral-900/40",
                      plan.featured
                        ? "border-amber-300 dark:border-amber-700"
                        : "border-neutral-200 dark:border-neutral-800",
                    )}
                  >
                    <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">
                      {plan.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                      {plan.price}
                    </p>
                    <ul className="mt-3 space-y-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                      {plan.points.map((point) => (
                        <li key={point} className="flex gap-2">
                          <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="faq" sectionRefs={sectionRefs}>
              <SectionHeader
                icon={HelpCircle}
                title="Sık sorulan sorular"
                lead="Kısa cevaplar. Soruya tıklayınca açılır."
              />
              <div className="mt-5 space-y-2">
                {FAQ_ITEMS.map((item, index) => (
                  <FaqItem
                    key={item.q}
                    item={item}
                    isOpen={openFaq === index}
                    onToggle={() => setOpenFaq((current) => (current === index ? -1 : index))}
                  />
                ))}
              </div>
            </Section>

            <Section id="contact" sectionRefs={sectionRefs}>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-8 sm:px-8 dark:border-neutral-800 dark:bg-neutral-900/30">
                <SectionHeader
                  icon={MessageSquare}
                  title="Çözüm bulamadınız mı? Bize ulaşın"
                  lead="Geri bildirim veya teknik yardım için doğru kanalı seçin."
                />
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <ContactCard
                    icon={MessageSquare}
                    title="Öneri ve şikayet"
                    description="Fikirlerini, beğendiğin veya gelmesini istediğin özellikleri bizimle paylaş."
                  />
                  <ContactCard
                    icon={Wrench}
                    title="Teknik destek"
                    description="Senkronizasyon, giriş veya uygulama hataları için teknik ekibimize yaz."
                  />
                </div>
              </div>
            </Section>
          </article>
        </div>
      </div>
    </div>
  );
};
