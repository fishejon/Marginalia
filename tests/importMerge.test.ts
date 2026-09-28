import { describe, it, expect } from 'vitest';
import {
  applyImportToExisting,
  mergeImportedEntries,
  countExistingMatches,
  IMPORT_OWNED_FIELDS,
} from '../src/utils/goodreadsImport';
import { Entry } from '../src/types';

/**
 * These are the data-safety tests for bulk import.
 *
 * If any of them regress, re-importing an updated Goodreads export silently destroys
 * the user's reflection work — which is the entire point of the product. Treat a
 * failure here as a release blocker, not a flaky test.
 */

/** An entry the user has already reflected on in depth. */
function reflectedEntry(): Entry {
  return {
    id: 'gr-12345',
    title: 'Test Book',
    author: 'Jane Doe',
    medium: 'book',
    dateLogged: '2023-05-14',
    rating: 4,
    tags: ['classics'],
    status: 'completed',
    whatImThinking: 'My hard-won takeaways.',
    whyILikedIt: 'The argument in chapter 4.',
    howIllUseItGoingForward: 'Weekly review ritual.',
    clubDiscussion: [{ id: 'qa-1', question: 'Q?', answer: 'A.' }],
    quotes: [{ id: 'q-1', text: 'A memorable line.' }],
    synthesis: {
      thesis: 'A synthesised thesis.',
      keyPrinciples: ['One'],
      actionPlaybook: [{ id: 'a-1', action: 'Do it', category: 'Immediate' }],
      recommendationPitch: {
        whyRecommend: 'Because.',
        whoShouldRead: 'Everyone.',
        ratingBlurb: 'Great.',
      },
      synthesizedAt: '2023-06-01T00:00:00.000Z',
    },
  };
}

/** The same book in a later export. Pillars are always blank on import. */
function reimported(): Entry {
  return {
    id: 'gr-12345',
    title: 'Test Book (Revised Edition)',
    author: 'Jane Doe',
    medium: 'book',
    dateLogged: '2024-01-01',
    rating: 5,
    tags: ['classics', 'reread'],
    status: 'rereading',
    whatImThinking: '',
    whyILikedIt: '',
    howIllUseItGoingForward: '',
    clubDiscussion: [],
    quotes: [],
    isbn: '9780743273565',
    goodreadsBookId: '12345',
    importedAt: '2024-01-02T00:00:00.000Z',
  };
}

describe('IMPORT_OWNED_FIELDS', () => {
  it('excludes every user-authored field', () => {
    const protectedFields = [
      'whatImThinking',
      'whyILikedIt',
      'howIllUseItGoingForward',
      'clubDiscussion',
      'quotes',
      'synthesis',
    ];

    for (const field of protectedFields) {
      expect(IMPORT_OWNED_FIELDS).not.toContain(field);
    }
  });
});

describe('applyImportToExisting', () => {
  it('never blanks the three pillars', () => {
    const merged = applyImportToExisting(reflectedEntry(), reimported());
    expect(merged.whatImThinking).toBe('My hard-won takeaways.');
    expect(merged.whyILikedIt).toBe('The argument in chapter 4.');
    expect(merged.howIllUseItGoingForward).toBe('Weekly review ritual.');
  });

  it('preserves synthesis, club discussion and quotes', () => {
    const merged = applyImportToExisting(reflectedEntry(), reimported());
    expect(merged.synthesis?.thesis).toBe('A synthesised thesis.');
    expect(merged.clubDiscussion).toHaveLength(1);
    expect(merged.quotes).toHaveLength(1);
  });

  it('does apply refreshed import-owned fields', () => {
    const merged = applyImportToExisting(reflectedEntry(), reimported());
    expect(merged.title).toBe('Test Book (Revised Edition)');
    expect(merged.rating).toBe(5);
    expect(merged.status).toBe('rereading');
    expect(merged.tags).toEqual(['classics', 'reread']);
    expect(merged.isbn).toBe('9780743273565');
  });

  it('leaves an existing value alone when the import omits it', () => {
    const existing = { ...reflectedEntry(), coverUrl: 'https://example.com/cover.jpg' };
    const merged = applyImportToExisting(existing, reimported());
    expect(merged.coverUrl).toBe('https://example.com/cover.jpg');
  });

  it('does not mutate either input', () => {
    const existing = reflectedEntry();
    const incoming = reimported();
    applyImportToExisting(existing, incoming);
    expect(existing.title).toBe('Test Book');
    expect(incoming.whatImThinking).toBe('');
  });
});

describe('mergeImportedEntries', () => {
  const base: Entry = {
    id: 'gr-1',
    title: 'One',
    author: 'A',
    medium: 'book',
    dateLogged: '2023-01-01',
    rating: 3,
    tags: [],
    status: 'completed',
    whatImThinking: 'kept',
    whyILikedIt: '',
    howIllUseItGoingForward: '',
    clubDiscussion: [],
    quotes: [],
  };

  it('counts added and updated separately', () => {
    const res = mergeImportedEntries(
      [base],
      [
        { ...base, title: 'One Updated', whatImThinking: '' },
        { ...base, id: 'gr-2', title: 'Two' },
      ]
    );

    expect(res.added).toBe(1);
    expect(res.updated).toBe(1);
    expect(res.merged).toHaveLength(2);
  });

  it('does not duplicate an entry that is re-imported', () => {
    const res = mergeImportedEntries([base], [{ ...base }]);
    expect(res.merged).toHaveLength(1);
  });

  it('protects reflections during a guest-mode merge too', () => {
    const res = mergeImportedEntries([base], [{ ...base, whatImThinking: '' }]);
    expect(res.merged[0].whatImThinking).toBe('kept');
  });

  it('leaves unrelated existing entries untouched', () => {
    const other: Entry = { ...base, id: 'manual-1', title: 'Hand written' };
    const res = mergeImportedEntries([base, other], [{ ...base }]);
    expect(res.merged.find((e) => e.id === 'manual-1')?.title).toBe('Hand written');
  });

  it('handles an empty import as a no-op', () => {
    const res = mergeImportedEntries([base], []);
    expect(res.added).toBe(0);
    expect(res.updated).toBe(0);
    expect(res.merged).toHaveLength(1);
  });
});

describe('countExistingMatches', () => {
  const mk = (id: string): Entry => ({
    id,
    title: id,
    author: 'A',
    medium: 'book',
    dateLogged: '2023-01-01',
    rating: 0,
    tags: [],
    status: 'completed',
    whatImThinking: '',
    whyILikedIt: '',
    howIllUseItGoingForward: '',
    clubDiscussion: [],
    quotes: [],
  });

  it('counts only ids already present', () => {
    expect(countExistingMatches([mk('gr-1'), mk('gr-2')], [mk('gr-2'), mk('gr-3')])).toBe(1);
  });

  it('returns zero for a first import', () => {
    expect(countExistingMatches([], [mk('gr-1')])).toBe(0);
  });
});
