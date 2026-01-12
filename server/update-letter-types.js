import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data.db');
const db = new Database(dbPath);

// Yangi xat turlari
const letterTypes = [
  { id: 'lt-01', name: "Maqola va Nashrlar", description: "Scopus, Web of Science va mahalliy jurnallarda nashr" },
  { id: 'lt-02', name: "Patent va guvohnomalar", description: "Patent va guvohnomalar olish" },
  { id: 'lt-03', name: "Iqtidorli talabalar", description: "Olimpiadalar va iqtidorli yoshlar bilan ishlash" },
  { id: 'lt-04', name: "Ma'naviy-ma'rifiy tadbirlar", description: "Bayramlar va uchrashuvlar tashkili" },
  { id: 'lt-05', name: "Talabalar turar joyi (TTJ)", description: "Yotoqxona bilan ta'minlash va sharoitlar" },
  { id: 'lt-06', name: "Ijtimoiy himoya", description: "Yetim va nogironligi bor talabalarni qo'llab-quvvatlash" },
  { id: 'lt-07', name: "Beshta tashabbus", description: "Prezidentning 5 tashabbusi doirasidagi tadbirlar" },
  { id: 'lt-08', name: "O'quv reja va dasturlar", description: "Yangi o'quv rejalarni tasdiqlash va joriy etish" },
  { id: 'lt-09', name: "Diniy ekstremizm profilaktikasi", description: "Yot g'oyalarga qarshi kurashish" },
  { id: 'lt-10', name: "Sport tadbirlari", description: "Musobaqalar, spartakiadalar va sportga jalb qilish" },
  { id: 'lt-11', name: "Madaniy tashriflar", description: "Teatr, muzey va kinoga talabalarni olib borish" },
  { id: 'lt-12', name: "Tyutorlar faoliyati", description: "Guruh murabbiylar va tyutorlar ishi" },
  { id: 'lt-13', name: "Yoshlar ittifoqi", description: "Yoshlar tashkilotlari faoliyati" },
  { id: 'lt-14', name: "Jinoyatchilikni oldini olish", description: "Talabalar o'rtasida huquqbuzarlik profilaktikasi" },
  { id: 'lt-15', name: "Kontrakt to'lovlari", description: "To'lov-shartnoma tushumlari va muddatlari" },
  { id: 'lt-16', name: "Stipendiya va Ish haqi", description: "To'lovlar kechikishi va hisob-kitoblar" },
  { id: 'lt-17', name: "Moliyaviy hisobot", description: "Buxgalteriya balanslari va smeta ijrosi" },
  { id: 'lt-18', name: "Davlat xaridlari", description: "Tender va birja savdolari" },
  { id: 'lt-19', name: "Kredit-modul tizimi", description: "Kredit-modul tizimi ijrosi va muammolari" },
  { id: 'lt-20', name: "Moddiy-texnik baza", description: "Jihozlash, mebel va kompyuterlar xaridi" },
  { id: 'lt-21', name: "Pedagoglar malakasini oshirish", description: "Qayta tayyorlash va malaka oshirish kurslari" },
  { id: 'lt-22', name: "Professor-o'qituvchilar reytingi", description: "KPI va ish samaradorligini baholash" },
  { id: 'lt-23', name: "Vakansiyalar", description: "Bo'sh ish o'rinlari va tanlovlar" },
  { id: 'lt-24', name: "Ijro intizomi", description: "Moddiy javobgarlik va intizomiy choralar" },
];

// Eski xat turlarini o'chirish
db.prepare('DELETE FROM letter_types').run();

// Yangi xat turlarini qo'shish
const stmt = db.prepare('INSERT INTO letter_types (id, name, description) VALUES (?, ?, ?)');

for (const type of letterTypes) {
  stmt.run(type.id, type.name, type.description);
}

console.log(`${letterTypes.length} ta xat turi qo'shildi!`);
db.close();
