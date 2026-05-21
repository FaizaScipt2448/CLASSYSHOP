const asyncHandler = require('express-async-handler');
const Newsletter = require('../models/Newsletter');

const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const exists = await Newsletter.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('Email already subscribed');
  }
  await Newsletter.create({ email });
  res.status(201).json({ message: 'Subscribed successfully' });
});

module.exports = { subscribe };
