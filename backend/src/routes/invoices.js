const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Invoices API is working' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create invoice endpoint ready' });
});

module.exports = router;
