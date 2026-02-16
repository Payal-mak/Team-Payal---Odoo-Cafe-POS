// Error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    console.error(err);

    // MySQL duplicate key error
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // MySQL foreign key constraint error
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        const message = 'Cannot delete record as it is referenced by other records';
        error = { message, statusCode: 400 };
    }

    // MySQL validation error
    if (err.code === 'ER_NO_DEFAULT_FOR_FIELD') {
        const message = 'Required field is missing';
        error = { message, statusCode: 400 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
