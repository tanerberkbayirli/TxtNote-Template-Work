/**
 * Flashcard deck. Edit, flip and study one note — cards are stored on the
 * note itself, through the same save path as the other editors.
 */

import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CARD_IMAGE_MAX_BYTES, CARD_IMAGE_MAX_LABEL } from "../../config/limits";
import { EditorTitle } from "../editor/EditorTitle";
import { readImageAsDataUrl } from "../../lib/academicMedia";
import { cn } from "../../lib/cn";
import { createId } from "../../lib/id";
import {
  clampIndex,
  createCard,
  createStudySession,
  deckStatus,
  flipSession,
  knownCount,
  markSession,
  moveSession,
  sameFlashcardDeck,
  sanitizeDeck,
  sessionCard,
  studyResults,
} from "../../lib/flashcards";
import { FlashcardCard } from "./FlashcardCard";
import { FlashcardControls } from "./FlashcardControls";
import { FlashcardHelp } from "./FlashcardHelp";
import { FlashcardResults } from "./FlashcardResults";
import { FlashcardStudyMode } from "./FlashcardStudyMode";

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-30 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

const hintClass = "text-center text-[12px] text-neutral-400 dark:text-neutral-500";

const isTypingTarget = (target) => {
  if (!target || typeof target.closest !== "function") return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable], [role='dialog']"));
};

const incompleteWarning = (status) => {
  if (status.incomplete <= 0) return "";
  if (status.incomplete === 1) return "1 kartın ön veya arka yüzü boş.";
  return `${status.incomplete} kartın ön veya arka yüzü boş.`;
};

export function FlashcardEditor({ title, flashcards, onTitleChange, onFlashcardsChange }) {
  const [cards, setCards] = useState(() => sanitizeDeck(flashcards)?.cards ?? []);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState("edit");
  const [session, setSession] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [imageError, setImageError] = useState("");
  const frontRef = useRef(null);
  const cardsRef = useRef(cards);
  const onChangeRef = useRef(onFlashcardsChange);
  const activeIdRef = useRef("");
  const focusFrontRef = useRef(false);
  cardsRef.current = cards;
  onChangeRef.current = onFlashcardsChange;

  useEffect(() => {
    const incoming = sanitizeDeck(flashcards)?.cards ?? [];
    setCards((current) =>
      sameFlashcardDeck({ cards: current }, { cards: incoming }) ? current : incoming,
    );
  }, [flashcards]);

  const safeIndex = clampIndex(index, cards.length);
  const activeId = cards[safeIndex]?.id ?? "";
  activeIdRef.current = activeId;
  const [faceCardId, setFaceCardId] = useState(activeId);
  if (faceCardId !== activeId) {
    setFaceCardId(activeId);
    setFlipped(false);
  }

  const card = cards[safeIndex] ?? null;
  const status = deckStatus(cards);

  useEffect(() => {
    if (status.playable > 0 && notice) setNotice("");
  }, [status.playable, notice]);

  useEffect(() => {
    setImageError("");
  }, [activeId]);

  useEffect(() => {
    if (!focusFrontRef.current || mode !== "edit" || flipped) return;
    focusFrontRef.current = false;
    frontRef.current?.focus();
  }, [activeId, mode, flipped]);

  useEffect(() => {
    if (mode !== "study") return undefined;
    const onKey = (event) => {
      if (helpOpen || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      if (isTypingTarget(event.target)) return;
      const onButton = event.target?.closest?.("button, a");
      if (event.key === " " || event.code === "Space") {
        if (onButton) return;
        event.preventDefault();
        setSession((current) => (current ? flipSession(current) : current));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setSession((current) => (current ? moveSession(current, 1) : current));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSession((current) => (current ? moveSession(current, -1) : current));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, helpOpen]);

  useEffect(() => {
    if (mode === "study" && session?.pass === "done") setMode("results");
  }, [mode, session]);

  const commit = (nextCards) => {
    cardsRef.current = nextCards;
    setCards(nextCards);
    onChangeRef.current?.({ cards: nextCards });
  };

  const patchCard = (cardId, patch) => {
    commit(cardsRef.current.map((item) => (item.id === cardId ? { ...item, ...patch } : item)));
  };

  const addCard = () => {
    const next = createCard(createId("card"));
    focusFrontRef.current = true;
    setIndex(cardsRef.current.length);
    setFlipped(false);
    setMode("edit");
    setNotice("");
    commit([...cardsRef.current, next]);
  };

  const removeCard = () => {
    const current = cardsRef.current;
    if (current.length === 0) return;
    const at = clampIndex(index, current.length);
    const next = current.filter((_, itemIndex) => itemIndex !== at);
    setIndex(clampIndex(at, next.length));
    setFlipped(false);
    commit(next);
  };

  const showCard = (nextIndex) => {
    setIndex(clampIndex(nextIndex, cardsRef.current.length));
    setFlipped(false);
  };

  const pickImage = async (file) => {
    const cardId = activeIdRef.current;
    if (!file || !cardId) return;
    if (file.type && !file.type.startsWith("image/")) {
      setImageError("Yalnızca görsel dosyası seçebilirsin.");
      return;
    }
    if (file.size > CARD_IMAGE_MAX_BYTES) {
      setImageError(`Görsel en fazla ${CARD_IMAGE_MAX_LABEL} olabilir.`);
      return;
    }
    try {
      const url = await readImageAsDataUrl(file, 1200);
      patchCard(cardId, { image: url });
      if (activeIdRef.current === cardId) setImageError("");
    } catch {
      if (activeIdRef.current === cardId) setImageError("Görsel okunamadı. Başka bir dosya dene.");
    }
  };

  const startStudy = () => {
    const next = createStudySession(cardsRef.current);
    if (next.pass === "done") {
      setNotice(
        cardsRef.current.length === 0
          ? "Önce bir kart oluştur."
          : "Çalışmak için bir karta soru veya cevap yaz.",
      );
      return;
    }
    setNotice("");
    setFlipped(false);
    setHelpOpen(false);
    setSession(next);
    setMode("study");
  };

  const backToEdit = () => {
    setMode("edit");
    setSession(null);
    setFlipped(false);
  };

  const studyAgain = () => {
    const next = createStudySession(cardsRef.current);
    if (next.pass === "done") {
      backToEdit();
      setNotice("Çalışmak için bir karta soru veya cevap yaz.");
      return;
    }
    setSession(next);
    setMode("study");
  };

  let stage = null;
  if (mode === "results" && session) {
    stage = <FlashcardResults results={studyResults(session)} onAgain={studyAgain} onEdit={backToEdit} />;
  } else if (mode === "study" && session) {
    const current = sessionCard(session);
    stage = current ? (
      <FlashcardStudyMode
        card={current}
        revealed={session.revealed}
        known={knownCount(session)}
        total={session.cards.length}
        repeat={(session.attempts?.[current.id]?.length ?? 0) > 0}
        skipped={session.skipped}
        onFlip={() => setSession((currentSession) => flipSession(currentSession))}
        onKnow={() => setSession((currentSession) => markSession(currentSession, "know"))}
        onAgain={() => setSession((currentSession) => markSession(currentSession, "again"))}
      />
    ) : null;
  } else if (!card) {
    stage = (
      <div className="flashcard-scene w-full">
        <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-100">İlk kartını oluştur</h2>
          <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Ön tarafa soru veya görsel, arka tarafa cevabını ekle.
          </p>
          <button
            type="button"
            onClick={addCard}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Kart Oluştur
          </button>
        </div>
      </div>
    );
  } else {
    stage = (
      <div className="flex w-full flex-col items-center">
        <FlashcardCard
          key={card.id}
          card={card}
          flipped={flipped}
          editable
          imageError={imageError}
          frontRef={frontRef}
          onFlip={() => setFlipped((value) => !value)}
          onFrontChange={(front) => patchCard(card.id, { front })}
          onBackChange={(back) => patchCard(card.id, { back })}
          onPickImage={pickImage}
          onClearImage={() => {
            setImageError("");
            patchCard(card.id, { image: null });
          }}
        />
        <div className="mt-4 flex w-full items-center justify-center gap-1">
          <button
            type="button"
            title="Önceki kart"
            aria-label="Önceki kart"
            disabled={safeIndex <= 0}
            onClick={() => showCard(safeIndex - 1)}
            className={iconButton}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <p className="min-w-[4.5rem] text-center text-[12px] tabular-nums text-neutral-400 dark:text-neutral-500">
            {safeIndex + 1} / {cards.length}
          </p>
          <button
            type="button"
            title="Sonraki kart"
            aria-label="Sonraki kart"
            disabled={safeIndex >= cards.length - 1}
            onClick={() => showCard(safeIndex + 1)}
            className={iconButton}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            title="Kart ekle"
            aria-label="Kart ekle"
            onClick={addCard}
            className={cn(iconButton, "ml-2 w-auto gap-1 px-2 text-[12px]")}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Kart
          </button>
          <button
            type="button"
            title="Kartı sil"
            aria-label="Kartı sil"
            onClick={removeCard}
            className={iconButton}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
        <p className={cn("mt-2", hintClass)}>
          {flipped ? "Cevabını buraya yaz" : "Ön tarafa soru veya görsel ekle"}
        </p>
      </div>
    );
  }

  return (
    <div data-flashcard-editor="" data-mode={mode} className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <EditorTitle compact value={title ?? ""} onChange={onTitleChange} />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-4 lg:flex-row lg:items-center lg:justify-center lg:gap-14 lg:px-8">
        <div
          className={cn(
            "flex w-full min-w-0 flex-col items-center",
            mode === "results" ? "max-w-4xl" : "max-w-[32rem]",
          )}
        >
          {stage}
        </div>
        <FlashcardControls
          mode={mode}
          warning={incompleteWarning(status)}
          notice={notice}
          onStart={startStudy}
          onHelp={() => setHelpOpen(true)}
          onExit={backToEdit}
        />
      </div>
      {helpOpen ? <FlashcardHelp onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}
