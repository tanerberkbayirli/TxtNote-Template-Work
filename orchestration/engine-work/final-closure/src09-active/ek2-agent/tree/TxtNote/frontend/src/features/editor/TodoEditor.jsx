/**
 * To-Do note: one list, one input line.
 *
 * A row is either a plain task — pending / done / failed, cycled from its own
 * circle — or a daily-target task, which ticks itself the moment that day's
 * number reaches the target. Daily notes add the diary date strip under the
 * composer; a mark on the right keeps the same tasks across days.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { dayKey } from "../../lib/diaryCalendar";
import { createId } from "../../lib/id";
import { htmlToPlainText } from "../../lib/richText";
import {
  dayHasTodos,
  setTodoPersistent,
  todosForDay,
  writeTodosForDay,
} from "../../lib/todoDaily";
import {
  amountOnDay,
  isProgressTodo,
  parseAmount,
  progressRatio,
  progressTarget,
  setDayAmount,
  setProgressTarget,
  TODO_KIND_CLASSIC,
  TODO_KIND_PROGRESS,
  todoDayKey,
} from "../../lib/todoProgress";
import { DayStrip } from "./DayStrip";
import { EditorTitle } from "./EditorTitle";

/* -- three states, one circle ---------------------------------------------- */

const PENDING = "pending";
const DONE = "done";
const FAILED = "failed";

/** Plain rows carry `done` and `failed`; a target row's state is its number. */
const statusOf = (todo) => (todo.done ? DONE : todo.failed ? FAILED : PENDING);
const nextStatus = { [PENDING]: DONE, [DONE]: FAILED, [FAILED]: PENDING };
const statusPatch = (status) => ({ done: status === DONE, failed: status === FAILED });

const NEXT_LABEL = {
  [PENDING]: "Başarılı işaretle",
  [DONE]: "Başarısız işaretle",
  [FAILED]: "İşareti kaldır",
};

const splitLines = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const makeTodo = (text, target) =>
  target > 0
    ? { id: createId("todo"), kind: TODO_KIND_PROGRESS, text, target, logs: [], done: false }
    : { id: createId("todo"), kind: TODO_KIND_CLASSIC, text, done: false, failed: false };

/** Grow a textarea to its wrapped height so nothing scrolls sideways. */
const fitField = (el) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

const RING = 2 * Math.PI * 9.5;

/**
 * The one control on a row. Plain rows cycle on click; target rows fill on
 * their own, so they show the same circle without taking a click.
 */
const Mark = ({ status, progress = false, ratio = 0, onCycle }) => {
  const face =
    status === DONE ? (
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    ) : status === FAILED ? (
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-rose-400 text-rose-500 dark:border-rose-500/70 dark:text-rose-400">
        <X className="h-3 w-3" strokeWidth={3} />
      </span>
    ) : progress ? (
      <svg viewBox="0 0 22 22" className="h-[22px] w-[22px] -rotate-90" aria-hidden="true">
        <circle
          cx="11"
          cy="11"
          r="9.5"
          fill="none"
          strokeWidth="2"
          className="stroke-neutral-300 dark:stroke-neutral-600"
        />
        <circle
          cx="11"
          cy="11"
          r="9.5"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={RING}
          strokeDashoffset={RING * (1 - Math.min(1, Math.max(0, ratio)))}
          className="stroke-neutral-800 transition-[stroke-dashoffset] duration-300 dark:stroke-neutral-200"
        />
      </svg>
    ) : (
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-neutral-300 text-transparent transition-colors group-hover/mark:border-neutral-500 dark:border-neutral-600 dark:group-hover/mark:border-neutral-400">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );

  if (progress) {
    return (
      <span className="mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center">{face}</span>
    );
  }

  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onCycle}
      title={NEXT_LABEL[status]}
      aria-label={NEXT_LABEL[status]}
      className="group/mark mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
    >
      {face}
    </button>
  );
};

/** A number you can type straight over — no edit mode, no buttons. */
const NumberCell = ({ value, placeholder, align, label, onChange }) => (
  <input
    type="text"
    inputMode="decimal"
    value={value}
    placeholder={placeholder}
    aria-label={label}
    title={label}
    autoComplete="off"
    onChange={onChange}
    className={cn(
      "w-11 rounded-md bg-neutral-100 px-1 py-1 text-[13px] tabular-nums text-neutral-700 outline-none transition-colors",
      "placeholder:text-neutral-400 focus:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:bg-neutral-700",
      align,
    )}
  />
);

const PersistentMark = ({ pressed, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={pressed}
    aria-label="Görevleri bütün günler için kalıcı tut"
    title="Açıkken görevler her günde aynı kalır; yalnızca yapıldı ve süreç işaretleri güne göre değişir"
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
      pressed
        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
        : "border-2 border-neutral-300 text-transparent hover:border-neutral-500 dark:border-neutral-600 dark:hover:border-neutral-400",
    )}
  >
    <Check className="h-4 w-4" strokeWidth={3} />
  </button>
);

/* -- editor ---------------------------------------------------------------- */

export const TodoEditor = ({
  title,
  todos = [],
  todoPlan,
  daily = false,
  onTitleChange,
  onTodosChange,
}) => {
  const titleRef = useRef(null);
  const draftRef = useRef(null);
  const rowRefs = useRef(new Map());
  const pendingFocusId = useRef(null);
  const [draft, setDraft] = useState("");
  const [draftTarget, setDraftTarget] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const selectedKey = dayKey(selectedDate);
  const todayKey = dayKey(new Date());
  const viewDay = daily ? selectedKey : todoDayKey();
  const visible = daily ? todosForDay(todoPlan, todos, selectedKey) : todos;
  const persistent = Boolean(todoPlan?.persistent);
  const newTarget = parseAmount(draftTarget) || 0;

  const commitVisible = (nextVisible) => {
    if (!daily) {
      onTodosChange(nextVisible);
      return;
    }
    const next = writeTodosForDay(todoPlan, todos, selectedKey, nextVisible);
    onTodosChange(next.todos, next.todoPlan);
  };

  const focusTitle = useCallback(() => {
    const field = titleRef.current;
    if (!field) return;
    EditorTitle.focusEnd(field);
  }, []);

  const focusDraft = useCallback(() => {
    const field = draftRef.current;
    if (!field) return;
    field.focus();
    const end = field.value.length;
    field.setSelectionRange(end, end);
  }, []);

  useLayoutEffect(() => {
    rowRefs.current.forEach(fitField);
    fitField(draftRef.current);

    if (pendingFocusId.current === "draft") {
      focusDraft();
      pendingFocusId.current = null;
      return;
    }
    if (!pendingFocusId.current) return;
    rowRefs.current.get(pendingFocusId.current)?.focus();
    pendingFocusId.current = null;
  }, [visible, draft, focusDraft]);

  const isBlank = !htmlToPlainText(title).trim() && visible.length === 0;
  useEffect(() => {
    if (!isBlank) return;
    const frame = window.requestAnimationFrame(focusTitle);
    return () => window.cancelAnimationFrame(frame);
    // Mount only: re-running this on every keystroke would fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchTodo = (todoId, patch) =>
    commitVisible(visible.map((todo) => (todo.id === todoId ? { ...todo, ...patch } : todo)));

  const replaceTodo = (todoId, next) =>
    commitVisible(visible.map((todo) => (todo.id === todoId ? next : todo)));

  const removeTodo = (todoId) => {
    commitVisible(visible.filter((todo) => todo.id !== todoId));
    rowRefs.current.delete(todoId);
  };

  const cycleTodo = (todo) => patchTodo(todo.id, statusPatch(nextStatus[statusOf(todo)]));

  const addFrom = (lines, target) => {
    if (lines.length === 0) return;
    pendingFocusId.current = "draft";
    commitVisible([...visible, ...lines.map((text) => makeTodo(text, target))]);
    setDraft("");
    setDraftTarget("");
  };

  /** Split the row at the caret and open a fresh one directly underneath. */
  const splitRowAt = (index, cursor) => {
    const current = visible[index];
    const newId = createId("todo");
    pendingFocusId.current = newId;
    const after = isProgressTodo(current)
      ? {
          id: newId,
          kind: TODO_KIND_PROGRESS,
          text: current.text.slice(cursor),
          target: progressTarget(current),
          logs: [],
          done: false,
        }
      : {
          id: newId,
          kind: TODO_KIND_CLASSIC,
          text: current.text.slice(cursor),
          done: false,
          failed: false,
        };
    commitVisible([
      ...visible.slice(0, index),
      { ...current, text: current.text.slice(0, cursor) },
      after,
      ...visible.slice(index + 1),
    ]);
  };

  const handleRowKeyDown = (event, index) => {
    if (event.nativeEvent.isComposing) return;
    const current = visible[index];

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (!isProgressTodo(current)) cycleTodo(current);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      splitRowAt(index, event.target.selectionStart ?? current.text.length);
      return;
    }
    if (event.key === "Backspace" && !current.text) {
      event.preventDefault();
      removeTodo(current.id);
      if (index > 0) rowRefs.current.get(visible[index - 1]?.id)?.focus();
      else focusTitle();
    }
  };

  const handleRowPaste = (event, index) => {
    const pasted = event.clipboardData?.getData("text/plain") ?? "";
    if (!pasted.includes("\n")) return;
    event.preventDefault();

    const field = event.target;
    const current = visible[index];
    const start = field.selectionStart ?? current.text.length;
    const end = field.selectionEnd ?? start;
    const lines = splitLines(
      `${current.text.slice(0, start)}${pasted}${current.text.slice(end)}`,
    );
    if (lines.length === 0) return;

    const [first, ...rest] = lines;
    const target = isProgressTodo(current) ? progressTarget(current) : 0;
    const extra = rest.map((text) => makeTodo(text, target));
    pendingFocusId.current = extra.at(-1)?.id ?? current.id;
    commitVisible([
      ...visible.slice(0, index),
      { ...current, text: first },
      ...extra,
      ...visible.slice(index + 1),
    ]);
  };

  const handleDraftKeyDown = (event) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key !== "Enter") return;
    event.preventDefault();
    addFrom(splitLines(draft), newTarget);
  };

  const handleDraftPaste = (event) => {
    const pasted = event.clipboardData?.getData("text/plain") ?? "";
    if (!pasted.includes("\n")) return;
    event.preventDefault();
    const field = event.target;
    addFrom(
      splitLines(
        `${draft.slice(0, field.selectionStart ?? draft.length)}${pasted}${draft.slice(field.selectionEnd ?? draft.length)}`,
      ),
      newTarget,
    );
  };

  const doneCount = visible.filter(
    (todo) => (isProgressTodo(todo) ? amountOnDay(todo, viewDay) >= progressTarget(todo) && progressTarget(todo) > 0 : todo.done),
  ).length;
  const canAdd = Boolean(draft.trim());
  const togglePersistent = () => {
    const next = setTodoPersistent(todoPlan, todos, selectedKey, !persistent);
    onTodosChange(next.todos, next.todoPlan);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorTitle
        value={title}
        inputRef={titleRef}
        onChange={onTitleChange}
        onSubmit={focusDraft}
      />

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        onClick={(event) => {
          if (event.target === event.currentTarget) focusDraft();
        }}
      >
        {visible.length === 0 ? (
          <p className="px-8 pt-2 text-center text-[13px] text-neutral-400 dark:text-neutral-500">
            {daily ? "Bu güne ilk görevini yaz." : "Aşağıya ilk görevini yaz."}
          </p>
        ) : (
          <>
            <p className="px-6 pb-2 text-right text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500 sm:px-10">
              {doneCount} / {visible.length}
            </p>
            <ul className="px-4 pb-2 sm:px-8">
              {visible.map((todo, index) => {
                const progress = isProgressTodo(todo);
                const target = progressTarget(todo);
                const amount = amountOnDay(todo, viewDay);
                const status = progress
                  ? target > 0 && amount >= target
                    ? DONE
                    : PENDING
                  : statusOf(todo);

                return (
                  <li
                    key={todo.id}
                    className="group/row flex w-full min-w-0 items-start gap-2 rounded-lg px-1 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                  >
                    <Mark
                      status={status}
                      progress={progress}
                      ratio={progress ? progressRatio(todo, viewDay) : 0}
                      onCycle={() => cycleTodo(todo)}
                    />

                    <textarea
                      ref={(node) => {
                        if (node) {
                          rowRefs.current.set(todo.id, node);
                          fitField(node);
                        } else {
                          rowRefs.current.delete(todo.id);
                        }
                      }}
                      rows={1}
                      value={todo.text}
                      aria-label="Görev"
                      data-undo-app="true"
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(event) => {
                        fitField(event.target);
                        patchTodo(todo.id, { text: event.target.value });
                      }}
                      onKeyDown={(event) => handleRowKeyDown(event, index)}
                      onPaste={(event) => handleRowPaste(event, index)}
                      className={cn(
                        "min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent py-2.5 text-[15px] leading-6 outline-none transition-colors",
                        status === DONE
                          ? "text-neutral-400 line-through decoration-neutral-300 dark:text-neutral-500 dark:decoration-neutral-600"
                          : status === FAILED
                            ? "text-neutral-400 line-through decoration-rose-300 dark:text-neutral-500 dark:decoration-rose-500/60"
                            : "text-neutral-800 dark:text-neutral-200",
                      )}
                    />

                    {progress ? (
                      <div className="mt-1.5 flex shrink-0 items-center gap-1">
                        <NumberCell
                          value={amount > 0 ? String(amount) : ""}
                          placeholder="0"
                          align="text-right"
                          label="Bugün yapılan"
                          onChange={(event) =>
                            replaceTodo(todo.id, setDayAmount(todo, event.target.value, viewDay))
                          }
                        />
                        <span className="text-[13px] text-neutral-300 dark:text-neutral-600">/</span>
                        <NumberCell
                          value={target > 0 ? String(target) : ""}
                          placeholder="100"
                          align="text-left"
                          label="Günlük hedef"
                          onChange={(event) =>
                            replaceTodo(todo.id, setProgressTarget(todo, event.target.value, viewDay))
                          }
                        />
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        removeTodo(todo.id);
                        focusDraft();
                      }}
                      aria-label="Sil"
                      title="Sil"
                      className={cn(
                        "mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-300",
                        "opacity-0 transition group-hover/row:opacity-100 focus-visible:opacity-100",
                        "hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-300",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
                      )}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="shrink-0">
        <div className="px-4 pt-2 sm:px-8">
          <div className="flex items-end gap-2 rounded-xl border border-neutral-200 bg-white px-2 py-1.5 transition-colors focus-within:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:border-neutral-500">
            <textarea
              ref={(node) => {
                draftRef.current = node;
                fitField(node);
              }}
              rows={1}
              value={draft}
              placeholder="Yeni görev…"
              aria-label="Yeni görev"
              data-undo-app="true"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                fitField(event.target);
                setDraft(event.target.value);
              }}
              onKeyDown={handleDraftKeyDown}
              onPaste={handleDraftPaste}
              className="min-h-[2rem] w-full min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent px-1 py-1.5 text-[15px] leading-6 text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200 dark:placeholder:text-neutral-500"
            />

            <input
              type="text"
              inputMode="decimal"
              value={draftTarget}
              placeholder="günlük hedef"
              aria-label="Günlük hedef"
              title="Sayı yazarsan görev günlük hedefli olur"
              autoComplete="off"
              onChange={(event) => setDraftTarget(event.target.value)}
              onKeyDown={handleDraftKeyDown}
              className="mb-0.5 h-8 w-28 shrink-0 rounded-lg bg-neutral-100 px-2 text-[13px] tabular-nums text-neutral-700 outline-none transition-colors placeholder:text-[12px] placeholder:text-neutral-400 focus:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:bg-neutral-700"
            />

            <button
              type="button"
              disabled={!canAdd}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                addFrom(splitLines(draft), newTarget);
                focusDraft();
              }}
              aria-label="Ekle"
              title="Ekle"
              className={cn(
                "mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
                canAdd
                  ? "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
                  : "cursor-not-allowed bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600",
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {daily ? (
          <div className="relative">
            <DayStrip
              className="pr-14 sm:pr-16"
              selectedDate={selectedDate}
              todayKey={todayKey}
              hasEntry={(key) => dayHasTodos(todoPlan, todos, key)}
              onSelect={setSelectedDate}
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center sm:right-6">
              <div className="pointer-events-auto">
                <PersistentMark pressed={persistent} onToggle={togglePersistent} />
              </div>
            </div>
          </div>
        ) : null}

        <p className="px-4 pt-2 pb-3 text-[11px] leading-4 text-neutral-400 dark:text-neutral-500 sm:px-8">
          {daily
            ? persistent
              ? "Kalıcı işaret açık: görevler her günde aynı kalır; yalnızca yapıldı ve süreç o güne aittir."
              : "Tarih çubuğuyla gün değiştir. Sağ alttaki işaret görevleri bütün günlere taşır."
            : "Daireye bas: bekliyor → başarılı → başarısız · Sayı hedefi verirsen görev, o sayıya ulaşınca kendi işaretlenir"}
        </p>
      </div>
    </div>
  );
};
