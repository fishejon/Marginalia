import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Headphones, FileText, Plus, ExternalLink, Loader2, RefreshCw, Check } from 'lucide-react';
import { Entry, SmartRecommendation, MediumType } from '../types';
import { fetchSmartRecommendations } from '../utils/api';

interface SmartRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Entry[];
  onAddEntryToVault: (newEntry: Entry) => void;
}

export const SmartRecommendationsModal: React.FC<SmartRecommendationsModalProps> = ({
  isOpen,
  onClose,
  entries,
  onAddEntryToVault,
}) => {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [shelfSynthesis, setShelfSynthesis] = useState<string>('');
  const [groundingSources, setGroundingSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [customInquiry, setCustomInquiry] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = async (inquiryText?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSmartRecommendations({
        userVaultEntries: entries,
        query: inquiryText || customInquiry,
      });

      setRecommendations(res.recommendations || []);
      setShelfSynthesis(res.shelfSynthesis || '');
      setGroundingSources(res.groundingSources || []);
    } catch (err: any) {
      console.error('Failed to load smart recommendations:', err);
      setError(err?.message || 'Could not load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && recommendations.length === 0) {
      loadRecommendations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddRecommendation = (rec: SmartRecommendation) => {
    const newEntry: Entry = {
      id: `rec-entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: rec.title,
      author: rec.author,
      medium: rec.medium as MediumType,
      coverUrl: rec.coverUrl,
      dateLogged: new Date().toISOString().slice(0, 10),
      rating: 5,
      tags: rec.tags && rec.tags.length > 0 ? rec.tags : ['Recommended'],
      status: 'in-progress',
      whatImThinking: `Recommended based on shelf synthesis: ${rec.thematicConnection}`,
      whyILikedIt: rec.whyRecommended,
      howIllUseItGoingForward: '',
      clubDiscussion: [],
      quotes: [],
    };

    onAddEntryToVault(newEntry);
    setAddedIds((prev) => new Set([...prev, rec.id]));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl border border-[#E7E2D8] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DA] bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#9A3412] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                Smart Library Recommendations
              </h2>
              <p className="text-[11px] text-stone-500 font-sans">
                Grounded in web search data & tailored to expand your vaulted themes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-900 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom inquiry row */}
        <div className="p-4 sm:px-6 bg-[#FAF8F5] border-b border-[#EDE7DC] flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={customInquiry}
            onChange={(e) => setCustomInquiry(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadRecommendations();
            }}
            placeholder="Focus recommendations (e.g. 'Books on pricing strategies', 'Neuroscience podcasts')..."
            className="w-full text-xs font-sans p-2.5 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
          />
          <button
            onClick={() => loadRecommendations()}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Discover</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Synthesis Note */}
          {shelfSynthesis && !loading && (
            <div className="p-4 rounded-xl bg-[#F8F5EE] border border-[#E7E2D8] text-xs font-serif italic text-stone-800 leading-relaxed">
              <span className="font-sans font-bold uppercase tracking-wider text-[#9A3412] not-italic block mb-1 text-[11px]">
                Vault Reading Horizon:
              </span>
              "{shelfSynthesis}"
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#9A3412] mx-auto" />
              <p className="text-sm font-serif text-stone-700">
                Searching and curating grounded recommendations for your library...
              </p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-16 text-center text-stone-500 font-serif">
              <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm">Click "Discover" to generate tailored recommendations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const isAdded = addedIds.has(rec.id);

                return (
                  <div
                    key={rec.id}
                    className="p-5 rounded-xl border border-[#E7E2D8] bg-white hover:border-stone-400 transition-all flex flex-col sm:flex-row items-start gap-4 shadow-2xs"
                  >
                    {/* Cover Art thumbnail */}
                    {rec.coverUrl ? (
                      <img
                        src={rec.coverUrl}
                        alt={rec.title}
                        className="w-20 h-28 object-cover rounded-md border border-[#DFD8C9] shrink-0 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-[#F5F2EB] rounded-md border border-[#DFD8C9] flex flex-col items-center justify-center p-2 text-center text-stone-400 shrink-0">
                        {rec.medium === 'podcast' ? (
                          <Headphones className="w-6 h-6 mb-1 text-[#854D0E]" />
                        ) : (
                          <BookOpen className="w-6 h-6 mb-1 text-[#9A3412]" />
                        )}
                        <span className="text-[10px] uppercase font-mono">{rec.medium}</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-sans text-stone-500 mb-1">
                        <span className="capitalize font-semibold text-stone-800">
                          {rec.medium}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{rec.author}</span>
                      </div>

                      <h3 className="text-lg font-serif font-bold text-stone-900 leading-snug">
                        {rec.title}
                      </h3>

                      <p className="text-xs sm:text-sm font-serif text-stone-700 mt-2 leading-relaxed">
                        {rec.whyRecommended}
                      </p>

                      {rec.thematicConnection && (
                        <p className="text-xs font-sans text-[#9A3412] mt-1.5 font-medium">
                          Bridge to your vault: {rec.thematicConnection}
                        </p>
                      )}

                      {rec.tags && rec.tags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-stone-500 font-sans">
                          {rec.tags.map((tag, idx) => (
                            <span key={idx} className="bg-[#FAF8F5] border border-[#EDE7DC] px-2 py-0.5 rounded text-stone-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleAddRecommendation(rec)}
                        disabled={isAdded}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs ${
                          isAdded
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>In Vault</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Shelf</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grounding Web Citations from Google Search */}
          {groundingSources.length > 0 && (
            <div className="pt-4 border-t border-[#EAE5DA] text-xs text-stone-500 font-sans">
              <span className="font-semibold text-stone-700 block mb-1">
                Verified Search Grounding Sources:
              </span>
              <div className="flex flex-wrap gap-2">
                {groundingSources.slice(0, 4).map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 underline truncate max-w-xs"
                  >
                    <span>{source.title || source.uri}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
