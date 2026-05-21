const express  = require('express');
const router   = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createReturn,
  getMyReturns,
  adminGetReturns,
  adminGetReturn,
  adminUpdateReturnStatus,
  adminGetReturnAnalytics
} = require('../controllers/returnController');

// Customer routes
router.post('/',    protect, createReturn);
router.get('/mine', protect, getMyReturns);

// Admin routes
router.get('/admin',              protect, admin, adminGetReturns);
router.get('/admin/analytics',    protect, admin, adminGetReturnAnalytics);
router.get('/admin/:id',          protect, admin, adminGetReturn);
router.patch('/admin/:id/status', protect, admin, adminUpdateReturnStatus);

module.exports = router;
