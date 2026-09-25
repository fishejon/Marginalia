import React, { useState } from 'react';
import { Sparkles, MessageCircleQuestion, ArrowRight, Loader2, BookOpen, CheckCircle, Quote, Lightbulb } from 'lucide-react';
import { Entry, QueryRepositoryResult } from '../types';
import { queryRepository } from '../utils/api';
import { SpeechToTextButton } from './SpeechToTextButton';

interface ConsultRepositoryViewProps {
  entries: Entry[];
  onSelectEntry: (entry: Entry) => void;
}

export const ConsultRepositoryView: React.FC<ConsultRepositoryViewProps> = ({
  entries,
  onSelectEntry,
}) => {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState<'problem-solving' | 'recommendation' | 'general'>(
    'problem-solving'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryRepositoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQueries = [
    {
      title: 'Strategic Decision-Making Under Risk',
      text: 'I have a high-stakes business decision with lots of unknowns. How does my reading library advise me to evaluate the downside and avoid cognitive biases?',
      type: 'problem-solving' as const,
    },
    {
      title: 'Habit Consistency & Workspace Friction',
      text: 'I am struggling to sustain my morning writing routine. What specific systems and environment rules should I implement according to my notes?',
      type: 'problem-solving' as const,
    },
    {
      title: 'Recommendation for a Stressed Colleague',
      text: 'Recommend a book from my shelf for a founder colleague who is burning out, feeling overwhelmed by goals, and neglecting recovery.',
      type: 'recommendation' as const,
    },
    {
      title: 'Capital & Financial Autonomy',
      text: 'Why did I like The Psychology of Money, and how do I apply the concept of "enough" to our business runway?',
      type: 'general' as const,
    },
  ];

  const handleConsult = async (customQuery?: string, customType?: 'problem-solving' | 'recommendation' | 'general') => {
    const q = customQuery || query;
    const t = customType || queryType;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await queryRepository({
        query: q.trim(),
        libraryItems: entries,
        queryType: t,
      });
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to query the repository. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#78716C] mb-2 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[#9A3412]" />
          <span>Synthesis & Consultation Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-stone-900 leading-tight">
          Ask Your Reading Repository
        </h1>
        <p className="text-sm sm:text-base text-stone-600 font-serif mt-2 leading-relaxed">
          Pose a business challenge, personal dilemma, or request a book recommendation. AI synthesizes advice grounded exclusively in the takeaways, principles, and rules you’ve vaulted.
        </p>
      </div>

      {/* Query Formulation Box */}
      <div className="bg-white rounded-xl border border-[#E7E2D8] p-6 sm:p-8 shadow-xs">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 mb-4 p-1 bg-[#F4EFE6] rounded-lg w-fit text-xs font-medium">
          <button
            onClick={() => setQueryType('problem-solving')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              queryType === 'problem-solving'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Business / Personal Problem
          </button>
          <button
            onClick={() => setQueryType('recommendation')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              queryType === 'recommendation'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Recommend a Book
          </button>
          <button
            onClick={() => setQueryType('general')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              queryType === 'general'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Concept / Takeaway Review
          </button>
        </div>

        {/* Input Area */}
        <div className="relative">
          <textarea
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              queryType === 'problem-solving'
                ? 'Describe the business or personal problem you are grappling with... (e.g. "We need to price a new product tier without scaring clients", or "I cannot focus during afternoon meetings")'
                : queryType === 'recommendation'
                ? 'Who are you looking to recommend a book for, and what are their current goals or struggles?'
                : 'What idea, concept, or element from your reading library would you like to review?'
            }
            className="w-full text-sm sm:text-base font-serif leading-relaxed text-stone-800 p-4 rounded-lg border border-[#D5CCBA] bg-[#FAF8F5] focus:bg-white focus:outline-stone-400 transition-colors"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <SpeechToTextButton
              onTranscript={(t) => setQuery((prev) => (prev ? prev + ' ' + t : t))}
              label="Speak Question"
            />

            <button
              onClick={() => handleConsult()}
              disabled={loading || !query.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Library...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#E7A382]" />
                  <span>Consult My Vault</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample Queries */}
        <div className="mt-8 pt-6 border-t border-[#EDE7DC]">
          <span className="text-xs uppercase tracking-wider text-stone-400 font-mono font-medium block mb-3">
            Or test with a sample inquiry:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(sample.text);
                  setQueryType(sample.type);
                  handleConsult(sample.text, sample.type);
                }}
                className="text-left p-3 rounded-lg border border-[#E5DFD4] bg-[#FAF8F5] hover:bg-white hover:border-stone-400 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-semibold text-stone-800 group-hover:text-[#9A3412] transition-colors">
                    {sample.title}
                  </span>
                  <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-stone-500 font-serif mt-1 line-clamp-2">
                  "{sample.text}"
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl">
          {error}
        </div>
      )}

      {/* Consultation Result Display */}
      {result && (
        <div className="bg-white rounded-xl border border-[#D5CCBA] p-6 sm:p-10 shadow-sm space-y-8 animate-in fade-in duration-300">
          {/* Header & High-level Thesis */}
          <div className="border-b border-[#EAE5DA] pb-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#9A3412] font-mono font-bold mb-2">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Library Consultation Report</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
              {result.consultationSummary}
            </h2>
          </div>

          {/* Main Synthesized Advice */}
          <div className="prose prose-stone max-w-none">
            <div className="text-sm sm:text-base font-serif text-stone-800 leading-relaxed whitespace-pre-line space-y-4">
              {result.answer}
            </div>
          </div>

          {/* Cited Works from Repository */}
          {result.citedEntries && result.citedEntries.length > 0 && (
            <div className="pt-6 border-t border-[#EAE5DA]">
              <h3 className="text-xs uppercase tracking-widest text-stone-500 font-mono font-bold mb-4">
                Cited Sources From Your Vault ({result.citedEntries.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.citedEntries.map((cited, idx) => {
                  const full = entries.find((e) => e.id === cited.id || e.title === cited.title);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2D8] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-serif font-semibold text-stone-900 text-sm">
                            {cited.title}
                          </span>
                          {full && (
                            <button
                              onClick={() => onSelectEntry(full)}
                              className="text-[11px] font-sans font-medium text-[#9A3412] hover:underline cursor-pointer"
                            >
                              Open Notes
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 font-serif italic mb-2">
                          by {cited.author}
                        </p>
                        <p className="text-xs text-stone-700 font-sans leading-relaxed">
                          {cited.relevance}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggested Next Steps */}
          {result.suggestedNextSteps && result.suggestedNextSteps.length > 0 && (
            <div className="pt-6 border-t border-[#EAE5DA] bg-[#F9F7F2] p-5 rounded-lg border border-[#EDE7DC]">
              <h3 className="text-xs uppercase tracking-widest text-[#14532D] font-mono font-bold mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Actionable Rules to Apply</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm font-serif text-stone-800">
                {result.suggestedNextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#14532D] font-mono font-bold shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
