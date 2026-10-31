const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ success: true, message: 'Auth API is working (login stub)' });
});

router.post('/register', (req, res) => {
  res.json({ success: true, message: 'Auth API is working (register stub)' });
});

router.get('/me', (req, res) => {
  res.json({ success: true, message: 'Auth API is working (me stub)' });
});

module.exports = router;
