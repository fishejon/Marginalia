import React from 'react';
import {
  Plus,
  Sparkles,
  Users,
  BookOpen,
  Headphones,
  FileText,
  Quote,
  TrendingUp,
} from 'lucide-react';
import { Entry } from '../types';

interface HeroBannerProps {
  entries: Entry[];
  libraryViewMode?: 'shelf' | 'grid';
  onToggleViewMode?: (mode: 'shelf' | 'grid') => void;
  onOpenNewModal: () => void;
  onOpenConsult: () => void;
  onSelectReflect: () => void;
  onOpenSmartRecs?: () => void;
  onLoadStarterCanon?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  entries,
  onOpenNewModal,
  onOpenConsult,
  onOpenSmartRecs,
  onLoadStarterCanon,
}) => {
  const booksCount = entries.filter((e) => e.medium === 'book').length;
  const podcastsCount = entries.filter((e) => e.medium === 'podcast').length;
  const articlesCount = entries.filter(
    (e) => e.medium === 'article' || e.medium === 'essay'
  ).length;
  const totalQuotes = entries.reduce(
    (acc, curr) => acc + (curr.quotes?.length || 0),
    0
  );
  const totalActions = entries.reduce(
    (acc, curr) => acc + (curr.synthesis?.actionPlaybook?.length || 0),
    0
  );

  // Sample recent book or quote to showcase in the compact side note
  const sampleEntry = entries.find((e) => e.quotes && e.quotes.length > 0) || entries[0];
  const sampleQuote = sampleEntry?.quotes?.[0]?.text;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#E4DEC3]/90 bg-[#F4EFE6] shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Column: Editorial Book Club Introduction */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-[#78716C] mb-2 font-sans font-medium">
              <span className="font-bold text-[#9A3412] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Community & Personal Book Club
              </span>
              <span aria-hidden="true">·</span>
              <span>Books · Podcasts · Articles · Talks</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium text-stone-900 leading-[1.2] tracking-tight mb-3 max-w-2xl text-balance">
              Read deeply. Discuss openly. Share what transforms.
            </h1>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-serif max-w-2xl mb-5">
              A collaborative book club and knowledge library to record takeaways from books,
              podcasts, and articles: synthesize what you’re thinking, why it resonated, and
              curate recommendations to share with friends and fellow readers.
            </p>
          </div>

          <div>
            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <button
                onClick={onOpenNewModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record New Source</span>
                <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded font-mono">
                  URL / Title
                </span>
              </button>

              <button
                onClick={onOpenConsult}
                disabled={entries.length === 0}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-stone-800 bg-[#E8E1D3] hover:bg-[#DED5C4] rounded-lg transition-colors border border-[#D5CCBA] cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#9A3412]" />
                <span>Ask Knowledge Base</span>
              </button>

              {onOpenSmartRecs && (
                <button
                  onClick={onOpenSmartRecs}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#9A3412] hover:bg-[#EAE2D2] rounded-lg transition-colors cursor-pointer border border-[#DFD3BF]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Smart Recommendations</span>
                </button>
              )}

              {entries.length === 0 && onLoadStarterCanon && (
                <button
                  onClick={onLoadStarterCanon}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 underline underline-offset-4 cursor-pointer"
                >
                  <span>Load starter canon</span>
                </button>
              )}
            </div>

            {/* Live Library Footnotes */}
            <div className="pt-3 border-t border-[#DFD8C9] flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-stone-600 font-sans">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-stone-900 font-mono tabular-nums">
                  {entries.length}
                </span>
                <span>Sources</span>
              </div>
              <span className="text-stone-300" aria-hidden="true">|</span>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-amber-700" />
                <span className="font-semibold text-stone-900 font-mono tabular-nums">
                  {booksCount}
                </span>
                <span>Books</span>
              </div>
              <span className="text-stone-300" aria-hidden="true">|</span>
              <div className="flex items-center gap-1">
                <Headphones className="w-3 h-3 text-[#9A3412]" />
                <span className="font-semibold text-stone-900 font-mono tabular-nums">
                  {podcastsCount}
                </span>
                <span>Podcasts</span>
              </div>
              <span className="text-stone-300" aria-hidden="true">|</span>
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-800" />
                <span className="font-semibold text-stone-900 font-mono tabular-nums">
                  {articlesCount}
                </span>
                <span>Articles</span>
              </div>
              <span className="text-stone-300" aria-hidden="true">|</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-stone-500" />
                <span className="font-semibold text-stone-900 font-mono tabular-nums">
                  {totalActions}
                </span>
                <span>Actions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Compact Club Reflection & Reader Quote Note */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#DFD8C9] bg-[#EDE7DC]/50 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#9A3412] flex items-center gap-1">
                <Quote className="w-3 h-3" />
                Club Highlight
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                {totalQuotes} saved quotes
              </span>
            </div>

            {sampleQuote ? (
              <blockquote className="border-l-2 border-[#9A3412]/60 pl-3 py-1 font-serif italic text-xs sm:text-sm text-stone-800 leading-snug">
                "{sampleQuote.length > 130 ? sampleQuote.slice(0, 130) + '...' : sampleQuote}"
              </blockquote>
            ) : (
              <p className="font-serif italic text-xs text-stone-600 leading-relaxed">
                "The books that help you most are those which make you think that most." — Theodore Parker
              </p>
            )}

            {sampleEntry && (
              <p className="text-[11px] font-sans text-stone-500">
                From <span className="font-semibold text-stone-800 font-serif">{sampleEntry.title}</span> by {sampleEntry.author}
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#DED7C7] flex items-center justify-between text-[11px] text-stone-600">
            <span className="font-serif italic text-stone-500">Shared canon & living shelf</span>
            <span className="font-mono text-stone-700 font-semibold">{entries.length} items logged</span>
          </div>
        </div>
      </div>
    </div>
  );
};
