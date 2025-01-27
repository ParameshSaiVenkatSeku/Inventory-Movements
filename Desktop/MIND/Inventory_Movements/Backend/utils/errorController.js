const logger = require('../middlewares/logger');

const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

const prodErrors = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong, please try again',
    });
  }
};

const globalErrorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  logger.error(`Error: ${error.message}`, {
    stack: error.stack,
    method: req.method,
    url: req.url,
  });

  if (process.env.NODE_ENV === 'development') {
    devErrors(res, error);
  } else {
    prodErrors(res, error);
  }
};

module.exports = globalErrorHandler;
