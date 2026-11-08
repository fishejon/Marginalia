import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  parseGoodreadsCsv,
  stripExcelFormula,
  normalizeDate,
  stripHtml,
  goodreadsEntryId,
  openLibraryCoverUrl,
  GoodreadsParseError,
} from '../src/utils/goodreadsImport';

const HEADER =
  'Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Publisher,Binding,' +
  'Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,' +
  'Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count';

/** Builds a single CSV data row from a partial map of column name to raw value. */
function row(overrides: Record<string, string> = {}): string {
  const cols: Record<string, string> = {
    'Book Id': '12345',
    Title: 'Test Book',
    Author: 'Jane Doe',
    'Author l-f': 'Doe, Jane',
    'Additional Authors': '',
    ISBN: '="0743273567"',
    ISBN13: '="9780743273565"',
    'My Rating': '4',
    Publisher: 'Scribner',
    Binding: 'Paperback',
    'Number of Pages': '180',
    'Year Published': '2004',
    'Original Publication Year': '1925',
    'Date Read': '2023/05/14',
    'Date Added': '2023/01/02',
    Bookshelves: 'classics, fiction',
    'Bookshelves with positions': 'classics (#1), fiction (#2)',
    'Exclusive Shelf': 'read',
    'My Review': '',
    Spoiler: '',
    'Private Notes': '',
    'Read Count': '1',
    ...overrides,
  };

  return HEADER.split(',')
    .map((h) => {
      const v = cols[h] ?? '';
      // Excel-escaped identifier columns are emitted verbatim. Goodreads does NOT
      // additionally CSV-quote them, so the inner quotes act as CSV quoting and get
      // consumed during tokenization. Re-quoting here would encode them differently
      // from a real export and hide bugs.
      if (v.startsWith('="')) return v;
      // Quote anything containing a comma, quote, or newline, as Goodreads does.
      return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    })
    .join(',');
}

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join('\n');
}

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('preserves commas inside quoted fields', () => {
    expect(parseCsv('a,b\n"one, two",three')).toEqual([
      ['a', 'b'],
      ['one, two', 'three'],
    ]);
  });

  it('preserves newlines inside quoted fields', () => {
    expect(parseCsv('a,b\n"line one\nline two",x')).toEqual([
      ['a', 'b'],
      ['line one\nline two', 'x'],
    ]);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsv('a\n"He said ""hi"""')).toEqual([['a'], ['He said "hi"']]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('strips a UTF-8 BOM so the first header is not corrupted', () => {
    expect(parseCsv('\uFEFFBook Id,Title')).toEqual([['Book Id', 'Title']]);
  });

  it('ignores a trailing newline rather than emitting a blank row', () => {
    expect(parseCsv('a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps empty fields', () => {
    expect(parseCsv('a,b,c\n1,,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', '3'],
    ]);
  });
});

describe('stripExcelFormula', () => {
  it('unwraps the raw Goodreads ="..." escape', () => {
    expect(stripExcelFormula('="9780743273565"')).toBe('9780743273565');
  });

  it('returns empty for the raw empty escape', () => {
    expect(stripExcelFormula('=""')).toBe('');
  });

  /*
   * These two are the forms that actually reach this function in production. The inner
   * quotes in `="..."` are CSV quoting, so the tokenizer strips them first, leaving a
   * bare `=` prefix. A regression here produces ISBNs like `=9780743273565` that look
   * almost correct and break every cover lookup.
   */
  it('strips the = prefix left behind after CSV tokenization', () => {
    expect(stripExcelFormula('=9780743273565')).toBe('9780743273565');
  });

  it('returns empty for a bare = left behind by an empty escape', () => {
    expect(stripExcelFormula('=')).toBe('');
  });

  it('passes through a bare value', () => {
    expect(stripExcelFormula('9780743273565')).toBe('9780743273565');
  });
});

describe('normalizeDate', () => {
  it('converts YYYY/MM/DD to ISO', () => {
    expect(normalizeDate('2023/05/14')).toBe('2023-05-14');
  });

  it('zero-pads single digit months and days', () => {
    expect(normalizeDate('2023/5/4')).toBe('2023-05-04');
  });

  it('passes through ISO dates', () => {
    expect(normalizeDate('2023-05-14')).toBe('2023-05-14');
  });

  it('returns undefined for blank or unrecognised input', () => {
    expect(normalizeDate('')).toBeUndefined();
    expect(normalizeDate('   ')).toBeUndefined();
    expect(normalizeDate('not a date')).toBeUndefined();
  });
});

describe('stripHtml', () => {
  it('converts <br/> to newlines', () => {
    expect(stripHtml('one<br/>two')).toBe('one\ntwo');
  });

  it('removes remaining tags and decodes entities', () => {
    expect(stripHtml('<b>bold</b> &amp; <i>italic</i>')).toBe('bold & italic');
  });
});

describe('goodreadsEntryId', () => {
  it('prefixes the id so it satisfies the Firestore id charset', () => {
    expect(goodreadsEntryId('12345')).toBe('gr-12345');
  });

  it('strips characters Firestore rules would reject', () => {
    expect(goodreadsEntryId('123/45')).toBe('gr-12345');
    expect(/^[a-zA-Z0-9_-]+$/.test(goodreadsEntryId('12.3/4 5'))).toBe(true);
  });
});

describe('openLibraryCoverUrl', () => {
  it('builds a URL from a 13 digit ISBN', () => {
    expect(openLibraryCoverUrl('9780743273565')).toBe(
      'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'
    );
  });

  it('accepts a 10 character ISBN including a trailing X', () => {
    expect(openLibraryCoverUrl('043942089X')).toBe(
      'https://covers.openlibrary.org/b/isbn/043942089X-L.jpg'
    );
  });

  it('returns undefined for missing or malformed ISBNs', () => {
    expect(openLibraryCoverUrl(undefined)).toBeUndefined();
    expect(openLibraryCoverUrl('')).toBeUndefined();
    expect(openLibraryCoverUrl('123')).toBeUndefined();
  });
});

describe('parseGoodreadsCsv', () => {
  it('maps a standard read row onto an Entry', () => {
    const res = parseGoodreadsCsv(csv(row()));

    expect(res.entries).toHaveLength(1);
    const e = res.entries[0];
    expect(e.id).toBe('gr-12345');
    expect(e.goodreadsBookId).toBe('12345');
    expect(e.title).toBe('Test Book');
    expect(e.author).toBe('Jane Doe');
    expect(e.medium).toBe('book');
    expect(e.rating).toBe(4);
    expect(e.status).toBe('completed');
    expect(e.dateLogged).toBe('2023-05-14');
    expect(e.isbn).toBe('9780743273565');
    expect(e.tags).toEqual(['classics', 'fiction']);
  });

  it('leaves all three pillars blank so imported prose is never mistaken for reflection', () => {
    const res = parseGoodreadsCsv(
      csv(row({ 'My Review': 'Genuinely changed how I think about focus.' }))
    );

    const e = res.entries[0];
    expect(e.whatImThinking).toBe('');
    expect(e.whyILikedIt).toBe('');
    expect(e.howIllUseItGoingForward).toBe('');
    // ...but the review itself must not be lost.
    expect(e.importedReview).toBe('Genuinely changed how I think about focus.');
  });

  it('skips rows that are not on the read shelf', () => {
    const res = parseGoodreadsCsv(
      csv(
        row({ 'Book Id': '1' }),
        row({ 'Book Id': '2', 'Exclusive Shelf': 'to-read' }),
        row({ 'Book Id': '3', 'Exclusive Shelf': 'currently-reading' })
      )
    );

    expect(res.entries).toHaveLength(1);
    expect(res.entries[0].goodreadsBookId).toBe('1');
    expect(res.skippedNotRead).toBe(2);
    expect(res.totalRows).toBe(3);
  });

  it('treats a rating of 0 as unrated rather than coercing it', () => {
    const res = parseGoodreadsCsv(csv(row({ 'My Rating': '0' })));
    expect(res.entries[0].rating).toBe(0);
  });

  it('clamps out-of-range ratings to unrated', () => {
    expect(parseGoodreadsCsv(csv(row({ 'My Rating': '9' }))).entries[0].rating).toBe(0);
    expect(parseGoodreadsCsv(csv(row({ 'My Rating': '' }))).entries[0].rating).toBe(0);
  });

  it('falls back to Date Added when Date Read is blank', () => {
    const res = parseGoodreadsCsv(csv(row({ 'Date Read': '', 'Date Added': '2021/11/03' })));
    expect(res.entries[0].dateLogged).toBe('2021-11-03');
  });

  it('marks a book with multiple reads as rereading', () => {
    const res = parseGoodreadsCsv(csv(row({ 'Read Count': '3' })));
    expect(res.entries[0].status).toBe('rereading');
  });

  it('drops reserved shelf names from tags', () => {
    const res = parseGoodreadsCsv(csv(row({ Bookshelves: 'read, to-read, philosophy' })));
    expect(res.entries[0].tags).toEqual(['philosophy']);
  });

  it('handles a review containing commas, newlines and escaped quotes', () => {
    const review = 'First, a thought.\nThen a "quoted" aside.';
    const res = parseGoodreadsCsv(csv(row({ 'My Review': review })));
    expect(res.entries[0].importedReview).toBe(review);
  });

  it('falls back to ISBN when ISBN13 is the empty escape', () => {
    const res = parseGoodreadsCsv(csv(row({ ISBN13: '=""', ISBN: '="0743273567"' })));
    expect(res.entries[0].isbn).toBe('0743273567');
  });

  it('leaves isbn undefined when both ISBN columns are empty escapes', () => {
    const res = parseGoodreadsCsv(csv(row({ ISBN13: '=""', ISBN: '=""' })));
    expect(res.entries[0].isbn).toBeUndefined();
  });

  it('produces an ISBN with no leftover = that would break cover lookup', () => {
    const res = parseGoodreadsCsv(csv(row()));
    const isbn = res.entries[0].isbn!;
    expect(isbn.startsWith('=')).toBe(false);
    expect(isbn).toBe('9780743273565');
    expect(openLibraryCoverUrl(isbn)).toBe(
      'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'
    );
  });

  it('combines additional authors', () => {
    const res = parseGoodreadsCsv(csv(row({ 'Additional Authors': 'John Roe, Ada Poe' })));
    expect(res.entries[0].author).toBe('Jane Doe, John Roe, Ada Poe');
  });

  it('reports a row with no title as an error instead of importing it', () => {
    const res = parseGoodreadsCsv(csv(row({ Title: '' })));
    expect(res.entries).toHaveLength(0);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].reason).toMatch(/title/i);
  });

  it('reports duplicate Book Ids within one file rather than silently overwriting', () => {
    const res = parseGoodreadsCsv(csv(row({ 'Book Id': '7' }), row({ 'Book Id': '7' })));
    expect(res.entries).toHaveLength(1);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].reason).toMatch(/duplicate/i);
  });

  it('resolves columns by name, not position', () => {
    // Same data, columns reversed. Positional parsing would produce garbage here.
    const reversed = HEADER.split(',').reverse().join(',');
    const values = row().split(',');
    // row() emits values in HEADER order; reverse to match the reversed header.
    const reversedRow = values.reverse().join(',');

    const res = parseGoodreadsCsv([reversed, reversedRow].join('\n'));
    expect(res.entries).toHaveLength(1);
    expect(res.entries[0].title).toBe('Test Book');
    expect(res.entries[0].goodreadsBookId).toBe('12345');
  });

  it('throws when the file is not a Goodreads export', () => {
    expect(() => parseGoodreadsCsv('name,email\nJane,jane@example.com')).toThrow(
      GoodreadsParseError
    );
  });

  it('throws on an empty file', () => {
    expect(() => parseGoodreadsCsv('')).toThrow(GoodreadsParseError);
  });

  it('names the missing columns so the user can tell what is wrong', () => {
    expect(() => parseGoodreadsCsv('Book Id,Title\n1,X')).toThrow(/Author.*Exclusive Shelf/s);
  });
});
