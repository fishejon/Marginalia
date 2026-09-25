import React, { useState } from 'react';
import { X, Share2, Copy, Check, Sparkles, BookOpen, Quote } from 'lucide-react';
import { Entry } from '../types';

interface RecommendationGeneratorModalProps {
  entry: Entry | null;
  onClose: () => void;
}

export const RecommendationGeneratorModal: React.FC<RecommendationGeneratorModalProps> = ({
  entry,
  onClose,
}) => {
  const [recipient, setRecipient] = useState('');
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const whyLiked = entry.synthesis?.recommendationPitch?.whyRecommend || entry.whyILikedIt || 'Insightful and practical perspective.';
  const thesis = entry.synthesis?.thesis || entry.whatImThinking;
  const quote = entry.quotes && entry.quotes.length > 0 ? entry.quotes[0].text : null;

  const generatedNote = `Hey${recipient ? ' ' + recipient : ''}! 
I was reviewing my book club notes and immediately thought of you:

"${entry.title}" by ${entry.author} (${entry.medium})
${entry.sourceUrl ? `Link: ${entry.sourceUrl}\n` : ''}
Why I loved it:
${whyLiked}

Core takeaway:
${thesis || 'A transformative perspective on navigating decisions and systems.'}
${quote ? `\nOne of my favorite passages:\n"${quote}"\n` : ''}
Let me know if you check it out—would love to discuss!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl border border-[#E7E2D8] max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE5DA] bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#9A3412]" />
            <h2 className="text-lg font-serif font-bold text-stone-900">
              Share a Recommendation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-900 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-sans font-semibold text-stone-700 block mb-1">
              Recipient Name or Friend (Optional)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. Alex, Maya, or Team"
              className="w-full text-xs font-sans p-2 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
            />
          </div>

          <div>
            <label className="text-xs font-sans font-semibold text-stone-700 block mb-1">
              Personalized Recommendation Message
            </label>
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] font-serif text-xs text-stone-800 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
              {generatedNote}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE5DA] flex items-center justify-between">
          <span className="text-xs text-stone-500 font-sans">
            Ready to paste in iMessage, Slack, or Email.
          </span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Message</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
