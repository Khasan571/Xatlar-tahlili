// Test ma'lumotlarni bazaga qo'shish uchun script
// Ishlatish: node server/seed-test-data.js

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data.db');
const db = new Database(dbPath);

const testDocuments = [
  {
    id: "test-001",
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 soat oldin
    fileName: "xat-01-2025.pdf",
    contentSnippet: "Oliy ta'lim muassasalarida 2024-2025 o'quv yili uchun qabul kvotalarini...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 01-15/234
Sana: 10.01.2025

Barcha oliy ta'lim muassasalari rektorlariga

Mavzu: 2024-2025 o'quv yili uchun qabul kvotalari to'g'risida

Hurmatli rektorlar!

Mazkur xat orqali 2024-2025 o'quv yili uchun qabul kvotalarini tasdiqlash va tegishli hujjatlarni taqdim etish zarurligini ma'lum qilamiz.

Quyidagi talablarni bajarishingizni so'raymiz:
1. Har bir yo'nalish bo'yicha qabul kvotasini aniqlash
2. Professor-o'qituvchilar tarkibini tahlil qilish
3. Moddiy-texnik bazani baholash

Javob muddati: 2025-yil 20-yanvarga qadar

Hurmat bilan,
Qabul jarayonlari va akademik mobillik bo'limi boshlig'i`,
    analysis: {
      docType: "Qabul jarayonlari",
      docTypeConfidence: 95,
      departmentOrigin: "Qabul jarayonlari va akademik mobillik bo'limi",
      letterNumber: "01-15/234",
      letterDate: "10.01.2025",
      summary: "2024-2025 o'quv yili uchun qabul kvotalarini tasdiqlash va hujjatlar taqdim etish haqida xat",
      sentiment: "Neutral",
      urgency: "Medium",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["2024-2025 o'quv yili", "qabul kvotalari", "rektorlar"]
    }
  },
  {
    id: "test-002",
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 soat oldin
    fileName: "stipendiya-xat.pdf",
    contentSnippet: "Talabalar stipendiyasini o'z vaqtida to'lash bo'yicha shoshilinch...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 02-08/567
Sana: 09.01.2025

SHOSHILINCH

Barcha oliy ta'lim muassasalari moliya bo'limlariga

Mavzu: Stipendiya to'lovlarini kechiktirmaslik haqida

Hurmatli hamkasblar!

So'nggi paytlarda ayrim oliy ta'lim muassasalarida talabalar stipendiyasi o'z vaqtida to'lanmayotgani aniqlandi. Bu holat talabalar ijtimoiy ahvolini yomonlashtirmoqda.

TALABLAR:
1. Yanvar oyi stipendiyasini 15-yanvargacha to'liq to'lash
2. Kechikish sabablari bo'yicha tushuntirish xati yuborish
3. To'lov jadvalini yangilash

Mas'ul: Buxgalteriya hisobi va hisoboti bo'limi

Vazir o'rinbosari`,
    analysis: {
      docType: "Stipendiya va Ish haqi",
      docTypeConfidence: 98,
      departmentOrigin: "Buxgalteriya hisobi va hisoboti bo'limi",
      letterNumber: "02-08/567",
      letterDate: "09.01.2025",
      summary: "Talabalar stipendiyasini o'z vaqtida to'lash bo'yicha shoshilinch xat",
      sentiment: "Urgent",
      urgency: "High",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["stipendiya", "yanvar oyi", "15-yanvar", "moliya bo'limi"]
    }
  },
  {
    id: "test-003",
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 kun oldin
    fileName: "ilmiy-konferensiya.pdf",
    contentSnippet: "Xalqaro ilmiy-amaliy konferensiya o'tkazish to'g'risida...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 03-22/891
Sana: 08.01.2025

Barcha oliy ta'lim muassasalari ilmiy bo'limlariga

Mavzu: "Innovatsion texnologiyalar va fan" xalqaro konferensiyasi haqida

Hurmatli hamkasblar!

2025-yil 15-20 fevral kunlari Toshkent shahridagi Mirzo Ulug'bek nomidagi O'zbekiston Milliy universitetida "Innovatsion texnologiyalar va fan" mavzusida xalqaro ilmiy-amaliy konferensiya o'tkaziladi.

Konferensiya yo'nalishlari:
- Sun'iy intellekt va ma'lumotlar tahlili
- Yashil energetika
- Biotexnologiya
- Raqamli iqtisodiyot

Maqolalar qabul qilish muddati: 2025-yil 1-fevral

Fan va innovatsion faoliyatni rivojlantirish boshqarmasi`,
    analysis: {
      docType: "Xalqaro konferensiyalar",
      docTypeConfidence: 96,
      departmentOrigin: "Fan va innovatsion faoliyatni rivojlantirish boshqarmasi",
      letterNumber: "03-22/891",
      letterDate: "08.01.2025",
      summary: "Xalqaro ilmiy-amaliy konferensiya o'tkazish va maqolalar qabul qilish haqida",
      sentiment: "Positive",
      urgency: "Medium",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["xalqaro konferensiya", "15-20 fevral", "O'zMU", "innovatsion texnologiyalar"]
    }
  },
  {
    id: "test-004",
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 kun oldin
    fileName: "hemis-tizimi.pdf",
    contentSnippet: "HEMIS tizimiga ma'lumotlarni to'liq kiritish bo'yicha...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 04-11/123
Sana: 07.01.2025

Barcha oliy ta'lim muassasalari IT bo'limlariga

Mavzu: HEMIS tizimiga ma'lumotlar kiritish muddatlari

Hurmatli mutaxassislar!

HEMIS tizimiga 2024-2025 o'quv yili uchun quyidagi ma'lumotlarni kiritish muddatlari belgilandi:

1. Talabalar kontingenti - 15-yanvargacha
2. Professor-o'qituvchilar ma'lumotlari - 20-yanvargacha
3. O'quv rejalari - 25-yanvargacha
4. Dars jadvallari - 30-yanvargacha

Kiritilgan ma'lumotlar to'g'riligi uchun rektor javobgar.

Raqamlashtirish va sun'iy intellekt texnologiyalarini joriy etish boshqarmasi`,
    analysis: {
      docType: "HEMIS tizimi",
      docTypeConfidence: 99,
      departmentOrigin: "Raqamlashtirish va sun'iy intellekt texnologiyalarini joriy etish boshqarmasi",
      letterNumber: "04-11/123",
      letterDate: "07.01.2025",
      summary: "HEMIS tizimiga ma'lumotlarni belgilangan muddatlarda kiritish haqida ko'rsatma",
      sentiment: "Neutral",
      urgency: "Medium",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["HEMIS", "talabalar kontingenti", "o'quv rejalari", "yanvar"]
    }
  },
  {
    id: "test-005",
    timestamp: Date.now() - 1000 * 60 * 60 * 72, // 3 kun oldin
    fileName: "korrupsiya-profilaktika.pdf",
    contentSnippet: "Korrupsiyaga qarshi kurashish bo'yicha chora-tadbirlar...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 05-03/456
Sana: 06.01.2025

MAXFIY

Barcha oliy ta'lim muassasalari rektorlariga

Mavzu: Korrupsiyaviy xavflarni oldini olish chora-tadbirlari

Hurmatli rektorlar!

2024-yilda o'tkazilgan tekshiruvlar natijasida ayrim oliy ta'lim muassasalarida korrupsiyaviy holatlar aniqlandi. Bunday holatlarning oldini olish maqsadida:

1. Ichki nazorat tizimini kuchaytirish
2. Xodimlar bilan profilaktik suhbatlar o'tkazish
3. Davlat xaridlari shaffofligini ta'minlash
4. Anonim murojaat tizimini joriy etish

Chorak oxiriga qadar hisobot talab etiladi.

Korrupsiyaga qarshi kurashish bo'limi`,
    analysis: {
      docType: "Korrupsiyaga qarshi kurash",
      docTypeConfidence: 97,
      departmentOrigin: "Korrupsiyaga qarshi kurashish bo'limi",
      letterNumber: "05-03/456",
      letterDate: "06.01.2025",
      summary: "Korrupsiyaviy xavflarni oldini olish va ichki nazoratni kuchaytirish haqida maxfiy xat",
      sentiment: "Negative",
      urgency: "High",
      grammarErrors: [],
      confidentialityRisk: true,
      keyEntities: ["korrupsiya", "ichki nazorat", "davlat xaridlari", "tekshiruv"]
    }
  },
  {
    id: "test-006",
    timestamp: Date.now() - 1000 * 60 * 60 * 96, // 4 kun oldin
    fileName: "talaba-turar-joyi.pdf",
    contentSnippet: "Talabalar turar joylarida sharoitlarni yaxshilash...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 06-17/789
Sana: 05.01.2025

Barcha oliy ta'lim muassasalari rektorlariga

Mavzu: Talabalar turar joylarida qishki sharoitlarni ta'minlash

Hurmatli rektorlar!

Qish mavsumi boshlanishi munosabati bilan talabalar turar joylarida (TTJ) quyidagi chora-tadbirlarni amalga oshirishni so'raymiz:

1. Isitish tizimlarini to'liq ishga tushirish
2. Derazalarni izolyatsiya qilish
3. Issiq suv ta'minotini uzluksiz ta'minlash
4. Sanitariya-gigiyena shartlariga rioya etilishini nazorat qilish

Muddat: Doimiy nazorat

Yoshlar siyosati va ma'naviy-ma'rifiy ishlar boshqarmasi`,
    analysis: {
      docType: "Talabalar turar joyi (TTJ)",
      docTypeConfidence: 94,
      departmentOrigin: "Yoshlar siyosati va ma'naviy-ma'rifiy ishlar boshqarmasi",
      letterNumber: "06-17/789",
      letterDate: "05.01.2025",
      summary: "Talabalar turar joylarida qishki mavsumda sharoitlarni yaxshilash haqida",
      sentiment: "Neutral",
      urgency: "Medium",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["TTJ", "qish mavsumi", "isitish tizimi", "sanitariya"]
    }
  },
  {
    id: "test-007",
    timestamp: Date.now() - 1000 * 60 * 60 * 120, // 5 kun oldin
    fileName: "grant-tanlov.pdf",
    contentSnippet: "Davlat ilmiy grantlari tanlovida ishtirok etish...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 07-25/321
Sana: 04.01.2025

Barcha oliy ta'lim muassasalari ilmiy bo'limlariga

Mavzu: 2025-yil davlat ilmiy grantlari tanlovi

Hurmatli hamkasblar!

2025-yil uchun davlat ilmiy grantlari tanlovi e'lon qilinadi. Tanlov yo'nalishlari:

1. Fundamental tadqiqotlar - 50 ta grant
2. Amaliy tadqiqotlar - 100 ta grant
3. Innovatsion loyihalar - 30 ta grant
4. Yoshlar grantlari - 70 ta grant

Grant hajmi: 100 mln so'mdan 500 mln so'mgacha

Hujjatlar qabul muddati: 2025-yil 1-mart

Fan va innovatsion faoliyatni rivojlantirish boshqarmasi`,
    analysis: {
      docType: "Ilmiy loyihalar va grantlar",
      docTypeConfidence: 98,
      departmentOrigin: "Fan va innovatsion faoliyatni rivojlantirish boshqarmasi",
      letterNumber: "07-25/321",
      letterDate: "04.01.2025",
      summary: "2025-yil davlat ilmiy grantlari tanlovi e'lon qilish va hujjatlar qabul muddatlari",
      sentiment: "Positive",
      urgency: "Low",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["davlat granti", "2025-yil", "fundamental tadqiqotlar", "1-mart"]
    }
  },
  {
    id: "test-008",
    timestamp: Date.now() - 1000 * 60 * 60 * 144, // 6 kun oldin
    fileName: "xorijiy-talabalar.pdf",
    contentSnippet: "Xorijiy talabalarni jalb qilish strategiyasi...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 08-19/654
Sana: 03.01.2025

Xalqaro hamkorlik bo'limlariga

Mavzu: Xorijiy talabalarni jalb qilish ko'rsatkichlari

Hurmatli hamkasblar!

2025-yil uchun xorijiy talabalarni jalb qilish bo'yicha quyidagi maqsadlar belgilandi:

- Hindiston va Pokiston: 500 ta talaba
- Afg'oniston: 200 ta talaba
- Turkiya: 150 ta talaba
- Rossiya: 100 ta talaba
- Boshqa davlatlar: 300 ta talaba

JAMI: 1250 ta xorijiy talaba

Marketing strategiyasini tayyorlash so'raladi.

Xalqaro hamkorlik va reytinglar boshqarmasi`,
    analysis: {
      docType: "Xorijiy talabalar",
      docTypeConfidence: 96,
      departmentOrigin: "Xalqaro hamkorlik va reytinglar boshqarmasi",
      letterNumber: "08-19/654",
      letterDate: "03.01.2025",
      summary: "2025-yil uchun xorijiy talabalarni jalb qilish maqsadlari va strategiyasi",
      sentiment: "Positive",
      urgency: "Low",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["xorijiy talabalar", "Hindiston", "Pokiston", "marketing strategiya"]
    }
  },
  {
    id: "test-009",
    timestamp: Date.now() - 1000 * 60 * 60 * 168, // 7 kun oldin
    fileName: "professor-reyting.pdf",
    contentSnippet: "Professor-o'qituvchilar reytingini aniqlash tartibi...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 09-14/987
Sana: 02.01.2025

Barcha oliy ta'lim muassasalari kadrlar bo'limlariga

Mavzu: Professor-o'qituvchilar reytingini hisoblash metodikasi

Hurmatli hamkasblar!

2025-yildan boshlab professor-o'qituvchilar reytingini hisoblashning yangilangan metodikasi joriy etiladi:

Baholash mezonlari:
1. Dars o'tish sifati - 25%
2. Ilmiy faoliyat - 30%
3. Scopus/WoS maqolalari - 20%
4. Loyihalarda ishtirok - 15%
5. Ijtimoiy faollik - 10%

Reyting natijalari: har chorak oxirida

Inson resurslarini rivojlantirish va boshqarish boshqarmasi`,
    analysis: {
      docType: "Professor-o'qituvchilar reytingi",
      docTypeConfidence: 97,
      departmentOrigin: "Inson resurslarini rivojlantirish va boshqarish boshqarmasi",
      letterNumber: "09-14/987",
      letterDate: "02.01.2025",
      summary: "Professor-o'qituvchilar reytingini hisoblashning yangi metodikasi haqida",
      sentiment: "Neutral",
      urgency: "Low",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["reyting", "metodika", "Scopus", "baholash mezonlari"]
    }
  },
  {
    id: "test-010",
    timestamp: Date.now() - 1000 * 60 * 60 * 192, // 8 kun oldin
    fileName: "olimpiada-natija.pdf",
    contentSnippet: "Fan olimpiadalarida g'olib bo'lgan talabalar...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 10-08/147
Sana: 01.01.2025

Barcha oliy ta'lim muassasalariga

Mavzu: 2024-yil fan olimpiadalari natijalari

Hurmatli hamkasblar!

2024-yil davomida o'tkazilgan xalqaro fan olimpiadalarida O'zbekiston talabalari yuqori natijalar ko'rsatdi:

Matematika: 5 ta oltin, 8 ta kumush medal
Fizika: 3 ta oltin, 6 ta kumush medal
Informatika: 4 ta oltin, 7 ta kumush medal
Kimyo: 2 ta oltin, 5 ta kumush medal

G'oliblarni rag'batlantirish uchun maxsus mukofotlar ajratiladi.

Tabriklaymiz!

Strategik tahlil, metodologiya va JST masalalari boshqarmasi`,
    analysis: {
      docType: "Iqtidorli talabalar",
      docTypeConfidence: 95,
      departmentOrigin: "Strategik tahlil, metodologiya va JST masalalari boshqarmasi",
      letterNumber: "10-08/147",
      letterDate: "01.01.2025",
      summary: "2024-yil xalqaro fan olimpiadalari natijalari va g'oliblarni rag'batlantirish",
      sentiment: "Positive",
      urgency: "Low",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["olimpiada", "oltin medal", "matematika", "fizika", "informatika"]
    }
  },
  {
    id: "test-011",
    timestamp: Date.now() - 1000 * 60 * 60 * 216, // 9 kun oldin
    fileName: "manaviy-tadbir.pdf",
    contentSnippet: "Yangi yil bayrami munosabati bilan tadbirlar...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 11-21/258
Sana: 28.12.2024

Barcha oliy ta'lim muassasalariga

Mavzu: Yangi 2025-yil bayrami tadbirlari

Hurmatli hamkasblar!

Yangi 2025-yil bayrami munosabati bilan quyidagi tadbirlarni tashkil etish so'raladi:

1. Talabalar bilan bayram konserti - 29-dekabr
2. Yetim va kam ta'minlangan talabalar bilan uchrashvu - 30-dekabr
3. Sport musobaqalari yakunlash - 31-dekabr
4. TTJlarda bayram dasturxoni - 31-dekabr

Barcha tadbirlar xavfsizlik qoidalariga rioya qilgan holda o'tkazilsin.

Yoshlar siyosati va ma'naviy-ma'rifiy ishlar boshqarmasi`,
    analysis: {
      docType: "Ma'naviy-ma'rifiy tadbirlar",
      docTypeConfidence: 94,
      departmentOrigin: "Yoshlar siyosati va ma'naviy-ma'rifiy ishlar boshqarmasi",
      letterNumber: "11-21/258",
      letterDate: "28.12.2024",
      summary: "Yangi 2025-yil bayrami munosabati bilan tadbirlar tashkil etish haqida",
      sentiment: "Positive",
      urgency: "Medium",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["Yangi yil", "bayram", "konsert", "sport musobaqalari"]
    }
  },
  {
    id: "test-012",
    timestamp: Date.now() - 1000 * 60 * 60 * 240, // 10 kun oldin
    fileName: "tender-xarid.pdf",
    contentSnippet: "2025-yil uchun davlat xaridlari rejasini tasdiqlash...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 12-05/369
Sana: 27.12.2024

Barcha oliy ta'lim muassasalari moliya bo'limlariga

Mavzu: 2025-yil davlat xaridlari rejasi

Hurmatli hamkasblar!

2025-yil uchun davlat xaridlari rejasini 2025-yil 15-yanvargacha tasdiqlash va tizimga kiritish zarur.

Reja quyidagilarni o'z ichiga olishi kerak:
1. Jihozlar va uskunalar
2. Mebel buyumlari
3. Kompyuter texnikasi
4. O'quv-laboratoriya jihozlari
5. Xo'jalik mollari

Reja elektron davlat xaridlari tizimiga yuklansin.

Moliya-iqtisodiyot va infratuzilmani rivojlantirish boshqarmasi`,
    analysis: {
      docType: "Davlat xaridlari",
      docTypeConfidence: 96,
      departmentOrigin: "Moliya-iqtisodiyot va infratuzilmani rivojlantirish boshqarmasi",
      letterNumber: "12-05/369",
      letterDate: "27.12.2024",
      summary: "2025-yil uchun davlat xaridlari rejasini tasdiqlash va tizimga kiritish",
      sentiment: "Neutral",
      urgency: "Medium",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["davlat xaridlari", "tender", "jihozlar", "15-yanvar"]
    }
  },
  {
    id: "test-013",
    timestamp: Date.now() - 1000 * 60 * 60 * 264, // 11 kun oldin
    fileName: "phd-himoya.pdf",
    contentSnippet: "PhD dissertatsiyalarini himoya qilish jadvali...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 13-27/471
Sana: 26.12.2024

Barcha ilmiy kengashlarga

Mavzu: 2025-yil I-chorak PhD himoyalari jadvali

Hurmatli kengash raislari!

2025-yil I-chorak uchun PhD dissertatsiyalarini himoya qilish jadvali quyidagicha belgilandi:

Yanvar: 15 ta himoya
Fevral: 25 ta himoya
Mart: 30 ta himoya

Har bir himoya hujjatlari kamida 1 oy oldin ilmiy kengash kotibiyatiga topshirilsin.

Himoya jarayoni video-yozuvga olinishi shart.

Fan va innovatsion faoliyatni rivojlantirish boshqarmasi`,
    analysis: {
      docType: "Ilmiy daraja va unvonlar",
      docTypeConfidence: 97,
      departmentOrigin: "Fan va innovatsion faoliyatni rivojlantirish boshqarmasi",
      letterNumber: "13-27/471",
      letterDate: "26.12.2024",
      summary: "2025-yil I-chorak uchun PhD dissertatsiyalarini himoya qilish jadvali",
      sentiment: "Neutral",
      urgency: "Low",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["PhD", "dissertatsiya", "himoya", "ilmiy kengash"]
    }
  },
  {
    id: "test-014",
    timestamp: Date.now() - 1000 * 60 * 60 * 288, // 12 kun oldin
    fileName: "fuqaro-murojaat.pdf",
    contentSnippet: "Fuqarolar murojaatlariga javob berish muddatlari...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 14-33/582
Sana: 25.12.2024

SHOSHILINCH

Barcha oliy ta'lim muassasalari devonxonalariga

Mavzu: Fuqarolar murojaatlariga javob berish intizomi

Hurmatli hamkasblar!

So'nggi tekshiruvlarda ayrim OTMlarda fuqarolar murojaatlariga o'z vaqtida javob berilmayotgani aniqlandi.

ESLATMA:
- Oddiy murojaatlar: 15 kun
- Murakkab murojaatlar: 30 kun
- Shikoyatlar: 15 kun
- Takroriy murojaatlar: 7 kun

Muddatlarni buzgan xodimlar javobgarlikka tortiladi.

Murojaatlar bilan ishlash bo'limi`,
    analysis: {
      docType: "Fuqarolar murojaati",
      docTypeConfidence: 98,
      departmentOrigin: "Murojaatlar bilan ishlash bo'limi",
      letterNumber: "14-33/582",
      letterDate: "25.12.2024",
      summary: "Fuqarolar murojaatlariga o'z vaqtida javob berish intizomi haqida shoshilinch xat",
      sentiment: "Negative",
      urgency: "High",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["fuqarolar murojaati", "muddatlar", "shikoyat", "javobgarlik"]
    }
  },
  {
    id: "test-015",
    timestamp: Date.now() - 1000 * 60 * 60 * 312, // 13 kun oldin
    fileName: "elektron-kutubxona.pdf",
    contentSnippet: "Raqamli kutubxona resurslaridan foydalanish...",
    fullContent: `O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi

Xat raqami: 15-11/693
Sana: 24.12.2024

Barcha oliy ta'lim muassasalari kutubxonalariga

Mavzu: Elektron kutubxona resurslaridan foydalanish

Hurmatli kutubxonachilar!

2025-yildan boshlab quyidagi xalqaro elektron bazalarga obuna rasmiylashtirildi:

1. Scopus - to'liq kirish
2. Web of Science - to'liq kirish
3. ScienceDirect - 500+ jurnal
4. Springer Nature - 1000+ kitob
5. JSTOR - arxiv materiallari

Foydalanuvchi login/parollarni kutubxonadan olish mumkin.

Raqamlashtirish va sun'iy intellekt texnologiyalarini joriy etish boshqarmasi`,
    analysis: {
      docType: "Raqamli kutubxona",
      docTypeConfidence: 95,
      departmentOrigin: "Raqamlashtirish va sun'iy intellekt texnologiyalarini joriy etish boshqarmasi",
      letterNumber: "15-11/693",
      letterDate: "24.12.2024",
      summary: "Xalqaro elektron kutubxona bazalariga obuna va foydalanish haqida",
      sentiment: "Positive",
      urgency: "Low",
      grammarErrors: [],
      confidentialityRisk: false,
      keyEntities: ["Scopus", "Web of Science", "elektron kutubxona", "ScienceDirect"]
    }
  }
];

// To'g'ridan-to'g'ri bazaga yozish
function seedData() {
  console.log('Test ma\'lumotlarni yuklash boshlanmoqda...\n');

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO documents (id, timestamp, file_name, content_snippet, full_content, analysis, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const doc of testDocuments) {
    try {
      stmt.run(
        doc.id,
        doc.timestamp,
        doc.fileName || null,
        doc.contentSnippet,
        doc.fullContent,
        JSON.stringify(doc.analysis),
        null
      );
      console.log(`✓ Yuklandi: ${doc.analysis.docType} (${doc.analysis.letterNumber})`);
    } catch (err) {
      console.log(`✗ Xatolik: ${doc.id} - ${err.message}`);
    }
  }

  console.log('\n15 ta test xat muvaffaqiyatli yuklandi!');
  console.log('Sahifani yangilang: http://localhost:3000');

  db.close();
}

seedData();
