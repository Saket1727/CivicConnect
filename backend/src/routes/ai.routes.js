const express = require('express');
const router = express.Router();
const { getHealthcareAssistance } = require('../integrations/ai.service');
const { apiSuccess, apiError } = require('../utils/response');

router.post('/chat', async (req, res, next) => {
  try {
    const { prompt, conversationHistory } = req.body;
    if (!prompt) {
      return apiError(res, 'Prompt query is required.', 400);
    }
    const result = await getHealthcareAssistance(prompt, conversationHistory);
    return apiSuccess(res, result, 'Guidance generated');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
