import React from 'react';
import { Plus, Sparkles, User, LogOut, LogIn } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

export type ActiveTab = 'library' | 'reflection' | 'consult' | 'playbook';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewModal: () => void;
  onOpenConsult: () => void;
  onOpenSmartRecs?: () => void;
  entryCount: number;
  user: FirebaseUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewModal,
  onOpenConsult,
  onOpenSmartRecs,
  entryCount,
  user,
  onOpenAuth,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E7E2D8] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element brand wordmark */}
        <button
          onClick={() => setActiveTab('library')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="text-2xl font-serif font-medium tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors">
            Marginalia Book Club
          </span>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
          <button
            onClick={() => setActiveTab('library')}
            className={`cursor-pointer transition-colors py-1 relative ${
              activeTab === 'library'
                ? 'text-stone-900 font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            Club Library
            {activeTab === 'library' && (
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#9A3412]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reflection')}
            className={`cursor-pointer transition-colors py-1 relative flex items-center gap-1.5 ${
              activeTab === 'reflection'
                ? 'text-stone-900 font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            Club Reflections
            {activeTab === 'reflection' && (
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#9A3412]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('consult')}
            className={`cursor-pointer transition-colors py-1 relative flex items-center gap-1.5 ${
              activeTab === 'consult'
                ? 'text-stone-900 font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            Ask Knowledge Base
            {activeTab === 'consult' && (
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#9A3412]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('playbook')}
            className={`cursor-pointer transition-colors py-1 relative ${
              activeTab === 'playbook'
                ? 'text-stone-900 font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            Action Playbook
            {activeTab === 'playbook' && (
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#9A3412]" />
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions & User Profile */}
        <div className="flex items-center gap-2.5">
          {onOpenSmartRecs && (
            <button
              onClick={onOpenSmartRecs}
              title="Smart recommendations grounded in web search"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9A3412] bg-[#F8EFE9] hover:bg-[#F2E5DC] rounded-md transition-colors border border-[#EACEC0] whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9A3412]" />
              <span>Smart Recs</span>
            </button>
          )}

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-md transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Source</span>
          </button>


          {/* User Auth control */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E7E2D8]">
              <span
                className="hidden lg:inline text-xs font-sans text-stone-700 font-medium truncate max-w-[120px]"
                title={user.email || user.displayName || ''}
              >
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <button
                onClick={onSignOut}
                title="Sign out of your vault"
                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-[#F2ECE1] rounded-md transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile subnav */}
      <div className="md:hidden flex items-center justify-around border-t border-[#E7E2D8] py-2 px-2 bg-[#FAF7F2] text-xs font-medium text-stone-600">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-2 py-1 rounded ${activeTab === 'library' ? 'text-stone-900 font-bold bg-[#EAE4D7]' : ''}`}
        >
          Library
        </button>
        <button
          onClick={() => setActiveTab('reflection')}
          className={`px-2 py-1 rounded ${activeTab === 'reflection' ? 'text-stone-900 font-bold bg-[#EAE4D7]' : ''}`}
        >
          Reflect
        </button>
        <button
          onClick={() => setActiveTab('consult')}
          className={`px-2 py-1 rounded ${activeTab === 'consult' ? 'text-stone-900 font-bold bg-[#EAE4D7]' : ''}`}
        >
          Ask AI
        </button>
        <button
          onClick={() => setActiveTab('playbook')}
          className={`px-2 py-1 rounded ${activeTab === 'playbook' ? 'text-stone-900 font-bold bg-[#EAE4D7]' : ''}`}
        >
          Playbook
        </button>
      </div>
    </header>
  );
};
