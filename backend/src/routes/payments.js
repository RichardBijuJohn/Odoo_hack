const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Payments API is working' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create payment endpoint ready' });
});

module.exports = router;
