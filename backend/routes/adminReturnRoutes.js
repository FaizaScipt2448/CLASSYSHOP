const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect, admin } = require('../middleware/authMiddleware');
const { adminGetReturns, adminGetReturnAnalytics } = require('../controllers/returnController');
const returnSvc = require('../services/returnAnalyticsService');
const { success } = require('../helpers/apiResponse');

const router = express.Router();

const startOfDayIso = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const endOfDayIso = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

const range = (req) => {
  const fromValue = req.query.from || req.query.dateFrom;
  const toValue = req.query.to || req.query.dateTo;
  return {
    from: fromValue ? startOfDayIso(fromValue) : new Date(Date.now() - 30 * 86400000).toISOString(),
    to: toValue ? endOfDayIso(toValue) : new Date().toISOString()
  };
};

router.use(protect, admin);

router.get('/', adminGetReturns);
router.get('/analytics', adminGetReturnAnalytics);
router.get('/most-returned', asyncHandler(async (req, res) => {
  success(res, await returnSvc.getMostReturnedProducts(20));
}));
router.get('/reasons', asyncHandler(async (req, res) => {
  const { from, to } = range(req);
  success(res, await returnSvc.getReturnReasonBreakdown(from, to));
}));

module.exports = router;
