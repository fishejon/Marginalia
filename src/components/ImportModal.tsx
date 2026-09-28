import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
  Info,
} from 'lucide-react';
import { Entry } from '../types';
import {
  parseGoodreadsCsv,
  countExistingMatches,
  openLibraryCoverUrl,
  GoodreadsParseResult,
} from '../utils/goodreadsImport';
import { resolveCovers } from '../utils/api';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEntries: Entry[];
  /** Persists the parsed entries. Resolves once every write has committed. */
  onImport: (entries: Entry[], onProgress: (written: number, total: number) => void) => Promise<void>;
  isSignedIn: boolean;
}

type Stage = 'choose' | 'preview' | 'importing' | 'done';

/**
 * Rough ceiling for the guest-mode localStorage budget. Browsers allow around 5MB;
 * staying well under avoids a mid-import QuotaExceededError that would leave the
 * library half-written.
 */
const GUEST_BYTE_BUDGET = 3_500_000;

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  existingEntries,
  onImport,
  isSignedIn,
}) => {
  const [stage, setStage] = useState<Stage>('choose');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<GoodreadsParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ written: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setStage('choose');
    setFileName('');
    setResult(null);
    setParseError(null);
    setImportError(null);
    setProgress({ written: 0, total: 0 });
  };

  const handleClose = () => {
    // Refuse to close mid-write; a partial import is confusing to recover from.
    if (stage === 'importing') return;
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setParseError(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const parsed = parseGoodreadsCsv(text);

      if (parsed.entries.length === 0) {
        setParseError(
          parsed.skippedNotRead > 0
            ? `Found ${parsed.skippedNotRead} books, but none are on your "read" shelf. Only books you have finished are imported.`
            : 'No importable books found in that file.'
        );
        return;
      }

      setResult(parsed);
      setStage('preview');
    } catch (err: any) {
      setParseError(err?.message || 'Could not read that file.');
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so selecting the same file again re-triggers change.
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const duplicateCount = result ? countExistingMatches(existingEntries, result.entries) : 0;
  const newCount = result ? result.entries.length - duplicateCount : 0;

  // Estimate the guest-mode payload so we can warn before writing rather than after.
  const projectedBytes = result
    ? new Blob([JSON.stringify([...existingEntries, ...result.entries])]).size
    : 0;
  const exceedsGuestBudget = !isSignedIn && projectedBytes > GUEST_BYTE_BUDGET;

  const runImport = async () => {
    if (!result) return;
    setStage('importing');
    setImportError(null);
    setProgress({ written: 0, total: result.entries.length });

    // Attach covers we can derive for free from the ISBN. No API call, no quota.
    const withCovers = result.entries.map((entry) =>
      entry.coverUrl ? entry : { ...entry, coverUrl: openLibraryCoverUrl(entry.isbn) }
    );

    // Whatever is still uncovered had no usable ISBN. Ask the server to look those up,
    // in small chunks, stopping early if Google Books starts rate limiting. This is
    // best-effort: any failure just means a placeholder cover.
    const needsLookup = withCovers.filter((e) => !e.coverUrl);
    if (needsLookup.length > 0) {
      const CHUNK = 40;
      const resolved: Record<string, string> = {};

      for (let i = 0; i < needsLookup.length; i += CHUNK) {
        const chunk = needsLookup.slice(i, i + CHUNK);
        const { covers, rateLimited } = await resolveCovers(
          chunk.map((e) => ({ id: e.id, title: e.title, author: e.author }))
        );
        Object.assign(resolved, covers);
        if (rateLimited) break;
      }

      for (const entry of withCovers) {
        if (!entry.coverUrl && resolved[entry.id]) {
          entry.coverUrl = resolved[entry.id];
        }
      }
    }

    try {
      await onImport(withCovers, (written, total) => setProgress({ written, total }));
      setStage('done');
    } catch (err: any) {
      console.error('Import failed:', err);
      setImportError(err?.message || 'The import could not be completed.');
      setStage('preview');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white rounded-2xl border border-[#E7E2D8] max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DA] bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#9A3412] text-white flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">Import Reading History</h2>
              <p className="text-[11px] text-stone-500 font-sans">
                Bring your finished books across from Goodreads
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={stage === 'importing'}
            aria-label="Close import dialog"
            className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-200/50 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STAGE: choose a file */}
          {stage === 'choose' && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                  isDragging
                    ? 'border-[#9A3412] bg-[#FBECE4]'
                    : 'border-[#D5CCBA] bg-[#FAF8F5] hover:border-stone-400'
                }`}
              >
                <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-sm font-serif text-stone-800 mb-1">
                  Drop your Goodreads export here
                </p>
                <p className="text-xs text-stone-500 font-sans mb-4">
                  The file is named <code className="font-mono">goodreads_library_export.csv</code>
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onFileInput}
                  className="hidden"
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#F8F5EE] border border-[#E7E2D8] text-xs text-stone-600 font-sans">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-stone-400" />
                <span>
                  Only books on your <strong>read</strong> shelf are imported. Your reflection
                  pillars stay blank so you can write them deliberately, but any Goodreads review
                  you wrote is kept alongside the entry for reference.
                </span>
              </div>

              <details className="text-xs text-stone-500 font-sans">
                <summary className="cursor-pointer hover:text-stone-800">
                  How do I export from Goodreads?
                </summary>
                <p className="mt-2 leading-relaxed">
                  On Goodreads go to <em>My Books</em>, choose <em>Import and export</em> in the
                  left sidebar, then click <em>Export Library</em>. Goodreads emails you a CSV.
                </p>
              </details>

              {parseError && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{parseError}</span>
                </div>
              )}
            </>
          )}

          {/* STAGE: preview before committing anything */}
          {stage === 'preview' && result && (
            <>
              <div className="flex items-center gap-2 text-xs text-stone-500 font-sans">
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">{fileName}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#F8F5EE] border border-[#E7E2D8] text-center">
                  <div className="text-2xl font-serif font-bold text-stone-900">{newCount}</div>
                  <div className="text-[11px] text-stone-500 font-sans mt-0.5">New books</div>
                </div>
                <div className="p-4 rounded-xl bg-[#F8F5EE] border border-[#E7E2D8] text-center">
                  <div className="text-2xl font-serif font-bold text-stone-900">
                    {duplicateCount}
                  </div>
                  <div className="text-[11px] text-stone-500 font-sans mt-0.5">Already in vault</div>
                </div>
                <div className="p-4 rounded-xl bg-[#F8F5EE] border border-[#E7E2D8] text-center">
                  <div className="text-2xl font-serif font-bold text-stone-900">
                    {result.skippedNotRead}
                  </div>
                  <div className="text-[11px] text-stone-500 font-sans mt-0.5">Not yet read</div>
                </div>
              </div>

              {duplicateCount > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[#F8F5EE] border border-[#E7E2D8] text-xs text-stone-600 font-sans">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-stone-400" />
                  <span>
                    {duplicateCount} {duplicateCount === 1 ? 'book is' : 'books are'} already in your
                    vault and will be refreshed. Your reflections, quotes and AI synthesis on{' '}
                    {duplicateCount === 1 ? 'it' : 'them'} will not be touched.
                  </span>
                </div>
              )}

              {/* A sample so the user can eyeball that parsing actually worked. */}
              <div>
                <div className="text-[11px] uppercase tracking-wider font-mono font-bold text-stone-500 mb-2">
                  Preview
                </div>
                <div className="rounded-xl border border-[#E7E2D8] divide-y divide-[#F0EBE1] overflow-hidden">
                  {result.entries.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-white">
                      <BookOpen className="w-4 h-4 text-stone-300 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-stone-900 truncate">
                          {entry.title}
                        </div>
                        <div className="text-[11px] text-stone-500 font-sans truncate">
                          {entry.author} &middot; {entry.dateLogged}
                          {entry.rating > 0 ? ` · ${entry.rating}/5` : ' · Unrated'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {result.entries.length > 4 && (
                    <div className="p-2 text-center text-[11px] text-stone-400 font-sans bg-[#FAF8F5]">
                      and {result.entries.length - 4} more
                    </div>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-amber-700 hover:text-amber-900 font-medium">
                    {result.errors.length} row{result.errors.length === 1 ? '' : 's'} could not be
                    read and will be skipped
                  </summary>
                  <ul className="mt-2 space-y-1 text-stone-600 font-sans max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 20).map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {exceedsGuestBudget && (
                <div
                  role="alert"
                  className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    This import is too large for guest mode, which stores your library in this
                    browser only. Sign in first so it can be saved to your cloud vault.
                  </span>
                </div>
              )}

              {importError && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{importError}</span>
                </div>
              )}
            </>
          )}

          {/* STAGE: writing */}
          {stage === 'importing' && (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#9A3412] mx-auto" />
              <p className="text-sm font-serif text-stone-700">
                Importing {progress.written} of {progress.total} books...
              </p>
              <div className="w-full h-1.5 bg-[#F0EBE1] rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="h-full bg-[#9A3412] transition-all duration-300"
                  style={{
                    width: `${progress.total ? (progress.written / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* STAGE: finished */}
          {stage === 'done' && result && (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-serif font-semibold text-stone-900">
                {result.entries.length} book{result.entries.length === 1 ? '' : 's'} imported
              </h3>
              <p className="text-xs text-stone-600 font-sans max-w-sm mx-auto leading-relaxed">
                Your shelf is populated. The reflection pillars are intentionally blank — open any
                book in the Reflection Studio when you are ready to write them.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {stage !== 'importing' && (
          <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE5DA] flex items-center justify-end gap-3">
            {stage === 'preview' && (
              <>
                <button
                  onClick={reset}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
                >
                  Choose a different file
                </button>
                <button
                  onClick={runImport}
                  disabled={exceedsGuestBudget}
                  className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import {result?.entries.length} book{result?.entries.length === 1 ? '' : 's'}
                </button>
              </>
            )}
            {stage === 'done' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Done
              </button>
            )}
            {stage === 'choose' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
