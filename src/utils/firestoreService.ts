import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Entry } from '../types';
import { INITIAL_ENTRIES } from '../data/initialEntries';
import { IMPORT_OWNED_FIELDS } from './goodreadsImport';

export function subscribeToUserEntries(
  userId: string,
  onData: (entries: Entry[]) => void,
  onError: (err: any) => void
) {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: Entry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as Entry);
      });
      // Sort by dateLogged descending
      entries.sort((a, b) => new Date(b.dateLogged).getTime() - new Date(a.dateLogged).getTime());
      onData(entries);
    },
    (err) => {
      console.error('Error subscribing to entries:', err);
      onError(err);
    }
  );
}

export async function saveUserEntry(userId: string, entry: Entry): Promise<void> {
  const entryDocRef = doc(db, 'users', userId, 'entries', entry.id);
  const data = {
    ...entry,
    userId,
  };
  await setDoc(entryDocRef, data, { merge: true });
}

export async function removeUserEntry(userId: string, entryId: string): Promise<void> {
  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryDocRef);
}

// Firestore caps a single batch at 500 writes.
const BATCH_WRITE_LIMIT = 450;

/**
 * Copies entries recorded in guest mode into the signed-in user's cloud vault.
 *
 * Writes are keyed by the entry's existing id and use `merge`, so re-running this
 * for the same entries is idempotent rather than duplicating them. Throws if any
 * chunk fails, so the caller can keep the local copy instead of clearing it.
 */
export async function migrateGuestEntriesToCloud(
  userId: string,
  guestEntries: Entry[]
): Promise<number> {
  if (guestEntries.length === 0) return 0;

  for (let i = 0; i < guestEntries.length; i += BATCH_WRITE_LIMIT) {
    const chunk = guestEntries.slice(i, i + BATCH_WRITE_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((entry) => {
      const docRef = doc(db, 'users', userId, 'entries', entry.id);
      batch.set(docRef, { ...entry, userId }, { merge: true });
    });
    await batch.commit();
  }

  return guestEntries.length;
}

/**
 * Firestore rejects `undefined` field values outright. Parsed entries legitimately
 * carry undefined for optional columns (no ISBN, no review), so they must be removed
 * rather than written.
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export interface BulkUpsertProgress {
  written: number;
  total: number;
}

/**
 * Writes imported entries to the user's vault in chunked batches.
 *
 * For entries already present, only `IMPORT_OWNED_FIELDS` are written. This is the
 * safeguard that stops a re-import from overwriting pillars, synthesis, quotes or
 * club discussion the user has written since the previous import. New entries are
 * written in full.
 */
export async function bulkUpsertEntries(
  userId: string,
  entries: Entry[],
  existingIds: Set<string>,
  onProgress?: (progress: BulkUpsertProgress) => void
): Promise<void> {
  if (entries.length === 0) return;

  for (let i = 0; i < entries.length; i += BATCH_WRITE_LIMIT) {
    const chunk = entries.slice(i, i + BATCH_WRITE_LIMIT);
    const batch = writeBatch(db);

    chunk.forEach((entry) => {
      const docRef = doc(db, 'users', userId, 'entries', entry.id);

      if (existingIds.has(entry.id)) {
        // Narrow the write to import-owned fields only.
        const partial: Record<string, unknown> = { userId };
        for (const key of IMPORT_OWNED_FIELDS) {
          const value = entry[key];
          if (value !== undefined) partial[key] = value;
        }
        batch.set(docRef, partial, { merge: true });
      } else {
        batch.set(docRef, stripUndefined({ ...entry, userId }), { merge: true });
      }
    });

    await batch.commit();
    onProgress?.({ written: Math.min(i + chunk.length, entries.length), total: entries.length });
  }
}

export async function loadSampleCanonToFirestore(userId: string): Promise<void> {
  const batch = writeBatch(db);
  INITIAL_ENTRIES.forEach((sample) => {
    const newId = `sample-${Date.now()}-${sample.id}`;
    const docRef = doc(db, 'users', userId, 'entries', newId);
    batch.set(docRef, {
      ...sample,
      id: newId,
      userId,
      dateLogged: new Date().toISOString().slice(0, 10),
    });
  });
  await batch.commit();
}
