import React, { useState } from 'react';
import { X, BookOpen, Star, Sparkles, MessageSquare, Quote, CheckCircle2, Edit3, Trash2, ArrowUpRight, Share2 } from 'lucide-react';
import { Entry } from '../types';

interface EntryDetailModalProps {
  entry: Entry | null;
  onClose: () => void;
  onOpenReflectionStudio: (entryId: string) => void;
  onOpenRecommendationMaker: (entry: Entry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onOpenReflectionStudio,
  onOpenRecommendationMaker,
  onDeleteEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'reflections' | 'synthesis' | 'qa' | 'quotes'>('reflections');

  if (!entry) return null;

  const formattedDate = new Date(entry.dateLogged).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl border border-[#E7E2D8] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DA] bg-[#FAF8F5]">
          <div className="flex items-center gap-2 text-xs font-sans text-stone-500">
            <span className="capitalize font-medium text-stone-800">{entry.medium}</span>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 font-mono text-stone-900 font-bold">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              {entry.rating} / 5
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenRecommendationMaker(entry)}
              title="Generate shareable recommendation"
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 rounded-md transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Remove "${entry.title}" from your library?`)) {
                  onDeleteEntry(entry.id);
                  onClose();
                }
              }}
              title="Delete source"
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Header / Book Overview */}
        <div className="p-6 border-b border-[#EAE5DA] flex flex-col sm:flex-row items-start gap-5 bg-white">
          {entry.coverUrl ? (
            <img
              src={entry.coverUrl}
              alt={entry.title}
              className="w-20 h-28 object-cover rounded-lg border border-[#DFD8C9] shrink-0 shadow-xs"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 h-28 bg-[#F5F2EB] rounded-lg border border-[#DFD8C9] flex items-center justify-center text-stone-400 shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
              {entry.title}
            </h2>
            <p className="text-base font-serif italic text-stone-600 mt-1">
              by {entry.author}
            </p>

            {entry.sourceUrl && (
              <div className="mt-2">
                <a
                  href={entry.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-sans text-[#9A3412] hover:text-[#7A280E] hover:underline"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Open Original Source Link</span>
                </a>
              </div>
            )}

            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500 font-sans">
                {entry.tags.map((t, idx) => (
                  <span key={idx} className="bg-[#F5F2EB] px-2 py-0.5 rounded text-stone-700">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenReflectionStudio(entry.id);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Open Reflection Studio</span>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-[#EAE5DA] bg-[#FAF8F5] flex items-center gap-6 text-xs font-medium text-stone-600">
          <button
            onClick={() => setActiveTab('reflections')}
            className={`py-3 relative cursor-pointer ${
              activeTab === 'reflections' ? 'text-stone-900 font-bold' : 'hover:text-stone-900'
            }`}
          >
            3 Core Pillars
            {activeTab === 'reflections' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#9A3412]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('synthesis')}
            className={`py-3 relative cursor-pointer flex items-center gap-1 ${
              activeTab === 'synthesis' ? 'text-stone-900 font-bold' : 'hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#9A3412]" />
            AI Executive Synthesis
            {activeTab === 'synthesis' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#9A3412]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('qa')}
            className={`py-3 relative cursor-pointer ${
              activeTab === 'qa' ? 'text-stone-900 font-bold' : 'hover:text-stone-900'
            }`}
          >
            Club Q&A ({entry.clubDiscussion?.length || 0})
            {activeTab === 'qa' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#9A3412]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`py-3 relative cursor-pointer ${
              activeTab === 'quotes' ? 'text-stone-900 font-bold' : 'hover:text-stone-900'
            }`}
          >
            Gems & Quotes ({entry.quotes?.length || 0})
            {activeTab === 'quotes' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#9A3412]" />
            )}
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Tab 1: Reflections */}
          {activeTab === 'reflections' && (
            <div className="space-y-6">
              {/* Pillar 1 */}
              <div className="p-4 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5]">
                <span className="text-xs uppercase tracking-widest text-[#9A3412] font-mono font-bold block mb-1">
                  Pillar 01 · What I'm Thinking
                </span>
                <p className="text-sm font-serif text-stone-800 leading-relaxed whitespace-pre-line">
                  {entry.whatImThinking || 'No initial reflections recorded yet.'}
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5]">
                <span className="text-xs uppercase tracking-widest text-[#9A3412] font-mono font-bold block mb-1">
                  Pillar 02 · Why I Liked It
                </span>
                <p className="text-sm font-serif text-stone-800 leading-relaxed whitespace-pre-line">
                  {entry.whyILikedIt || 'No impressions recorded yet.'}
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5]">
                <span className="text-xs uppercase tracking-widest text-[#14532D] font-mono font-bold block mb-1">
                  Pillar 03 · How I'll Use It Going Forward
                </span>
                <p className="text-sm font-serif text-stone-800 leading-relaxed whitespace-pre-line">
                  {entry.howIllUseItGoingForward || 'No operational actions recorded yet.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: AI Synthesis */}
          {activeTab === 'synthesis' && (
            <div>
              {entry.synthesis ? (
                <div className="space-y-6">
                  {/* Thesis */}
                  <div>
                    <span className="text-xs uppercase tracking-widest text-stone-400 font-mono font-medium block mb-1">
                      Executive Thesis
                    </span>
                    <p className="text-lg font-serif italic text-stone-900 leading-relaxed bg-[#F8F5EE] p-4 rounded-lg border border-[#EBE5DA]">
                      "{entry.synthesis.thesis}"
                    </p>
                  </div>

                  {/* Key Principles */}
                  <div>
                    <span className="text-xs uppercase tracking-widest text-stone-400 font-mono font-medium block mb-2">
                      Core Mental Models
                    </span>
                    <ul className="space-y-2 text-sm font-serif text-stone-800">
                      {entry.synthesis.keyPrinciples.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#9A3412] font-bold">·</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Playbook */}
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#14532D] font-mono font-medium block mb-2">
                      Action Playbook ({entry.synthesis.actionPlaybook.length} Rules)
                    </span>
                    <div className="space-y-2">
                      {entry.synthesis.actionPlaybook.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-lg border border-[#EDE7DC] bg-[#FAF8F5] flex items-center justify-between text-xs sm:text-sm font-serif"
                        >
                          <span>{act.action}</span>
                          <span className="font-sans text-[11px] font-medium text-stone-500 shrink-0 ml-3">
                            {act.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation Pitch */}
                  <div className="p-4 rounded-xl border border-[#DFD8CB] bg-white text-xs font-sans space-y-2">
                    <span className="text-xs uppercase tracking-widest text-stone-400 font-mono font-medium block">
                      Recommendation Pitch Card
                    </span>
                    <div>
                      <span className="font-semibold text-stone-800">Why I Liked It: </span>
                      <span className="text-stone-600">{entry.synthesis.recommendationPitch.whyRecommend}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-800">Who Should Read: </span>
                      <span className="text-stone-600">{entry.synthesis.recommendationPitch.whoShouldRead}</span>
                    </div>
                    <div className="pt-2 border-t border-stone-100 font-serif italic text-stone-800 text-sm">
                      "{entry.synthesis.recommendationPitch.ratingBlurb}"
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-serif text-stone-600 mb-4">
                    This source has not been synthesized with AI yet.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenReflectionStudio(entry.id);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-[#9A3412] text-white rounded-lg hover:bg-[#822B0F] transition-colors"
                  >
                    Open Reflection Studio & Synthesize
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Club Q&A */}
          {activeTab === 'qa' && (
            <div className="space-y-4">
              {entry.clubDiscussion && entry.clubDiscussion.length > 0 ? (
                entry.clubDiscussion.map((qa, idx) => (
                  <div key={qa.id} className="p-4 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5]">
                    <span className="text-xs font-mono font-bold text-[#9A3412] block mb-1">
                      Question {idx + 1}
                    </span>
                    <h4 className="font-serif font-semibold text-stone-900 text-sm mb-2">
                      {qa.question}
                    </h4>
                    <p className="text-sm font-serif text-stone-700 whitespace-pre-line pl-3 border-l-2 border-[#D5CCBA]">
                      {qa.answer || '(No answer recorded yet. Add your response in the Reflection Studio!)'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-stone-500 font-serif text-sm">
                  No discussion questions recorded yet for this book.
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Quotes */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {entry.quotes && entry.quotes.length > 0 ? (
                entry.quotes.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5]">
                    <Quote className="w-4 h-4 text-[#9A3412]/60 mb-1" />
                    <p className="text-sm font-serif italic text-stone-900 leading-relaxed">
                      "{q.text}"
                    </p>
                    {q.location && (
                      <span className="text-xs font-sans text-stone-500 block mt-2">
                        {q.location}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-stone-500 font-serif text-sm">
                  No quotes or soundbites recorded yet.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
