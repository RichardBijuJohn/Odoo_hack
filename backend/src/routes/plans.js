const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Plans API is working' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create plan endpoint ready' });
});

module.exports = router;
