// src/services/journalV2Service.js
// Journal V2 API service — multi-entry per day, longform + micro
import api from './api';
import { extractPlainText as extractPlainTextUtil } from '../utils/sanitizeBlock';

const BASE = '/api/journal-v2';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const journalV2Service = {
  /* ── Day operations ──────────────────────────────────────────── */

  // Get all entries for a specific date (longform + micros)
  async getDay(date) {
    try {
      return await api.get(`${BASE}/day/${date}`);
    } catch (error) {
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        return { date, longform: null, micros: [], totalEntries: 0 };
      }
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        return null;
      }
      throw error;
    }
  },

  /* ── Longform operations ─────────────────────────────────────── */

  // Save/update the day's longform entry
  async saveLongform(date, data) {
    return api.post(`${BASE}/longform/${date}`, data);
  },

  /* ── Micro-entry operations ──────────────────────────────────── */

  // Create a new micro-entry
  async createMicro(date, text, opts = {}) {
    return api.post(`${BASE}/micro/${date}`, { text, ...opts });
  },

  /* ── Entry operations (by ID) ────────────────────────────────── */

  // Update any entry by ID
  async updateEntry(id, data) {
    return api.patch(`${BASE}/${id}`, data);
  },

  // Soft-delete entry by ID
  async deleteEntry(id) {
    return api.delete(`${BASE}/${id}`);
  },

  /* ── Indicators ──────────────────────────────────────────────── */

  // Get which dates have entries for week strip
  async getIndicators(startDate, endDate) {
    try {
      return await api.get(`${BASE}/indicators?startDate=${startDate}&endDate=${endDate}`);
    } catch {
      return {};
    }
  },

  /* ── Search & threads ────────────────────────────────────────── */

  async search(query, opts = {}) {
    const params = new URLSearchParams({ q: query });
    if (opts.type) params.append('type', opts.type);
    if (opts.tag) params.append('tag', opts.tag);
    if (opts.habitId) params.append('habitId', opts.habitId);
    if (opts.page) params.append('page', opts.page);
    if (opts.limit) params.append('limit', opts.limit);
    return api.get(`${BASE}/search?${params.toString()}`);
  },

  async getHabitThread(habitId, opts = {}) {
    const params = new URLSearchParams();
    if (opts.page) params.append('page', opts.page);
    if (opts.limit) params.append('limit', opts.limit);
    const qs = params.toString();
    return api.get(`${BASE}/thread/${habitId}${qs ? `?${qs}` : ''}`);
  },

  /* ── Stats ───────────────────────────────────────────────────── */

  async getStats() {
    return api.get(`${BASE}/stats`);
  },

  /* ── Archive (legacy entries) ────────────────────────────────── */

  async getArchive(opts = {}) {
    const params = new URLSearchParams();
    if (opts.page) params.append('page', opts.page);
    if (opts.limit) params.append('limit', opts.limit);
    return api.get(`${BASE}/archive?${params.toString()}`);
  },

  /* ── Utilities ───────────────────────────────────────────────── */

  /**
   * Upload an image file for use in journal entries.
   * Returns the Cloudinary secure URL.
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}${BASE}/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Image upload failed');
    return data.url;
  },

  extractPlainText(blockNoteContent) {
    return extractPlainTextUtil(blockNoteContent);
  },

  formatDateForAPI(date) {
    if (!date) return new Date().toISOString().split('T')[0];
    if (typeof date === 'string') return date.split('T')[0];
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return new Date(date).toISOString().split('T')[0];
  },

  getWordCount(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  },

  getReadingTime(wordCount) {
    return Math.max(1, Math.ceil(wordCount / 200));
  },
};
