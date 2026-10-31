const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Reports API is working' });
});

router.get('/mrr', (req, res) => {
  res.json({ success: true, mrr: 38420, message: 'MRR report stub' });
});

module.exports = router;
