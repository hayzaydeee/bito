import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useJournal } from '../../hooks/useJournal';
import BlockNoteEditor from '../journal/BlockNoteEditor';
import { CalendarPopover } from './JournalWeekStrip';
import JournalDayFeed from './JournalDayFeed';
import JournalStream from './JournalStream';
import JournalArchiveView from './JournalArchiveView';
import JournalEntryList from './JournalEntryList';
import JournalHome from './JournalHome';
import JournalPrivacySettings, { AIOptInNudge } from './JournalPrivacy';
import JournalTour from './JournalTour';
import { ArrowLeft, MagnifyingGlass, X, Lock, LockOpen, CalendarBlank } from '@phosphor-icons/react';
import { journalV2Service } from '../../services/journalV2Service';
import { userAPI } from '../../services/api';

/* ═══════════════════════════════════════════════════════════════
   JournalPageV2 — Orchestrator with Journal Home
   Default view is 'home'. Navigates into day / list / stream /
   archive sub-views, each with a back-to-home button.
   ═══════════════════════════════════════════════════════════════ */

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const JournalPageV2 = () => {
  const { isAuthenticated, user, updateUser } = useAuth();

  // Journal hook — single source of truth
  const journal = useJournal();

  // Local UI state
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [forceJournalTour, setForceJournalTour] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // View state — 'home' is the default landing
  const [activeView, setActiveView] = useState('home');

  // AI privacy state from user profile
  const journalAI = user?.preferences?.journalAI || {};
  const shouldShowNudge = !journalAI.tourCompleted && !journalAI.nudgeDismissed;

  // Check if user has enough entries to show the nudge (after ~7 entries)
  const [entryCount, setEntryCount] = useState(0);
  useEffect(() => {
    if (!isAuthenticated || journalAI.tourCompleted || journalAI.nudgeDismissed) return;
    journalV2Service.getStats()
      .then(data => setEntryCount(data.stats?.totalEntries || 0))
      .catch(() => {});
  }, [isAuthenticated, journalAI.tourCompleted, journalAI.nudgeDismissed]);

  const showNudgeBanner = shouldShowNudge && entryCount >= 7;

  // Update AI privacy settings
  const handleUpdateAISettings = useCallback(async (settings) => {
    try {
      const newJournalAI = { ...journalAI, ...settings };
      const newPreferences = { ...user?.preferences, journalAI: newJournalAI };
      await userAPI.updateProfile({ preferences: newPreferences });
      if (updateUser) updateUser({ preferences: newPreferences });
    } catch (error) {
      console.error('Error updating AI settings:', error);
    }
  }, [updateUser, user, journalAI]);

  const handleDismissNudge = useCallback(async () => {
    await handleUpdateAISettings({ nudgeDismissed: true });
  }, [handleUpdateAISettings]);

  // Search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const data = await journalV2Service.search(searchQuery.trim());
      setSearchResults(data);
    } catch {
      setSearchResults({ entries: [], query: searchQuery });
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const clearSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults(null);
  }, []);

  /* ── Navigation handlers ──────────────────────────────────── */
  const goHome = useCallback(() => {
    setActiveView('home');
    clearSearch();
  }, [clearSearch]);

  const openToday = useCallback(() => {
    journal.selectDate(todayStr());
    setActiveView('day');
  }, [journal]);

  const openYesterday = useCallback(() => {
    journal.selectDate(yesterdayStr());
    setActiveView('day');
  }, [journal]);

  const openList = useCallback(() => setActiveView('list'), []);
  const openStream = useCallback(() => setActiveView('stream'), []);
  const openArchive = useCallback(() => setActiveView('archive'), []);

  const openSearch = useCallback(() => {
    setShowSearch(true);
  }, []);

  const openDateFromHome = useCallback((dateStr) => {
    journal.selectDate(dateStr);
    setActiveView('day');
  }, [journal]);

  const handleAddMicroFromHome = useCallback((text) => {
    // Ensure we're on today's date for micro entries from home
    const today = todayStr();
    if (journal.selectedDate !== today) {
      journal.selectDate(today);
    }
    journal.addMicro(text);
  }, [journal]);

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="page-container flex items-center justify-center h-full">
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Please log in to access your journal.
        </p>
      </div>
    );
  }

  // Archive view (full-page takeover)
  if (activeView === 'archive') {
    return <JournalArchiveView onClose={goHome} />;
  }

  /* ── Home view ───────────────────────────────────────────── */
  if (activeView === 'home') {
    return (
      <div className="journal-v2-page std flex flex-col h-full overflow-clip w-full">
        {/* AI opt-in nudge */}
        {showNudgeBanner && (
          <div className="flex-shrink-0 px-4 sm:px-8 pt-4">
            <div className="max-w-5xl mx-auto">
              <AIOptInNudge
                onStartTour={() => setShowPrivacySettings(true)}
                onDismiss={handleDismissNudge}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <JournalHome
            wordCount={journal.wordCount}
            mood={journal.mood}
            energy={journal.energy}
            micros={journal.micros}
            selectedDate={journal.selectedDate}
            onOpenToday={openToday}
            onOpenYesterday={openYesterday}
            onOpenList={openList}
            onOpenStream={openStream}

            onOpenArchive={openArchive}
            onSelectDate={openDateFromHome}
            onAddMicro={handleAddMicroFromHome}
            journalAI={journalAI}
            onOpenIntelligence={() => setShowPrivacySettings(true)}
          />
        </div>

        {/* Privacy settings modal */}
        {showPrivacySettings && (
          <JournalPrivacySettings
            journalAI={journalAI}
            onUpdate={handleUpdateAISettings}
            onClose={() => setShowPrivacySettings(false)}
          />
        )}

        {/* Journal tour */}
        <JournalTour
          userId={user?._id || user?.id}
          forceShow={forceJournalTour}
          onComplete={() => setForceJournalTour(false)}
        />
      </div>
    );
  }

  /* ── Sub-views (day / list / stream) ─────────────────────── */
  return (
    <div className="journal-v2-page std flex flex-col h-full overflow-clip p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between mb-3 gap-3">
          {/* Left: back button + context */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={goHome}
              className="flex items-center gap-1.5 std-btn std-btn--sm"
              aria-label="Back to Journal Home"
            >
              <ArrowLeft size={14} weight="bold" />
              Journal
            </button>

            {/* View label */}
            {activeView === 'day' && (
              <span className="std-kicker text-[var(--ink-3)]">Day View</span>
            )}
            {activeView === 'list' && (
              <span className="std-kicker text-[var(--ink-3)]">All Entries</span>
            )}
            {activeView === 'stream' && (
              <span className="std-kicker text-[var(--ink-3)]">Timeline</span>
            )}
          </div>

          {/* Right: search + intelligence */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search toggle */}
            <button
              onClick={() => showSearch ? clearSearch() : setShowSearch(true)}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[var(--line-2)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
              aria-label={showSearch ? 'Close search' : 'Search journal'}
            >
              {showSearch ? <X size={16} weight="bold" /> : <MagnifyingGlass size={16} weight="bold" />}
            </button>

            {/* Calendar toggle (Day view only) */}
            {activeView === 'day' && (
              <div className="relative">
                <button
                  onClick={() => setCalendarOpen(!calendarOpen)}
                  className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[var(--line-2)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
                  aria-label="Open calendar"
                >
                  <CalendarBlank size={16} weight="bold" />
                </button>
                {calendarOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCalendarOpen(false)} />
                    <CalendarPopover
                      selectedDate={journal.selectedDate}
                      onSelect={(date) => { journal.selectDate(date); setCalendarOpen(false); }}
                      onClose={() => setCalendarOpen(false)}
                      indicators={journal.indicators}
                    />
                  </>
                )}
              </div>
            )}

            {/* Intelligence button */}
            <button
              onClick={() => setShowPrivacySettings(true)}
              className="std-btn std-btn--signal std-btn--sm"
              aria-label="Journal Intelligence settings"
            >
              {journalAI?.insightNudges || journalAI?.contentAnalysis || journalAI?.weeklySummaries
                ? <LockOpen size={14} weight="bold" />
                : <Lock size={14} weight="bold" />
              }
              Intelligence
            </button>
          </div>
        </div>

        {/* Search bar (conditional) */}
        {showSearch && (
          <div className="mb-3">
            <div className="flex items-center gap-2 std-input">
              <MagnifyingGlass size={16} weight="bold" className="flex-shrink-0" style={{ color: 'var(--ink-3)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search journal entries..."
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--ink)' }}
              />
              {searchQuery && (
                <button onClick={handleSearch} disabled={searchLoading} className="std-btn std-btn--signal std-btn--sm h-7 px-3">
                  {searchLoading ? '...' : 'Search'}
                </button>
              )}
            </div>

            {/* Search results */}
            {searchResults && (
              <div className="mt-2 max-h-60 overflow-y-auto std-card p-3 space-y-2">
                {searchResults.entries?.length === 0 ? (
                  <p className="grp-mono text-[11px] text-center py-4 uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                    No results for "{searchResults.query}"
                  </p>
                ) : (
                  searchResults.entries?.map(entry => (
                    <button
                      key={entry._id}
                      onClick={() => {
                        const dateStr = new Date(entry.date).toISOString().split('T')[0];
                        journal.selectDate(dateStr);
                        setActiveView('day');
                        clearSearch();
                      }}
                      className="w-full text-left px-3 py-2 rounded-[8px] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="std-tag" style={entry.type === 'micro' ? {} : { color: 'var(--signal)', borderColor: 'color-mix(in srgb, var(--signal) 40%, transparent)' }}>
                          {entry.type}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ink-2)' }}>
                        {entry.plainTextContent?.slice(0, 120)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Week strip navigation removed to increase vertical space */}
      </div>

      {/* ── AI opt-in nudge ─────────────────────────────────── */}
      {showNudgeBanner && (
        <div className="flex-shrink-0 pb-2">
          <AIOptInNudge
            onStartTour={() => setShowPrivacySettings(true)}
            onDismiss={handleDismissNudge}
          />
        </div>
      )}

      {/* ── Content area ───────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'list' ? (
          <JournalEntryList
            onSelectDate={(dateStr) => {
              journal.selectDate(dateStr);
              setActiveView('day');
            }}
          />
        ) : activeView === 'stream' ? (
          <JournalStream
            onSelectDate={(dateStr) => {
              journal.selectDate(dateStr);
              setActiveView('day');
            }}
          />
        ) : (
          <JournalDayFeed
            selectedDate={journal.selectedDate}
            longform={journal.longform}
            micros={journal.micros}
            isLoading={journal.isLoading}
            mood={journal.mood}
            energy={journal.energy}
            tags={journal.tags}
            wordCount={journal.wordCount}
            saveStatus={journal.saveStatus}
            onMoodChange={journal.changeMood}
            onEnergyChange={journal.changeEnergy}
            onAddTag={journal.addTag}
            onRemoveTag={journal.removeTag}
            onAddMicro={journal.addMicro}
            onEditMicro={journal.editMicro}
            onDeleteMicro={journal.deleteMicro}
            editorSlot={
              <BlockNoteEditor
                key={journal.selectedDate}
                initialContent={journal.longform?.richContent}
                onChange={journal.handleEditorChange}
                onReady={journal.handleEditorReady}
                placeholder="Start writing..."
                className="prose prose-lg max-w-none font-garamond journal-v2-editor"
              />
            }
          />
        )}
      </div>

      {/* ── Privacy settings modal ──────────────────────────── */}
      {showPrivacySettings && (
        <JournalPrivacySettings
          journalAI={journalAI}
          onUpdate={handleUpdateAISettings}
          onClose={() => setShowPrivacySettings(false)}
        />
      )}

      {/* ── Journal tour ────────────────────────────────────── */}
      <JournalTour
        userId={user?._id || user?.id}
        forceShow={forceJournalTour}
        onComplete={() => setForceJournalTour(false)}
      />
    </div>
  );
};

export default JournalPageV2;
