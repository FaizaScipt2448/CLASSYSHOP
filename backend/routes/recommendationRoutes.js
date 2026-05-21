const express = require('express');
const router  = express.Router();
const {
  getTrending,
  getPersonalized,
  getAlsoBought,
  trackBehavior
} = require('../controllers/recommendationController');

// GET /api/recommendations/trending
router.get('/trending', getTrending);

// GET /api/recommendations/personalized?userId=&sessionId=&limit=
router.get('/personalized', getPersonalized);

// GET /api/recommendations/also-bought?productId=&category=&limit=
router.get('/also-bought', getAlsoBought);

// POST /api/recommendations/track  { userId, sessionId, productId, action, category }
router.post('/track', trackBehavior);

module.exports = router;
