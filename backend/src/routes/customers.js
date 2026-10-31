const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Customers API is working' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create customer endpoint ready' });
});

module.exports = router;
