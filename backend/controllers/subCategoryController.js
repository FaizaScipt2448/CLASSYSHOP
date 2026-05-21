const asyncHandler = require('express-async-handler');
const SubCategory = require('../models/SubCategory');

const getSubCategories = asyncHandler(async (req, res) => {
  const subs = await SubCategory.find({}).populate('parentCategory', 'name slug image').sort({ createdAt: -1 });
  res.json(subs);
});

const createSubCategory = asyncHandler(async (req, res) => {
  const { name, parentCategory, image } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const sub = await SubCategory.create({ name, slug, parentCategory, image });
  res.status(201).json(sub);
});

const updateSubCategory = asyncHandler(async (req, res) => {
  const { name, parentCategory, image } = req.body;
  const slug = name ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined;
  const update = { ...(name && { name }), ...(slug && { slug }), ...(parentCategory && { parentCategory }), ...(image !== undefined && { image }) };
  const sub = await SubCategory.findByIdAndUpdate(req.params.id, update, { new: true }).populate('parentCategory', 'name slug');
  if (!sub) { res.status(404); throw new Error('Sub category not found'); }
  res.json(sub);
});

const deleteSubCategory = asyncHandler(async (req, res) => {
  const sub = await SubCategory.findByIdAndDelete(req.params.id);
  if (!sub) { res.status(404); throw new Error('Sub category not found'); }
  res.json({ message: 'Sub category deleted' });
});

module.exports = { getSubCategories, createSubCategory, updateSubCategory, deleteSubCategory };
