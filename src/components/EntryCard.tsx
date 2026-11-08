import React from 'react';
import { Book, Headphones, FileText, Star, MessageSquare, ArrowUpRight, Sparkles } from 'lucide-react';
import { Entry, isUnrated } from '../types';

interface EntryCardProps {
  entry: Entry;
  onSelect: (entry: Entry) => void;
  onReflect: (entry: Entry) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onSelect, onReflect }) => {
  const getMediumIcon = (medium: string) => {
    switch (medium) {
      case 'podcast':
        return <Headphones className="w-3.5 h-3.5 text-[#854D0E]" />;
      case 'article':
      case 'essay':
        return <FileText className="w-3.5 h-3.5 text-[#14532D]" />;
      default:
        return <Book className="w-3.5 h-3.5 text-[#9A3412]" />;
    }
  };

  const formattedDate = new Date(entry.dateLogged).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <article className="group bg-white rounded-xl border border-[#E7E2D8] hover:border-stone-400/80 transition-all duration-200 flex flex-col justify-between overflow-hidden hover:shadow-md">
      <div>
        {/* Cover presentation & medium header */}
        <div className="relative h-44 sm:h-48 w-full bg-[#F5F2EA] overflow-hidden border-b border-[#EAE5DA]">
          {entry.coverUrl ? (
            <img
              src={entry.coverUrl}
              alt={`Cover of ${entry.title}`}
              className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // If local image fails to load, gracefully hide img and show fallback styling
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-[#F5F2EB] to-[#E9E3D5]">
              <div className="text-xs uppercase tracking-widest font-sans font-medium text-stone-500">
                {entry.medium}
              </div>
              <div>
                <p className="font-serif font-semibold text-lg text-stone-900 leading-snug line-clamp-2">
                  {entry.title}
                </p>
                <p className="text-xs text-stone-600 mt-1 font-serif italic">
                  {entry.author}
                </p>
              </div>
            </div>
          )}

          {/* Quick status marker */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-stone-900/85 text-white backdrop-blur-xs rounded text-[11px] font-sans font-medium tracking-wide">
            {getMediumIcon(entry.medium)}
            <span className="capitalize">{entry.medium}</span>
          </div>

          {/* Rating — omitted entirely when the book was never rated. */}
          {!isUnrated(entry.rating) && (
            <div className="absolute top-3 right-3 flex items-center gap-0.5 px-2 py-1 bg-white/90 backdrop-blur-xs rounded text-[11px] font-mono text-stone-800 shadow-xs">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="font-bold">{entry.rating}</span>
            </div>
          )}
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6">
          {/* Unboxed metadata row adhering strictly to Zero-Pill discipline */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-sans mb-2.5">
            <span className="font-medium text-stone-800">{entry.author}</span>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
            {entry.synthesis && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#9A3412] font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Synthesized
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h2
            onClick={() => onSelect(entry)}
            className="text-xl font-serif font-semibold text-stone-900 leading-snug tracking-tight hover:text-[#9A3412] cursor-pointer transition-colors mb-3 line-clamp-2"
          >
            {entry.title}
          </h2>

          {/* Synthesis thesis if available or What I'm thinking preview */}
          <p className="text-sm text-stone-600 font-serif leading-relaxed line-clamp-3 mb-4">
            {entry.synthesis?.thesis || entry.whatImThinking || entry.whyILikedIt}
          </p>

          {/* The 3 Core Pillars Indicators */}
          <div className="space-y-1.5 pt-3 border-t border-[#F0EBE1] text-xs font-sans">
            <div className="flex items-start gap-2">
              <span className="text-stone-400 font-serif italic shrink-0 w-24">Thinking:</span>
              <span className="text-stone-700 truncate">{entry.whatImThinking || 'No notes yet'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-stone-400 font-serif italic shrink-0 w-24">Why Liked:</span>
              <span className="text-stone-700 truncate">{entry.whyILikedIt || 'No notes yet'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-stone-400 font-serif italic shrink-0 w-24">Going Forward:</span>
              <span className="text-stone-700 truncate">{entry.howIllUseItGoingForward || 'No notes yet'}</span>
            </div>
          </div>

          {/* Tags as subtle text items */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex flex-wrap gap-1.5 text-xs text-stone-500 font-sans">
              {entry.tags.map((tag, idx) => (
                <span key={idx} className="hover:text-stone-900 transition-colors">
                  #{tag}
                  {idx < entry.tags.length - 1 ? ' ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 bg-[#FAF7F2] border-t border-[#EAE5DA] flex items-center justify-between">
        <button
          onClick={() => onReflect(entry)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#9A3412]" />
          <span>Club Prompts ({entry.clubDiscussion?.length || 0})</span>
        </button>

        <button
          onClick={() => onSelect(entry)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:text-[#9A3412] transition-colors cursor-pointer"
        >
          <span>Open Vault</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
