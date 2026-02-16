const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const { promisePool } = require('../config/database');

// Export sales report as PDF
exports.exportSalesPDF = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;

        // Fetch sales data
        const [salesData] = await promisePool.query(`
            SELECT 
                DATE(order_date) as date,
                COUNT(*) as total_orders,
                COALESCE(SUM(subtotal), 0) as subtotal,
                COALESCE(SUM(tax_amount), 0) as tax_amount,
                COALESCE(SUM(total_amount), 0) as total_revenue
            FROM orders
            WHERE DATE(order_date) BETWEEN ? AND ? 
            AND status != 'cancelled'
            GROUP BY DATE(order_date)
            ORDER BY date DESC
        `, [start_date, end_date]);

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${start_date}-to-${end_date}.pdf`);

        doc.pipe(res);

        // Add title
        doc.fontSize(20).text('Odoo Cafe POS - Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${start_date} to ${end_date}`, { align: 'center' });
        doc.moveDown(2);

        // Add table headers
        const tableTop = 200;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date', 50, tableTop);
        doc.text('Orders', 150, tableTop);
        doc.text('Subtotal', 250, tableTop);
        doc.text('Tax', 350, tableTop);
        doc.text('Total Revenue', 450, tableTop);

        // Add table rows
        doc.font('Helvetica');
        let y = tableTop + 25;
        salesData.forEach((row) => {
            doc.text(row.date, 50, y);
            doc.text(row.total_orders.toString(), 150, y);
            doc.text(`₹${Number(row.subtotal).toFixed(2)}`, 250, y);
            doc.text(`₹${Number(row.tax_amount).toFixed(2)}`, 350, y);
            doc.text(`₹${Number(row.total_revenue).toFixed(2)}`, 450, y);
            y += 20;
        });

        // Add totals
        const totalRevenue = salesData.reduce((sum, row) => sum + Number(row.total_revenue), 0);
        const totalOrders = salesData.reduce((sum, row) => sum + Number(row.total_orders), 0);

        doc.moveDown(2);
        doc.font('Helvetica-Bold');
        doc.text(`Total Orders: ${totalOrders}`, 50, y + 20);
        doc.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 50, y + 40);

        doc.end();
    } catch (error) {
        next(error);
    }
};

// Export sales report as Excel
exports.exportSalesExcel = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;

        // Fetch sales data
        const [salesData] = await promisePool.query(`
            SELECT 
                DATE(order_date) as date,
                COUNT(*) as total_orders,
                COALESCE(SUM(subtotal), 0) as subtotal,
                COALESCE(SUM(tax_amount), 0) as tax_amount,
                COALESCE(SUM(total_amount), 0) as total_revenue
            FROM orders
            WHERE DATE(order_date) BETWEEN ? AND ? 
            AND status != 'cancelled'
            GROUP BY DATE(order_date)
            ORDER BY date DESC
        `, [start_date, end_date]);

        // Format data for Excel
        const excelData = salesData.map(row => ({
            'Date': row.date,
            'Total Orders': row.total_orders,
            'Subtotal': Number(row.subtotal).toFixed(2),
            'Tax': Number(row.tax_amount).toFixed(2),
            'Total Revenue': Number(row.total_revenue).toFixed(2)
        }));

        // Add summary row
        const totalRevenue = salesData.reduce((sum, row) => sum + Number(row.total_revenue), 0);
        const totalOrders = salesData.reduce((sum, row) => sum + Number(row.total_orders), 0);
        const totalSubtotal = salesData.reduce((sum, row) => sum + Number(row.subtotal), 0);
        const totalTax = salesData.reduce((sum, row) => sum + Number(row.tax_amount), 0);

        excelData.push({
            'Date': 'TOTAL',
            'Total Orders': totalOrders,
            'Subtotal': totalSubtotal.toFixed(2),
            'Tax': totalTax.toFixed(2),
            'Total Revenue': totalRevenue.toFixed(2)
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${start_date}-to-${end_date}.xlsx`);

        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    ...require('./reportController'),
    exportSalesPDF,
    exportSalesExcel
};
