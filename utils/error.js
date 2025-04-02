const errorHandler = (res, statusCode, message, error = null) => {
    res.status(statusCode).json({
        success: false,
        message,
        error: error ? error.message || error : null,
    });
};

module.exports = errorHandler;