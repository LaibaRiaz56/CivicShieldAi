const express = require('express');
const router = express.Router();
const db = require('../services/db');

router.get('/', async (req, res, next) => {
  try {
    const { data } = await db.getAll('alerts');
    res.json({ alerts: data || [] });
  } catch (err) { next(err); }
});

module.exports = router;
