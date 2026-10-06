const express = require('express');
const router = express.Router();
const { submitProblem, getProblems } = require('../controllers/problemController');

// GET /api/problems - Retrieve all stored complaints
router.get('/problems', getProblems);

// POST /api/problems - Endpoint for student complaint submission
router.post('/problems', submitProblem);

module.exports = router;
