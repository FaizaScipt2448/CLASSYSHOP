const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');

router.get('/',     protect, admin, getBlogs);
router.get('/:id',  protect, admin, getBlogById);
router.post('/',    protect, admin, createBlog);
router.put('/:id',  protect, admin, updateBlog);
router.delete('/:id', protect, admin, deleteBlog);

module.exports = router;
