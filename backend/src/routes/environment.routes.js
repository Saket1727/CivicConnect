const express = require('express');
const router = express.Router();
const { getEnvironmentalConditions } = require('../integrations/weather.service');
const { apiSuccess } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const { lat = 28.6139, lon = 77.2090 } = req.query;
    const data = await getEnvironmentalConditions(parseFloat(lat), parseFloat(lon));
    return apiSuccess(res, data, 'Environmental observations retrieved');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
