const express = require('express');
const router = express.Router();
const mockResources = require('../utils/mockResources');

router.get('/', (req, res) => {
  const { type, status } = req.query;
  let resources = [...mockResources];
  if (type)   resources = resources.filter(r => r.type === type);
  if (status) resources = resources.filter(r => r.status === status);
  res.json({ resources, count: resources.length });
});

module.exports = router;
