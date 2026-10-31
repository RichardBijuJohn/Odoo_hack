const app = require('./app');
const dotenv = require('dotenv');
const pool = require('./config/db');

dotenv.config();

const PORT = process.env.PORT || 5000;

// Test MySQL connection on boot (non-blocking for fast skeleton dev)
pool.getConnection()
  .then((conn) => {
    console.log('✓ Successfully connected to MySQL database');
    conn.release();
  })
  .catch((err) => {
    const detail = err.message || (err.errors ? err.errors.map(e => e.message || e.code).join(', ') : err.code);
    console.warn(`⚠️  MySQL connection warning: Could not connect to MySQL (${detail}). Verify MySQL is running and check backend/.env`);
  });

app.listen(PORT, () => {
  console.log(`🚀 Brightloop Backend running on http://localhost:${PORT}`);
});
