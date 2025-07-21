// src/services/journalService.js
import api from './api';

export const journalService = {
  // Get daily journal entry
  async getDailyJournal(date) {
    try {
      const data = await api.get(`/api/journal/${date}`);
      return data;
    } catch (error) {
      console.log('Journal fetch error:', error.message); // Debug log
      
      // Check if it's a 404 error (journal entry doesn't exist yet)
      if (error.message?.includes('Journal entry not found') || 
          error.message?.includes('404') || 
          error.message?.includes('Not Found')) {
        console.log('Returning null for 404 error'); // Debug log
        return null; // No journal entry for this date
      }
      
      // Check for authentication errors
      if (error.message?.includes('401') || 
          error.message?.includes('Access denied') || 
          error.message?.includes('Authentication') ||
          error.message?.includes('Unauthorized')) {
        console.warn('Authentication required for journal access');
        return null; // Return null when not authenticated
      }
      
      console.error('Error fetching journal entry:', error);
      throw error;
    }
  },

  // Create or update daily journal entry
  async saveDailyJournal(date, data) {
    try {
      console.log('Saving journal entry:', { date, data }); // Debug log
      const result = await api.post(`/api/journal/${date}`, data);
      return result;
    } catch (error) {
      console.error('Journal save error details:', error); // Enhanced error logging
      if (error.message?.includes('401') || error.message?.includes('Access denied')) {
        throw new Error('Please log in to save journal entries');
      }
      if (error.message?.includes('400')) {
        // Try to extract more specific error from the response
        const errorDetails = error.response?.data?.errors || error.response?.data?.message || 'Invalid data provided';
        throw new Error(`Validation error: ${errorDetails}. Please check your journal entry.`);
      }
      console.error('Error saving journal:', error);
      throw error;
    }
  },

  // Update specific fields of daily journal entry (uses POST since backend handles create/update)
  async updateDailyJournal(date, data) {
    try {
      // Use POST route which handles both create and update via findOrCreateDaily
      const result = await api.post(`/api/journal/${date}`, data);
      return result;
    } catch (error) {
      console.error('Error updating journal:', error);
      throw error;
    }
  },

  // Delete daily journal entry
  async deleteDailyJournal(date) {
    try {
      const result = await api.delete(`/api/journal/${date}`);
      return result;
    } catch (error) {
      console.error('Error deleting journal:', error);
      throw error;
    }
  },

  // Get journal entries with pagination
  async getJournalEntries(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const result = await api.get(`/api/journal?${queryParams.toString()}`);
      return result;
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  },

  // Search journal entries
  async searchJournals(query, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const result = await api.get(`/api/journal/search?${queryParams.toString()}`);
      return result;
    } catch (error) {
      console.error('Error searching journals:', error);
      throw error;
    }
  },

  // Get journal statistics
  async getJournalStats() {
    try {
      const result = await api.get('/api/journal/stats');
      return result;
    } catch (error) {
      console.error('Error fetching journal stats:', error);
      throw error;
    }
  },

  // Check if journal exists for date
  async hasJournalForDate(date) {
    try {
      await this.getDailyJournal(date);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get journal entries for date range (for indicators)
  async getJournalIndicators(startDate, endDate) {
    try {
      const response = await this.getJournalEntries({ 
        startDate, 
        endDate, 
        limit: 100 // Get enough to cover the date range
      });
      
      // Convert to a simple map of date -> boolean
      const indicators = {};
      if (response && response.entries && Array.isArray(response.entries)) {
        response.entries.forEach(entry => {
          const date = new Date(entry.date).toISOString().split('T')[0];
          indicators[date] = true;
        });
      }
      
      return indicators;
    } catch (error) {
      console.error('Error fetching journal indicators:', error);
      return {};
    }
  },

  // Extract plain text from BlockNote content
  extractPlainText(blockNoteContent) {
    if (!blockNoteContent || !Array.isArray(blockNoteContent)) {
      return '';
    }
    
    const extractTextFromBlock = (block) => {
      let text = '';
      
      if (block.content && Array.isArray(block.content)) {
        for (const item of block.content) {
          if (typeof item === 'string') {
            text += item;
          } else if (item.text) {
            text += item.text;
          } else if (item.content) {
            text += extractTextFromBlock(item);
          }
        }
      }
      
      return text + '\n';
    };
    
    return blockNoteContent
      .map(extractTextFromBlock)
      .join('')
      .trim();
  },

  // Format date for API calls (YYYY-MM-DD)
  formatDateForAPI(date) {
    if (typeof date === 'string') {
      return date.split('T')[0]; // Handle ISO strings
    }
    return date.toISOString().split('T')[0];
  },

  // Get word count from text
  getWordCount(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  },

  // Calculate reading time (words per minute)
  getReadingTime(wordCount, wordsPerMinute = 200) {
    return Math.ceil(wordCount / wordsPerMinute);
  }
};
