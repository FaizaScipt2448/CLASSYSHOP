const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({});
  res.json(categories);
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (category) res.json(category);
  else { res.status(404); throw new Error('Category not found'); }
});

const createCategory = asyncHandler(async (req, res) => {
  const category = new Category(req.body);
  const created = await category.save();
  res.status(201).json(created);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (category) res.json(category);
  else { res.status(404); throw new Error('Category not found'); }
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (category) res.json({ message: 'Category deleted' });
  else { res.status(404); throw new Error('Category not found'); }
});

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
