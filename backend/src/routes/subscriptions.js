const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Subscriptions API is working' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create subscription endpoint ready' });
});

module.exports = router;
