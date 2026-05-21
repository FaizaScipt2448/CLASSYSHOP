const express = require('express');
const router = express.Router();
const { processMessage, getSuggestions, getRelated } = require('../controllers/chatbotController');

router.post('/message', processMessage);
router.get('/suggestions', getSuggestions);
router.get('/related', getRelated);

module.exports = router;
