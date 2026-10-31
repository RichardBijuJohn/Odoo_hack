// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Extract real error message (especially for Node AggregateError or MySQL errors)
  let resolvedMessage = err.message || '';

  if (!resolvedMessage && err.sqlMessage) {
    resolvedMessage = err.sqlMessage;
  }

  // Handle Node.js 18+ AggregateError (empty err.message on failed dual-stack connections)
  if (err.name === 'AggregateError' || (err.errors && err.errors.length > 0)) {
    const errorMessages = (err.errors || []).map(e => e.message || e.code).filter(Boolean);
    if (errorMessages.length > 0) {
      resolvedMessage = errorMessages.join('; ');
    }
  }

  // Detect MySQL database connection failures
  const isDbConnectionError =
    err.code === 'ECONNREFUSED' ||
    err.code === 'EACCES' ||
    err.code === 'ENOTFOUND' ||
    (err.errors && err.errors.some(e => ['ECONNREFUSED', 'EACCES', 'ENOTFOUND'].includes(e.code)));

  if (isDbConnectionError) {
    resolvedMessage = `Database connection failed: Could not connect to MySQL at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}. Please ensure your MySQL server is running and database credentials in backend/.env are configured.`;
  }

  // Fallback if still empty
  if (!resolvedMessage) {
    resolvedMessage = err.code || 'Internal Server Error';
  }

  const statusCode = err.status || (isDbConnectionError ? 503 : 500);

  // Detailed server logging
  console.error(`[Error ${statusCode}] ${resolvedMessage}`);
  if (err.stack) {
    console.error(err.stack);
  }

  const responseBody = {
    success: false,
    message: resolvedMessage
  };

  // Expose underlying diagnostic details in non-production environments to avoid hiding the real cause
  if (process.env.NODE_ENV !== 'production') {
    responseBody.diagnostic = {
      code: err.code || (err.errors && err.errors[0]?.code),
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    };
  }

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;
