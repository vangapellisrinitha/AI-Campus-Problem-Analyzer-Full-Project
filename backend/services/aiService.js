// Allowed categories matching project requirements
const ALLOWED_CATEGORIES = [
  'Classroom',
  'Laboratory',
  'Hostel',
  'Wi-Fi / Network',
  'Electrical',
  'Cleanliness',
  'Infrastructure',
  'Transportation',
  'Other'
];

// Allowed priority levels
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Builds the structured prompt for the AI model
 */
const buildPrompt = (description, campusLocation, userCategory) => {
  return `You are an expert AI Campus Problem Analyzer for a university.
Analyze the following student complaint and return a strictly structured JSON analysis.

Student Complaint Details:
- Description: "${description}"
- Campus Location: "${campusLocation}"
- User-Selected Category: "${userCategory}"

You MUST respond with ONLY a valid, raw JSON object. Do NOT include markdown code blocks, backticks, or conversational text.

Required JSON Structure:
{
  "category": "One of: Classroom, Laboratory, Hostel, Wi-Fi / Network, Electrical, Cleanliness, Infrastructure, Transportation, Other",
  "priority": "One of: Low, Medium, High, Critical",
  "ai_summary": "A concise one-sentence summary of the problem (max 25 words)",
  "responsible_department": "The university department responsible for fixing this (e.g., IT / Network Support, Electrical Maintenance, Hostel Administration, Facilities & Estate Office, Transportation Department, Housekeeping / Sanitation, Laboratory In-Charge)",
  "recommended_action": "Specific and actionable step for the department to take"
}

Priority Guidelines:
- Critical: Imminent safety hazards, electrical sparks, widespread power/water outages, major health dangers.
- High: Severe disruption to classes, laboratory sessions, examinations, or living conditions (e.g., Wi-Fi down in hostel for days).
- Medium: Functional disruption affecting equipment, cleanliness, or room comfort that requires timely maintenance.
- Low: Minor cosmetic defects, non-urgent maintenance, or aesthetic suggestions.`;
};

/**
 * Validates and normalizes the parsed AI response
 */
const validateAiResponse = (parsed, fallbackCategory) => {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response is not a valid JSON object.');
  }

  // Validate category
  let category = ALLOWED_CATEGORIES.find(
    (cat) => cat.toLowerCase() === (parsed.category || '').toLowerCase()
  );
  if (!category) {
    // Fall back to student category or 'Other'
    category = ALLOWED_CATEGORIES.includes(fallbackCategory) ? fallbackCategory : 'Other';
  }

  // Validate priority
  let priority = ALLOWED_PRIORITIES.find(
    (p) => p.toLowerCase() === (parsed.priority || '').toLowerCase()
  );
  if (!priority) {
    priority = 'Medium'; // Sensible default if AI priority is missing or malformed
  }

  // Validate summary
  const ai_summary = typeof parsed.ai_summary === 'string' && parsed.ai_summary.trim().length > 0
    ? parsed.ai_summary.trim()
    : 'Issue reported and registered for campus review.';

  // Validate responsible department
  const responsible_department = typeof parsed.responsible_department === 'string' && parsed.responsible_department.trim().length > 0
    ? parsed.responsible_department.trim()
    : 'Campus Administration';

  // Validate recommended action
  const recommended_action = typeof parsed.recommended_action === 'string' && parsed.recommended_action.trim().length > 0
    ? parsed.recommended_action.trim()
    : 'Inspect location and assign maintenance personnel.';

  return {
    category,
    priority,
    ai_summary,
    responsible_department,
    recommended_action
  };
};

/**
 * Safely parses raw JSON text returned by the AI model
 */
const parseAiJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty AI response received.');
  }

  // Strip markdown code fences if present (e.g. ```json ... ```)
  let cleanText = rawText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  return JSON.parse(cleanText);
};

/**
 * Call Google Gemini API using native fetch
 */
const callGeminiApi = async (apiKey, model, prompt) => {
  const modelName = model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API returned status ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API did not return any candidate text.');
  }

  return text;
};

/**
 * Call OpenAI or generic OpenAI-compatible API using native fetch
 */
const callOpenAiApi = async (apiKey, model, apiUrl, prompt) => {
  const modelName = model || 'gpt-4o-mini';
  const endpoint = apiUrl ? `${apiUrl.replace(/\/+$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an AI Campus Problem Analyzer. You respond exclusively with raw valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI API returned status ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('AI API did not return message content.');
  }

  return text;
};

/**
 * Analyze a student complaint using the configured AI provider
 *
 * @param {Object} complaintDetails
 * @param {string} complaintDetails.description
 * @param {string} complaintDetails.campusLocation
 * @param {string} complaintDetails.category
 * @returns {Promise<{success: boolean, data?: Object, error?: string, reason?: string}>}
 */
const analyzeComplaint = async ({ description, campusLocation, category }) => {
  // Read configuration from environment variables
  const apiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const provider = (process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'gemini')).toLowerCase().trim();
  const model = (process.env.AI_MODEL || '').trim();
  const apiUrl = (process.env.AI_API_URL || '').trim();

  // If no API key is configured, return safe error response without failing the complaint
  if (!apiKey) {
    console.log('[AI Service] No AI_API_KEY configured. Skipping automated AI analysis.');
    return {
      success: false,
      reason: 'AI_KEY_NOT_CONFIGURED',
      error: 'AI_API_KEY is not configured in backend/.env.'
    };
  }

  try {
    const prompt = buildPrompt(description, campusLocation, category);
    let rawResponseText = '';

    if (provider === 'openai') {
      rawResponseText = await callOpenAiApi(apiKey, model, apiUrl, prompt);
    } else {
      // Default to Google Gemini
      rawResponseText = await callGeminiApi(apiKey, model, prompt);
    }

    const parsedJson = parseAiJson(rawResponseText);
    const validatedData = validateAiResponse(parsedJson, category);

    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    // Never print the API key to console logs
    console.error('[AI Service Error]:', error.message || error);
    return {
      success: false,
      reason: 'AI_ANALYSIS_FAILED',
      error: error.message || 'Failed to complete AI analysis.'
    };
  }
};

module.exports = {
  analyzeComplaint,
  validateAiResponse,
  parseAiJson,
  ALLOWED_CATEGORIES,
  ALLOWED_PRIORITIES
};
