import React, { useState } from 'react';
import { X, BookOpen, Headphones, FileText, Video, Sparkles, Loader2, Star, MessageSquare, FormInput, Link, Check, Globe } from 'lucide-react';
import { Entry, MediumType } from '../types';
import { SpeechToTextButton } from './SpeechToTextButton';
import { TagInput } from './TagInput';
import { SocraticChatPanel } from './SocraticChatPanel';
import { lookupBookDetails, fetchSourceFromUrl } from '../utils/api';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: Entry, openReflectionStudio?: boolean) => void;
}

export const NewEntryModal: React.FC<NewEntryModalProps> = ({
  isOpen,
  onClose,
  onAddEntry,
}) => {
  const [entryMode, setEntryMode] = useState<'form' | 'socratic'>('form');
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchedSuccess, setUrlFetchedSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [medium, setMedium] = useState<MediumType>('book');
  const [sourceUrl, setSourceUrl] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [tags, setTags] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState('');

  // The 3 core pillars:
  const [whatImThinking, setWhatImThinking] = useState('');
  const [whyILikedIt, setWhyILikedIt] = useState('');
  const [howIllUseIt, setHowIllUseIt] = useState('');

  const [isLookingUp, setIsLookingUp] = useState(false);

  if (!isOpen) return null;

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    setIsFetchingUrl(true);
    setUrlFetchedSuccess(false);

    try {
      const data = await fetchSourceFromUrl(urlInput.trim());
      if (data.title) setTitle(data.title);
      if (data.author) setAuthor(data.author);
      if (data.medium) setMedium(data.medium);
      if (data.coverUrl) setCoverUrl(data.coverUrl);
      if (data.briefContext && !whatImThinking) {
        setWhatImThinking(data.briefContext);
      }
      if (data.suggestedTags && data.suggestedTags.length > 0) {
        setTags((prev) => Array.from(new Set([...prev, ...data.suggestedTags])));
      }
      setSourceUrl(urlInput.trim());
      setUrlFetchedSuccess(true);
    } catch (err: any) {
      console.warn('URL fetch failed:', err);
      alert('Could not automatically fetch from this URL. Please enter title manually: ' + (err?.message || ''));
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleLookup = async () => {
    if (!title.trim()) return;
    setIsLookingUp(true);
    try {
      const data = await lookupBookDetails(title.trim());
      if (data.title) setTitle(data.title);
      if (data.author) setAuthor(data.author);
      if (data.medium) setMedium(data.medium);
      if (data.coverUrl) setCoverUrl(data.coverUrl);
      if (data.suggestedTags && data.suggestedTags.length > 0) {
        setTags((prev) => Array.from(new Set([...prev, ...data.suggestedTags])));
      }
    } catch (err) {
      console.warn('Lookup failed, continue manually:', err);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleApplyPillarsFromChat = (pillars: {
    whatImThinking: string;
    whyILikedIt: string;
    howIllUseItGoingForward: string;
    suggestedTags?: string[];
  }) => {
    setWhatImThinking(pillars.whatImThinking);
    setWhyILikedIt(pillars.whyILikedIt);
    setHowIllUseIt(pillars.howIllUseItGoingForward);
    if (pillars.suggestedTags && pillars.suggestedTags.length > 0) {
      setTags((prev) => Array.from(new Set([...prev, ...pillars.suggestedTags!])));
    }
    setEntryMode('form');
  };

  const handleSubmit = (openStudio: boolean = false) => {
    if (!title.trim()) {
      alert('Please provide a title or episode name');
      return;
    }

    const newEntry: Entry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      author: author.trim() || 'Unknown',
      medium,
      sourceUrl: sourceUrl.trim() || urlInput.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      dateLogged: new Date().toISOString().slice(0, 10),
      rating,
      tags: tags.length > 0 ? tags : ['Insights'],
      status: 'completed',
      whatImThinking: whatImThinking.trim(),
      whyILikedIt: whyILikedIt.trim(),
      howIllUseItGoingForward: howIllUseIt.trim(),
      clubDiscussion: [],
      quotes: [],
    };

    onAddEntry(newEntry, openStudio);
    onClose();

    // Reset form
    setTitle('');
    setAuthor('');
    setMedium('book');
    setSourceUrl('');
    setUrlInput('');
    setUrlFetchedSuccess(false);
    setRating(5);
    setTags([]);
    setCoverUrl('');
    setWhatImThinking('');
    setWhyILikedIt('');
    setHowIllUseIt('');
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl border border-[#E7E2D8] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DA] bg-[#FAF8F5]">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Record New Source in Book Club Library
            </h2>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Log a podcast, article, book, or talk to capture takeaways and share recommendations.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-200/50 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Fast URL Pull Section for Podcasts, Articles, Videos, and Books */}
          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E7E0D3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-mono font-bold text-[#9A3412] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Pull from URL (Podcast, Article, Video, or Book)
              </span>
              <span className="text-[11px] text-stone-500 font-sans hidden sm:inline">
                Auto-fills title, creator, thumbnail & tags
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFetchUrl();
                    }
                  }}
                  placeholder="Paste Spotify episode, Apple Podcasts, Substack, YouTube, Medium, or article link..."
                  className="w-full text-xs sm:text-sm font-sans pl-9 pr-3 py-2.5 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
                />
              </div>
              <button
                type="button"
                onClick={handleFetchUrl}
                disabled={isFetchingUrl || !urlInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Pulling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pull Source</span>
                  </>
                )}
              </button>
            </div>

            {urlFetchedSuccess && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50/90 border border-emerald-200 rounded-lg text-xs text-emerald-900 animate-in fade-in">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Source thumbnail"
                    className="w-12 h-12 object-cover rounded border border-emerald-300 shadow-2xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 truncate">
                    Pulled: {title}
                  </p>
                  <p className="text-[11px] text-stone-600 truncate">
                    {author} · {medium.toUpperCase()} · Thumbnail and metadata extracted
                  </p>
                </div>
              </div>
            )}

            {/* Quick format hint badges */}
            <div className="flex items-center gap-2 text-[11px] text-stone-500 overflow-x-auto pt-0.5">
              <span className="font-mono text-stone-400 shrink-0">Supported:</span>
              <span className="px-2 py-0.5 bg-white rounded border border-stone-200 text-stone-700 whitespace-nowrap">
                Podcasts (Spotify, Apple, Overcast)
              </span>
              <span className="px-2 py-0.5 bg-white rounded border border-stone-200 text-stone-700 whitespace-nowrap">
                Articles & Substack
              </span>
              <span className="px-2 py-0.5 bg-white rounded border border-stone-200 text-stone-700 whitespace-nowrap">
                YouTube Talks & Video
              </span>
              <span className="px-2 py-0.5 bg-white rounded border border-stone-200 text-stone-700 whitespace-nowrap">
                Books
              </span>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase font-mono text-stone-400 font-medium">
              Source Details & Review
            </span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {/* Title & Fast AI Auto-lookup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-sans font-semibold text-stone-800">
                Title / Work Name *
              </label>
              {title.trim().length > 2 && (
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={isLookingUp}
                  className="inline-flex items-center gap-1 text-[11px] text-[#9A3412] font-semibold hover:underline cursor-pointer disabled:opacity-50"
                >
                  {isLookingUp ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>Auto-detect author & tags</span>
                </button>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Range: Why Generalists Triumph, or Huberman Lab Ep. 42"
              className="w-full text-sm font-serif p-3 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
              required
            />
          </div>

          {/* Author & Medium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-sans font-semibold text-stone-800 block mb-1">
                Author / Creator
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. David Epstein"
                className="w-full text-sm font-serif p-2.5 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
              />
            </div>

            <div>
              <label className="text-xs font-sans font-semibold text-stone-800 block mb-1">
                Medium
              </label>
              <select
                value={medium}
                onChange={(e) => setMedium(e.target.value as MediumType)}
                className="w-full text-xs font-sans p-2.5 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
              >
                <option value="book">Book</option>
                <option value="podcast">Podcast</option>
                <option value="article">Article</option>
                <option value="essay">Essay</option>
                <option value="video">Talk / Video</option>
              </select>
            </div>
          </div>

          {/* Rating & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-sans font-semibold text-stone-800 block mb-1">
                Rating
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-mono font-bold text-stone-700 ml-2">
                  {rating}/5
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-sans font-semibold text-stone-800 block mb-1">
                Thematic Tags & Topics
              </label>
              <TagInput tags={tags} onChange={setTags} />
            </div>
          </div>

          {/* Optional Cover Art URL & Preview */}
          <div className="flex items-start gap-4">
            {coverUrl && (
              <img
                src={coverUrl}
                alt="Detected cover"
                className="w-14 h-20 object-cover rounded border border-[#DFD8C9] shrink-0 shadow-2xs"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <div className="flex-1">
              <label className="text-xs font-sans font-semibold text-stone-800 block mb-1">
                Cover Image Thumbnail (Auto-detected or custom URL)
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://... (auto-filled if title matches published work)"
                className="w-full text-xs font-sans p-2.5 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
              />
            </div>
          </div>

          {/* Mode Selector for Reflections */}
          <div className="pt-2 border-t border-[#EDE7DC]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-[#9A3412] font-mono font-bold">
                How do you want to reflect?
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-[#F4EFE6] rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setEntryMode('form')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    entryMode === 'form'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Structured Fields
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('socratic')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    entryMode === 'socratic'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#9A3412]" />
                  <span>Socratic Chat with AI</span>
                </button>
              </div>
            </div>

            {/* Socratic Chat Mode */}
            {entryMode === 'socratic' ? (
              <div className="space-y-3">
                <p className="text-xs text-stone-600 font-serif leading-relaxed">
                  Have an intellectual back-and-forth dialogue with the LLM. It will challenge your assumptions and probe deeper on your thinking. When done, click <strong>"Apply to 3 Pillars"</strong> to distill the conversation into your notes.
                </p>
                <SocraticChatPanel
                  workTitle={title.trim() || 'this work'}
                  workAuthor={author.trim()}
                  medium={medium}
                  onApplyPillars={handleApplyPillarsFromChat}
                />
              </div>
            ) : (
              /* The 3 Core Book Club Discussion Prompts Form */
              <div className="space-y-4">
                {/* Pillar 1 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-serif font-semibold text-stone-900">
                      1. What I'm thinking (takeaways & surprises)
                    </label>
                    <SpeechToTextButton
                      onTranscript={(t) =>
                        setWhatImThinking((prev) => (prev ? prev + ' ' + t : t))
                      }
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={whatImThinking}
                    onChange={(e) => setWhatImThinking(e.target.value)}
                    placeholder="What aha moment did you have? What concept shifted how you view things?"
                    className="w-full text-xs font-serif p-2.5 rounded-lg border border-[#D5CCBA] bg-[#FAF8F5] focus:bg-white focus:outline-stone-400"
                  />
                </div>

                {/* Pillar 2 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-serif font-semibold text-stone-900">
                      2. Why I liked it (resonance & standouts)
                    </label>
                    <SpeechToTextButton
                      onTranscript={(t) =>
                        setWhyILikedIt((prev) => (prev ? prev + ' ' + t : t))
                      }
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={whyILikedIt}
                    onChange={(e) => setWhyILikedIt(e.target.value)}
                    placeholder="What stories or arguments resonated most? Why would you recommend it?"
                    className="w-full text-xs font-serif p-2.5 rounded-lg border border-[#D5CCBA] bg-[#FAF8F5] focus:bg-white focus:outline-stone-400"
                  />
                </div>

                {/* Pillar 3 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-serif font-semibold text-stone-900">
                      3. How I'll use it going forward (habits & rules)
                    </label>
                    <SpeechToTextButton
                      onTranscript={(t) =>
                        setHowIllUseIt((prev) => (prev ? prev + ' ' + t : t))
                      }
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={howIllUseIt}
                    onChange={(e) => setHowIllUseIt(e.target.value)}
                    placeholder="What rule, experiment, or habit will you implement in your business or life?"
                    className="w-full text-xs font-serif p-2.5 rounded-lg border border-[#D5CCBA] bg-[#FAF8F5] focus:bg-white focus:outline-stone-400"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE5DA] flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 text-xs font-semibold text-stone-800 bg-[#E8E1D3] hover:bg-[#DED5C4] border border-[#D5CCBA] rounded-lg transition-colors cursor-pointer"
          >
            Save to Vault
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            Save & Open Reflection Studio
          </button>
        </div>

      </div>
    </div>
  );
};
