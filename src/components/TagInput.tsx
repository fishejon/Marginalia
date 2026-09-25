import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (newTags: string[]) => void;
  suggestedTags?: string[];
}

const DEFAULT_SUGGESTED_TAGS = [
  'Strategy',
  'Decision Making',
  'Habits',
  'Psychology',
  'Neuroscience',
  'Deep Work',
  'Leadership',
  'Investing',
  'Philosophy',
  'Business Models',
  'Writing',
  'Productivity'
];

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  suggestedTags = DEFAULT_SUGGESTED_TAGS
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim().replace(/^#/, '');
    if (!clean) return;
    if (!tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      onChange([...tags, clean]);
    }
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputVal);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      {/* Existing Tag Chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F4EFE6] border border-[#E5DFD4] text-xs font-sans text-stone-800"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a tag & press Enter (e.g. Strategy, Pricing)..."
            className="w-full text-xs font-sans pl-8 pr-3 py-2 rounded-lg border border-[#D5CCBA] bg-white focus:outline-stone-400"
          />
        </div>
        <button
          type="button"
          onClick={() => handleAddTag(inputVal)}
          disabled={!inputVal.trim()}
          className="px-3 py-2 text-xs font-medium bg-[#FAF8F5] border border-[#D5CCBA] text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 font-sans">
        <span className="text-stone-400">Quick suggestions:</span>
        {suggestedTags
          .filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()))
          .slice(0, 6)
          .map((suggested) => (
            <button
              key={suggested}
              type="button"
              onClick={() => handleAddTag(suggested)}
              className="hover:text-stone-900 hover:underline cursor-pointer text-stone-600"
            >
              +{suggested}
            </button>
          ))}
      </div>
    </div>
  );
};
