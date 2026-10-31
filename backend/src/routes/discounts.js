const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Discounts API is working' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create discount endpoint ready' });
});

module.exports = router;
