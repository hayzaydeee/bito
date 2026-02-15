import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { journalService } from '../services/journalService';
import { useAuth } from '../contexts/AuthContext';
import BlockNoteEditor from '../components/journal/BlockNoteEditor';
import JournalDateList from '../components/journal/JournalDateList';
import JournalMeta from '../components/journal/JournalMeta';

/* -----------------------------------------------------------------
   JournalPage — full-page distraction-free journal
   Desktop: date sidebar + writing surface
   Mobile: date strip + writing surface
   Route: /app/journal
----------------------------------------------------------------- */

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const JournalPage = () => {
  const { isAuthenticated } = useAuth();

  /* ── state ───────────────────────────────── */
  const [selectedDate, setSelectedDate] = useState(today);
  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved | saving | error
  const [wordCount, setWordCount] = useState(0);
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [tags, setTags] = useState([]);
  const [indicators, setIndicators] = useState({});
  const [editor, setEditor] = useState(null);
  const [editorReady, setEditorReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* ── responsive ──────────────────────────── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── load indicators (which dates have entries) */
  useEffect(() => {
    if (!isAuthenticated) return;
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 60);
    journalService
      .getJournalIndicators(
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
      )
      .then(setIndicators)
      .catch(() => {});
  }, [isAuthenticated]);

  /* ── load entry when date changes ────────── */
  useEffect(() => {
    if (!isAuthenticated) return;
    loadEntry(selectedDate);
  }, [selectedDate, isAuthenticated]);

  const loadEntry = async (dateStr) => {
    setIsLoading(true);
    setEditorReady(false);
    setEditor(null);
    try {
      const data = await journalService.getDailyJournal(dateStr);
      if (data) {
        setEntry(data);
        setMood(data.mood);
        setEnergy(data.energy);
        setTags(data.tags || []);
        setWordCount(data.wordCount || 0);
      } else {
        setEntry({ date: dateStr, richContent: null, plainTextContent: '', mood: null, energy: null, tags: [], wordCount: 0 });
        setMood(null);
        setEnergy(null);
        setTags([]);
        setWordCount(0);
      }
      setSaveStatus('saved');
    } catch {
      setEntry({ date: dateStr, richContent: null, plainTextContent: '', mood: null, energy: null, tags: [], wordCount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── editor ready ────────────────────────── */
  const handleEditorReady = useCallback((inst) => {
    setEditor(inst);
    setTimeout(() => setEditorReady(true), 120);
  }, []);

  /* ── debounced save ──────────────────────── */
  const saveTimerRef = React.useRef(null);

  const scheduleSave = useCallback((content) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      if (!isAuthenticated || isSaving) return;
      setIsSaving(true);
      try {
        const plainText = journalService.extractPlainText(content);
        const wc = journalService.getWordCount(plainText);
        const sanitized = Array.isArray(content)
          ? content.map(b => ({
              id: b.id || crypto.randomUUID?.() || Math.random().toString(36),
              type: b.type || 'paragraph',
              props: b.props || {},
              content: Array.isArray(b.content) ? b.content : [],
            }))
          : null;

        const saved = await journalService.saveDailyJournal(selectedDate, {
          richContent: sanitized,
          plainTextContent: plainText,
          wordCount: wc,
          mood,
          energy,
          tags,
          createdVia: 'page',
        });
        setEntry(saved);
        setWordCount(wc);
        setSaveStatus('saved');
        // Mark indicator
        setIndicators(prev => ({ ...prev, [selectedDate]: true }));
      } catch {
        setSaveStatus('error');
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  }, [isAuthenticated, isSaving, selectedDate, mood, energy, tags]);

  /* ── editor change ───────────────────────── */
  const handleEditorChange = useCallback((content) => {
    if (!entry || !editorReady) return;
    const pt = journalService.extractPlainText(content);
    setWordCount(journalService.getWordCount(pt));
    const oldPt = journalService.extractPlainText(entry.richContent || []);
    if (pt !== oldPt) scheduleSave(content);
  }, [entry, editorReady, scheduleSave]);

  /* ── metadata changes → save ─────────────── */
  const saveMetadata = useCallback(async (newMood, newEnergy, newTags) => {
    if (!isAuthenticated || !entry) return;
    setSaveStatus('saving');
    try {
      let currentContent = entry.richContent;
      let currentPlain = entry.plainTextContent;
      if (editor) {
        try { currentContent = editor.document; currentPlain = journalService.extractPlainText(currentContent); } catch {}
      }
      const saved = await journalService.saveDailyJournal(selectedDate, {
        richContent: currentContent,
        plainTextContent: currentPlain,
        mood: newMood,
        energy: newEnergy,
        tags: newTags,
      });
      setEntry(saved);
      setSaveStatus('saved');
      setIndicators(prev => ({ ...prev, [selectedDate]: true }));
    } catch {
      setSaveStatus('error');
    }
  }, [isAuthenticated, entry, editor, selectedDate]);

  const handleMoodChange = (v) => { setMood(v); saveMetadata(v, energy, tags); };
  const handleEnergyChange = (v) => { setEnergy(v); saveMetadata(mood, v, tags); };
  const handleAddTag = (t) => { const nt = [...tags, t]; setTags(nt); saveMetadata(mood, energy, nt); };
  const handleRemoveTag = (t) => { const nt = tags.filter(x => x !== t); setTags(nt); saveMetadata(mood, energy, nt); };

  /* ── formatted heading date ──────────────── */
  const headingDate = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [selectedDate]);

  /* ── not authenticated ───────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="page-container flex items-center justify-center h-full">
        <p className="text-sm font-spartan text-[var(--color-text-tertiary)]">
          Please log in to access your journal.
        </p>
      </div>
    );
  }

  /* ── render ──────────────────────────────── */
  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Date sidebar (desktop) / strip (mobile) ── */}
      {!isMobile && (
        <JournalDateList
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          indicators={indicators}
          days={60}
          isMobile={false}
        />
      )}

      {/* ── Main writing area ─────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile date strip */}
        {isMobile && (
          <div className="flex-shrink-0 px-3 pt-3">
            <JournalDateList
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              indicators={indicators}
              days={30}
              isMobile
            />
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 px-6 sm:px-10 pt-6 pb-2">
          <h1 className="text-2xl sm:text-3xl font-garamond font-bold text-[var(--color-text-primary)] mb-1">
            {headingDate}
          </h1>

          {/* Meta strip */}
          <div className="mt-3">
            <JournalMeta
              mood={mood}
              energy={energy}
              tags={tags}
              onMoodChange={handleMoodChange}
              onEnergyChange={handleEnergyChange}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-brand-500)] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <BlockNoteEditor
                key={selectedDate}
                initialContent={entry?.richContent}
                onChange={handleEditorChange}
                onReady={handleEditorReady}
                placeholder="How did today go? Reflect on your habits, mood, and experiences..."
                className="prose prose-lg max-w-none font-garamond"
              />
            </div>
          )}
        </div>

        {/* Footer status bar */}
        <div className="flex-shrink-0 border-t border-[var(--color-border-primary)] px-6 sm:px-10 py-2 flex items-center justify-between text-xs font-spartan text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{journalService.getReadingTime(wordCount)} min read</span>
          </div>
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saving' && (
              <>
                <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] animate-pulse" />
                <span>Saving…</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <div className="w-2 h-2 rounded-full bg-[var(--color-error)]" />
                <span className="text-[var(--color-error)]">Error saving</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalPage;
