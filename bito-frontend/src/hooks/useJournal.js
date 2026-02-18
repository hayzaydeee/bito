// src/hooks/useJournal.js
// Single source of truth for journal state management
import { useState, useEffect, useCallback, useRef } from 'react';
import { journalV2Service } from '../services/journalV2Service';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeDocument } from '../utils/sanitizeBlock';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Build a lightweight fingerprint of the document content.
 * Captures text, link hrefs, embed URLs, and table cell text
 * so we detect changes to embeds (images, files) that plain-text comparison misses.
 */
function getContentFingerprint(content) {
  if (!Array.isArray(content)) return '';
  let fp = '';
  const visit = (blocks) => {
    for (const b of blocks) {
      if (!b) continue;
      fp += b.type || '';
      if (Array.isArray(b.content)) {
        for (const ic of b.content) {
          if (ic?.text) fp += ic.text;
          if (ic?.type === 'link') {
            fp += ic.href || '';
            if (Array.isArray(ic.content)) {
              for (const lc of ic.content) { if (lc?.text) fp += lc.text; }
            }
          }
        }
      }
      if (b.content?.type === 'tableContent') {
        for (const row of (b.content.rows || [])) {
          for (const cell of (row.cells || [])) {
            if (Array.isArray(cell)) {
              for (const item of cell) { if (item?.text) fp += item.text; }
            }
          }
        }
      }
      if (b.props?.url) fp += b.props.url;
      if (b.props?.caption) fp += b.props.caption;
      if (Array.isArray(b.children) && b.children.length > 0) visit(b.children);
    }
  };
  visit(content);
  return fp;
}

export function useJournal() {
  const { isAuthenticated } = useAuth();

  /* ── Core state ──────────────────────────────────────────────── */
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [longform, setLongform] = useState(null);
  const [micros, setMicros] = useState([]);
  const [indicators, setIndicators] = useState({});

  /* ── Loading / saving state ──────────────────────────────────── */
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error

  /* ── Metadata (for the active longform entry) ────────────────── */
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [tags, setTags] = useState([]);
  const [wordCount, setWordCount] = useState(0);

  /* ── Editor ref ──────────────────────────────────────────────── */
  const [editor, setEditor] = useState(null);
  const [editorReady, setEditorReady] = useState(false);
  const saveTimerRef = useRef(null);
  const abortRef = useRef(null);
  const isSavingRef = useRef(false);
  const lastContentFpRef = useRef('');

  /* ── Load indicators for the week strip ──────────────────────── */
  const loadIndicators = useCallback(async () => {
    if (!isAuthenticated) return;
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 45); // ~6 weeks back
    try {
      const data = await journalV2Service.getIndicators(
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
      );
      setIndicators(data);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => { loadIndicators(); }, [loadIndicators]);

  /* ── Load day's entries when date changes ────────────────────── */
  const loadDay = useCallback(async (dateStr) => {
    if (!isAuthenticated) return;

    // Cancel any pending saves
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setIsLoading(true);
    setEditorReady(false);
    setEditor(null);

    try {
      const data = await journalV2Service.getDay(dateStr);
      if (data) {
        setLongform(data.longform);
        setMicros(data.micros || []);
        // Set metadata from longform entry (if exists)
        if (data.longform) {
          setMood(data.longform.mood);
          setEnergy(data.longform.energy);
          setTags(data.longform.tags || []);
          setWordCount(data.longform.wordCount || 0);
        } else {
          setMood(null);
          setEnergy(null);
          setTags([]);
          setWordCount(0);
        }
      } else {
        setLongform(null);
        setMicros([]);
        setMood(null);
        setEnergy(null);
        setTags([]);
        setWordCount(0);
      }
      setSaveStatus('idle');
    } catch {
      setLongform(null);
      setMicros([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadDay(selectedDate); }, [selectedDate, loadDay]);

  /* ── Select date ─────────────────────────────────────────────── */
  const selectDate = useCallback((dateStr) => {
    setSelectedDate(dateStr);
  }, []);

  /* ── Editor ready ────────────────────────────────────────────── */
  const handleEditorReady = useCallback((inst) => {
    setEditor(inst);
    setEditorReady(true);
  }, []);

  /* ── Debounced longform save ─────────────────────────────────── */
  const scheduleSave = useCallback((content) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');

    saveTimerRef.current = setTimeout(async () => {
      if (!isAuthenticated || isSaving) return;
      setIsSaving(true);
      try {
        const plainText = journalV2Service.extractPlainText(content);
        const wc = journalV2Service.getWordCount(plainText);

        // Sanitize blocks (preserves tables, embeds, links, children)
        const sanitized = Array.isArray(content)
          ? sanitizeDocument(content)
          : null;

        const saved = await journalV2Service.saveLongform(selectedDate, {
          richContent: sanitized,
          plainTextContent: plainText,
          mood,
          energy,
          tags,
          createdVia: 'page',
        });

        setLongform(saved);
        setWordCount(wc);
        setSaveStatus('saved');

        // Update indicator for this date
        setIndicators(prev => ({
          ...prev,
          [selectedDate]: { ...(prev[selectedDate] || {}), hasLongform: true, count: (prev[selectedDate]?.count || 0) + (prev[selectedDate]?.hasLongform ? 0 : 1) },
        }));
      } catch {
        setSaveStatus('error');
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  }, [isAuthenticated, isSaving, selectedDate, mood, energy, tags]);

  /* ── Editor content change ───────────────────────────────────── */
  const handleEditorChange = useCallback((content) => {
    if (!editorReady) return;
    const pt = journalV2Service.extractPlainText(content);
    setWordCount(journalV2Service.getWordCount(pt));

    // Always schedule save — debounce handles rate-limiting.
    // Previous plain-text-only comparison missed embed changes (images, files).
    scheduleSave(content);
  }, [editorReady, scheduleSave]);

  /* ── Metadata changes → save ─────────────────────────────────── */
  const saveMetadata = useCallback(async (newMood, newEnergy, newTags) => {
    if (!isAuthenticated) return;
    setSaveStatus('saving');
    try {
      let currentContent = longform?.richContent;
      let currentPlain = longform?.plainTextContent;
      if (editor) {
        try {
          currentContent = editor.document;
          currentPlain = journalV2Service.extractPlainText(currentContent);
        } catch { /* use existing */ }
      }

      const saved = await journalV2Service.saveLongform(selectedDate, {
        richContent: currentContent,
        plainTextContent: currentPlain,
        mood: newMood,
        energy: newEnergy,
        tags: newTags,
      });

      setLongform(saved);
      setSaveStatus('saved');
      setIndicators(prev => ({
        ...prev,
        [selectedDate]: { ...(prev[selectedDate] || {}), hasLongform: true },
      }));
    } catch {
      setSaveStatus('error');
    }
  }, [isAuthenticated, longform, editor, selectedDate]);

  const changeMood = useCallback((v) => {
    setMood(v);
    saveMetadata(v, energy, tags);
  }, [energy, tags, saveMetadata]);

  const changeEnergy = useCallback((v) => {
    setEnergy(v);
    saveMetadata(mood, v, tags);
  }, [mood, tags, saveMetadata]);

  const addTag = useCallback((t) => {
    const nt = [...tags, t];
    setTags(nt);
    saveMetadata(mood, energy, nt);
  }, [mood, energy, tags, saveMetadata]);

  const removeTag = useCallback((t) => {
    const nt = tags.filter(x => x !== t);
    setTags(nt);
    saveMetadata(mood, energy, nt);
  }, [mood, energy, tags, saveMetadata]);

  /* ── Micro-entry operations ──────────────────────────────────── */
  const addMicro = useCallback(async (text, opts = {}) => {
    if (!isAuthenticated || !text.trim()) return null;
    try {
      const entry = await journalV2Service.createMicro(selectedDate, text.trim(), opts);
      setMicros(prev => [...prev, entry]);
      // Update indicator
      setIndicators(prev => ({
        ...prev,
        [selectedDate]: {
          ...(prev[selectedDate] || {}),
          hasMicro: true,
          count: (prev[selectedDate]?.count || 0) + 1,
        },
      }));
      return entry;
    } catch (error) {
      console.error('Error creating micro-entry:', error);
      return null;
    }
  }, [isAuthenticated, selectedDate]);

  const deleteMicro = useCallback(async (id) => {
    try {
      await journalV2Service.deleteEntry(id);
      setMicros(prev => prev.filter(m => m._id !== id));
    } catch (error) {
      console.error('Error deleting micro-entry:', error);
    }
  }, []);

  const editMicro = useCallback(async (id, text) => {
    try {
      const updated = await journalV2Service.updateEntry(id, { text });
      setMicros(prev => prev.map(m => m._id === id ? updated : m));
      return updated;
    } catch (error) {
      console.error('Error editing micro-entry:', error);
      return null;
    }
  }, []);

  /* ── Cleanup ─────────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return {
    // State
    selectedDate,
    longform,
    micros,
    indicators,
    isLoading,
    isSaving,
    saveStatus,
    mood,
    energy,
    tags,
    wordCount,
    editorReady,

    // Actions
    selectDate,
    handleEditorReady,
    handleEditorChange,
    changeMood,
    changeEnergy,
    addTag,
    removeTag,
    addMicro,
    deleteMicro,
    editMicro,
    loadIndicators,
  };
}
