import { GoogleGenAI, Type } from "@google/genai";
import { CodeAnalysis } from "../types";

const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const analyzeCodeWithGemini = async (code: string): Promise<CodeAnalysis> => {
  if (!ai) {
    console.warn("API Key missing for Gemini");
    return {
      score: 0,
      suggestions: ["Clé API non configurée. Impossible d'analyser."],
    };
  }

  try {
    const prompt = `
      Tu es un expert en développement web (HTML/CSS/JS). Analyse le code HTML suivant qui est destiné à être hébergé sur une plateforme statique.
      
      Code à analyser :
      \`\`\`html
      ${code.substring(0, 10000)}
      \`\`\`
      
      Tes tâches :
      1. Donne un score de qualité de 0 à 100.
      2. Liste 3 à 5 suggestions concrètes pour améliorer le code (SEO, Accessibilité, Performance, Modernité).
      3. Si possible, génère une version optimisée du code en utilisant des classes utilitaires modernes (style Tailwind CSS si applicable, sinon CSS propre).
      
      Réponds UNIQUEMENT au format JSON suivant.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            optimizedCode: { type: Type.STRING }
          },
          required: ["score", "suggestions"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as CodeAnalysis;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      score: 50,
      suggestions: ["Erreur lors de l'analyse AI. Veuillez réessayer plus tard."],
    };
  }
};
