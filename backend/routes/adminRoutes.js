const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, deleteUser, updateOrderStatus, bulkDeleteProducts } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getStats);
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);
router.put('/orders/:id/status', protect, admin, updateOrderStatus);
router.delete('/products/bulk', protect, admin, bulkDeleteProducts);

module.exports = router;
