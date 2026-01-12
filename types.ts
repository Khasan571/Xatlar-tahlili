export interface HierarchyNode {
  id: string;
  name: string;
  type: 'Ministry' | 'Deputy' | 'Department' | 'Division' | 'Advisor';
  description?: string; // Vazifalar va funksiyalar
  children?: HierarchyNode[];
}

export interface LetterType {
  id: string;
  name: string;
  description: string;
}

export interface GrammarError {
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style';
}

export interface AnalysisResult {
  docType: string;
  docTypeConfidence: number;
  departmentOrigin: string; // The predicted department
  letterNumber?: string; // Extracted letter number (e.g., 01-123)
  letterDate?: string;   // Extracted date (e.g., 20.05.2024)
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Urgent';
  urgency: 'Low' | 'Medium' | 'High';
  grammarErrors: GrammarError[];
  confidentialityRisk: boolean;
  keyEntities: string[]; // Names, dates, places mentioned
}

export interface StoredDocument {
  id: string;
  timestamp: number;
  fileName?: string;
  contentSnippet: string;
  fullContent: string; // Added to store the actual content
  analysis: AnalysisResult;
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';
