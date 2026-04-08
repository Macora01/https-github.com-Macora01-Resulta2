import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getFinancialInsights = async (financialData: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza los siguientes datos financieros de la empresa Facore y proporciona 3-4 insights clave, tendencias y recomendaciones estratégicas. Los datos están en formato JSON: ${JSON.stringify(financialData)}. Responde en español y mantén un tono profesional y constructivo.`,
      config: {
        systemInstruction: "Eres un experto asesor financiero senior para una empresa chilena. Tu objetivo es analizar datos de ventas, costos y gastos para identificar oportunidades de mejora y riesgos.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["positive", "negative", "neutral"] }
                },
                required: ["title", "description", "type"]
              }
            },
            summary: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["insights", "summary", "recommendation"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    throw error;
  }
};

export const getForecast = async (financialData: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Basado en los datos históricos de Facore: ${JSON.stringify(financialData)}, predice las Ventas Netas y el Resultado Neto para los próximos 3 meses. Explica brevemente el razonamiento detrás de la predicción.`,
      config: {
        systemInstruction: "Eres un analista predictivo financiero. Utiliza tendencias históricas y estacionalidad para proyectar resultados futuros.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING },
                  predictedVentas: { type: Type.NUMBER },
                  predictedResultado: { type: Type.NUMBER }
                },
                required: ["month", "predictedVentas", "predictedResultado"]
              }
            },
            reasoning: { type: Type.STRING }
          },
          required: ["projections", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching AI forecast:", error);
    throw error;
  }
};

export const askFinancialQuestion = async (financialData: any[], question: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Pregunta del usuario: "${question}". Datos financieros de referencia: ${JSON.stringify(financialData)}. Responde de forma concisa y basada estrictamente en los datos proporcionados.`,
      config: {
        systemInstruction: "Eres un asistente financiero inteligente. Responde preguntas sobre los datos de la empresa Facore de manera clara y precisa."
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error asking AI question:", error);
    throw error;
  }
};
