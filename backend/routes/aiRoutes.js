const express = require('express');
const router = express.Router();
const { generateProductContent } = require('../controllers/aiController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/generate-product', protect, admin, generateProductContent);

module.exports = router;
