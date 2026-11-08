import { Entry, SynthesizedInsights, QueryRepositoryResult } from '../types';

export async function fetchReflectionPrompts(data: {
  title: string;
  author: string;
  medium?: string;
  whatImThinking?: string;
  whyILikedIt?: string;
  howIllUseItGoingForward?: string;
}): Promise<{ questions: Array<{ id: string; question: string; context: string }> }> {
  const res = await fetch('/api/gemini/reflection-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch reflection prompts');
  }

  return res.json();
}

export async function synthesizeEntryInsights(entry: {
  title: string;
  author: string;
  medium: string;
  whatImThinking: string;
  whyILikedIt: string;
  howIllUseItGoingForward: string;
  quotes?: any[];
}): Promise<SynthesizedInsights> {
  const res = await fetch('/api/gemini/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to synthesize insights');
  }

  return res.json();
}

export async function queryRepository(data: {
  query: string;
  libraryItems: Entry[];
  queryType?: 'problem-solving' | 'recommendation' | 'general';
}): Promise<QueryRepositoryResult> {
  const res = await fetch('/api/gemini/query-repository', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to consult repository');
  }

  return res.json();
}

export async function lookupBookDetails(query: string): Promise<{
  title: string;
  author: string;
  medium: 'book' | 'podcast' | 'article' | 'video' | 'essay';
  suggestedTags: string[];
  briefContext: string;
  coverUrl?: string;
}> {
  const res = await fetch('/api/gemini/book-lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error('Failed to lookup book');
  }

  return res.json();
}

export async function fetchSourceFromUrl(url: string): Promise<{
  title: string;
  author: string;
  medium: 'book' | 'podcast' | 'article' | 'video' | 'essay';
  coverUrl?: string;
  suggestedTags: string[];
  briefContext: string;
}> {
  const res = await fetch('/api/gemini/fetch-url-source', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to fetch source from URL');
  }

  return res.json();
}


export async function sendSocraticChatMessage(data: {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  workTitle?: string;
  workAuthor?: string;
  medium?: string;
}): Promise<{ reply: string }> {
  const res = await fetch('/api/gemini/socratic-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, mode: 'chat' }),
  });

  if (!res.ok) {
    throw new Error('Socratic discussion turn failed');
  }

  return res.json();
}

export async function extractPillarsFromSocraticChat(data: {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  workTitle?: string;
  workAuthor?: string;
}): Promise<{
  whatImThinking: string;
  whyILikedIt: string;
  howIllUseItGoingForward: string;
  suggestedTags: string[];
}> {
  const res = await fetch('/api/gemini/socratic-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, mode: 'extract_pillars' }),
  });

  if (!res.ok) {
    throw new Error('Failed to distill discussion into pillars');
  }

  return res.json();
}

/**
 * Resolves covers for imported books that have no ISBN.
 *
 * Books with an ISBN never reach here — their cover URL is built directly from Open
 * Library at zero cost. This is the fallback for the remainder, and it is deliberately
 * best-effort: covers are cosmetic and must never block or fail an import.
 *
 * Returns a map of entry id to cover URL, plus whether the server hit a rate limit and
 * the caller should stop sending further chunks.
 */
export async function resolveCovers(
  books: Array<{ id: string; title: string; author?: string }>
): Promise<{ covers: Record<string, string>; rateLimited: boolean }> {
  try {
    const res = await fetch('/api/covers/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ books }),
    });

    if (!res.ok) return { covers: {}, rateLimited: false };
    return await res.json();
  } catch (err) {
    console.warn('Cover resolution failed; continuing without covers:', err);
    return { covers: {}, rateLimited: false };
  }
}

export async function fetchSmartRecommendations(data: {
  userVaultEntries: Entry[];
  query?: string;
  focusArea?: string;
}): Promise<{
  shelfSynthesis: string;
  recommendations: Array<{
    id: string;
    title: string;
    author: string;
    medium: 'book' | 'podcast' | 'article' | 'essay';
    coverUrl?: string;
    whyRecommended: string;
    thematicConnection: string;
    tags: string[];
    sourceLink?: string;
  }>;
  groundingSources: Array<{ title: string; uri: string }>;
}> {
  const res = await fetch('/api/gemini/smart-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch smart recommendations');
  }

  return res.json();
}

