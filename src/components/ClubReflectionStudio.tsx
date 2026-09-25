import React, { useState } from 'react';
import { Sparkles, MessageSquare, Mic, BookOpen, Quote, CheckCircle2, ChevronRight, ArrowLeft, Loader2, Save, Plus, Trash2, ExternalLink, Bot } from 'lucide-react';
import { Entry, ClubDiscussionQA, QuoteItem } from '../types';
import { SpeechToTextButton } from './SpeechToTextButton';
import { SocraticChatPanel } from './SocraticChatPanel';
import { fetchReflectionPrompts, synthesizeEntryInsights } from '../utils/api';

interface ClubReflectionStudioProps {
  entries: Entry[];
  selectedEntryId?: string;
  onUpdateEntry: (updated: Entry) => void;
  onBackToLibrary: () => void;
}

export const ClubReflectionStudio: React.FC<ClubReflectionStudioProps> = ({
  entries,
  selectedEntryId,
  onUpdateEntry,
  onBackToLibrary,
}) => {
  const [activeId, setActiveId] = useState<string>(
    selectedEntryId || (entries.length > 0 ? entries[0].id : '')
  );

  const entry = entries.find((e) => e.id === activeId) || entries[0];

  // Editable local state for the active entry
  const [whatImThinking, setWhatImThinking] = useState(entry ? entry.whatImThinking : '');
  const [whyILikedIt, setWhyILikedIt] = useState(entry ? entry.whyILikedIt : '');
  const [howIllUseIt, setHowIllUseIt] = useState(entry ? entry.howIllUseItGoingForward : '');
  const [clubQA, setClubQA] = useState<ClubDiscussionQA[]>(entry ? entry.clubDiscussion || [] : []);
  const [quotes, setQuotes] = useState<QuoteItem[]>(entry ? entry.quotes || [] : []);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteLoc, setNewQuoteLoc] = useState('');

  // Socratic dialogue drawer state
  const [showSocraticChat, setShowSocraticChat] = useState(false);

  // AI loading states
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);


  // Sync state when switching active entry
  const handleSelectEntry = (id: string) => {
    const target = entries.find((e) => e.id === id);
    if (target) {
      setActiveId(id);
      setWhatImThinking(target.whatImThinking || '');
      setWhyILikedIt(target.whyILikedIt || '');
      setHowIllUseIt(target.howIllUseItGoingForward || '');
      setClubQA(target.clubDiscussion || []);
      setQuotes(target.quotes || []);
    }
  };

  const handleSave = () => {
    if (!entry) return;
    const updated: Entry = {
      ...entry,
      whatImThinking,
      whyILikedIt,
      howIllUseItGoingForward: howIllUseIt,
      clubDiscussion: clubQA,
      quotes,
    };
    onUpdateEntry(updated);
    setSaveNotification('Reflections saved successfully to your vault.');
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const handleGeneratePrompts = async () => {
    if (!entry) return;
    setIsGeneratingQuestions(true);
    try {
      const res = await fetchReflectionPrompts({
        title: entry.title,
        author: entry.author,
        medium: entry.medium,
        whatImThinking,
        whyILikedIt,
        howIllUseItGoingForward: howIllUseIt,
      });

      if (res.questions && res.questions.length > 0) {
        const newQA: ClubDiscussionQA[] = res.questions.map((q) => ({
          id: `gen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          question: q.question,
          answer: '',
        }));

        setClubQA((prev) => [...prev, ...newQA]);
        setSaveNotification('New tailored discussion prompts generated.');
        setTimeout(() => setSaveNotification(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
      alert('Could not generate prompts at this moment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleSynthesize = async () => {
    if (!entry) return;
    setIsSynthesizing(true);
    try {
      const synthesis = await synthesizeEntryInsights({
        title: entry.title,
        author: entry.author,
        medium: entry.medium,
        whatImThinking,
        whyILikedIt,
        howIllUseItGoingForward: howIllUseIt,
        quotes,
      });

      const updated: Entry = {
        ...entry,
        whatImThinking,
        whyILikedIt,
        howIllUseItGoingForward: howIllUseIt,
        clubDiscussion: clubQA,
        quotes,
        synthesis,
      };

      onUpdateEntry(updated);
      setSaveNotification('AI synthesis generated! Check out the executive thesis and action playbook.');
      setTimeout(() => setSaveNotification(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Failed to synthesize: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim()) return;
    const newQ: QuoteItem = {
      id: `quote-${Date.now()}`,
      text: newQuoteText.trim(),
      location: newQuoteLoc.trim() || undefined,
    };
    setQuotes((prev) => [...prev, newQ]);
    setNewQuoteText('');
    setNewQuoteLoc('');
  };

  const handleRemoveQuote = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpdateAnswer = (id: string, answer: string) => {
    setClubQA((prev) =>
      prev.map((qa) => (qa.id === id ? { ...qa, answer } : qa))
    );
  };

  const handleRemoveQA = (id: string) => {
    setClubQA((prev) => prev.filter((qa) => qa.id !== id));
  };

  if (!entry) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-[#E7E2D8] p-8">
        <BookOpen className="w-10 h-10 text-stone-400 mx-auto mb-3" />
        <h2 className="text-xl font-serif text-stone-900 mb-2">No Sources in Vault</h2>
        <p className="text-sm text-stone-600 mb-6">
          Record a book or podcast first to enter the Club Reflection Studio.
        </p>
        <button
          onClick={onBackToLibrary}
          className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          Go to Library
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Source Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E2D8]">
        <div>
          <button
            onClick={onBackToLibrary}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Vault</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900">
              Personal Club Reflection Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 font-sans">
            Facilitate your inner book club meeting across the three essential pillars of mindful reading.
          </p>
        </div>

        {/* Source Dropdown & Global Save */}
        <div className="flex items-center gap-3">
          <select
            value={activeId}
            onChange={(e) => handleSelectEntry(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white text-stone-800 border border-[#D5CCBA] rounded-lg shadow-2xs focus:outline-stone-400"
          >
            {entries.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.medium})
              </option>
            ))}
          </select>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Notes</span>
          </button>
        </div>
      </div>

      {/* Save banner alert */}
      {saveNotification && (
        <div className="p-3 bg-[#EAF5EC] border border-[#BCE1C2] text-[#14532D] text-xs font-medium rounded-lg flex items-center justify-between transition-all">
          <span>{saveNotification}</span>
          <button
            onClick={() => setSaveNotification(null)}
            className="text-[#14532D] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Book Showcase Banner */}
      <div className="bg-white rounded-xl border border-[#E7E2D8] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-start gap-4">
          {entry.coverUrl ? (
            <img
              src={entry.coverUrl}
              alt={entry.title}
              className="w-16 h-22 object-cover rounded border border-[#DFD8C9] shrink-0"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-22 bg-[#EFECE4] rounded flex items-center justify-center text-stone-400 border border-[#DFD8C9] shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-sans mb-1">
              <span className="capitalize">{entry.medium}</span>
              <span aria-hidden="true">·</span>
              <span>Logged on {entry.dateLogged}</span>
              <span aria-hidden="true">·</span>
              <span>{entry.rating} / 5 Stars</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900">
              {entry.title}
            </h2>
            <p className="text-sm font-serif italic text-stone-600">
              by {entry.author}
            </p>
          </div>
        </div>

        {/* Quick Synthesis Trigger */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setShowSocraticChat(!showSocraticChat)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
              showSocraticChat
                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                : 'bg-[#F4EFE6] text-stone-800 hover:bg-[#EAE4D7] border-[#D5CCBA]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#9A3412]" />
            <span>{showSocraticChat ? 'Hide Thinking Partner' : 'Socratic Chat Partner'}</span>
          </button>

          <button
            onClick={handleGeneratePrompts}
            disabled={isGeneratingQuestions}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-800 bg-[#F4EFE6] hover:bg-[#EAE4D7] border border-[#D5CCBA] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGeneratingQuestions ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9A3412]" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5 text-[#9A3412]" />
            )}
            <span>Generate Club Prompts</span>
          </button>

          <button
            onClick={handleSynthesize}
            disabled={isSynthesizing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#832B0F] rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSynthesizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{entry.synthesis ? 'Re-Synthesize Insights' : 'AI Synthesize Takeaways'}</span>
          </button>
        </div>
      </div>

      {/* Socratic Dialogue Thinking Partner Panel */}
      {showSocraticChat && (
        <div className="animate-in fade-in duration-300">
          <SocraticChatPanel
            workTitle={entry.title}
            workAuthor={entry.author}
            medium={entry.medium}
            onApplyPillars={(pillars) => {
              setWhatImThinking(pillars.whatImThinking);
              setWhyILikedIt(pillars.whyILikedIt);
              setHowIllUseIt(pillars.howIllUseItGoingForward);
              setSaveNotification('Updated 3 pillars from Socratic dialogue! Remember to click "Save Notes".');
              setTimeout(() => setSaveNotification(null), 4000);
            }}
          />
        </div>
      )}

      {/* The 3 Core Book Club Discussion Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pillar 1: What I'm Thinking */}
        <div className="bg-white rounded-xl border border-[#E7E2D8] p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-[#9A3412] font-mono font-medium">
                Pillar 01
              </span>
              <SpeechToTextButton
                onTranscript={(text) =>
                  setWhatImThinking((prev) => (prev ? prev + ' ' + text : text))
                }
              />
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 mb-1">
              What I'm Thinking
            </h3>
            <p className="text-xs text-stone-500 font-sans mb-4">
              Your raw takeaways, aha moments, mental models, and initial counter-arguments.
            </p>
            <textarea
              rows={9}
              value={whatImThinking}
              onChange={(e) => setWhatImThinking(e.target.value)}
              placeholder="What immediate reactions did you have? What surprised you or made you pause? What mental model shifted?"
              className="w-full text-sm font-serif leading-relaxed text-stone-800 p-3.5 rounded-lg border border-[#E5DFD4] bg-[#FAF8F5] focus:bg-white focus:outline-stone-400 focus:ring-1 focus:ring-stone-400 transition-colors placeholder:text-stone-400"
            />
          </div>
          <div className="mt-3 text-[11px] text-stone-400 font-sans">
            Captures cognitive shifts & intellectual sparks.
          </div>
        </div>

        {/* Pillar 2: Why I Liked It */}
        <div className="bg-white rounded-xl border border-[#E7E2D8] p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-[#9A3412] font-mono font-medium">
                Pillar 02
              </span>
              <SpeechToTextButton
                onTranscript={(text) =>
                  setWhyILikedIt((prev) => (prev ? prev + ' ' + text : text))
                }
              />
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 mb-1">
              Why I Liked It
            </h3>
            <p className="text-xs text-stone-500 font-sans mb-4">
              The standout stories, resonance, emotional impact, and why it's worth recommending.
            </p>
            <textarea
              rows={9}
              value={whyILikedIt}
              onChange={(e) => setWhyILikedIt(e.target.value)}
              placeholder="What made this memorable? Why did this resonate with your current life or work? What stories stuck with you?"
              className="w-full text-sm font-serif leading-relaxed text-stone-800 p-3.5 rounded-lg border border-[#E5DFD4] bg-[#FAF8F5] focus:bg-white focus:outline-stone-400 focus:ring-1 focus:ring-stone-400 transition-colors placeholder:text-stone-400"
            />
          </div>
          <div className="mt-3 text-[11px] text-stone-400 font-sans">
            Powers your personal recommendation engine.
          </div>
        </div>

        {/* Pillar 3: How I'll Use It Going Forward */}
        <div className="bg-white rounded-xl border border-[#E7E2D8] p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-[#14532D] font-mono font-medium">
                Pillar 03
              </span>
              <SpeechToTextButton
                onTranscript={(text) =>
                  setHowIllUseIt((prev) => (prev ? prev + ' ' + text : text))
                }
              />
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 mb-1">
              How I'll Use It
            </h3>
            <p className="text-xs text-stone-500 font-sans mb-4">
              Concrete business rules, personal operating system changes, experiments, and habits.
            </p>
            <textarea
              rows={9}
              value={howIllUseIt}
              onChange={(e) => setHowIllUseIt(e.target.value)}
              placeholder="1. Immediate operational tweak...&#10;2. Habit to build or stop...&#10;3. Strategic principle for upcoming decisions..."
              className="w-full text-sm font-serif leading-relaxed text-stone-800 p-3.5 rounded-lg border border-[#E5DFD4] bg-[#FAF8F5] focus:bg-white focus:outline-stone-400 focus:ring-1 focus:ring-stone-400 transition-colors placeholder:text-stone-400"
            />
          </div>
          <div className="mt-3 text-[11px] text-stone-400 font-sans">
            Feeds your compiled Action Playbook.
          </div>
        </div>

      </div>

      {/* Dynamic Club Prompts & Guided Q&A */}
      <div className="bg-white rounded-xl border border-[#E7E2D8] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE5DA]">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#78716C] font-mono font-medium">
              Facilitated Inquiry
            </span>
            <h3 className="text-xl font-serif font-semibold text-stone-900 mt-1">
              Guided Book Club Discussion Q&A
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Deepen your thoughts with tailored provocations. Answer them to build an enduring dialogue.
            </p>
          </div>

          <button
            onClick={handleGeneratePrompts}
            disabled={isGeneratingQuestions}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-800 bg-[#F4EFE6] hover:bg-[#EAE4D7] border border-[#D5CCBA] rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isGeneratingQuestions ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9A3412]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#9A3412]" />
            )}
            <span>Generate 3 Provocative Questions</span>
          </button>
        </div>

        {clubQA.length === 0 ? (
          <div className="py-10 text-center text-stone-500">
            <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-serif">
              No club discussion questions yet. Click "Generate 3 Provocative Questions" above to let AI craft custom debate inquiries based on your notes!
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {clubQA.map((qa, idx) => (
              <div
                key={qa.id}
                className="p-5 rounded-lg border border-[#EDE7DC] bg-[#FAF8F5] transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#E5DFD4] text-stone-700 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-serif font-semibold text-stone-900 leading-snug">
                      {qa.question}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SpeechToTextButton
                      onTranscript={(t) =>
                        handleUpdateAnswer(
                          qa.id,
                          qa.answer ? qa.answer + ' ' + t : t
                        )
                      }
                    />
                    <button
                      onClick={() => handleRemoveQA(qa.id)}
                      className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pl-7">
                  <textarea
                    rows={3}
                    value={qa.answer}
                    onChange={(e) => handleUpdateAnswer(qa.id, e.target.value)}
                    placeholder="Record your discussion answer here..."
                    className="w-full text-xs sm:text-sm font-serif leading-relaxed text-stone-800 p-3 rounded border border-[#DFD8CB] bg-white focus:outline-stone-400"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quotes & Soundbites Section */}
      <div className="bg-white rounded-xl border border-[#E7E2D8] p-6 sm:p-8 shadow-xs">
        <div className="pb-5 border-b border-[#EAE5DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#78716C] font-mono font-medium">
              Verbatim Gems
            </span>
            <h3 className="text-xl font-serif font-semibold text-stone-900 mt-1">
              Memorable Passages & Timestamps
            </h3>
            <p className="text-xs text-stone-500 font-sans">
              Save timeless quotes, passage citations, or podcast timestamps for effortless recall.
            </p>
          </div>
        </div>

        {/* Existing quotes list */}
        {quotes.length > 0 && (
          <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-lg bg-[#FAF8F5] border border-[#EBE5DA] relative group flex flex-col justify-between"
              >
                <div>
                  <Quote className="w-4 h-4 text-[#9A3412]/60 mb-2" />
                  <p className="text-sm font-serif italic text-stone-800 leading-relaxed">
                    "{q.text}"
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#EFECE5] flex items-center justify-between text-xs text-stone-500 font-sans">
                  <span>{q.location || 'Location not noted'}</span>
                  <button
                    onClick={() => handleRemoveQuote(q.id)}
                    className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new quote form */}
        <form onSubmit={handleAddQuote} className="mt-6 pt-4 border-t border-[#EAE5DA] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <input
                type="text"
                value={newQuoteText}
                onChange={(e) => setNewQuoteText(e.target.value)}
                placeholder="Enter memorable quote or excerpt..."
                className="w-full text-xs sm:text-sm font-serif p-2.5 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newQuoteLoc}
                onChange={(e) => setNewQuoteLoc(e.target.value)}
                placeholder="e.g. Chapter 4, p. 82 / 31:40"
                className="w-full text-xs sm:text-sm font-sans p-2.5 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
              />
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full h-full py-2.5 px-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-xs font-semibold flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* AI Synthesis Section if available */}
      {entry.synthesis && (
        <div className="bg-[#FAF8F5] rounded-xl border border-[#D5CCBA] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#9A3412]" />
            <span className="text-xs uppercase tracking-widest text-[#9A3412] font-mono font-bold">
              Synthesized Knowledge Asset
            </span>
          </div>

          <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">
            Executive Synthesis & Thesis
          </h3>
          <p className="text-base sm:text-lg font-serif italic text-stone-800 leading-relaxed mb-6 max-w-3xl">
            "{entry.synthesis.thesis}"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#DFD8CB]">
            <div>
              <h4 className="text-sm font-sans font-bold uppercase tracking-wider text-stone-700 mb-3">
                Key Mental Models & Principles
              </h4>
              <ul className="space-y-2 text-sm font-serif text-stone-700">
                {entry.synthesis.keyPrinciples.map((principle, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#9A3412] font-mono font-bold">·</span>
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-sans font-bold uppercase tracking-wider text-stone-700 mb-3">
                Why Recommend & To Whom
              </h4>
              <div className="p-4 rounded-lg bg-white border border-[#E5DFD4] text-xs font-sans space-y-2 text-stone-700">
                <div>
                  <span className="font-semibold text-stone-900">Why I Recommend: </span>
                  {entry.synthesis.recommendationPitch.whyRecommend}
                </div>
                <div>
                  <span className="font-semibold text-stone-900">Ideal Audience: </span>
                  {entry.synthesis.recommendationPitch.whoShouldRead}
                </div>
                <div className="pt-2 border-t border-stone-100 font-serif italic text-stone-800">
                  "{entry.synthesis.recommendationPitch.ratingBlurb}"
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating or Bottom Save Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E7E2D8] shadow-xs">
        <span className="text-xs text-stone-500 font-sans">
          Always save after dictating or writing your reflections.
        </span>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};
