import React, { useState } from 'react';
import { CheckSquare, Square, Filter, BookOpen, Sparkles, Plus, ArrowUpRight } from 'lucide-react';
import { Entry, ActionItem } from '../types';

interface ActionPlaybookViewProps {
  entries: Entry[];
  onSelectEntry: (entry: Entry) => void;
  onUpdateEntry: (updated: Entry) => void;
}

export const ActionPlaybookView: React.FC<ActionPlaybookViewProps> = ({
  entries,
  onSelectEntry,
  onUpdateEntry,
}) => {
  const [selectedMedium, setSelectedMedium] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Collect all action items with their originating source metadata
  const allActions: Array<{
    action: ActionItem;
    entry: Entry;
  }> = [];

  entries.forEach((entry) => {
    // Collect from synthesis playbook if available
    if (entry.synthesis?.actionPlaybook) {
      entry.synthesis.actionPlaybook.forEach((item) => {
        allActions.push({ action: item, entry });
      });
    }
  });

  const toggleActionCompleted = (entryId: string, actionId: string) => {
    const targetEntry = entries.find((e) => e.id === entryId);
    if (!targetEntry || !targetEntry.synthesis?.actionPlaybook) return;

    const updatedPlaybook = targetEntry.synthesis.actionPlaybook.map((act) =>
      act.id === actionId ? { ...act, completed: !act.completed } : act
    );

    const updatedEntry: Entry = {
      ...targetEntry,
      synthesis: {
        ...targetEntry.synthesis,
        actionPlaybook: updatedPlaybook,
      },
    };

    onUpdateEntry(updatedEntry);
  };

  const filteredActions = allActions.filter(({ action, entry }) => {
    if (selectedMedium !== 'all' && entry.medium !== selectedMedium) return false;
    if (categoryFilter !== 'all' && action.category !== categoryFilter) return false;
    return true;
  });

  const completedCount = allActions.filter((a) => a.action.completed).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#E7E2D8] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#14532D] font-mono font-medium mb-1">
            <span>Operational Knowledge Base</span>
          </div>
          <h1 className="text-3xl font-serif font-medium text-stone-900">
            Action Playbook & Operational Rules
          </h1>
          <p className="text-sm text-stone-600 font-serif mt-1">
            Every behavior change, habit stack, and decision rule distilled from your personal library.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white p-3.5 rounded-lg border border-[#E7E2D8] flex items-center gap-4 text-xs font-sans shrink-0">
          <div>
            <span className="text-stone-400 block">Total Rules</span>
            <span className="font-mono font-bold text-stone-900 text-sm tabular-nums">
              {allActions.length}
            </span>
          </div>
          <div className="h-6 w-[1px] bg-stone-200" />
          <div>
            <span className="text-stone-400 block">Adopted / Applied</span>
            <span className="font-mono font-bold text-[#14532D] text-sm tabular-nums">
              {completedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar adhering to Anti-Slop Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#F4EFE6] rounded-lg">
        {/* Category Filters */}
        <div className="flex items-center gap-1">
          {['all', 'Immediate', 'Habit', 'Strategic Decision'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {cat === 'all' ? 'All Rules' : cat}
            </button>
          ))}
        </div>

        {/* Medium Filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-stone-500 font-sans mr-1">Source:</span>
          {['all', 'book', 'podcast'].map((med) => (
            <button
              key={med}
              onClick={() => setSelectedMedium(med)}
              className={`px-2.5 py-1 rounded capitalize transition-colors cursor-pointer ${
                selectedMedium === med
                  ? 'bg-stone-900 text-white font-medium'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {med}
            </button>
          ))}
        </div>
      </div>

      {/* Action Items List */}
      {filteredActions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-[#E7E2D8]">
          <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-serif text-stone-600">
            No action rules found for the selected filter. Run AI Synthesis on your entries to generate actionable playbooks!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map(({ action, entry }) => (
            <div
              key={`${entry.id}-${action.id}`}
              className={`p-4 sm:p-5 rounded-xl border transition-all flex items-start gap-4 ${
                action.completed
                  ? 'bg-[#FAF8F5] border-[#E8E2D5] opacity-75'
                  : 'bg-white border-[#E7E2D8] hover:border-stone-400 shadow-2xs'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleActionCompleted(entry.id, action.id)}
                className="mt-0.5 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer shrink-0"
              >
                {action.completed ? (
                  <CheckSquare className="w-5 h-5 text-[#14532D]" />
                ) : (
                  <Square className="w-5 h-5 text-stone-400 hover:text-stone-600" />
                )}
              </button>

              {/* Action Text & Attribution */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm sm:text-base font-serif leading-relaxed ${
                    action.completed
                      ? 'line-through text-stone-500'
                      : 'text-stone-900 font-medium'
                  }`}
                >
                  {action.action}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-sans text-stone-500">
                  <span className="font-semibold text-stone-700">{action.category}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    onClick={() => onSelectEntry(entry)}
                    className="hover:text-stone-900 hover:underline cursor-pointer font-serif italic text-stone-600"
                  >
                    From "{entry.title}" by {entry.author}
                  </span>
                </div>
              </div>

              {/* Source Link */}
              <button
                onClick={() => onSelectEntry(entry)}
                className="text-stone-400 hover:text-stone-900 transition-colors p-1 cursor-pointer shrink-0"
                title="View full book notes"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
