const express = require('express');
const router = express.Router();
const { createOrder, getOrderById, getMyOrders, updateOrderToPaid, getAllOrders, getOrderTracking } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, updateOrderToPaid);
router.get('/:id/track', protect, getOrderTracking);
router.get('/', protect, admin, getAllOrders);

module.exports = router;
