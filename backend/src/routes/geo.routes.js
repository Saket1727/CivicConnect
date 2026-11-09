const express = require('express');
const router = express.Router();
const { geocodeLocation, reverseGeocode } = require('../integrations/osm.service');
const { apiSuccess, apiError } = require('../utils/response');

router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return apiError(res, 'Query parameter "q" is required for geocoding.', 400);
    }
    const results = await geocodeLocation(q);
    return apiSuccess(res, results, 'Geocoding results retrieved');
  } catch (error) {
    next(error);
  }
});

router.get('/reverse', async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return apiError(res, 'Latitude (lat) and Longitude (lon) are required for reverse geocoding.', 400);
    }
    const result = await reverseGeocode(parseFloat(lat), parseFloat(lon));
    return apiSuccess(res, result, 'Reverse geocoding details retrieved');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
