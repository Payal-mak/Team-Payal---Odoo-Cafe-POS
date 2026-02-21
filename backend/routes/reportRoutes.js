const express = require('express');
const router = express.Router();
const { getDashboardStats, getSalesReport, getTopProducts, getTopCategories, exportReport, getAdvancedReports } = require('../controllers/reportController');
const { exportSalesPDF, exportSalesExcel } = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardStats);
router.get('/sales', protect, authorize('admin'), getSalesReport);
router.get('/top-products', protect, authorize('admin'), getTopProducts);
router.get('/top-categories', protect, authorize('admin'), getTopCategories);
router.post('/export', protect, authorize('admin'), exportReport);
router.get('/export/pdf', protect, authorize('admin'), exportSalesPDF);
router.get('/export/excel', protect, authorize('admin'), exportSalesExcel);

router.get('/advanced', protect, getAdvancedReports);

module.exports = router;
