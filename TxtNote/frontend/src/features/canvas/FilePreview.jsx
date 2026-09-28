/**
 * Canvas view for an uploaded file: shows the thing itself where the browser
 * can render it, and an honest download card where it cannot.
 * HTML and other source is not rendered here — those open in the code editor.
 */

import React, { useRef, useState } from "react";
import { Download, FolderOpen, FolderUp, Upload } from "lucide-react";
import { FileTypeIcon } from "../../components/ui/FileTypeIcon";
import { downloadViaAnchor, openOrDownloadFile } from "../../lib/fileAccess";
import { FILE_KIND, FILE_KIND_LABEL, formatFileSize, isExtractableArchive, resolveItemKind } from "../../lib/fileType";
import { hasSessionFile } from "../../lib/fileSession";

const Frame = ({ tab, kind, onTitleChange, children }) => {
  const [draft, setDraft] = React.useState(tab.title);

  React.useEffect(() => {
    setDraft(tab.title);
  }, [tab.title]);

  const commitTitle = () => {
    if (!onTitleChange) return;
    onTitleChange(draft);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-8 py-10">
        <div className="flex items-start gap-3">
          <FileTypeIcon kind={kind} className="mt-1 h-6 w-6" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            {onTitleChange ? (
              <input
                value={draft}
                aria-label="Dosya adı"
                placeholder="Dosya adı"
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commitTitle}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
                className="w-full border-b border-neutral-300 bg-transparent pb-1 text-2xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus-visible:ring-0 dark:border-neutral-600 dark:text-neutral-50 dark:focus:border-neutral-100"
              />
            ) : (
              <h1 className="truncate text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                {tab.title}
              </h1>
            )}
            <p className="mt-1 truncate text-[13px] text-neutral-500 dark:text-neutral-400">
              {[FILE_KIND_LABEL[kind], tab.fileName, formatFileSize(tab.fileSize)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
};

const Action = ({ children, onClick, as = "button", href, download }) => {
  const className =
    "mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-neutral-50 transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white";
  if (as === "a") {
    return (
      <a href={href} download={download} rel="noopener" className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
};

export const FilePreview = ({ tab, onTitleChange, onReplaceFile, onExtractArchive }) => {
  const kind = resolveItemKind(tab);
  const { url, fileName, title, needsReselect, persistentAccess } = tab;
  const inputRef = useRef(null);
  const [actionError, setActionError] = useState("");
  const [extracting, setExtracting] = useState(false);

  const hasBytes = Boolean(url) || hasSessionFile(tab.id);
  const missingBytes = !hasBytes && (needsReselect || persistentAccess === false);

  const openFile = async () => {
    setActionError("");
    try {
      await openOrDownloadFile(tab);
    } catch (error) {
      setActionError(error?.message || "Dosya açılamadı.");
    }
  };

  const extractArchive = async () => {
    if (!onExtractArchive) return;
    setActionError("");
    setExtracting(true);
    try {
      await onExtractArchive(tab);
    } catch (error) {
      setActionError(error?.message || "Arşiv açılamadı.");
    } finally {
      setExtracting(false);
    }
  };

  const onPicked = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    onReplaceFile?.(tab.id, file);
  };

  if (url && kind === FILE_KIND.IMAGE) {
    return (
      <Frame tab={tab} kind={kind} onTitleChange={onTitleChange}>
        <img
          src={url}
          alt={title}
          className="max-h-[65vh] w-auto rounded-lg border border-neutral-200 object-contain dark:border-neutral-800"
        />
      </Frame>
    );
  }

  if (url && kind === FILE_KIND.VIDEO) {
    return (
      <Frame tab={tab} kind={kind} onTitleChange={onTitleChange}>
        <video
          src={url}
          controls
          className="max-h-[65vh] w-full rounded-lg border border-neutral-200 bg-black dark:border-neutral-800"
        />
      </Frame>
    );
  }

  if (url && kind === FILE_KIND.AUDIO) {
    return (
      <Frame tab={tab} kind={kind} onTitleChange={onTitleChange}>
        <audio src={url} controls className="w-full" />
      </Frame>
    );
  }

  if (url && kind === FILE_KIND.PDF) {
    return (
      <Frame tab={tab} kind={kind} onTitleChange={onTitleChange}>
        <iframe
          src={url}
          title={title}
          className="h-[70vh] w-full rounded-lg border border-neutral-200 bg-white dark:border-neutral-800"
        />
      </Frame>
    );
  }

  return (
    <Frame tab={tab} kind={kind} onTitleChange={onTitleChange}>
      <div className="flex flex-col items-center rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center dark:border-neutral-700">
        <FileTypeIcon kind={kind} className="h-10 w-10" strokeWidth={1.25} />
        <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {missingBytes
            ? "Bu dosyanın içeriği kalıcı olarak saklanmadı. Geçici bağlantılar oturumdan sonra geçersiz olur. Açmak veya indirmek için dosyayı yeniden seç."
            : url
              ? "Bu dosya türü uygulama içinde çalıştırılmaz. İşletim sistemi izin verirse açabilir veya indirebilirsin."
              : "Bu dosyanın önizlemesi yok. Yeniden seçerek bağlayabilirsin."}
        </p>

        {actionError && (
          <p role="alert" className="mt-3 text-[12px] text-amber-700 dark:text-amber-400">
            {actionError}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {hasBytes && (
            <Action onClick={openFile}>
              <FolderOpen className="h-4 w-4" strokeWidth={2} />
              Aç / İndir
            </Action>
          )}
          {url && (
            <Action as="a" href={url} download={fileName || title}>
              <Download className="h-4 w-4" strokeWidth={2} />
              İndir
            </Action>
          )}
          {isExtractableArchive({ name: tab.fileName || tab.title, type: tab.mimeType }) && typeof onExtractArchive === "function" && hasBytes && (
            <Action onClick={extractArchive}>
              <FolderUp className="h-4 w-4" strokeWidth={2} />
              {extracting ? "Açılıyor…" : "Arşivi klasöre aç"}
            </Action>
          )}
          {typeof onReplaceFile === "function" && (
            <>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={onPicked}
                tabIndex={-1}
                aria-hidden="true"
              />
              <Action onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" strokeWidth={2} />
                Dosyayı yeniden seç
              </Action>
            </>
          )}
        </div>
      </div>
    </Frame>
  );
};
