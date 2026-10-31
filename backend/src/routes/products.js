const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Products API is working' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create product endpoint ready' });
});

module.exports = router;
