const express = require('express');
const router  = express.Router();
const { searchProducts } = require('../controllers/searchController');

// GET /api/search?q=&category=&brand=&minPrice=&maxPrice=&rating=&color=&sort=&page=&limit=
router.get('/', searchProducts);

module.exports = router;
