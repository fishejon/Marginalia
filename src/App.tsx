import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import {
  subscribeToUserEntries,
  saveUserEntry,
  removeUserEntry,
  loadSampleCanonToFirestore,
  migrateGuestEntriesToCloud,
  bulkUpsertEntries,
} from './utils/firestoreService';
import { mergeImportedEntries } from './utils/goodreadsImport';
import {
  loadEntries,
  saveEntries,
  clearLocalEntries,
  resetToDemoEntries,
  exportEntriesAsJson,
} from './utils/storage';
import { INITIAL_ENTRIES } from './data/initialEntries';
import { Entry, MediumType, isUnrated } from './types';
import { Header, ActiveTab } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { EntryCard } from './components/EntryCard';
import { EntryDetailModal } from './components/EntryDetailModal';
import { NewEntryModal } from './components/NewEntryModal';
import { ClubReflectionStudio } from './components/ClubReflectionStudio';
import { ConsultRepositoryView } from './components/ConsultRepositoryView';
import { ActionPlaybookView } from './components/ActionPlaybookView';
import { RecommendationGeneratorModal } from './components/RecommendationGeneratorModal';
import { AuthModal } from './components/AuthModal';
import { VirtualBookshelf } from './components/VirtualBookshelf';
import { SmartRecommendationsModal } from './components/SmartRecommendationsModal';
import { ImportModal } from './components/ImportModal';
import {
  Search,
  BookOpen,
  Sparkles,
  Plus,
  Download,
  RotateCcw,
  LogIn,
  Layers,
  Headphones,
  FileText,
  Trash2,
  Grid,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSmartRecsOpen, setIsSmartRecsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [migrationNotice, setMigrationNotice] = useState<
    { tone: 'success' | 'error'; text: string } | null
  >(null);

  // Entries in vault
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [libraryViewMode, setLibraryViewMode] = useState<'shelf' | 'grid'>('shelf');
  const [shelfStyle, setShelfStyle] = useState<'spines' | 'covers' | 'stack'>('spines');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedium, setSelectedMedium] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'title'>('recent');

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [inspectingEntry, setInspectingEntry] = useState<Entry | null>(null);
  const [reflectingEntryId, setReflectingEntryId] = useState<string | undefined>(undefined);
  const [recommendingEntry, setRecommendingEntry] = useState<Entry | null>(null);

  // Listen to Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // When logged in, sync with user's Firestore vault
  useEffect(() => {
    if (!user) {
      // In guest mode, load local entries
      setEntries(loadEntries());
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      // Anything recorded before signing in lives only in localStorage. The Firestore
      // subscription below replaces state wholesale, so migrate first or it is lost.
      const guestEntries = loadEntries();
      if (guestEntries.length > 0) {
        try {
          await migrateGuestEntriesToCloud(user.uid, guestEntries);
          // Only clear local once the cloud write has actually committed.
          clearLocalEntries();
          if (!cancelled) {
            setMigrationNotice({
              tone: 'success',
              text: `Moved ${guestEntries.length} ${
                guestEntries.length === 1 ? 'entry' : 'entries'
              } recorded in guest mode into your cloud vault.`,
            });
          }
        } catch (err) {
          console.error('Failed to migrate guest entries; keeping the local copy:', err);
          if (!cancelled) {
            setMigrationNotice({
              tone: 'error',
              text: `Could not move your ${guestEntries.length} guest ${
                guestEntries.length === 1 ? 'entry' : 'entries'
              } into the cloud vault. They are still saved on this device — sign out and back in to retry.`,
            });
          }
        }
      }

      if (cancelled) return;

      // Subscribe to Firestore entries for this authenticated user
      unsubscribe = subscribeToUserEntries(
        user.uid,
        (cloudEntries) => {
          setEntries(cloudEntries);
        },
        (err) => {
          console.warn('Could not read Firestore entries:', err);
        }
      );
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Sync to local storage when guest
  useEffect(() => {
    if (!user) {
      saveEntries(entries);
    }
  }, [entries, user]);

  // Aggregate tags for filtering
  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []))
  ).sort();

  // Handlers
  const handleAddEntry = async (newEntry: Entry, openReflectionStudio: boolean = false) => {
    if (user) {
      await saveUserEntry(user.uid, newEntry);
    } else {
      const updated = [newEntry, ...entries];
      setEntries(updated);
    }

    if (openReflectionStudio) {
      setReflectingEntryId(newEntry.id);
      setActiveTab('reflection');
    }
  };

  const handleUpdateEntry = async (updatedEntry: Entry) => {
    if (user) {
      await saveUserEntry(user.uid, updatedEntry);
    } else {
      setEntries((prev) =>
        prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
      );
    }

    if (inspectingEntry && inspectingEntry.id === updatedEntry.id) {
      setInspectingEntry(updatedEntry);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (user) {
      await removeUserEntry(user.uid, entryId);
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    }
  };

  const handleLoadStarterCanon = async () => {
    if (user) {
      await loadSampleCanonToFirestore(user.uid);
    } else {
      const demo = resetToDemoEntries();
      setEntries(demo);
    }
  };

  const handleClearAllEntries = async () => {
    if (confirm('Clear all entries to start completely blank?')) {
      if (user) {
        for (const entry of entries) {
          await removeUserEntry(user.uid, entry.id);
        }
      } else {
        setEntries([]);
        saveEntries([]);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setEntries(loadEntries());
  };

  /**
   * Persists a parsed Goodreads import.
   *
   * Both branches route through merge logic that only writes import-owned fields for
   * books already in the vault, so re-importing never destroys reflection work.
   */
  const handleImportEntries = async (
    imported: Entry[],
    onProgress: (written: number, total: number) => void
  ) => {
    if (user) {
      const existingIds = new Set(entries.map((e) => e.id));
      await bulkUpsertEntries(user.uid, imported, existingIds, ({ written, total }) =>
        onProgress(written, total)
      );
      // The Firestore subscription pushes the new state back down; no local set needed.
      return;
    }

    const { merged } = mergeImportedEntries(entries, imported);
    setEntries(merged);
    saveEntries(merged);
    onProgress(imported.length, imported.length);
  };

  // Filtered entries for the Library Vault view
  const filteredEntries = entries
    .filter((entry) => {
      // Medium filter
      if (selectedMedium !== 'all' && entry.medium !== selectedMedium) return false;

      // Tag filter
      if (selectedTag !== 'all' && !(entry.tags || []).some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = entry.title.toLowerCase().includes(q);
        const authorMatch = entry.author.toLowerCase().includes(q);
        const thinkMatch = (entry.whatImThinking || '').toLowerCase().includes(q);
        const likedMatch = (entry.whyILikedIt || '').toLowerCase().includes(q);
        const actionMatch = (entry.howIllUseItGoingForward || '').toLowerCase().includes(q);
        const tagsMatch = (entry.tags || []).some((t) => t.toLowerCase().includes(q));
        const quotesMatch = (entry.quotes || []).some((quote) =>
          quote.text.toLowerCase().includes(q)
        );

        if (
          !titleMatch &&
          !authorMatch &&
          !thinkMatch &&
          !likedMatch &&
          !actionMatch &&
          !tagsMatch &&
          !quotesMatch
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.dateLogged).getTime() - new Date(a.dateLogged).getTime();
      }
      if (sortBy === 'rating') {
        // Unrated books sort last rather than masquerading as the worst-rated.
        const ar = isUnrated(a.rating) ? -1 : a.rating;
        const br = isUnrated(b.rating) ? -1 : b.rating;
        return br - ar;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col font-sans selection:bg-[#E2D9C8]">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onOpenConsult={() => setActiveTab('consult')}
        onOpenSmartRecs={() => setIsSmartRecsOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        entryCount={entries.length}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Guest vault migration result */}
        {migrationNotice && (
          <div
            role="status"
            className={`mb-6 p-3 border text-xs font-medium rounded-lg flex items-center justify-between gap-4 ${
              migrationNotice.tone === 'success'
                ? 'bg-[#EAF5EC] border-[#BCE1C2] text-[#14532D]'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>{migrationNotice.text}</span>
            <button
              onClick={() => setMigrationNotice(null)}
              className="hover:underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* VIEW 1: Library & Book Club */}
        {activeTab === 'library' && (
          <div className="space-y-8">
            {/* Hero Banner with Interactive Presentation Mode Switcher */}
            <HeroBanner
              entries={entries}
              libraryViewMode={libraryViewMode}
              onToggleViewMode={setLibraryViewMode}
              onOpenNewModal={() => setIsNewModalOpen(true)}
              onOpenConsult={() => setActiveTab('consult')}
              onSelectReflect={() => setActiveTab('reflection')}
              onOpenSmartRecs={() => setIsSmartRecsOpen(true)}
              onLoadStarterCanon={handleLoadStarterCanon}
            />

            {/* Filter and Search Controls Bar */}
            <div className="bg-white rounded-xl border border-[#E7E2D8] p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, author, takeaway, question, quote, or #tag..."
                    className="w-full text-xs sm:text-sm font-sans pl-10 pr-4 py-2.5 rounded-lg border border-[#DDD6C8] bg-[#FAF8F5] focus:bg-white focus:outline-stone-400 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-stone-400 hover:text-stone-700 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Medium Filter Segmented Controls */}
                <div className="flex items-center gap-1 p-1 bg-[#F4EFE6] rounded-lg shrink-0 overflow-x-auto text-xs font-medium">
                  {[
                    { id: 'all', label: 'All Formats' },
                    { id: 'book', label: 'Books' },
                    { id: 'podcast', label: 'Podcasts' },
                    { id: 'article', label: 'Articles' },
                    { id: 'essay', label: 'Essays' },
                  ].map((med) => (
                    <button
                      key={med.id}
                      onClick={() => setSelectedMedium(med.id)}
                      className={`px-3 py-1.5 rounded-md capitalize transition-colors whitespace-nowrap cursor-pointer ${
                        selectedMedium === med.id
                          ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {med.label}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-stone-500 font-sans">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs font-medium bg-[#FAF8F5] border border-[#DDD6C8] rounded-md px-2.5 py-1.5 text-stone-800 focus:outline-stone-400 cursor-pointer"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="rating">Highest Rating</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>

              </div>

              {/* Tag Filter row */}
              {allTags.length > 0 && (
                <div className="pt-3 border-t border-[#F0EBE1] flex items-center gap-2 overflow-x-auto text-xs">
                  <span className="text-stone-400 font-sans shrink-0">Tags:</span>
                  <button
                    onClick={() => setSelectedTag('all')}
                    className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                      selectedTag === 'all'
                        ? 'bg-stone-900 text-white font-medium'
                        : 'text-stone-600 hover:bg-[#F2ECE1]'
                    }`}
                  >
                    All Tags
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                        selectedTag === tag
                          ? 'bg-stone-900 text-white font-medium'
                          : 'text-stone-600 hover:bg-[#F2ECE1]'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Representation Selection & Display Controls (Compact, Below Search Bar) */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase text-stone-500 font-bold">
                  Representation:
                </span>
                
                {/* Mode Selector: Shelf vs Grid */}
                <div className="flex items-center gap-1 p-0.5 bg-[#F2EDE4] rounded-lg text-xs font-medium border border-[#DDD6C8]">
                  <button
                    onClick={() => setLibraryViewMode('shelf')}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                      libraryViewMode === 'shelf'
                        ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#9A3412]" />
                    <span>Virtual Bookshelf</span>
                  </button>
                  <button
                    onClick={() => setLibraryViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                      libraryViewMode === 'grid'
                        ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Catalog Grid</span>
                  </button>
                </div>

                {/* When Bookshelf is active: Compact Spine/Cover/Stack Style & Auto-Rotate Tour */}
                {libraryViewMode === 'shelf' && (
                  <>
                    <div className="flex items-center gap-0.5 p-0.5 bg-[#FAF7F2] rounded-lg text-xs border border-[#DDD6C8]">
                      <button
                        onClick={() => setShelfStyle('spines')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          shelfStyle === 'spines'
                            ? 'bg-stone-900 text-white font-medium'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Spines
                      </button>
                      <button
                        onClick={() => setShelfStyle('covers')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          shelfStyle === 'covers'
                            ? 'bg-stone-900 text-white font-medium'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Face-Out
                      </button>
                      <button
                        onClick={() => setShelfStyle('stack')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          shelfStyle === 'stack'
                            ? 'bg-stone-900 text-white font-medium'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Stack
                      </button>
                    </div>

                    <button
                      onClick={() => setAutoRotate((prev) => !prev)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                        autoRotate
                          ? 'bg-[#FBECE4] text-[#9A3412] border-[#EACEC0] font-semibold'
                          : 'bg-[#FAF7F2] text-stone-600 border-[#DDD6C8] hover:text-stone-900'
                      }`}
                      title="Auto-tour smoothly rotates through shelf to shelf over time"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'text-[#9A3412]' : ''}`} />
                      <span>{autoRotate ? 'Rotating Tour: ON' : 'Rotating Tour: PAUSED'}</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsSmartRecsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9A3412] bg-[#F8EFE9] hover:bg-[#F2E5DC] rounded-lg transition-colors border border-[#EACEC0] cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Discover Smart Recommendations</span>
              </button>
            </div>

            {/* Library Content: Virtual Shelf OR Catalog Grid */}
            {filteredEntries.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-xl border border-[#E7E2D8] p-8">
                <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="text-xl font-serif font-semibold text-stone-900 mb-2">
                  {entries.length === 0 ? 'Your Book Club Library is Ready (Blank Slate)' : 'No Matching Sources'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 font-sans mb-6 max-w-md mx-auto leading-relaxed">
                  {entries.length === 0
                    ? 'Start building your shared reading repository. Paste a URL or record your takeaways from a podcast, book, or article to watch your virtual shelf fill up.'
                    : 'No entries match your current search and filters. Try clearing filters or keywords.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {entries.length === 0 ? (
                    <>
                      <button
                        onClick={() => setIsNewModalOpen(true)}
                        className="px-4 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        Record Your First Source
                      </button>
                      <button
                        onClick={handleLoadStarterCanon}
                        className="px-4 py-2.5 text-xs font-semibold text-stone-800 bg-[#E8E1D3] hover:bg-[#DED5C4] rounded-lg transition-colors border border-[#D5CCBA] cursor-pointer"
                      >
                        Load Starter Canon for Inspiration
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedMedium('all');
                        setSelectedTag('all');
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-[#F3EFE6] hover:bg-[#EAE4D7] rounded-lg transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            ) : libraryViewMode === 'shelf' ? (
              <VirtualBookshelf
                entries={filteredEntries}
                onSelectEntry={(entry) => setInspectingEntry(entry)}
                onReflectEntry={(entry) => {
                  setReflectingEntryId(entry.id);
                  setActiveTab('reflection');
                }}
                onOpenNewModal={() => setIsNewModalOpen(true)}
                shelfStyle={shelfStyle}
                onChangeShelfStyle={setShelfStyle}
                autoRotateEnabled={autoRotate}
                onToggleAutoRotate={() => setAutoRotate((prev) => !prev)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onSelect={(e) => setInspectingEntry(e)}
                    onReflect={(e) => {
                      setReflectingEntryId(e.id);
                      setActiveTab('reflection');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}


        {/* VIEW 2: Club Reflection Studio */}
        {activeTab === 'reflection' && (
          <ClubReflectionStudio
            entries={entries}
            selectedEntryId={reflectingEntryId}
            onUpdateEntry={handleUpdateEntry}
            onBackToLibrary={() => setActiveTab('library')}
          />
        )}

        {/* VIEW 3: Consult Repository (Ask Knowledge Base) */}
        {activeTab === 'consult' && (
          <ConsultRepositoryView
            entries={entries}
            onSelectEntry={(entry) => setInspectingEntry(entry)}
          />
        )}

        {/* VIEW 4: Action Playbook */}
        {activeTab === 'playbook' && (
          <ActionPlaybookView
            entries={entries}
            onSelectEntry={(entry) => setInspectingEntry(entry)}
            onUpdateEntry={handleUpdateEntry}
          />
        )}

      </main>

      {/* Archival Editorial Footer */}
      <footer className="mt-20 border-t border-[#E7E2D8] bg-[#F5F2EA] py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-500 font-sans">
          
          <div>
            <span className="font-serif font-semibold text-stone-900 text-sm">
              Marginalia Vault
            </span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>
              {user ? `Private Cloud Vault (${user.email})` : 'Personal Library Vault (Guest Mode)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {!user ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-stone-900 font-semibold hover:underline cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Create Account / Sign In</span>
              </button>
            ) : null}

            <button
              onClick={() => exportEntriesAsJson(entries)}
              className="inline-flex items-center gap-1.5 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Vault JSON</span>
            </button>

            <span className="text-stone-300 hidden sm:inline" aria-hidden="true">|</span>

            {entries.length > 0 ? (
              <button
                onClick={handleClearAllEntries}
                className="inline-flex items-center gap-1.5 text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset to Blank Slate</span>
              </button>
            ) : (
              <button
                onClick={handleLoadStarterCanon}
                className="inline-flex items-center gap-1.5 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load Starter Examples</span>
              </button>
            )}
          </div>

        </div>
      </footer>

      {/* Modals */}
      <NewEntryModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAddEntry={handleAddEntry}
      />

      <EntryDetailModal
        entry={inspectingEntry}
        onClose={() => setInspectingEntry(null)}
        onOpenReflectionStudio={(id) => {
          setReflectingEntryId(id);
          setActiveTab('reflection');
        }}
        onOpenRecommendationMaker={(entry) => setRecommendingEntry(entry)}
        onDeleteEntry={handleDeleteEntry}
      />

      <RecommendationGeneratorModal
        entry={recommendingEntry}
        onClose={() => setRecommendingEntry(null)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SmartRecommendationsModal
        isOpen={isSmartRecsOpen}
        onClose={() => setIsSmartRecsOpen(false)}
        entries={entries}
        onAddEntryToVault={(newEntry) => handleAddEntry(newEntry)}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        existingEntries={entries}
        onImport={handleImportEntries}
        isSignedIn={Boolean(user)}
      />
    </div>
  );
}
