
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LogoConfig } from "../types";
import { GEMINI_MODEL_NAME } from "../constants";

const configSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    textMain: { type: Type.STRING },
    textSecondary: { type: Type.STRING },
    textTagline: { type: Type.STRING },
    colorMain: { type: Type.STRING },
    colorMainRest: { type: Type.STRING },
    colorSecondary: { type: Type.STRING },
    colorTagline: { type: Type.STRING },
    bgColor: { type: Type.STRING },
    fontFamily: { type: Type.STRING },
    
    // First Letter
    fontSizeMainFirst: { type: Type.NUMBER },
    skewMainFirst: { type: Type.NUMBER },
    xOffsetMainFirst: { type: Type.NUMBER },
    
    // Rest of Name
    fontSizeMainRest: { type: Type.NUMBER },
    skewMainRest: { type: Type.NUMBER },
    xOffsetMainRest: { type: Type.NUMBER },
    letterSpacingMainRest: { type: Type.NUMBER },
    
    // Symbol
    fontSizeSecondary: { type: Type.NUMBER },
    skewSecondary: { type: Type.NUMBER },
    xOffsetSecondary: { type: Type.NUMBER },

    // Tagline
    fontSizeTagline: { type: Type.NUMBER },
    taglineOffset: { type: Type.NUMBER },
    letterSpacingTagline: { type: Type.NUMBER },
    skewTagline: { type: Type.NUMBER },
  },
  required: [
    "textMain", "textSecondary", "textTagline", "colorMain", "colorMainRest",
    "colorSecondary", "colorTagline", "bgColor", "fontFamily",
    "fontSizeMainFirst", "skewMainFirst", "xOffsetMainFirst",
    "fontSizeMainRest", "skewMainRest", "xOffsetMainRest",
    "fontSizeSecondary", "skewSecondary", "xOffsetSecondary",
    "fontSizeTagline", "taglineOffset", "skewTagline"
  ],
};

export const generateLogoModification = async (
  currentConfig: LogoConfig,
  userPrompt: string
): Promise<LogoConfig> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: `Current Logo Configuration: ${JSON.stringify(currentConfig)}.
    User Request: "${userPrompt}".
    
    Instructions:
    1. Update the logo configuration JSON based on the user's request.
    2. "skew..." values are in degrees (e.g. -12 for italic/right lean).
    3. "xOffset..." values determine horizontal position relative to center.
    4. "fontSize..." determines size.
    5. Keep the "Dimo V" structure unless asked to change text.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: configSchema,
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as LogoConfig;
  }
  
  throw new Error("Failed to generate logo configuration");
};

export const generateLogoVariations = async (
  currentConfig: LogoConfig,
  userPrompt: string,
  count: number = 4
): Promise<LogoConfig[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: `Current Logo Configuration: ${JSON.stringify(currentConfig)}.
    User Request: "${userPrompt}".
    
    Instructions:
    1. Generate exactly ${count} DISTINCT variations.
    2. Vary the fonts, offsets, skews, and sizes to create different layouts.
    3. Ensure "xOffset" values are adjusted if "fontSize" changes to prevent overlapping.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          variations: {
            type: Type.ARRAY,
            items: configSchema,
          },
        },
      },
    },
  });

  if (response.text) {
    const parsed = JSON.parse(response.text);
    if (parsed.variations && Array.isArray(parsed.variations)) {
        return parsed.variations as LogoConfig[];
    }
    if (Array.isArray(parsed)) {
        return parsed as LogoConfig[];
    }
  }
  
  throw new Error("Failed to generate variations");
};
