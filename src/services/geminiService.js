const { ai } = require('../config/google');

const analyzeEmailContent = async (snippet) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Identify key action items and summarize the following email snippet:\n\n"${snippet}"`
    });
    return response.text;
  } catch (error) {
    console.error('Gemini Service Failure:', error);
    throw new Error('AI analysis processing failed.');
  }
};

module.exports = { analyzeEmailContent };
