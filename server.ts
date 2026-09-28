import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client with standard User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Returned when an AI-generating endpoint is called without a configured key.
// These endpoints must never invent plausible-looking output: a user cannot tell
// fabricated filler from real synthesis, which silently poisons their vault.
const MISSING_KEY_MESSAGE =
  'AI features are unavailable because GEMINI_API_KEY is not configured on the server. ' +
  'Set it in .env.local for local development, or as an environment variable on your host, then restart.';

// Endpoint 1: Generate custom provocative book club reflection questions
app.post('/api/gemini/reflection-prompts', async (req, res) => {
  try {
    const { title, author, medium = 'book', whatImThinking = '', whyILikedIt = '', howIllUseItGoingForward = '' } = req.body;

    if (!ai) {
      return res.status(503).json({ error: 'AI unavailable', message: MISSING_KEY_MESSAGE });
    }

    const prompt = `You are an insightful curator and facilitator for a high-caliber personal book club.
The user is reflecting on a ${medium} titled "${title}" by ${author || 'Unknown'}.
Here are the user's initial raw reflections:
- What they are thinking: "${whatImThinking}"
- Why they liked it: "${whyILikedIt}"
- How they plan to use it: "${howIllUseItGoingForward}"

Generate exactly 3 thought-provoking, deep discussion questions tailored specifically to this title, author, and the user's thoughts.
Questions should help them dig deeper into:
1. A counter-intuitive or challenging premise from the work.
2. A concrete dilemma or trade-off in applying the insight to business or life.
3. A critical evaluation or personal synthesis.

Return JSON in this exact structure:
{
  "questions": [
    { "id": "q1", "question": "...", "context": "..." },
    { "id": "q2", "question": "...", "context": "..." },
    { "id": "q3", "question": "...", "context": "..." }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ['id', 'question', 'context']
              }
            }
          },
          required: ['questions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating reflection prompts:', error);
    return res.status(500).json({
      error: 'Failed to generate prompts',
      message: error?.message || 'Unknown error'
    });
  }
});

// Endpoint 2: AI-Powered Summary & Insight Synthesizer
app.post('/api/gemini/synthesize', async (req, res) => {
  try {
    const { title, author, medium = 'book', whatImThinking, whyILikedIt, howIllUseItGoingForward, quotes = [] } = req.body;

    if (!ai) {
      return res.status(503).json({ error: 'AI unavailable', message: MISSING_KEY_MESSAGE });
    }

    const quotesText = quotes.map((q: any) => `"${q.text}" (${q.location || ''})`).join('\n');

    const prompt = `You are an elite intellectual synthesizer and executive book club partner.
Analyze the following personal reading notes for the ${medium} "${title}" by ${author || 'the author'}.

User's Notes:
- What I'm thinking: ${whatImThinking || 'None provided'}
- Why I liked it: ${whyILikedIt || 'None provided'}
- How I plan to use it going forward: ${howIllUseItGoingForward || 'None provided'}
- Memorable quotes/passages:
${quotesText || 'None recorded'}

Synthesize these insights into a definitive, crystal-clear executive knowledge asset with:
1. "thesis": A powerful 1-2 sentence thesis capturing the essential insight.
2. "keyPrinciples": 3-4 impactful principles/mental models extracted from the notes and work.
3. "actionPlaybook": Exactly 3-4 concrete actions categorized into 'Immediate', 'Habit', or 'Strategic Decision'.
4. "recommendationPitch": An object with:
   - "whyRecommend": A concise explanation of why the user loved this work.
   - "whoShouldRead": Precise audience description (e.g., 'Founders facing early growth friction', 'Anyone redesigning their daily routine').
   - "ratingBlurb": A 1-sentence punchy recommendation blurb for sharing.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thesis: { type: Type.STRING },
            keyPrinciples: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            actionPlaybook: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  action: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ['Immediate', 'Habit', 'Strategic Decision']
                  }
                },
                required: ['id', 'action', 'category']
              }
            },
            recommendationPitch: {
              type: Type.OBJECT,
              properties: {
                whyRecommend: { type: Type.STRING },
                whoShouldRead: { type: Type.STRING },
                ratingBlurb: { type: Type.STRING }
              },
              required: ['whyRecommend', 'whoShouldRead', 'ratingBlurb']
            }
          },
          required: ['thesis', 'keyPrinciples', 'actionPlaybook', 'recommendationPitch']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.synthesizedAt = new Date().toISOString();
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in synthesis:', error);
    return res.status(500).json({
      error: 'Failed to synthesize insights',
      message: error?.message || 'Unknown error'
    });
  }
});

// Endpoint 3: Knowledge Base Consultation & Recommendation Query
app.post('/api/gemini/query-repository', async (req, res) => {
  try {
    const { query, libraryItems = [], queryType = 'problem-solving' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'AI unavailable', message: MISSING_KEY_MESSAGE });
    }

    /*
     * Only entries with actual content are worth sending to the model.
     *
     * Bulk import can add hundreds of books whose pillars are deliberately blank. Those
     * contribute nothing but tokens, and at a few hundred entries they would dominate
     * the prompt, inflating latency and cost and risking the context limit. Filtering
     * here keeps consultation quality tied to what the user has actually reflected on.
     */
    const substantiveItems = libraryItems.filter((item: any) => {
      return Boolean(
        (item.whatImThinking || '').trim() ||
          (item.whyILikedIt || '').trim() ||
          (item.howIllUseItGoingForward || '').trim() ||
          item.synthesis ||
          (Array.isArray(item.quotes) && item.quotes.length > 0) ||
          (Array.isArray(item.clubDiscussion) && item.clubDiscussion.length > 0)
      );
    });

    if (substantiveItems.length === 0) {
      return res.json({
        answer:
          'Your library does not have any reflections to draw on yet. Open a book in the ' +
'Reflection Studio and record what you thought about it, then ask again — this ' +
          'feature answers from your own notes rather than from general knowledge.',
        consultationSummary: 'No reflections recorded yet.',
        citedEntries: [],
        suggestedNextSteps: [
          'Open any book in the Reflection Studio and fill in the three pillars.',
          'Run AI Synthesize on a book you have already reflected on.',
        ],
      });
    }

    // Build library digest for context
    const repositoryContext = substantiveItems.map((item: any, idx: number) => {
      const syn = item.synthesis;
      return `--- Entry #${idx + 1}: "${item.title}" by ${item.author} (${item.medium}) ---
Tags: ${(item.tags || []).join(', ')}
User's Thoughts: ${item.whatImThinking || ''}
Why User Liked It: ${item.whyILikedIt || ''}
How User Uses It: ${item.howIllUseItGoingForward || ''}
Synthesized Thesis: ${syn?.thesis || ''}
Key Principles: ${(syn?.keyPrinciples || []).join('; ')}
Quotes: ${(item.quotes || []).map((q: any) => `"${q.text}"`).join(' | ')}
Recommendation info: ${syn?.recommendationPitch ? JSON.stringify(syn.recommendationPitch) : ''}
`;
    }).join('\n\n');

    const prompt = `You are a personal intellectual advisor and knowledge base consultant for the user.
The user has built a private personal book club repository with detailed takeaways, reflections, and action playbooks.

User Inquiry: "${query}"
Inquiry Mode: ${queryType} (either problem-solving, recommendation for someone, or general conceptual review)

Here is the user's complete Personal Library Repository:
${repositoryContext}

Your Task:
1. Directly address the user's inquiry by synthesizing the actual insights, quotes, and principles from their library.
2. If this is a business or personal problem, explain how the ideas in their recorded books and podcasts solve or reframe the problem.
3. If this is a book recommendation request, pick the single best match (or top 2) from their vault and explain why, drawing on "why I liked it" and who it's for.
4. Cite specific entries from their library by title and author.
5. Provide 2-4 concrete, actionable next steps.

Format the response in JSON:
{
  "answer": "Comprehensive, articulate, well-structured response (using clear markdown with headings and bullet points)",
  "consultationSummary": "1-2 sentence high level takeaway",
  "citedEntries": [
    {
      "id": "entry id",
      "title": "Title",
      "author": "Author",
      "relevance": "Brief explanation of how this source informs the advice"
    }
  ],
  "suggestedNextSteps": [
    "Concrete step 1",
    "Concrete step 2"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            consultationSummary: { type: Type.STRING },
            citedEntries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  author: { type: Type.STRING },
                  relevance: { type: Type.STRING }
                },
                required: ['id', 'title', 'author', 'relevance']
              }
            },
            suggestedNextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['answer', 'consultationSummary', 'citedEntries', 'suggestedNextSteps']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error querying repository:', error);
    return res.status(500).json({
      error: 'Failed to query repository',
      message: error?.message || 'Unknown error'
    });
  }
});

// Helper: Discover real book/podcast cover art thumbnail
async function fetchCoverThumbnail(title: string, author?: string): Promise<string | undefined> {
  try {
    const query = `${title} ${author || ''}`.trim();
    // 1. Google Books API
    const gbooksRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
    );
    if (gbooksRes.ok) {
      const gdata: any = await gbooksRes.json();
      const item = gdata.items?.[0];
      const thumbnail =
        item?.volumeInfo?.imageLinks?.thumbnail ||
        item?.volumeInfo?.imageLinks?.smallThumbnail;
      if (thumbnail) {
        return thumbnail.replace(/^http:\/\//i, 'https://').replace('&edge=curl', '');
      }
    }

    // 2. Open Library fallback
    const olRes = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`
    );
    if (olRes.ok) {
      const olData: any = await olRes.json();
      const doc = olData.docs?.[0];
      if (doc?.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      }
    }
  } catch (err) {
    console.warn('Cover fetch failed, using fallback:', err);
  }
  return undefined;
}

// Endpoint 4: Quick book/podcast lookup helper with automatic cover thumbnail discovery
app.post('/api/gemini/book-lookup', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    let detectedCover: string | undefined = undefined;

    if (!ai) {
      // Without a key we cannot identify the work, but cover lookup is a real API
      // call, so return only genuinely-sourced data and invent nothing.
      detectedCover = await fetchCoverThumbnail(query);
      return res.json({
        title: query,
        author: '',
        medium: 'book',
        coverUrl: detectedCover,
        suggestedTags: [],
        briefContext: ''
      });
    }

    const prompt = `Identify this book, podcast, essay, or media work from this query: "${query}".
Provide:
- "title": Clean canonical title
- "author": Author, creator, or host name
- "medium": "book" | "podcast" | "article" | "video" | "essay"
- "suggestedTags": 3-4 thematic tags (e.g. "Strategy", "Neuroscience", "Habits", "Decision Making", "Philosophy", "Leadership")
- "briefContext": 1 sentence summary of what the work covers.

Return JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            medium: {
              type: Type.STRING,
              enum: ['book', 'podcast', 'article', 'video', 'essay']
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            briefContext: { type: Type.STRING }
          },
          required: ['title', 'author', 'medium', 'suggestedTags', 'briefContext']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    detectedCover = await fetchCoverThumbnail(parsed.title || query, parsed.author);
    parsed.coverUrl = detectedCover;

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in lookup:', error);
    return res.status(500).json({ error: 'Lookup failed' });
  }
});

// Endpoint 4B: Pull podcast, article, video, or online resource directly from a URL
app.post('/api/gemini/fetch-url-source', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    let fetchedTitle = '';
    let fetchedDescription = '';
    let fetchedImage = '';
    let fetchedAuthor = '';
    let mediumHint: 'podcast' | 'article' | 'video' | 'essay' | 'book' = 'article';

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com')) {
      mediumHint = 'video';
    } else if (
      lowerUrl.includes('spotify.com/episode') ||
      lowerUrl.includes('podcasts.apple.com') ||
      lowerUrl.includes('overcast.fm') ||
      lowerUrl.includes('podcast')
    ) {
      mediumHint = 'podcast';
    } else if (lowerUrl.includes('substack.com') || lowerUrl.includes('medium.com')) {
      mediumHint = 'article';
    }

    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      mediumHint = 'video';
      if (!fetchedImage) {
        fetchedImage = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const pageRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (pageRes.ok) {
        const html = await pageRes.text();

        const ogTitle =
          html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
        const ogImage =
          html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1];
        const ogDesc =
          html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1];
        const authorMatch =
          html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/<meta\s+property=["']article:author["']\s+content=["']([^"']+)["']/i)?.[1] ||
          html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i)?.[1];

        if (ogTitle) fetchedTitle = ogTitle.trim();
        if (ogDesc) fetchedDescription = ogDesc.trim();
        if (ogImage && !fetchedImage) {
          try {
            fetchedImage = new URL(ogImage, url).href;
          } catch {
            fetchedImage = ogImage;
          }
        }
        if (authorMatch) fetchedAuthor = authorMatch.trim();
      }
    } catch (fetchErr) {
      console.warn('Direct URL fetch failed, falling back to Gemini:', fetchErr);
    }

    if (!ai) {
      // Unlike the generative endpoints, everything above came from the page's own
      // metadata, so it is safe to return. Only AI-authored fields are withheld.
      return res.json({
        title: fetchedTitle || url,
        author: fetchedAuthor || '',
        medium: mediumHint,
        coverUrl: fetchedImage || undefined,
        suggestedTags: [],
        briefContext: fetchedDescription || '',
      });
    }

    const prompt = `Extract clean canonical metadata for this online resource:
URL: ${url}
Raw Extracted Title: ${fetchedTitle || 'Not available'}
Raw Description: ${fetchedDescription || 'Not available'}
Raw Author: ${fetchedAuthor || 'Not available'}
Medium Hint: ${mediumHint}

Provide:
- "title": Clean canonical title (strip out generic site suffixes like "| Substack" or "- YouTube" unless part of show name)
- "author": Creator, host, author, publication, or channel name
- "medium": "podcast" | "article" | "video" | "essay" | "book"
- "suggestedTags": 3-4 specific thematic tags (e.g. "Strategy", "Neuroscience", "Economics", "AI", "Startup")
- "briefContext": 1-2 sentence concise summary of the episode, talk, or article.

Return JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            medium: {
              type: Type.STRING,
              enum: ['podcast', 'article', 'video', 'essay', 'book'],
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            briefContext: { type: Type.STRING },
          },
          required: ['title', 'author', 'medium', 'suggestedTags', 'briefContext'],
        },
      },
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(response.text || '{}');
    } catch {
      const clean = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean || '{}');
    }

    return res.json({
      title: parsed.title || fetchedTitle || url,
      author: parsed.author || fetchedAuthor || 'Online Creator',
      medium: parsed.medium || mediumHint,
      coverUrl: fetchedImage || undefined,
      suggestedTags: parsed.suggestedTags || ['Insights'],
      briefContext: parsed.briefContext || fetchedDescription || 'Online source.',
    });
  } catch (error: any) {
    console.error('Error fetching source from URL:', error);
    return res.status(500).json({ error: 'Failed to fetch source from URL', message: error?.message });
  }
});

/**
 * Endpoint 4C: Bulk cover resolution for imported books.
 *
 * Only for rows with no ISBN. Anything with an ISBN gets an Open Library cover URL
 * built client-side with no network call at all, which is what keeps a several-hundred
 * book import off this code path entirely.
 *
 * Unauthenticated Google Books throttles at roughly 100 requests/minute and returns
 * 429 aggressively, so requests are issued with small bounded concurrency and the whole
 * endpoint degrades to "no cover" rather than failing the import.
 */
app.post('/api/covers/resolve', async (req, res) => {
  try {
    const { books = [] } = req.body as {
      books?: Array<{ id: string; title: string; author?: string }>;
    };

    if (!Array.isArray(books) || books.length === 0) {
      return res.json({ covers: {} });
    }

    // Hard cap per request. The client chunks anything larger.
    const MAX_PER_REQUEST = 40;
    const CONCURRENCY = 3;

    if (books.length > MAX_PER_REQUEST) {
      return res.status(413).json({
        error: 'Too many books in one request',
        message: `Send at most ${MAX_PER_REQUEST} books per request.`,
      });
    }

    const covers: Record<string, string> = {};
    let rateLimited = false;
    const queue = [...books];

    async function worker() {
      while (queue.length > 0) {
        // Once Google starts refusing, stop hammering it for the rest of the batch.
        if (rateLimited) return;

        const book = queue.shift();
        if (!book?.title) continue;

        try {
          const url = await fetchCoverThumbnail(book.title, book.author);
          if (url) covers[book.id] = url;
        } catch (err: any) {
          if (String(err?.message || '').includes('429')) {
            rateLimited = true;
            return;
          }
          // A single miss is not worth failing the batch over.
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    return res.json({
      covers,
      // Surfaced so the client can stop sending further chunks.
      rateLimited,
    });
  } catch (error: any) {
    console.error('Error resolving covers:', error);
    // Covers are cosmetic; never let this fail an import.
    return res.json({ covers: {}, rateLimited: false });
  }
});

// Endpoint 5: Socratic Conversational Reflection Partner (Push Deeper on Thinking)
app.post('/api/gemini/socratic-chat', async (req, res) => {
  try {
    const {
      messages = [],
      workTitle = 'this source',
      workAuthor = '',
      medium = 'source',
      mode = 'chat',
    } = req.body;

    if (!ai) {
      return res.status(503).json({ error: 'AI unavailable', message: MISSING_KEY_MESSAGE });
    }

    if (mode === 'extract_pillars') {
      // Summarize and distill conversation into the 3 pillars
      const dialogueTranscript = messages
        .map((m: any) => `${m.role === 'user' ? 'Reader' : 'Socratic Facilitator'}: ${m.content}`)
        .join('\n');

      const prompt = `You are an elite intellectual synthesizer.
Based on the following back-and-forth Socratic discussion between a reader and their thinking partner regarding "${workTitle}" by ${workAuthor || 'the author'}:

${dialogueTranscript}

Extract and synthesize the reader's insights into the 3 core pillars of their personal book club:
1. "whatImThinking": The reader's core takeaways, aha moments, mental model shifts, and intellectual sparks.
2. "whyILikedIt": What resonated most, standout arguments, memorable stories, and why they value this work.
3. "howIllUseItGoingForward": Concrete rules, habits, business decisions, or personal operating system changes they discussed.
4. "suggestedTags": 3-5 thematic classification tags (e.g. "Strategy", "Habits", "Neuroscience").

Return JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              whatImThinking: { type: Type.STRING },
              whyILikedIt: { type: Type.STRING },
              howIllUseItGoingForward: { type: Type.STRING },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['whatImThinking', 'whyILikedIt', 'howIllUseItGoingForward', 'suggestedTags'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    }

    // Interactive Socratic dialogue turn
    const dialogueTranscript = messages
      .map((m: any) => `${m.role === 'user' ? 'Reader' : 'Socratic Partner'}: ${m.content}`)
      .join('\n');

    const prompt = `You are a brilliant, inquisitive, and thoughtful Socratic Book Club Facilitator.
You are having an intellectual conversation with a reader reflecting on a ${medium} titled "${workTitle}" by ${workAuthor || 'the author'}.

Your purpose:
- Push their thinking deeper without being pedantic.
- If they make a broad statement, ask for a concrete scenario or trade-off.
- Challenge their assumptions: "What if the inverse were true?" or "In what business or personal context would this advice fail?"
- Encourage them to think about how this changes their actions, habits, or decisions.
- Keep responses concise (2 to 4 sentences), sharp, warm, and thought-provoking. End with one compelling follow-up question.

Conversation history:
${dialogueTranscript}

Respond as the Socratic Partner:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      reply: response.text || 'What is the most challenging premise in this work that you are still wrestling with?',
    });
  } catch (error: any) {
    console.error('Error in socratic chat:', error);
    return res.status(500).json({ error: 'Socratic dialogue failed', message: error?.message });
  }
});

// Endpoint 6: Smart Recommendations with Google Search Grounding (gemini-3.5-flash with googleSearch)
app.post('/api/gemini/smart-recommendations', async (req, res) => {
  try {
    const { userVaultEntries = [], query = '', focusArea = '' } = req.body;

    const vaultSummary = userVaultEntries.map((item: any) => {
      return `"${item.title}" by ${item.author} (${item.medium}) - Tags: ${(item.tags || []).join(', ')}. Key thesis: ${item.synthesis?.thesis || item.whatImThinking || ''}`;
    }).join('\n');

    if (!ai) {
      return res.status(503).json({ error: 'AI unavailable', message: MISSING_KEY_MESSAGE });
    }

    // As instructed by the tool specification: Use gemini-3.5-flash (with googleSearch tool)
    const prompt = `You are an elite intellectual librarian and literary curator.
The user has a private knowledge vault containing these items:
${vaultSummary || 'Vault is currently blank (starter exploration)'}

User Request: "${query || focusArea || 'Recommend 3 high-impact books, podcast episodes, or essays that complement and challenge my current intellectual interests.'}"

Your Task:
1. Use Google Search grounding to find authentic, acclaimed, and up-to-date works (books, podcast episodes like Huberman Lab, Dwarkesh Patel, Acquired, or seminal essays) that deeply connect with or expand their thinking.
2. Provide a 1-sentence "shelfSynthesis" describing the intellectual common thread or opportunity in their library.
3. Recommend exactly 3 distinct items (at least 1 book and 1 podcast/essay).
4. For each item provide:
   - title
   - author
   - medium ("book", "podcast", "article", or "essay")
   - whyRecommended (why they should read/listen, citing their existing themes)
   - thematicConnection (direct bridge to what they have or are thinking about)
   - tags (2-4 relevant tags)

Format response as clean JSON:
{
  "shelfSynthesis": "...",
  "recommendations": [
    {
      "id": "rec-1",
      "title": "...",
      "author": "...",
      "medium": "book",
      "whyRecommended": "...",
      "thematicConnection": "...",
      "tags": ["..."]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      },
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(response.text || '{}');
    } catch {
      // If output wrapped in markdown code blocks
      const clean = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean || '{}');
    }

    // Extract grounding sources from search chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingSources: Array<{ title: string; uri: string }> = [];
    if (Array.isArray(chunks)) {
      chunks.forEach((c: any) => {
        if (c.web?.uri) {
          groundingSources.push({
            title: c.web.title || c.web.uri,
            uri: c.web.uri,
          });
        }
      });
    }

    // Fetch real book cover thumbnail for recommended books
    if (Array.isArray(parsed.recommendations)) {
      for (const rec of parsed.recommendations) {
        if (!rec.coverUrl) {
          rec.coverUrl = await fetchCoverThumbnail(rec.title, rec.author);
        }
      }
    }

    return res.json({
      shelfSynthesis: parsed.shelfSynthesis || 'Curated recommendations to expand your intellectual frontier.',
      recommendations: parsed.recommendations || [],
      groundingSources,
    });
  } catch (error: any) {
    console.error('Error generating smart recommendations:', error);
    return res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error?.message || 'Unknown error',
    });
  }
});


// Vite middleware for development & static serving for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Marginalia server running at http://0.0.0.0:${port}`);
  });
}

startServer();
