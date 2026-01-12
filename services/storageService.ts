import { HierarchyNode, LetterType, StoredDocument } from '../types';
import { INITIAL_HIERARCHY, INITIAL_LETTER_TYPES } from '../constants';

const KEYS = {
  HIERARCHY: 'vazir_hierarchy_v1',
  LETTER_TYPES: 'vazir_letter_types_v1',
  DOCUMENTS: 'vazir_documents_v1'
};

export const storageService = {
  // Hierarchy
  getHierarchy: (): HierarchyNode[] => {
    try {
      const data = localStorage.getItem(KEYS.HIERARCHY);
      return data ? JSON.parse(data) : INITIAL_HIERARCHY;
    } catch (e) {
      console.error("Failed to load hierarchy", e);
      return INITIAL_HIERARCHY;
    }
  },
  saveHierarchy: (data: HierarchyNode[]) => {
    localStorage.setItem(KEYS.HIERARCHY, JSON.stringify(data));
  },

  // Letter Types
  getLetterTypes: (): LetterType[] => {
    try {
      const data = localStorage.getItem(KEYS.LETTER_TYPES);
      return data ? JSON.parse(data) : INITIAL_LETTER_TYPES;
    } catch (e) {
      console.error("Failed to load letter types", e);
      return INITIAL_LETTER_TYPES;
    }
  },
  saveLetterTypes: (data: LetterType[]) => {
    localStorage.setItem(KEYS.LETTER_TYPES, JSON.stringify(data));
  },

  // Documents
  getDocuments: (): StoredDocument[] => {
    try {
      const data = localStorage.getItem(KEYS.DOCUMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load documents", e);
      return [];
    }
  },
  saveDocuments: (data: StoredDocument[]) => {
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(data));
  },
  
  // Download as File helper
  downloadDocument: (doc: StoredDocument) => {
    const filename = `${doc.analysis.docType.replace(/\s+/g, '_')}_${new Date(doc.timestamp).toISOString().slice(0,10)}.txt`;
    
    const fileContent = `
XATLAR TAHLILI TIZIMI
------------------------------------------------
ID: ${doc.id}
Sana (Tizimga kiritilgan): ${new Date(doc.timestamp).toLocaleString('uz-UZ')}
Fayl nomi: ${doc.fileName || 'Matn kiritilgan'}
------------------------------------------------
TAHLIL NATIJALARI:

Xat Turi: ${doc.analysis.docType} (Ishonch: ${doc.analysis.docTypeConfidence}%)
Xat Raqami: ${doc.analysis.letterNumber || "Aniqlanmadi"}
Xat Sanasi: ${doc.analysis.letterDate || "Aniqlanmadi"}
Bo'linma: ${doc.analysis.departmentOrigin}
Muhimlik: ${doc.analysis.urgency}
Maxfiylik Xavfi: ${doc.analysis.confidentialityRisk ? 'MAVJUD' : 'Yo\'q'}

Qisqacha Mazmun:
${doc.analysis.summary}

Kalit so'zlar: ${doc.analysis.keyEntities.join(', ')}

Grammatik Xatolar soni: ${doc.analysis.grammarErrors.length}
------------------------------------------------
ASL MATN / MAG'ZI:

${doc.fullContent}
    `.trim();

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
