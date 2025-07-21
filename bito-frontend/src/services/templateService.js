import api from './api';

export const templateService = {
  // Get all templates for current user
  async getUserTemplates() {
    try {
      const response = await api.get('/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  // Get a specific template
  async getTemplate(templateId) {
    try {
      const response = await api.get(`/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  },

  // Create a new template
  async createTemplate(templateData) {
    try {
      const response = await api.post('/templates', templateData);
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  // Update an existing template
  async updateTemplate(templateId, templateData) {
    try {
      const response = await api.put(`/templates/${templateId}`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  // Delete a template
  async deleteTemplate(templateId) {
    try {
      const response = await api.delete(`/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  // Create default templates for new users
  getDefaultTemplates() {
    return [
      {
        name: "Daily Reflection",
        description: "Simple daily check-in template",
        content: [
          {
            id: crypto.randomUUID?.() || 'header-1',
            type: "heading",
            props: { level: 2 },
            content: [{ type: "text", text: "How was my day?" }]
          },
          {
            id: crypto.randomUUID?.() || 'para-1',
            type: "paragraph",
            props: {},
            content: [{ type: "text", text: "Today I felt..." }]
          },
          {
            id: crypto.randomUUID?.() || 'para-2',
            type: "paragraph",
            props: {},
            content: []
          },
          {
            id: crypto.randomUUID?.() || 'header-2',
            type: "heading",
            props: { level: 2 },
            content: [{ type: "text", text: "What went well?" }]
          },
          {
            id: crypto.randomUUID?.() || 'para-3',
            type: "paragraph",
            props: {},
            content: []
          },
          {
            id: crypto.randomUUID?.() || 'header-3',
            type: "heading",
            props: { level: 2 },
            content: [{ type: "text", text: "What could be improved?" }]
          },
          {
            id: crypto.randomUUID?.() || 'para-4',
            type: "paragraph",
            props: {},
            content: []
          }
        ]
      },
      {
        name: "Goal Planning",
        description: "Template for setting and tracking goals",
        content: [
          {
            id: crypto.randomUUID?.() || 'header-1',
            type: "heading",
            props: { level: 1 },
            content: [{ type: "text", text: "Goals for Today" }]
          },
          {
            id: crypto.randomUUID?.() || 'header-2',
            type: "heading",
            props: { level: 2 },
            content: [{ type: "text", text: "Priority Tasks" }]
          },
          {
            id: crypto.randomUUID?.() || 'bullet-1',
            type: "bulletListItem",
            props: {},
            content: [{ type: "text", text: "Task 1: " }]
          },
          {
            id: crypto.randomUUID?.() || 'bullet-2',
            type: "bulletListItem",
            props: {},
            content: [{ type: "text", text: "Task 2: " }]
          },
          {
            id: crypto.randomUUID?.() || 'bullet-3',
            type: "bulletListItem",
            props: {},
            content: [{ type: "text", text: "Task 3: " }]
          },
          {
            id: crypto.randomUUID?.() || 'header-3',
            type: "heading",
            props: { level: 2 },
            content: [{ type: "text", text: "Notes & Ideas" }]
          },
          {
            id: crypto.randomUUID?.() || 'para-1',
            type: "paragraph",
            props: {},
            content: []
          }
        ]
      },
      {
        name: "Gratitude Journal",
        description: "Focus on positive experiences and gratitude",
        content: [
          {
            id: crypto.randomUUID?.() || 'header-1',
            type: "heading",
            props: { level: 1 },
            content: [{ type: "text", text: "Today I'm Grateful For..." }]
          },
          {
            id: crypto.randomUUID?.() || 'numbered-1',
            type: "numberedListItem",
            props: {},
            content: [{ type: "text", text: "" }]
          },
          {
            id: crypto.randomUUID?.() || 'numbered-2',
            type: "numberedListItem",
            props: {},
            content: [{ type: "text", text: "" }]
          },
          {
            id: crypto.randomUUID?.() || 'numbered-3',
            type: "numberedListItem",
            props: {},
            content: [{ type: "text", text: "" }]
          },
          {
            id: crypto.randomUUID?.() || 'header-2',
            type: "heading",
            props: { level: 2 },
            content: [{ type: "text", text: "Positive Moments" }]
          },
          {
            id: crypto.randomUUID?.() || 'para-1',
            type: "paragraph",
            props: {},
            content: [{ type: "text", text: "A moment that made me smile today was..." }]
          },
          {
            id: crypto.randomUUID?.() || 'para-2',
            type: "paragraph",
            props: {},
            content: []
          }
        ]
      }
    ];
  },

  // Validate template content structure
  validateTemplateContent(content) {
    if (!Array.isArray(content)) {
      throw new Error('Template content must be an array');
    }

    // Basic validation - each item should have required BlockNote structure
    for (const block of content) {
      if (!block.type) {
        throw new Error('Each content block must have a type');
      }
      if (!block.content && block.type !== 'paragraph') {
        throw new Error('Each content block must have content (except empty paragraphs)');
      }
    }

    return true;
  }
};
