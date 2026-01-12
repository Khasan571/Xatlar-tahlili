/**
 * Mahalliy matn tahlilchisi - AI ishlatmasdan ishlaydi
 * O'zbek tilida rasmiy hujjatlarni tahlil qilish uchun
 */

import { AnalysisResult } from '../types';

// ============ GRAMMATIK QOIDALAR ============
const grammarRules: { pattern: RegExp; message: string; suggestion: string }[] = [
  // Tinish belgilari
  { pattern: /\s+,/g, message: "Verguldan oldin bo'sh joy", suggestion: "Verguldan oldin bo'sh joy bo'lmasligi kerak" },
  { pattern: /,\S/g, message: "Verguldan keyin bo'sh joy yo'q", suggestion: "Verguldan keyin bo'sh joy qo'ying" },
  { pattern: /\s+\./g, message: "Nuqtadan oldin bo'sh joy", suggestion: "Nuqtadan oldin bo'sh joy bo'lmasligi kerak" },
  { pattern: /\.\S/g, message: "Nuqtadan keyin bo'sh joy yo'q", suggestion: "Nuqtadan keyin bo'sh joy qo'ying" },
  { pattern: /\s{2,}/g, message: "Ortiqcha bo'sh joylar", suggestion: "Faqat bitta bo'sh joy ishlatilishi kerak" },

  // Katta-kichik harf
  { pattern: /^[a-z]/m, message: "Gap kichik harf bilan boshlangan", suggestion: "Gap bosh harf bilan boshlanishi kerak" },
  { pattern: /\. [a-z]/g, message: "Nuqtadan keyin kichik harf", suggestion: "Yangi gap bosh harf bilan boshlanishi kerak" },

  // O'zbek tiliga xos xatolar
  { pattern: /\bshunday qi\b/gi, message: "'shunday qi' - noto'g'ri", suggestion: "'shunday qilib' yoki 'shuning uchun'" },
  { pattern: /\bbilan birga\b/gi, message: "'bilan birga' - ortiqcha", suggestion: "Faqat 'bilan' yetarli" },
  { pattern: /\bva ham\b/gi, message: "'va ham' - ortiqcha", suggestion: "'va' yoki 'ham' dan birini tanlang" },
  { pattern: /\blekin ammo\b/gi, message: "'lekin ammo' - takrorlanish", suggestion: "'lekin' yoki 'ammo' dan birini tanlang" },
  { pattern: /\bagar agar\b/gi, message: "'agar' takrorlangan", suggestion: "Faqat bitta 'agar' ishlatilishi kerak" },

  // Rasmiy hujjat uslubi
  { pattern: /\bmen\b/gi, message: "Rasmiy hujjatda 'men' ishlatilgan", suggestion: "Rasmiy uslubda 'biz' yoki passiv shakl ishlatiladi" },
  { pattern: /\bsiz\b/gi, message: "'siz' ishlatilgan", suggestion: "Rasmiy hujjatda to'liq lavozim nomi ishlatiladi" },
  { pattern: /\!\s*$/gm, message: "Undov belgisi ishlatilgan", suggestion: "Rasmiy hujjatlarda undov belgisi kam ishlatiladi" },

  // So'z tartibidagi xatolar
  { pattern: /\bkerak emas\b/gi, message: "'kerak emas' - noto'g'ri tartib", suggestion: "'shart emas' yoki 'lozim emas'" },
  { pattern: /\bbo'ladi edi\b/gi, message: "'bo'ladi edi' - noto'g'ri", suggestion: "'bo'lar edi'" },

  // Takrorlanishlar
  { pattern: /\b(\w+)\s+\1\b/gi, message: "So'z takrorlangan", suggestion: "Takroriy so'zni olib tashlang" },
];

// ============ IMLO XATOLARI LEKSIKONI ============
const spellingCorrections: { [key: string]: string } = {
  // Keng tarqalgan xatolar
  'malumot': "ma'lumot",
  'masala': "mas'ala",
  'mutaxasis': "mutaxassis",
  'mutahasis': "mutaxassis",
  'rektor': "rektor",
  'prorektor': "prorektor",
  'fakultet': "fakultet",
  'kafedra': "kafedra",
  'talaba': "talaba",
  'oquv': "o'quv",
  'oqituvchi': "o'qituvchi",
  'dastur': "dastur",
  'rejа': "reja",
  'xujjat': "hujjat",
  'xat': "xat",
  'ariza': "ariza",
  'buyruq': "buyruq",
  'qaror': "qaror",
  'bayonnoma': "bayonnoma",
  'shartnoma': "shartnoma",
  'xisob': "hisob",
  'xisobot': "hisobot",
  'moliya': "moliya",
  'byudjet': "byudjet",
  'budget': "byudjet",
  'stipendiya': "stipendiya",
  'imtixon': "imtihon",
  'imtihon': "imtihon",
  'sertifikat': "sertifikat",
  'diplom': "diplom",
  'magistr': "magistr",
  'bakalavriat': "bakalavriat",
  'aspirantura': "aspirantura",
  'doktorantura': "doktorantura",
  'ilmiy': "ilmiy",
  'tadqiqot': "tadqiqot",
  'labaratoriya': "laboratoriya",
  'laboratoriya': "laboratoriya",
  'amaliyot': "amaliyot",
  'mashgulot': "mashg'ulot",
  'seminar': "seminar",
  'konferensiya': "konferensiya",
  'simpozium': "simpozium",
  'respublika': "respublika",
  'vazirlik': "vazirlik",
  'departament': "departament",
  'boshqarma': "boshqarma",
  'muasasa': "muassasa",
  'tashkilot': "tashkilot",

  // Qo'shimchalar bilan
  'bolishi': "bo'lishi",
  'boladi': "bo'ladi",
  'bolgan': "bo'lgan",
  'orinbosari': "o'rinbosari",
  'ozgarish': "o'zgarish",
  'ozgartirish': "o'zgartirish",
};

// ============ HUJJAT TURLARI KLASIFIKATORI ============
const documentTypeKeywords: { [type: string]: string[] } = {
  "Buyruq": ["buyruq", "buyuraman", "bajarilsin", "nazorat", "mas'ul", "muddat"],
  "Qaror": ["qaror", "qaror qilindi", "kelishildi", "tasdiqlandi", "roziman", "qo'llab-quvvatlayman"],
  "Ariza": ["ariza", "iltimos", "so'rayman", "ruxsat", "ijozat", "o'tinch"],
  "Xat": ["xat", "hurmatli", "murojaat", "javob", "xabar", "ma'lum qilamiz", "bildiramiz"],
  "Hisobot": ["hisobot", "natija", "ko'rsatkich", "statistika", "tahlil", "bajarildi", "amalga oshirildi"],
  "Shartnoma": ["shartnoma", "tomonlar", "majburiyat", "to'lov", "muddat", "shartlar", "imzoladilar"],
  "Bayonnoma": ["bayonnoma", "yig'ilish", "majlis", "qatnashdi", "kun tartibi", "qaror qilindi"],
  "Ko'rsatma": ["ko'rsatma", "yo'riqnoma", "tartib", "qoida", "bajarilishi shart"],
  "Taqdimnoma": ["taqdimnoma", "taqdim etiladi", "ko'rib chiqish", "taklif"],
  "Tavsiyanoma": ["tavsiyanoma", "tavsiya", "ijobiy", "munosib", "loyiq"],
};

// ============ DOLZARBLIK ANIQLASH ============
const urgencyKeywords = {
  High: ["shoshilinch", "zudlik bilan", "darhol", "bugun", "kechiktirmasdan", "favqulodda", "muhim", "zarur"],
  Medium: ["yaqin kunlarda", "tez orada", "imkon qadar", "bir hafta ichida", "belgilangan muddatda"],
  Low: ["reja asosida", "navbatdagi", "rejalashtirilgan", "keyingi", "imkoniyat bo'lganda"]
};

// ============ BO'LIMLAR ============
const departmentKeywords: { [dept: string]: string[] } = {
  "Ta'lim sifati": ["sifat", "monitoring", "nazorat", "baholash", "reyting", "akkreditatsiya"],
  "O'quv-uslubiy": ["o'quv reja", "dastur", "fanlar", "kredit", "modul", "sillabus"],
  "Ilmiy": ["ilmiy", "tadqiqot", "maqola", "dissertatsiya", "grant", "innovatsiya"],
  "Moliya": ["moliya", "byudjet", "to'lov", "stipendiya", "maosh", "xarajat"],
  "Kadrlar": ["kadr", "ishga qabul", "attestatsiya", "malaka oshirish", "lavozim"],
  "Talabalar": ["talaba", "o'quvchi", "stipendiya", "turar joy", "yotoqxona"],
  "Xalqaro": ["xalqaro", "chet el", "hamkorlik", "grant", "dastur", "almashinuv"],
};

// ============ ASOSIY TAHLIL FUNKSIYASI ============
export function analyzeText(text: string): AnalysisResult {
  const errors: { text: string; suggestion: string; position: number }[] = [];

  // 1. Grammatik xatolarni tekshirish
  grammarRules.forEach(rule => {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      errors.push({
        text: rule.message,
        suggestion: rule.suggestion,
        position: match.index
      });
    }
  });

  // 2. Imlo xatolarini tekshirish
  const words = text.toLowerCase().split(/\s+/);
  words.forEach((word, index) => {
    const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
    if (spellingCorrections[cleanWord]) {
      const position = text.toLowerCase().indexOf(cleanWord);
      errors.push({
        text: `"${cleanWord}" - imlo xatosi`,
        suggestion: `To'g'ri yozilishi: "${spellingCorrections[cleanWord]}"`,
        position
      });
    }
  });

  // 3. Hujjat turini aniqlash
  const docType = detectDocumentType(text);

  // 4. Dolzarblik darajasini aniqlash
  const urgency = detectUrgency(text);

  // 5. Bo'limni aniqlash
  const department = detectDepartment(text);

  // 6. Qisqa mazmun yaratish
  const summary = generateSummary(text);

  // 7. Mavzularni ajratish
  const topics = extractTopics(text);

  // 8. Kalit so'zlar
  const keywords = extractKeywords(text);

  // 9. Statistika
  const stats = calculateStats(text);

  // Xat raqami va sanasini topish
  const letterNumber = extractLetterNumber(text);
  const letterDate = extractLetterDate(text);

  // Maxfiylik xavfini aniqlash
  const confidentialityRisk = detectConfidentialityRisk(text);

  // Kayfiyatni aniqlash
  const sentiment = detectSentiment(text, urgency);

  return {
    docType,
    docTypeConfidence: calculateConfidence(text, errors.length),
    departmentOrigin: department,
    letterNumber,
    letterDate,
    summary,
    sentiment,
    urgency,
    grammarErrors: errors.map(e => ({
      original: e.text,
      suggestion: e.suggestion,
      explanation: e.suggestion,
      type: 'Grammar' as const
    })),
    confidentialityRisk,
    keyEntities: keywords.slice(0, 5)
  };
}

// ============ YORDAMCHI FUNKSIYALAR ============

function detectDocumentType(text: string): string {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let detectedType = "Xat";

  for (const [type, keywords] of Object.entries(documentTypeKeywords)) {
    let score = 0;
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score += 1;
      }
    });
    if (score > maxScore) {
      maxScore = score;
      detectedType = type;
    }
  }

  return detectedType;
}

function detectUrgency(text: string): "High" | "Medium" | "Low" {
  const lowerText = text.toLowerCase();

  for (const keyword of urgencyKeywords.High) {
    if (lowerText.includes(keyword)) return "High";
  }
  for (const keyword of urgencyKeywords.Medium) {
    if (lowerText.includes(keyword)) return "Medium";
  }

  return "Low";
}

function detectDepartment(text: string): string {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let detectedDept = "Umumiy";

  for (const [dept, keywords] of Object.entries(departmentKeywords)) {
    let score = 0;
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 1;
    });
    if (score > maxScore) {
      maxScore = score;
      detectedDept = dept;
    }
  }

  return detectedDept;
}

function generateSummary(text: string): string {
  // Birinchi 2-3 ta gapni olish
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length === 0) return text.slice(0, 150) + "...";

  const summary = sentences.slice(0, 2).join(". ").trim();
  return summary.length > 200 ? summary.slice(0, 200) + "..." : summary + ".";
}

function extractTopics(text: string): string[] {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();

  // Mavzular bo'yicha kalit so'zlar
  const topicPatterns = [
    { keywords: ["ta'lim", "o'qitish", "dars"], topic: "Ta'lim jarayoni" },
    { keywords: ["moliya", "byudjet", "mablag'"], topic: "Moliyaviy masalalar" },
    { keywords: ["kadr", "xodim", "ishchi"], topic: "Kadrlar masalasi" },
    { keywords: ["talaba", "o'quvchi"], topic: "Talabalar bilan ishlash" },
    { keywords: ["ilmiy", "tadqiqot"], topic: "Ilmiy faoliyat" },
    { keywords: ["xalqaro", "chet el"], topic: "Xalqaro hamkorlik" },
    { keywords: ["nazorat", "tekshirish"], topic: "Nazorat va monitoring" },
    { keywords: ["reja", "dastur"], topic: "Rejalashtirish" },
  ];

  topicPatterns.forEach(({ keywords, topic }) => {
    if (keywords.some(k => lowerText.includes(k))) {
      topics.push(topic);
    }
  });

  return topics.length > 0 ? topics : ["Umumiy masalalar"];
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[.,!?;:'"()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);

  // So'zlar chastotasi
  const frequency: { [word: string]: number } = {};
  words.forEach(word => {
    // Stop so'zlarni o'tkazib yuborish
    const stopWords = ['bilan', 'uchun', 'kerak', 'bo\'lgan', 'qilib', 'asosida', 'bo\'yicha', 'hamda', 'shuningdek'];
    if (!stopWords.includes(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });

  // Eng ko'p uchraganlarni olish
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function calculateStats(text: string): { words: number; sentences: number; paragraphs: number } {
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  return { words, sentences, paragraphs };
}

function calculateConfidence(text: string, errorCount: number): number {
  // Matn uzunligi va xatolar soni asosida ishonch darajasi
  const textLength = text.length;
  let confidence = 85;

  // Matn qanchalik uzun bo'lsa, ishonch shunchalik yuqori
  if (textLength > 500) confidence += 5;
  if (textLength > 1000) confidence += 5;

  // Xatolar ko'p bo'lsa, ishonch pasayadi
  confidence -= Math.min(errorCount * 2, 20);

  return Math.max(50, Math.min(95, confidence));
}

function extractLetterNumber(text: string): string | undefined {
  // Xat raqami formatlar: 01-123, №123, No.123, 12/34-56
  const patterns = [
    /№\s*(\d+[\-\/]?\d*)/i,
    /No\.?\s*(\d+[\-\/]?\d*)/i,
    /(\d{1,2}[\-\/]\d{2,4}[\-\/]?\d*)/,
    /raqam[i]?\s*[:.]?\s*(\d+[\-\/]?\d*)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] || match[0];
  }
  return undefined;
}

function extractLetterDate(text: string): string | undefined {
  // Sana formatlari: 20.05.2024, 20/05/2024, 2024-05-20, 20 may 2024
  const patterns = [
    /(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4})/,
    /(\d{4}[\-\.]\d{1,2}[\-\.]\d{1,2})/,
    /(\d{1,2})\s*(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)\s*(\d{4})/i,
    /sana[si]?\s*[:.]?\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return undefined;
}

function detectConfidentialityRisk(text: string): boolean {
  const sensitiveKeywords = [
    'maxfiy', 'sir', 'shaxsiy', 'parol', 'kalit', 'raqam',
    'pasport', 'telefon', 'manzil', 'bank', 'hisob raqami',
    'ish haqi', 'maosh', 'soliq', 'jarima', 'sud', 'jinoyat',
    'tergov', 'tekshiruv', 'nazorat', 'buzilish', 'qoidabuzarlik'
  ];

  const lowerText = text.toLowerCase();
  return sensitiveKeywords.some(keyword => lowerText.includes(keyword));
}

function detectSentiment(text: string, urgency: "High" | "Medium" | "Low"): 'Positive' | 'Neutral' | 'Negative' | 'Urgent' {
  if (urgency === 'High') return 'Urgent';

  const lowerText = text.toLowerCase();

  const positiveWords = ['muvaffaqiyat', 'ijobiy', 'yaxshi', 'ajoyib', 'rivojlanish', 'yutuq', 'tabriklash', 'rahmat', 'minnatdor'];
  const negativeWords = ['muammo', 'kamchilik', 'xato', 'buzilish', 'shikoyat', 'norozilik', 'jarima', 'jazo', 'ogohlantirish'];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });

  if (positiveScore > negativeScore) return 'Positive';
  if (negativeScore > positiveScore) return 'Negative';
  return 'Neutral';
}

// ============ MATN TUZATISH FUNKSIYASI ============
export function correctText(text: string): string {
  let corrected = text;

  // Imlo xatolarini tuzatish
  for (const [wrong, right] of Object.entries(spellingCorrections)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    corrected = corrected.replace(regex, right);
  }

  // Bo'sh joylarni tuzatish
  corrected = corrected.replace(/\s+,/g, ',');
  corrected = corrected.replace(/,(\S)/g, ', $1');
  corrected = corrected.replace(/\s+\./g, '.');
  corrected = corrected.replace(/\.(\S)/g, '. $1');
  corrected = corrected.replace(/\s{2,}/g, ' ');

  // Bosh harflarni tuzatish
  corrected = corrected.replace(/^([a-z])/gm, (_, char) => char.toUpperCase());
  corrected = corrected.replace(/\. ([a-z])/g, (_, char) => '. ' + char.toUpperCase());

  return corrected;
}

export default { analyzeText, correctText };
