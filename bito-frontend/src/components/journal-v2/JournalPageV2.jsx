import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useJournal } from '../../hooks/useJournal';
import BlockNoteEditor from '../journal/BlockNoteEditor';
import JournalWeekStrip from './JournalWeekStrip';
import JournalDayFeed from './JournalDayFeed';
import JournalArchiveView from './JournalArchiveView';
import JournalPrivacySettings, { PrivacyBadge, AIOptInNudge } from './JournalPrivacy';
import { ArchiveIcon, MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
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
    <div className="journal-v2-page flex flex-col h-full overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 sm:px-10 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          {/* Left: Title · contextual date */}
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-xl sm:text-2xl font-garamond font-bold flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>
              Journal
            </h1>
            <span className="text-sm font-spartan font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
              ·&nbsp; {headerDateLabel}
            </span>
          </div>

          {/* Right: Accessory icons */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
            {/* Privacy / AI badge */}
            <PrivacyBadge
              journalAI={journalAI}
              onClick={() => setShowPrivacySettings(true)}
            />

            {/* Search toggle */}
            <button
              onClick={() => showSearch ? clearSearch() : setShowSearch(true)}
              className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label={showSearch ? 'Close search' : 'Search journal'}
            >
              {showSearch
                ? <Cross2Icon className="w-4 h-4" />
                : <MagnifyingGlassIcon className="w-4 h-4" />
              }
            </button>

            {/* Archive link */}
            <button
              onClick={() => setShowArchive(true)}
              className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="View archive"
              title="View archived entries"
            >
              <ArchiveIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search bar (conditional) */}
        {showSearch && (
          <div className="mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                borderColor: 'var(--color-border-primary)',
              }}>
              <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search journal entries..."
                autoFocus
                className="flex-1 bg-transparent text-sm font-spartan outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {searchQuery && (
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="px-2 py-0.5 rounded text-xs font-spartan font-semibold text-white"
                  style={{ backgroundColor: 'var(--color-brand-500)' }}
                >
                  {searchLoading ? '...' : 'Search'}
                </button>
              )}
            </div>

            {/* Search results */}
            {searchResults && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border p-3 space-y-2"
                style={{
                  backgroundColor: 'var(--color-surface-primary)',
                  borderColor: 'var(--color-border-primary)',
                }}>
                {searchResults.entries?.length === 0 ? (
                  <p className="text-xs font-spartan text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
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
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-spartan font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-spartan px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: entry.type === 'micro' ? 'var(--color-surface-elevated)' : 'rgba(99,102,241,0.1)',
                            color: entry.type === 'micro' ? 'var(--color-text-tertiary)' : 'var(--color-brand-500)',
                          }}>
                          {entry.type}
                        </span>
                      </div>
                      <p className="text-xs font-spartan mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {entry.plainTextContent?.slice(0, 120)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Week strip navigation */}
        <JournalWeekStrip
          selectedDate={journal.selectedDate}
          onSelect={journal.selectDate}
          indicators={journal.indicators}
        />
      </div>

      {/* ── AI opt-in nudge ─────────────────────────────────── */}
      {showNudgeBanner && (
        <div className="flex-shrink-0 px-6 sm:px-10 pb-2">
          <AIOptInNudge
            onStartTour={() => setShowPrivacySettings(true)}
            onDismiss={handleDismissNudge}
          />
        </div>
      )}

      {/* ── Day feed (main content) ─────────────────────────── */}
      <div className="flex-1 overflow-hidden">
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
      </div>

      {/* ── Privacy settings modal ──────────────────────────── */}
      {showPrivacySettings && (
        <JournalPrivacySettings
          journalAI={journalAI}
          onUpdate={handleUpdateAISettings}
          onClose={() => setShowPrivacySettings(false)}
        />
      )}
    </div>
  );
};

export default JournalPageV2;
