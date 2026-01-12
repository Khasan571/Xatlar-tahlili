import { GoogleGenAI, Type } from "@google/genai";
import { HierarchyNode, LetterType, AnalysisResult } from '../types';

const flattenHierarchy = (nodes: HierarchyNode[]): string[] => {
  let list: string[] = [];
  nodes.forEach(node => {
    const desc = node.description ? ` | Tasks: ${node.description}` : '';
    list.push(`${node.type}: ${node.name}${desc}`);
    if (node.children) {
      list = [...list, ...flattenHierarchy(node.children)];
    }
  });
  return list;
};

export const analyzeDocument = async (
  content: string | File, 
  hierarchy: HierarchyNode[], 
  letterTypes: LetterType[],
  userSelectedDepartment?: string
): Promise<AnalysisResult> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  const availableTypes = letterTypes.map(t => t.name).join(", ");
  const departments = flattenHierarchy(hierarchy).join("; ");

  let promptText = `
    You are an AI assistant for the Ministry of Higher Education, Science and Innovations of Uzbekistan.
    Your task is to analyze an official document (letter).
    
    Current Ministry Structure: [${departments}]
    Allowed Letter Types: [${availableTypes}]
  `;

  if (userSelectedDepartment) {
    promptText += `\nIMPORTANT CONTEXT: The user has manually indicated that this document originates from or belongs to the department: "${userSelectedDepartment}". Give this high weight when determining 'departmentOrigin', but still verify if the content matches.\n`;
  }

  promptText += `
    Analyze the provided document and return a JSON object with:
    1. "docType": Classify the document into one of the Allowed Letter Types.
    2. "docTypeConfidence": Confidence score (0-100).
    3. "departmentOrigin": Infer which department or official likely wrote this based on context/signature.
    4. "letterNumber": Extract the document number/ID if present (e.g., "01-12/345", "No 15"). Return empty string if not found.
    5. "letterDate": Extract the document date if present (e.g., "15.01.2024", "2024 yil 15 yanvar"). Return empty string if not found.
    6. "summary": A concise summary of the letter in Uzbek (max 3 sentences).
    7. "sentiment": One of 'Positive', 'Neutral', 'Negative', 'Urgent'.
    8. "urgency": 'Low', 'Medium', 'High' based on deadlines or tone.
    9. "grammarErrors": An array of objects with "original", "suggestion", "explanation", "type" (Spelling/Grammar/Style). Focus on Uzbek language rules.
    10. "confidentialityRisk": Boolean, true if sensitive data (passport, login, secret stamp) is found.
    11. "keyEntities": List of names, organizations, or dates mentioned.
  `;

  let parts: any[] = [];

  if (typeof content === 'string') {
    parts.push({ text: promptText });
    parts.push({ text: `Document Content:\n${content}` });
  } else {
    // File handling
    const base64Data = await fileToBase64(content);
    parts.push({
      inlineData: {
        mimeType: content.type,
        data: base64Data
      }
    });
    parts.push({ text: promptText });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          docType: { type: Type.STRING },
          docTypeConfidence: { type: Type.NUMBER },
          departmentOrigin: { type: Type.STRING },
          letterNumber: { type: Type.STRING },
          letterDate: { type: Type.STRING },
          summary: { type: Type.STRING },
          sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative', 'Urgent'] },
          urgency: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
          grammarErrors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                explanation: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['Spelling', 'Grammar', 'Style'] }
              }
            }
          },
          confidentialityRisk: { type: Type.BOOLEAN },
          keyEntities: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const resultText = response.text || "{}";
  return JSON.parse(resultText) as AnalysisResult;
};

export interface DepartmentAssignment {
  department: string;
  confidence: number;
  role: 'primary' | 'secondary';
}

export interface DepartmentClassification {
  assignments: DepartmentAssignment[];
  reason: string;
}

export const classifyDepartment = async (
  content: string | File,
  hierarchy: HierarchyNode[]
): Promise<DepartmentClassification> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';
  const departments = flattenHierarchy(hierarchy).join("; ");

  const prompt = `
    You are an AI classifier for routing documents inside the Ministry.
    Choose the responsible departments based ONLY on the ministry structure WITH their task descriptions (vazifa va funksiyalari).

    Structure with tasks: [${departments}]

    Return JSON:
    {
      "assignments": [
        {
          "department": "<exact department name from the list>",
          "confidence": <0-100>,
          "role": "primary" | "secondary"
        }
      ],
      "reason": "<short uzbek reasoning and ties if any>"
    }

    Rules:
    - Always return at least 1 department.
    - PRIMARY: bo'lim vazifasi hujjatdagi masalaga bevosita mos bo'lsa. Agar bir nechta teng kuchli bo'lsa (eng yuqori ishonchdan 5 punkt ichida) — ularning barchasi primary.
    - SECONDARY: masalaga bilvosita yordam beruvchi yoki qo'llab-quvvatlovchi bo'limlar.
    - Do not invent departments outside the provided list.
  `;

  let parts: any[] = [];
  if (typeof content === 'string') {
    parts.push({ text: prompt });
    parts.push({ text: `Document Content:\n${content}` });
  } else {
    const base64Data = await fileToBase64(content);
    parts.push({
      inlineData: {
        mimeType: content.type,
        data: base64Data
      }
    });
    parts.push({ text: prompt });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          assignments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                department: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                role: { type: Type.STRING, enum: ['primary', 'secondary'] }
              }
            }
          },
          reason: { type: Type.STRING }
        }
      }
    }
  });

  const resultText = response.text || "{}";
  return JSON.parse(resultText) as DepartmentClassification;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data url prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
