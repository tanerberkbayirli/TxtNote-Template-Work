/**
 * One editor surface: the document/file that a work-area pane is showing.
 * Nav screens stay on Canvas; this is only tab content.
 */

import React, { lazy, Suspense } from "react";
import { Image as ImageIcon } from "lucide-react";
import { NoteEditor } from "../editor/NoteEditor";
import { AcademicEditor } from "../editor/AcademicEditor";
import { ITEM_TYPE_FILE } from "../../lib/upload";
import { isTextEditableFile } from "../../lib/fileType";
import { UPLOAD_TEXT_MAX_BYTES } from "../../config/limits";

const FilePreview = lazy(() =>
  import("../canvas/FilePreview").then((mod) => ({ default: mod.FilePreview })),
);
const CodeFileEditor = lazy(() =>
  import("../editor/CodeFileEditor").then((mod) => ({ default: mod.CodeFileEditor })),
);
const DiaryEditor = lazy(() =>
  import("../editor/DiaryEditor").then((mod) => ({ default: mod.DiaryEditor })),
);
const TodoEditor = lazy(() =>
  import("../editor/TodoEditor").then((mod) => ({ default: mod.TodoEditor })),
);
const MindmapEditor = lazy(() =>
  import("../mindmap/MindmapEditor").then((mod) => ({ default: mod.MindmapEditor })),
);
const FlashcardEditor = lazy(() =>
  import("../flashcards/FlashcardEditor").then((mod) => ({ default: mod.FlashcardEditor })),
);
const ThesisEditor = lazy(() =>
  import("../editor/ThesisEditor").then((mod) => ({ default: mod.ThesisEditor })),
);

const PaneFallback = () => (
  <div className="flex h-full items-center justify-center text-[15px] text-neutral-500 dark:text-neutral-400">
    Yükleniyor…
  </div>
);

export const DocumentPane = ({
  tab,
  note,
  onTitleChange,
  onContentChange,
  onNoteChange,
  onCreateAcademicFromTemplate,
  onReplaceFile,
  onExtractArchive,
}) => {
  if (!tab) return null;

  const codeFile = tab.type === ITEM_TYPE_FILE && isTextEditableFile(tab);
  const needsBody = (tab.type !== ITEM_TYPE_FILE && tab.type !== "media") || codeFile;
  if (needsBody && !note) return <PaneFallback />;

  return (
    <Suspense fallback={<PaneFallback />}>
      {codeFile ? (
        <CodeFileEditor
          key={tab.id}
          title={note?.title ?? tab.title ?? ""}
          fileName={tab.fileName}
          content={note?.content ?? ""}
          sourceUrl={
            note?.content || (tab.fileSize || 0) > UPLOAD_TEXT_MAX_BYTES ? undefined : tab.url
          }
          encoding={note?.encoding ?? tab.encoding}
          languageId={note?.languageId}
          languageLocked={Boolean(note?.languageLocked)}
          mimeType={tab.mimeType}
          onTitleChange={(value, reason) => onTitleChange?.(tab.id, value, reason)}
          onContentChange={(value, reason) => onContentChange?.(tab.id, value, reason)}
          onLanguageChange={(id, locked) =>
            onNoteChange?.(tab.id, { languageId: id, languageLocked: locked })
          }
        />
      ) : tab.type === ITEM_TYPE_FILE ? (
        <FilePreview
          tab={tab}
          onTitleChange={onTitleChange ? (value) => onTitleChange(tab.id, value) : undefined}
          onReplaceFile={onReplaceFile}
          onExtractArchive={onExtractArchive}
        />
      ) : tab.type === "media" ? (
        <div className="h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-8 py-10">
            <h1 className="truncate text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {tab.title}
            </h1>
            <div className="mt-6 flex h-52 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
              <ImageIcon className="h-8 w-8 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      ) : tab.noteType === "todo" ? (
        <TodoEditor
          key={tab.id}
          title={note?.title ?? ""}
          todos={note?.todos ?? []}
          todoPlan={note?.todoPlan}
          daily={Boolean(note?.todoDaily || note?.todoPlan)}
          onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
          onTodosChange={(todos, todoPlan) =>
            onNoteChange(
              tab.id,
              todoPlan ? { todos, todoPlan, todoDaily: true } : { todos },
            )
          }
        />
      ) : tab.noteType === "mindmap" ? (
        <MindmapEditor
          key={tab.id}
          title={note?.title ?? ""}
          mindmap={note?.mindmap}
          onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
          onMindmapChange={(mindmap) => onNoteChange(tab.id, { mindmap })}
        />
      ) : tab.noteType === "diary" ? (
        <DiaryEditor
          key={tab.id}
          title={note?.title ?? ""}
          entries={note?.entries ?? {}}
          onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
          onEntriesChange={(entries, reason) => onNoteChange(tab.id, { entries }, reason)}
        />
      ) : tab.noteType === "thesis" || (tab.noteType === "academic" && note?.researchData?.thesis?.document?.source?.format === "pdf") ? (
        <ThesisEditor key={tab.id} documentId={tab.id} title={note?.title ?? ""} content={note?.content ?? ""}
          onDocumentChange={(value) => onNoteChange(tab.id, value, "action")}
          researchData={note?.researchData}
          onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
          onContentChange={(value, reason) => onContentChange(tab.id, value, reason)}
          onResearchDataChange={(researchData, reason) => onNoteChange(tab.id, { researchData }, reason)} />
      ) : tab.noteType === "academic" ? (
        <AcademicEditor
          key={tab.id}
          title={note?.title ?? ""}
          content={note?.content ?? ""}
          researchData={note?.researchData}
          onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
          onContentChange={(value, reason) => onContentChange(tab.id, value, reason)}
          onResearchDataChange={(researchData) => onNoteChange(tab.id, { researchData })}
          onCreateFromTemplate={(seed) => onCreateAcademicFromTemplate?.(tab.id, seed)}
          onDocumentChange={(value)=>onNoteChange(tab.id,value,'action')}
        />
      ) : tab.noteType === "flashcards" ? (
        <FlashcardEditor
          key={tab.id}
          title={note?.title ?? ""}
          flashcards={note?.flashcards}
          onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
          onFlashcardsChange={(deck) => onNoteChange(tab.id, { flashcards: deck })}
        />
      ) : (
        <NoteEditor
          key={tab.id}
          title={note?.title ?? ""}
          content={note?.content ?? ""}
          onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
          onContentChange={(value, reason) => onContentChange(tab.id, value, reason)}
        />
      )}
    </Suspense>
  );
};
