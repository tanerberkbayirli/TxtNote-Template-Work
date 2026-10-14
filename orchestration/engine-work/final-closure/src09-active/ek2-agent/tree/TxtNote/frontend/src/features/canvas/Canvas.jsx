/**
 * Canvas router: renders whatever the active tab or nav link points at.
 */

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { CanvasMessage } from "./CanvasMessage";
import { FilePreview } from "./FilePreview";
import { AppearanceView } from "../appearance/AppearanceView";
import { ProfileView } from "../profile/ProfileView";
import { HelpView } from "../help/HelpView";
import { PremiumView } from "../premium/PremiumView";
import { SettingsView } from "../settings/SettingsView";
import { DiaryEditor } from "../editor/DiaryEditor";
import { NoteEditor } from "../editor/NoteEditor";
import { AcademicEditor } from "../editor/AcademicEditor";
import { TodoEditor } from "../editor/TodoEditor";
import { MindmapEditor } from "../mindmap/MindmapEditor";
import { TrashView } from "../trash/TrashView";
// geçici denetleme barı — kullanıcı ikinci bir komut verene kadar gizli
// import { SyncTestPanel } from "../sync/SyncTestPanel";
import { ITEM_TYPE_FILE } from "../../lib/upload";
import { isTextEditableFile } from "../../lib/fileType";
import { UPLOAD_TEXT_MAX_BYTES } from "../../config/limits";
import { CodeFileEditor } from "../editor/CodeFileEditor";
import { TemplateLibrary } from "../templates/TemplateLibrary";
import { FlashcardEditor } from "../flashcards/FlashcardEditor";

const ThesisEditor = React.lazy(() =>
  import("../editor/ThesisEditor").then((mod) => ({ default: mod.ThesisEditor })),
);

export const Canvas = ({
  tab,
  navId,
  navLabel,
  navIcon,
  trash,
  isTrashEnabled,
  onTrashToggle,
  onTrashRestore,
  onTrashDeleteForever,
  onTrashEmpty,
  note,
  onTitleChange,
  onContentChange,
  onNoteChange,
  theme,
  onThemeChange,
  themeSchedule,
  onThemeScheduleToggle,
  onThemeScheduleRuleChange,
  profile,
  onDisplayNameChange,
  isCryptoUser,
  onLogout,
  onTestExportEncryptedDb,
  onBlindRelaySend,
  onBlindRelayOpen,
  onDeviceWipe,
  onRestoreFromKey,
  onReloadApp,
  updateNotificationsEnabled,
  onUpdateNotificationsToggle,
  updateAvailable,
  updateVersion,
  updateStatus,
  updateProgress,
  updateError,
  onCheckUpdate,
  onInstallUpdate,
  autoLock,
  onAutoLockChange,
  planTier,
  peerDebounceSeconds,
  onPeerDebounceChange,
  cloudIntervalMinutes,
  onCloudIntervalChange,
  sync,
  helpFocusSection,
  onReplaceFile,
  onExtractArchive,
  pinnedTemplateIds,
  onTogglePinnedTemplate,
  onUseTemplate,
  onCreateThesis,
}) => {
  if (tab?.type === "system" && tab.noteType === "templates") {
    return (
      <TemplateLibrary
        pinnedTemplateIds={pinnedTemplateIds}
        onTogglePinned={onTogglePinnedTemplate}
        onUseTemplate={onUseTemplate}
        onCreateThesis={onCreateThesis}
      />
    );
  }

  // Settings: update alerts, language, auto lock, backup tools.
  if (navId === "settings") {
    return (
      <SettingsView
        updateNotificationsEnabled={updateNotificationsEnabled}
        onUpdateNotificationsToggle={onUpdateNotificationsToggle}
        updateAvailable={updateAvailable}
        updateVersion={updateVersion}
        updateStatus={updateStatus}
        updateProgress={updateProgress}
        updateError={updateError}
        onCheckUpdate={onCheckUpdate}
        onInstallUpdate={onInstallUpdate}
        autoLock={autoLock}
        onAutoLockChange={onAutoLockChange}
        planTier={planTier}
        peerDebounceSeconds={peerDebounceSeconds}
        onPeerDebounceChange={onPeerDebounceChange}
        cloudIntervalMinutes={cloudIntervalMinutes}
        onCloudIntervalChange={onCloudIntervalChange}
      />
    );
  }

  // Profile: display name, account facts, linked devices.
  if (navId === "profile") {
    return (
      <ProfileView
        profile={profile}
        onDisplayNameChange={onDisplayNameChange}
        isCryptoUser={isCryptoUser}
        onLogout={onLogout}
        onTestExportEncryptedDb={onTestExportEncryptedDb}
        onBlindRelaySend={onBlindRelaySend}
        onBlindRelayOpen={onBlindRelayOpen}
        onDeviceWipe={onDeviceWipe}
        onRestoreFromKey={onRestoreFromKey}
        onReloadApp={onReloadApp}
      />
    );
  }

  // Premium: plan comparison and upgrade options.
  if (navId === "premium") {
    return <PremiumView currentTier={planTier} />;
  }

  // Appearance: theme choice and the clock-based switcher.
  if (navId === "appearance") {
    return (
      <AppearanceView
        theme={theme}
        onThemeChange={onThemeChange}
        schedule={themeSchedule}
        onScheduleToggle={onThemeScheduleToggle}
        onScheduleRuleChange={onThemeScheduleRuleChange}
      />
    );
  }

  // Help: intro, FAQ and contact placeholders.
  if (navId === "help") {
    return <HelpView focusSection={helpFocusSection} />;
  }

  // The trash is the other system link with a real screen behind it.
  if (navId === "trash") {
    return (
      <TrashView
        entries={trash}
        isEnabled={isTrashEnabled}
        onToggle={onTrashToggle}
        onRestore={onTrashRestore}
        onDeleteForever={onTrashDeleteForever}
        onEmptyAll={onTrashEmpty}
      />
    );
  }

  if (navLabel) {
    return (
      <CanvasMessage icon={navIcon} heading={navLabel}>
        Bu bölüm demoda boş. Sekmelerin açık kaldı — birine tıkla, kaldığın yerden devam et.
      </CanvasMessage>
    );
  }

  if (!tab) {
    return (
      <CanvasMessage heading="Henüz bir içerik açmadın">
        Soldaki listeden bir içeriğe tıkla; yukarıda sekme olarak açılır.
      </CanvasMessage>
    );
  }

  // An upload shows itself: code in the editor, everything else as a preview.
  if (tab.type === ITEM_TYPE_FILE) {
    if (isTextEditableFile(tab)) {
      return (
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
      );
    }
    return (
      <FilePreview
        tab={tab}
        onTitleChange={onTitleChange ? (value) => onTitleChange(tab.id, value) : undefined}
        onReplaceFile={onReplaceFile}
        onExtractArchive={onExtractArchive}
      />
    );
  }

  // Fixture media has no file behind it — title and empty frame, nothing else.
  if (tab.type === "media") {
    return (
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
    );
  }

  let editor = null;

  // Checklist note: rows with a check that strikes the task through.
  if (tab.noteType === "todo") {
    editor = (
      <TodoEditor
        key={tab.id}
        title={note?.title ?? ""}
        todos={note?.todos ?? []}
        todoPlan={note?.todoPlan}
        daily={Boolean(note?.todoDaily || note?.todoPlan)}
        onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
        onTodosChange={(todos, todoPlan) =>
          onNoteChange(tab.id, todoPlan ? { todos, todoPlan, todoDaily: true } : { todos })
        }
      />
    );
  } else if (tab.noteType === "mindmap") {
    // Mindmap note: component palette on the left, pannable 2D canvas on the right.
    editor = (
      <MindmapEditor
        key={tab.id}
        title={note?.title ?? ""}
        mindmap={note?.mindmap}
        onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
        onMindmapChange={(mindmap) => onNoteChange(tab.id, { mindmap })}
      />
    );
  } else if (tab.noteType === "diary") {
    // Diary note: one page per day, dates pinned under the writing area.
    editor = (
      <DiaryEditor
        key={tab.id}
        title={note?.title ?? ""}
        entries={note?.entries ?? {}}
        onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
        onEntriesChange={(entries, reason) => onNoteChange(tab.id, { entries }, reason)}
      />
    );
  } else if (tab.noteType === "thesis" || (tab.noteType === "academic" && note?.researchData?.thesis?.document?.source?.format === "pdf")) {
    editor = (
      <ThesisEditor key={tab.id} title={note?.title ?? ""} content={note?.content ?? ""}
        onDocumentChange={(value) => onNoteChange(tab.id, value, "action")}
        researchData={note?.researchData}
        onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
        onContentChange={(value, reason) => onContentChange(tab.id, value, reason)}
          onResearchDataChange={(researchData, reason) => onNoteChange(tab.id, { researchData }, reason)} />
    );
  } else if (tab.noteType === "academic") {
    editor = (
      <AcademicEditor
        onDocumentChange={(value)=>onNoteChange(tab.id,value,'action')}
        key={tab.id}
        title={note?.title ?? ""}
        content={note?.content ?? ""}
        researchData={note?.researchData}
        onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
        onContentChange={(value, reason) => onContentChange(tab.id, value, reason)}
        onResearchDataChange={(researchData) => onNoteChange(tab.id, { researchData })}
      />
    );
  } else if (tab.noteType === "flashcards") {
    editor = (
      <FlashcardEditor
        key={tab.id}
        title={note?.title ?? ""}
        flashcards={note?.flashcards}
        onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
        onFlashcardsChange={(deck) => onNoteChange(tab.id, { flashcards: deck })}
      />
    );
  } else {
    // Keyed by note: each one gets its own fresh refs, measurement and focus.
    editor = (
      <NoteEditor
        key={tab.id}
        title={note?.title ?? ""}
        content={note?.content ?? ""}
        onTitleChange={(value, reason) => onTitleChange(tab.id, value, reason)}
        onContentChange={(value, reason) => onContentChange(tab.id, value, reason)}
      />
    );
  }

  // geçici denetleme barı — SyncTestPanel şu an null dönüyor; sarıcıya gerek yok
  void sync;
  void planTier;
  return editor;
};

/* ========================================================================== */
/*  Demo shell — this is what the Artifact preview actually renders           */
/* ========================================================================== */
