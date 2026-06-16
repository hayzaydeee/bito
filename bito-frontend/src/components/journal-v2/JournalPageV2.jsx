import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useJournal } from '../../hooks/useJournal';
import BlockNoteEditor from '../journal/BlockNoteEditor';
import JournalWeekStrip from './JournalWeekStrip';
import JournalDayFeed from './JournalDayFeed';
import JournalArchiveView from './JournalArchiveView';
import JournalEntryList from './JournalEntryList';
import JournalPrivacySettings, { AIOptInNudge } from './JournalPrivacy';
import JournalTour from './JournalTour';
import { ArchiveIcon, MagnifyingGlassIcon, Cross2Icon, LockClosedIcon, LockOpen1Icon, ListBulletIcon, FileTextIcon } from '@radix-ui/react-icons';
import { journalV2Service } from '../../services/journalV2Service';
import { userAPI } from '../../services/api';

/* ═══════════════════════════════════════════════════════════════
   JournalPageV2 — Fluid Writing Surface + Micro-Journal Feed
   ═══════════════════════════════════════════════════════════════ */

const JournalPageV2 = () => {
  const { isAuthenticated, user, updateUser } = useAuth();

  // Journal hook — single source of truth
  const journal = useJournal();

  // Local UI state
  const [showArchive, setShowArchive] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [forceJournalTour, setForceJournalTour] = useState(false);
  const [activeView, setActiveView] = useState(
    user?.preferences?.journalDefaultView || 'day'
  );

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

  // Update AI privacy settings (persist to backend + update local state)
  const handleUpdateAISettings = useCallback(async (settings) => {
    try {
      const newJournalAI = { ...journalAI, ...settings };
      const newPreferences = { ...user?.preferences, journalAI: newJournalAI };

      // Persist to backend
      await userAPI.updateProfile({ preferences: newPreferences });

      // Update local user state
      if (updateUser) {
        updateUser({ preferences: newPreferences });
      }
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

  // Contextual date label for header
  const headerDateLabel = useMemo(() => {
    const d = new Date(journal.selectedDate + 'T12:00:00');
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    const fullDate = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (isToday) return `Today, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    if (isYesterday) return `Yesterday, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    return fullDate;
  }, [journal.selectedDate]);

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

  // Archive view
  if (showArchive) {
    return <JournalArchiveView onClose={() => setShowArchive(false)} />;
  }

  return (
    <div className="journal-v2-page std flex flex-col h-full overflow-clip p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 pb-3">
        <div className="flex items-end justify-between mb-3 gap-3">
          {/* Left: kicker + Title */}
          <div className="min-w-0">
            <p className="std-kicker mb-1.5">The Ledger — Journal</p>
            <h1 className="std-display text-[28px] sm:text-[34px] font-bold leading-none truncate" style={{ color: 'var(--ink)' }}>
              Journal
            </h1>
          </div>

          {/* Right: Accessory icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Journal Intelligence button */}
            <button
              onClick={() => setShowPrivacySettings(true)}
              className="std-btn std-btn--signal std-btn--sm"
              aria-label="Journal Intelligence settings"
              data-tour="journal-intelligence"
            >
              {journalAI?.insightNudges || journalAI?.contentAnalysis || journalAI?.weeklySummaries
                ? <LockOpen1Icon className="w-3.5 h-3.5" />
                : <LockClosedIcon className="w-3.5 h-3.5" />
              }
              Intelligence
            </button>

            {/* View toggle: Day / List */}
            <div
              className="flex items-center rounded-[10px] border border-[var(--line-2)] bg-[var(--bg-2)] p-0.5"
              data-tour="journal-view-toggle"
            >
              {[
                { id: 'day', Icon: FileTextIcon, label: 'Day view' },
                { id: 'list', Icon: ListBulletIcon, label: 'Ledger view' },
              ].map(({ id, Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className="p-1.5 rounded-[7px] transition-colors"
                  style={{
                    backgroundColor: activeView === id ? 'var(--surface-2)' : 'transparent',
                    color: activeView === id ? 'var(--signal)' : 'var(--ink-3)',
                  }}
                  aria-label={label}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Search toggle */}
            <button
              onClick={() => showSearch ? clearSearch() : setShowSearch(true)}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[var(--line-2)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
              aria-label={showSearch ? 'Close search' : 'Search journal'}
              data-tour="journal-search"
            >
              {showSearch ? <Cross2Icon className="w-4 h-4" /> : <MagnifyingGlassIcon className="w-4 h-4" />}
            </button>

            {/* Archive link */}
            <button
              onClick={() => setShowArchive(true)}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[var(--line-2)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
              aria-label="View archive"
              title="View archived entries"
              data-tour="journal-archive"
            >
              <ArchiveIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search bar (conditional) */}
        {showSearch && (
          <div className="mb-3">
            <div className="flex items-center gap-2 std-input">
              <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ink-3)' }} />
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

        {/* Week strip navigation — only in day view */}
        {activeView === 'day' && (
          <JournalWeekStrip
            selectedDate={journal.selectedDate}
            onSelect={journal.selectDate}
            indicators={journal.indicators}
          />
        )}
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

      {/* ── Day feed (main content) ─────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'list' ? (
          <JournalEntryList
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
