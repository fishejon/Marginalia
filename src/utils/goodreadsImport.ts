import { Entry } from '../types';

/**
 * Parsing for Goodreads `goodreads_library_export.csv`.
 *
 * Framework-free and side-effect-free so it can be unit tested directly.
 *
 * Design notes:
 * - Columns are resolved by header NAME, never by position. Goodreads has changed
 *   column order before and positional parsing fails silently when it does.
 * - A missing required header is a hard error. A bad import that looks plausible
 *   is far more damaging than one that refuses to run.
 */

/** Headers we genuinely cannot proceed without. */
const REQUIRED_HEADERS = ['Book Id', 'Title', 'Author', 'Exclusive Shelf'] as const;

/**
 * Goodreads shelf names that are bookkeeping rather than user intent. These are
 * stripped from the tag list so imported entries aren't all tagged "read".
 */
const RESERVED_SHELVES = new Set(['read', 'to-read', 'currently-reading']);

/**
 * Entry keys that an import is allowed to write. Anything absent from this list is
 * user-authored and must survive a re-import untouched — notably the three pillars,
 * `synthesis`, `clubDiscussion`, and `quotes`.
 */
export const IMPORT_OWNED_FIELDS = [
  'title',
  'author',
  'medium',
  'coverUrl',
  'dateLogged',
  'rating',
  'tags',
  'status',
  'isbn',
  'goodreadsBookId',
  'importedReview',
  'importedNotes',
  'importedAt',
] as const satisfies readonly (keyof Entry)[];

export interface GoodreadsParseResult {
  /** Rows that became importable entries. */
  entries: Entry[];
  /** Rows deliberately skipped because they are not on the "read" shelf. */
  skippedNotRead: number;
  /** Rows that could not be parsed, with a reason. Import continues without them. */
  errors: Array<{ row: number; reason: string }>;
  /** Total data rows seen, excluding the header. */
  totalRows: number;
}

export class GoodreadsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoodreadsParseError';
  }
}

/**
 * RFC 4180 CSV tokenizer.
 *
 * Handles quoted fields containing commas, embedded newlines, and doubled quotes
 * (`""` as a literal `"`). Goodreads review text routinely contains all three, so a
 * naive `split(',')` mangles real exports.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  // Strip a UTF-8 BOM, which Goodreads sometimes emits and which would otherwise
  // corrupt the first header name.
  if (text.charCodeAt(0) === 0xfeff) {
    i = 1;
  }

  const pushField = () => {
    row.push(field);
    field = '';
  };

  const pushRow = () => {
    pushField();
    // Skip rows that are entirely empty (trailing newline at end of file).
    if (row.length > 1 || row[0] !== '') {
      rows.push(row);
    }
    row = [];
  };

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === ',') {
      pushField();
      i += 1;
      continue;
    }

    if (char === '\r') {
      // Normalise CRLF and lone CR to a single row break.
      if (text[i + 1] === '\n') {
        i += 1;
      }
      pushRow();
      i += 1;
      continue;
    }

    if (char === '\n') {
      pushRow();
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // Flush whatever is left when the file doesn't end in a newline.
  if (field !== '' || row.length > 0) {
    pushRow();
  }

  return rows;
}

/**
 * Goodreads wraps identifier columns in an Excel formula escape: `="9780743273565"`,
 * and emits `=""` for missing values.
 *
 * Note the subtlety: those inner quotes are *CSV quoting*, so a conforming RFC 4180
 * tokenizer has already consumed them by the time this runs, leaving `=9780743273565`
 * and a bare `=`. Both the raw and post-tokenization forms are handled here, because
 * getting this wrong yields ISBNs like `=9780743273565` that look almost right and
 * silently break every cover lookup.
 */
export function stripExcelFormula(value: string): string {
  let v = value.trim();

  // Drop the Excel formula marker.
  if (v.startsWith('=')) {
    v = v.slice(1);
  }

  // Unwrap quotes if they survived tokenization (raw, unparsed input).
  const quoted = v.match(/^"(.*)"$/);
  if (quoted) {
    v = quoted[1];
  }

  return v.trim();
}

/** Goodreads dates are `YYYY/MM/DD`; `Entry.dateLogged` is `YYYY-MM-DD`. */
export function normalizeDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const slash = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slash) {
    const [, y, m, d] = slash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Already ISO, or close enough to it.
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return undefined;
}

/**
 * Goodreads review text contains literal HTML (`<br/>` in particular). Entries render
 * as plain text, so convert breaks to newlines and drop remaining tags rather than
 * showing markup to the user.
 */
export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** Goodreads ids are numeric; prefix so the result satisfies Firestore's id charset. */
export function goodreadsEntryId(bookId: string): string {
  return `gr-${bookId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function parseTags(bookshelves: string): string[] {
  return bookshelves
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !RESERVED_SHELVES.has(s.toLowerCase()));
}

function buildAuthor(primary: string, additional: string): string {
  const extras = additional
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const main = primary.trim();
  if (!main && extras.length === 0) return 'Unknown';
  if (extras.length === 0) return main || 'Unknown';
  return [main, ...extras].filter(Boolean).join(', ');
}

/**
 * Parses a Goodreads export into importable entries.
 *
 * Only rows on the `read` shelf are returned — the rest of the app is built around
 * reflecting on things you've actually consumed, and `Entry.status` has no
 * "want to read" state.
 *
 * @throws GoodreadsParseError if the file is empty or missing required headers.
 */
export function parseGoodreadsCsv(text: string): GoodreadsParseResult {
  const rows = parseCsv(text);

  if (rows.length === 0) {
    throw new GoodreadsParseError('That file appears to be empty.');
  }

  const headers = rows[0].map((h) => h.trim());
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new GoodreadsParseError(
      `This does not look like a Goodreads export. Missing expected column${
        missing.length === 1 ? '' : 's'
      }: ${missing.join(', ')}.`
    );
  }

  const index = new Map<string, number>();
  headers.forEach((h, i) => index.set(h, i));

  const cell = (row: string[], header: string): string => {
    const i = index.get(header);
    if (i === undefined) return '';
    return (row[i] ?? '').trim();
  };

  const entries: Entry[] = [];
  const errors: Array<{ row: number; reason: string }> = [];
  const seenIds = new Set<string>();
  let skippedNotRead = 0;
  const importedAt = new Date().toISOString();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // +1 so the number matches what a spreadsheet would show the user.
    const rowNumber = r + 1;

    try {
      if (cell(row, 'Exclusive Shelf').toLowerCase() !== 'read') {
        skippedNotRead += 1;
        continue;
      }

      const title = cell(row, 'Title');
      if (!title) {
        errors.push({ row: rowNumber, reason: 'Missing title' });
        continue;
      }

      const bookId = stripExcelFormula(cell(row, 'Book Id'));
      if (!bookId) {
        errors.push({ row: rowNumber, reason: `Missing Book Id for "${title}"` });
        continue;
      }

      const id = goodreadsEntryId(bookId);
      if (seenIds.has(id)) {
        errors.push({ row: rowNumber, reason: `Duplicate Book Id ${bookId} within the file` });
        continue;
      }
      seenIds.add(id);

      const ratingRaw = parseInt(cell(row, 'My Rating'), 10);
      // 0 and absent both mean "unrated"; clamp anything out of range.
      const rating =
        Number.isFinite(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : 0;

      const readCount = parseInt(cell(row, 'Read Count'), 10);
      const status: Entry['status'] =
        Number.isFinite(readCount) && readCount > 1 ? 'rereading' : 'completed';

      // Date Read is frequently blank on books shelved as read years ago; Date Added
      // is a worse but non-empty approximation. Falling back to today would be a lie.
      const dateLogged =
        normalizeDate(cell(row, 'Date Read')) ??
        normalizeDate(cell(row, 'Date Added')) ??
        importedAt.slice(0, 10);

      const isbn =
        stripExcelFormula(cell(row, 'ISBN13')) || stripExcelFormula(cell(row, 'ISBN')) || undefined;

      const importedReview = stripHtml(cell(row, 'My Review')) || undefined;
      const importedNotes = stripHtml(cell(row, 'Private Notes')) || undefined;

      entries.push({
        id,
        title,
        author: buildAuthor(cell(row, 'Author'), cell(row, 'Additional Authors')),
        medium: 'book',
        dateLogged,
        rating,
        tags: parseTags(cell(row, 'Bookshelves')),
        status,

        // Pillars are intentionally blank. Imported prose must not masquerade as
        // deliberate reflection; the review is preserved separately below.
        whatImThinking: '',
        whyILikedIt: '',
        howIllUseItGoingForward: '',
        clubDiscussion: [],
        quotes: [],

        isbn,
        goodreadsBookId: bookId,
        importedReview,
        importedNotes,
        importedAt,
      });
    } catch (err: any) {
      errors.push({ row: rowNumber, reason: err?.message || 'Unparseable row' });
    }
  }

  return {
    entries,
    skippedNotRead,
    errors,
    totalRows: Math.max(0, rows.length - 1),
  };
}

/**
 * Folds an imported row into an entry that already exists in the vault.
 *
 * Only `IMPORT_OWNED_FIELDS` are copied across. Everything else — crucially the three
 * pillars, `synthesis`, `clubDiscussion` and `quotes` — is preserved, so re-importing
 * an updated export never destroys reflection work done since the last import.
 */
export function applyImportToExisting(existing: Entry, imported: Entry): Entry {
  const merged: Entry = { ...existing };

  for (const key of IMPORT_OWNED_FIELDS) {
    const value = imported[key];
    if (value !== undefined) {
      Object.assign(merged, { [key]: value });
    }
  }

  return merged;
}

export interface ImportMergeResult {
  merged: Entry[];
  added: number;
  updated: number;
}

/**
 * Merges parsed entries into an existing library, matching on entry id (derived from
 * the Goodreads Book Id). Used directly for guest mode, and to classify added vs
 * updated for the signed-in Firestore path.
 */
export function mergeImportedEntries(existing: Entry[], imported: Entry[]): ImportMergeResult {
  const byId = new Map(existing.map((e) => [e.id, e]));
  let added = 0;
  let updated = 0;

  for (const entry of imported) {
    const current = byId.get(entry.id);
    if (current) {
      byId.set(entry.id, applyImportToExisting(current, entry));
      updated += 1;
    } else {
      byId.set(entry.id, entry);
      added += 1;
    }
  }

  return { merged: Array.from(byId.values()), added, updated };
}

/** Counts how many imported rows already exist, for the pre-import preview. */
export function countExistingMatches(existing: Entry[], imported: Entry[]): number {
  const ids = new Set(existing.map((e) => e.id));
  return imported.reduce((n, e) => (ids.has(e.id) ? n + 1 : n), 0);
}

/**
 * Open Library serves covers directly from an ISBN with no API call and no key, which
 * is why it is the primary cover source. Google Books is reserved as a server-side
 * fallback for the minority of rows with no ISBN (see `/api/covers/resolve`), because
 * unauthenticated Google Books throttles at roughly 100 requests/minute.
 */
export function openLibraryCoverUrl(isbn?: string): string | undefined {
  if (!isbn) return undefined;
  const clean = isbn.replace(/[^0-9Xx]/g, '');
  if (clean.length !== 10 && clean.length !== 13) return undefined;
  return `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`;
}
