const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const templateController = require('../controllers/templateController');
const { authenticateJWT } = require('../middleware/auth');

// Validation middleware
const validateTemplate = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Template name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('content')
    .optional()
    .isArray()
    .withMessage('Content must be an array')
];

// All routes require authentication
router.use(authenticateJWT);

// GET /api/templates - Get all templates for user
router.get('/', templateController.getUserTemplates);

// GET /api/templates/:id - Get specific template
router.get('/:id', templateController.getTemplate);

// POST /api/templates - Create new template
router.post('/', validateTemplate, templateController.createTemplate);

// PUT /api/templates/:id - Update template
router.put('/:id', validateTemplate, templateController.updateTemplate);

// DELETE /api/templates/:id - Delete template
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;
