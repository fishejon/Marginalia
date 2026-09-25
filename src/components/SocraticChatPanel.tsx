import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2, ArrowRight, CheckCircle2, MessageSquare, Flame } from 'lucide-react';
import { SpeechToTextButton } from './SpeechToTextButton';
import { sendSocraticChatMessage, extractPillarsFromSocraticChat } from '../utils/api';

interface SocraticChatPanelProps {
  workTitle: string;
  workAuthor?: string;
  medium?: string;
  onApplyPillars?: (pillars: {
    whatImThinking: string;
    whyILikedIt: string;
    howIllUseItGoingForward: string;
    suggestedTags?: string[];
  }) => void;
  className?: string;
}

export const SocraticChatPanel: React.FC<SocraticChatPanelProps> = ({
  workTitle,
  workAuthor = '',
  medium = 'source',
  onApplyPillars,
  className = '',
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([
    {
      role: 'model',
      content: `Welcome to your Socratic dialogue on "${workTitle || 'this work'}". What is the single biggest claim or idea that struck you, and why do you find it compelling or challenging?`,
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [distilling, setDistilling] = useState(false);
  const [distilledNotification, setDistilledNotification] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputVal;
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, content: textToSend.trim() }];
    setMessages(newMessages);
    setInputVal('');
    setLoading(true);

    try {
      const res = await sendSocraticChatMessage({
        messages: newMessages,
        workTitle,
        workAuthor,
        medium,
      });

      setMessages((prev) => [...prev, { role: 'model', content: res.reply }]);
    } catch (err: any) {
      console.error('Socratic chat turn failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: 'I had trouble processing that turn. What is the fundamental principle here that you feel most strongly about?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    handleSend(promptText);
  };

  const handleDistillPillars = async () => {
    if (messages.length < 2) return;
    setDistilling(true);
    try {
      const pillars = await extractPillarsFromSocraticChat({
        messages,
        workTitle,
        workAuthor,
      });

      if (onApplyPillars) {
        onApplyPillars(pillars);
        setDistilledNotification(true);
        setTimeout(() => setDistilledNotification(false), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Could not distill conversation. Try chatting a bit more first.');
    } finally {
      setDistilling(false);
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-xl border border-[#E7E2D8] overflow-hidden shadow-xs ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[#EAE5DA] bg-[#FAF8F5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#9A3412] text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-stone-900">
              Socratic Thinking Partner
            </h3>
            <p className="text-[11px] text-stone-500 font-sans">
              Conversational inquiry to challenge assumptions & sharpen insights
            </p>
          </div>
        </div>

        {onApplyPillars && messages.length >= 2 && (
          <button
            onClick={handleDistillPillars}
            disabled={distilling}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9A3412] hover:bg-[#832B0F] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {distilling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Apply to 3 Pillars</span>
          </button>
        )}
      </div>

      {distilledNotification && (
        <div className="bg-[#EAF5EC] border-b border-[#BCE1C2] px-4 py-2 text-xs text-[#14532D] font-medium flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#14532D]" />
          <span>Extracted insights and populated your 3 core reflection pillars!</span>
        </div>
      )}

      {/* Messages stream */}
      <div className="p-4 overflow-y-auto space-y-4 max-h-[320px] min-h-[220px] bg-[#FAF8F5]/50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-6 h-6 rounded-full bg-[#EAE4D7] text-stone-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono">
                S
              </div>
            )}
            <div
              className={`p-3 rounded-xl text-xs sm:text-sm font-serif leading-relaxed max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-stone-900 text-white rounded-tr-none'
                  : 'bg-white border border-[#E7E2D8] text-stone-800 rounded-tl-none shadow-2xs'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-stone-500 font-sans italic py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9A3412]" />
            <span>Formulating thoughtful counter-question...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="px-4 py-2 bg-[#F5F1E8]/70 border-t border-[#EDE7DC] flex flex-wrap items-center gap-1.5 text-[11px] font-sans">
        <span className="text-stone-400 font-medium">Quick prompts:</span>
        <button
          onClick={() => handleQuickPrompt("What's the strongest counter-argument to this idea?")}
          className="text-stone-700 hover:text-stone-950 hover:underline cursor-pointer"
        >
          "Strongest counter-argument?"
        </button>
        <span className="text-stone-300">·</span>
        <button
          onClick={() => handleQuickPrompt("How does this apply to a business or personal dilemma?")}
          className="text-stone-700 hover:text-stone-950 hover:underline cursor-pointer"
        >
          "How to apply in practice?"
        </button>
        <span className="text-stone-300">·</span>
        <button
          onClick={() => handleQuickPrompt("What blindspot might someone reading this have?")}
          className="text-stone-700 hover:text-stone-950 hover:underline cursor-pointer"
        >
          "Identify blindspots"
        </button>
      </div>

      {/* Input row */}
      <div className="p-3 bg-white border-t border-[#EAE5DA] flex items-center gap-2">
        <SpeechToTextButton
          onTranscript={(t) => setInputVal((prev) => (prev ? prev + ' ' + t : t))}
          label=""
        />
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Speak or type your thought... (e.g. 'I agree with the thesis, but in early-stage startups speed beats deliberation')"
          className="flex-1 text-xs sm:text-sm font-sans p-2 rounded-lg border border-[#D5CCBA] focus:outline-stone-400"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputVal.trim() || loading}
          className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
