const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Determine SSL configuration for secure database connections (e.g., Aiven Cloud)
const getSslConfig = () => {
  // Local MySQL does not require TLS. Enable it explicitly for hosted databases.
  if (process.env.DB_SSL !== 'true') {
    return undefined;
  }

  const sslConfig = {};

  // Check for CA certificate from DB_SSL_CA (inline string), DB_SSL_CA_PATH, or local ca.pem
  if (process.env.DB_SSL_CA) {
    sslConfig.ca = process.env.DB_SSL_CA;
    sslConfig.rejectUnauthorized = true;
  } else if (process.env.DB_SSL_CA_PATH && fs.existsSync(path.resolve(process.env.DB_SSL_CA_PATH))) {
    sslConfig.ca = fs.readFileSync(path.resolve(process.env.DB_SSL_CA_PATH), 'utf8');
    sslConfig.rejectUnauthorized = true;
  } else {
    const defaultCaPath = path.resolve(__dirname, '../../ca.pem');
    if (fs.existsSync(defaultCaPath)) {
      sslConfig.ca = fs.readFileSync(defaultCaPath, 'utf8');
      sslConfig.rejectUnauthorized = true;
    } else {
      // If no CA is provided, honor DB_SSL_REJECT_UNAUTHORIZED if set (defaults to false for flexibility)
      sslConfig.rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
    }
  }

  return sslConfig;
};

// Create connection pool for MySQL (reading all credentials dynamically from .env)
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const ssl = getSslConfig();
if (ssl) {
  poolConfig.ssl = ssl;
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
