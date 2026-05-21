const express = require('express');
const router = express.Router();
const { getSubCategories, createSubCategory, updateSubCategory, deleteSubCategory } = require('../controllers/subCategoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getSubCategories);
router.post('/', protect, admin, createSubCategory);
router.put('/:id', protect, admin, updateSubCategory);
router.delete('/:id', protect, admin, deleteSubCategory);

module.exports = router;
