const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Deterministic medical guidance bank
const ADVISORY_RULES = [
  {
    keywords: ['chest pain', 'heart attack', 'angina', 'left arm pain', 'pressure in chest'],
    priority: 'EMERGENCY',
    response: `⚠️ **CRITICAL EMERGENCY WARNING**: Chest pain, especially radiating to the left arm, neck, or jaw accompanied by shortness of breath or cold sweats, can be an indicator of an acute coronary syndrome (heart attack).
    
**IMMEDIATE ACTIONS**:
1. Call National Emergency Ambulance: **108** or **112** immediately.
2. Rest in a seated, comfortable position and do not exert yourself.
3. If prescribed, take emergency Sorbitrate or Disprin under physician instructions.
4. Have someone stay with you and keep your door unlocked for paramedics.

*CivicConnect Emergency Registration is active in the navigation bar to alert the nearest trauma hospital.*`,
  },
  {
    keywords: ['fever', 'temperature', 'chills', 'dengue', 'malaria', 'viral'],
    priority: 'MODERATE',
    response: `🩺 **Fever & Infection Guidance**:
- A temperature above 100.4°F (38°C) is considered fever, typically an immune response to viral or bacterial infections.
- **Home Care Measures**:
  - Stay well-hydrated with water, coconut water, or ORS solutions.
  - Adequate rest.
  - If indicated by a physician, Paracetamol (650mg for adults) may help reduce fever and body aches. Avoid NSAIDs like Ibuprofen or Aspirin if Dengue is suspected.
- **When to visit Hospital/OPD**:
  - High fever lasting more than 3 consecutive days.
  - Persistent vomiting, severe abdominal pain, or bleeding gums (Dengue warning signs).
  - Difficulty breathing or confusion.
  
*You can book an OPD consultation with a General Physician via CivicConnect Hospital Discovery.*`,
  },
  {
    keywords: ['cough', 'cold', 'sore throat', 'sneezing', 'runny nose'],
    priority: 'ROUTINE',
    response: `🍵 **Upper Respiratory Symptoms Guidance**:
- Common cold and seasonal allergic rhinitis are frequently viral or caused by atmospheric particulate matter (PM2.5).
- **Relief Measures**:
  - Warm saline gargles (2-3 times a day).
  - Steam inhalation for nasal congestion.
  - Hydrate with warm liquids (soups, herbal tea).
  - Avoid cold drinks and direct exposure to heavy smog.
- **Consult a Doctor if**:
  - Cough persists for more than 2 weeks.
  - Sputum contains blood or you experience wheezing/shortness of breath.
  - Accompanied by sustained high fever.`,
  },
  {
    keywords: ['headache', 'migraine', 'head ache'],
    priority: 'MODERATE',
    response: `🧠 **Headache Evaluation**:
- Common causes include tension, stress, dehydration, lack of sleep, or migraine.
- **Self Care**:
  - Rest in a quiet, dark room.
  - Drink 2-3 glasses of water.
  - Apply a cool compress to your forehead.
- **Red Flag Signs (Seek Emergency Care)**:
  - Sudden, explosive headache ("thunderclap" headache).
  - Headache accompanied by neck stiffness, high fever, or confusion.
  - Sudden weakness on one side of the face or body, slurred speech (Signs of Stroke - Call 108 immediately).`,
  },
  {
    keywords: ['diabetes', 'sugar', 'blood sugar', 'metformin', 'insulin'],
    priority: 'CHRONIC',
    response: `🩸 **Diabetes Management Guidance**:
- Healthy target fasting blood glucose: 80–130 mg/dL; postprandial: < 180 mg/dL (individual targets may vary).
- **Hypoglycemia Alert (Sugar < 70 mg/dL)**:
  - Symptoms: Trembling, dizziness, sweating, rapid heartbeat.
  - 15-15 Rule: Consume 15 grams of fast-acting sugar (e.g., 3-4 glucose tablets, half cup fruit juice, or 1 tablespoon sugar in water). Recheck in 15 minutes.
- Schedule a quarterly HbA1c review and diabetic foot checkup with an Endocrinologist.`,
  },
  {
    keywords: ['blood', 'donate', 'transfusion', 'blood group'],
    priority: 'INQUIRY',
    response: `🩸 **Blood Donation & Availability Information**:
- Healthy adults aged 18–65 weighing ≥ 45 kg can donate blood every 3 months.
- One unit of donated blood can save up to three lives (red cells, platelets, and plasma).
- Use the **CivicConnect Blood Bank Discovery** module to search real-time verified blood units by group (A+, B+, O+, AB+, etc.) across registered government and NGO blood banks in your vicinity.`,
  },
  {
    keywords: ['ambulance', 'emergency transport', '108', 'accident'],
    priority: 'EMERGENCY',
    response: `🚑 **Emergency Ambulance Transit**:
- For immediate critical transit, call **108** (National Emergency Ambulance Service) or **112**.
- You can also request verified Advanced Life Support (ALS) or Basic Life Support (BLS) ambulances directly using the **CivicConnect Ambulance Assistance** module in your dashboard, with GPS driver tracking and instant hospital notification.`,
  },
];

const DEFAULT_GUIDANCE = `Hello! I am **CivicConnect Health Advisor**, an informational civic healthcare assistant.

Here is how I can assist you:
1. **Symptom Awareness**: Ask about common symptoms like fever, cough, chest discomfort, or headache.
2. **Facility Discovery**: Directing you to nearby government or private hospitals, emergency trauma units, and OPD clinics.
3. **Blood & Pharmacy**: Guiding you to locate verified blood units or search essential medicines in your city.
4. **Government Schemes**: Explaining benefits and eligibility for Ayushman Bharat (PM-JAY), CGHS, and state health funds.

> ⚠️ **Medical Disclaimer**: I provide evidence-based informational guidance for civic awareness only. I cannot replace an in-person clinical examination by a certified physician. In any acute or life-threatening situation, immediately call **108 / 112** or visit the nearest emergency trauma center.`;

/**
 * Handle AI conversational query with fallback
 */
async function getHealthcareAssistance(userPrompt, conversationHistory = []) {
  const queryLower = (userPrompt || '').toLowerCase();

  // 1. Try Gemini API if key is configured
  if (GEMINI_API_KEY) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are CivicConnect Health Advisor, a certified healthcare informational assistant designed for Indian citizens.
Guidelines:
1. Emphasize that you are an informational guide and not a substitute for a licensed medical doctor.
2. If the user mentions red-flag emergency symptoms (chest pain, stroke, unconsciousness, severe bleeding), immediately advise calling 108/112 or visiting the nearest hospital emergency room.
3. Offer practical, evidence-based health hygiene and OPD referral guidance.
4. Keep answers concise, empathetic, and formatted with clean bullet points.

User Query: "${userPrompt}"`,
                },
              ],
            },
          ],
        },
        { timeout: 6000 }
      );

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        return {
          response: generatedText,
          model: 'gemini-1.5-flash',
          isLiveAi: true,
          disclaimer: 'Informational only. In an emergency, dial 108/112 immediately.',
        };
      }
    } catch (err) {
      console.warn('[Gemini AI] Upstream request failed, switching to deterministic clinical knowledge base:', err.message);
    }
  }

  // 2. Deterministic Healthcare Knowledge Engine Fallback
  for (const rule of ADVISORY_RULES) {
    if (rule.keywords.some(k => queryLower.includes(k))) {
      return {
        response: rule.response,
        model: 'CivicConnect-Clinical-Rule-Engine',
        isLiveAi: false,
        priority: rule.priority,
        disclaimer: 'Informational only. For severe or persistent symptoms, please consult a certified doctor.',
      };
    }
  }

  return {
    response: DEFAULT_GUIDANCE,
    model: 'CivicConnect-Clinical-Rule-Engine',
    isLiveAi: false,
    disclaimer: 'CivicConnect Informational Portal. Not a clinical diagnosis.',
  };
}

module.exports = {
  getHealthcareAssistance,
};
