const Department = require('../models/Department');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

/**
 * @desc    Get all categories handled by active departments
 * @route   GET /api/v1/categories
 * @access  Authenticated (Any role)
 */
const getCategories = asyncHandler(async (req, res) => {
  // Fetch active departments only
  const departments = await Department.find({ isActive: true }).select('categoriesHandled');

  // Flatten categories, remove duplicates, and sort alphabetically
  const categorySet = new Set();
  departments.forEach((dept) => {
    if (Array.isArray(dept.categoriesHandled)) {
      dept.categoriesHandled.forEach((cat) => {
        if (cat && typeof cat === 'string') {
          categorySet.add(cat.trim());
        }
      });
    }
  });

  const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

  return success(res, { categories }, 'Categories retrieved successfully', 200);
});

module.exports = {
  getCategories
};
