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
    console.warn('⚠️  MySQL connection warning (verify DB is running or update .env):', err.message);
  });

app.listen(PORT, () => {
  console.log(`🚀 Brightloop Backend running on http://localhost:${PORT}`);
});
