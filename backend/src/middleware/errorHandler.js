const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
    let status = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    if (err.code === 'LIMIT_FILE_SIZE') { status = 400; message = 'Image must be 5 MB or smaller.'; }
    if (err.code === 'ER_DUP_ENTRY') { status = 409; message = 'Duplicate entry.'; }
    if (status === 500) console.error(err.stack);
    res.status(status).json({
        success: false,
        message: status === 500 && process.env.NODE_ENV !== 'development' ? 'Internal Server Error' : message
    });
};
module.exports = errorHandler;
