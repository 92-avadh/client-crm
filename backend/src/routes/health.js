const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const healthService = require('../services/health.service');

router.get('/overview', asyncHandler(async (req, res) => {
  res.json(await healthService.getAgencyHealthOverview(req.user));
}));

router.get('/:brandId', asyncHandler(async (req, res) => {
  const result = await healthService.calculateBrandHealth(req.params.brandId);
  if (!result) {
    return res.status(404).json({ error: 'Client not found.' });
  }
  res.json(result);
}));

module.exports = router;
