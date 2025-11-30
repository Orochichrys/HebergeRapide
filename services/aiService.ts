import OpenAI from 'openai';
import { CodeAnalysis } from '../types';

let client: OpenAI | null = null;

export const initAI = (apiKey: string) => {
  const key = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) return;

  client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: key,
    dangerouslyAllowBrowser: true
  });
};

// Analyse de code avec Grok
export const analyzeCodeWithGemini = async (code: string): Promise<CodeAnalysis> => {
  if (!client) {
    console.warn('OpenRouter API key not initialized');
    return {
      score: 0,
      suggestions: ['Clé API non configurée. Impossible d\'analyser.'],
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: 'x-ai/grok-4.1-fast:free',
      messages: [
        {
          role: 'system',
          content: 'You are an expert web developer. Analyze HTML code and provide quality scores and suggestions. Return ONLY valid JSON.'
        },
        {
          role: 'user',
          content: `Analyze this HTML code and respond with ONLY a JSON object:

Code to analyze:
\`\`\`html
${code.substring(0, 10000)}
\`\`\`

Respond with this exact JSON structure:
{
  "score": <number from 0 to 100>,
  "suggestions": [<array of 3-5 concrete suggestions in French for SEO, Accessibility, Performance, Modernity>],
  "optimizedCode": "<optional optimized version of the code>"
}

Return ONLY the JSON object, nothing else.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      score: result.score || 50,
      suggestions: result.suggestions || ['Analyse terminée'],
      optimizedCode: result.optimizedCode
    };

  } catch (error) {
    console.error('Grok Analysis Error:', error);
    return {
      score: 50,
      suggestions: ['Erreur lors de l\'analyse IA. Veuillez réessayer plus tard.'],
    };
  }
};

// Génération de site web avec Grok
export const generateWebsite = async (prompt: string): Promise<string> => {
  if (!client) {
    throw new Error('OpenRouter API key not initialized');
  }

  const response = await client.chat.completions.create({
    model: 'x-ai/grok-4.1-fast:free',
    messages: [
      {
        role: 'system',
        content: 'You are an expert web developer. Generate clean, modern, and responsive HTML code. Include inline CSS and JavaScript when needed. Return ONLY the HTML code without any markdown formatting or explanations.'
      },
      {
        role: 'user',
        content: `Create a complete, production-ready website for: ${prompt}

Requirements:
- Complete HTML document with proper structure
- Inline CSS for styling (modern, professional design)
- Inline JavaScript for interactivity if needed
- Responsive design
- No external dependencies
- Return ONLY the HTML code, no explanations, no markdown code blocks`
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  let htmlContent = response.choices[0]?.message?.content || '';

  // Clean up markdown code blocks if present
  htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

  return htmlContent;
};
