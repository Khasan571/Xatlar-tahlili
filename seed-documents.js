// Test hujjatlarni yuklash skripti
const API_URL = 'https://xatlar-tahlili.onrender.com';

const testDocs = [
  { fileName: 'Talabalar_stipendiyasi_01.pdf', content: "Oliy ta'lim, fan va innovatsiyalar vazirligiga. Hurmatli vazir janoblari! Toshkent davlat texnika universiteti talabalari stipendiya to'lovlari masalasida murojaat qilmoqda. 2024-yil 1-sentabrdan boshlab stipendiya miqdori oshirilishi so'raladi. Universitetimizda 5000 dan ortiq talaba ta'lim olmoqda. Iltimos, ushbu masalani ko'rib chiqishingizni so'raymiz. Rektor: A. Karimov" },
  { fileName: 'Ilmiy_konferensiya_02.pdf', content: "Mavzu: Xalqaro ilmiy konferensiya o'tkazish to'g'risida. Samarqand davlat universiteti 2024-yil noyabr oyida \"Zamonaviy ta'lim texnologiyalari\" mavzusida xalqaro ilmiy konferensiya o'tkazishni rejalashtirmoqda. Konferensiyada 15 ta mamlakatdan 200 dan ortiq olim ishtirok etishi kutilmoqda. Moliyaviy yordam so'raladi." },
  { fileName: 'Kutubxona_jihozlash_03.pdf', content: "Buxoro davlat universiteti kutubxonasini zamonaviy kompyuterlar bilan jihozlash loyihasi. Kutubxonada 50 ta yangi kompyuter o'rnatish, elektron kitoblar bazasini yaratish va internet tezligini oshirish rejalashtirilgan. Umumiy byudjet: 500 million so'm." },
  { fileName: 'Professor_tayinlash_04.pdf', content: "Toshkent moliya institutida Iqtisodiyot kafedrasi mudiri lavozimiga professor Sardor Rahimov nomzodini taklif etamiz. U 20 yillik tajribaga ega, 50 dan ortiq ilmiy maqola muallifi. PhD dissertatsiyasi himoya qilgan." },
  { fileName: 'Talabalar_turar_joyi_05.pdf', content: "SHOSHILINCH! Namangan muhandislik-texnologiya instituti talabalar turar joyida favqulodda holat. Bino tomida oqish aniqlandi, 200 ta talaba vaqtinchalik boshqa joyga ko'chirilishi kerak. Zudlik bilan ta'mirlash ishlari o'tkazilishi shart." },
  { fileName: 'Grant_dasturi_06.pdf', content: "Yevropa Ittifoqi grant dasturi doirasida Andijon davlat universiteti \"Yashil energiya\" loyihasini taqdim etadi. Loyiha maqsadi: universitet binosiga quyosh panellari o'rnatish. Loyiha qiymati: 2 million YEVRO." },
  { fileName: 'Xodimlar_malaka_07.pdf', content: "Farg'ona davlat universiteti professor-o'qituvchilarining malaka oshirish dasturi to'g'risida hisobot. 2024-yilda 150 nafar pedagog malaka oshirdi. Shundan 30 nafari xorijda stajirovka o'tadi." },
  { fileName: 'Yangi_fakultet_08.pdf', content: "Toshkent davlat yuridik universitetida \"Sun'iy intellekt va huquq\" yo'nalishi ochish taklifi. Dastur 4 yillik bakalavr darajasini o'z ichiga oladi. Dastlabki kvota: 50 talaba. Boshlanish sanasi: 2025-yil sentabr." },
  { fileName: 'Imtihon_natijalari_09.pdf', content: "Respublika miqyosidagi matematika olimpiadasi natijalari e'lon qilindi. Birinchi o'rin - Toshkent shahri, ikkinchi o'rin - Samarqand viloyati. Jami 500 ta talaba qatnashdi. G'oliblar davlat mukofotlari bilan taqdirlanadi." },
  { fileName: 'Xorijiy_profesor_10.pdf', content: "Germaniyadan professor Myuller O'zbekistonga tashrif buyuradi. U Toshkent davlat iqtisodiyot universitetida \"Raqamli iqtisodiyot\" mavzusida ma'ruza o'qiydi. Tashrif muddati: 2024-yil 15-30 noyabr." },
  { fileName: 'Laboratoriya_jihozlari_11.pdf', content: "Navoiy davlat konchilik instituti kimyo laboratoriyasi uchun yangi jihozlar sotib olish kerak. Zarur jihozlar ro'yxati ilova qilingan. Umumiy summa: 800 million so'm. Moliyalashtirish manbasi: davlat byudjeti." },
  { fileName: 'Talabalar_almashinuvi_12.pdf', content: "Koreya Respublikasi universitetlari bilan talabalar almashinuvi dasturi. Har yili 100 ta O'zbek talabasi Koreyada ta'lim olish imkoniyatiga ega bo'ladi. Dastur 5 yil davom etadi. Barcha xarajatlar Koreya tomoni tomonidan qoplanadi." },
  { fileName: 'Ilmiy_jurnal_13.pdf', content: "O'zbekiston Milliy universiteti \"Zamonaviy fan\" nomli yangi ilmiy jurnal chiqarishni boshladi. Jurnal Scopus bazasiga kiritilish uchun ariza topshirildi. Birinchi son 2024-yil dekabr oyida nashr etiladi." },
  { fileName: 'Sport_musobaqa_14.pdf', content: "Jismoniy tarbiya instituti Osiyo o'yinlariga tayyorgarlik ko'rmoqda. 50 nafar sportchi tanlab olindi. Maxsus mashg'ulotlar dasturi ishlab chiqildi. Zarur sport anjomlari xarid qilinishi kerak." },
  { fileName: 'Magistratura_kvota_15.pdf', content: "SHOSHILINCH! 2025-yil uchun magistratura kvotalari tasdiqlash muddati tugamoqda. Barcha oliy ta'lim muassasalari o'z takliflarini 10 kun ichida yuborishlari shart. Kechikkan arizalar qabul qilinmaydi." },
  { fileName: 'Online_talim_16.pdf', content: "Masofaviy ta'lim platformasini joriy etish bo'yicha loyiha. Moodle tizimi asosida 50 ta kurs yaratiladi. Barcha universitetlar uchun yagona platforma. Loyiha muddati: 2 yil. Byudjet: 3 milliard so'm." },
  { fileName: 'Fakultet_dekan_17.pdf', content: "Qarshi davlat universitetida Tarix fakulteti dekani lavozimiga saylov o'tkazildi. Saylov natijasida dots. Bobur Eshonqulov g'olib deb topildi. U 2024-yil 1-dekabrdan ishga kirishadi." },
  { fileName: 'Xalqaro_hamkorlik_18.pdf', content: "Turkiya universitetlari bilan hamkorlik memorandumi imzolandi. 10 ta O'zbek universiteti dasturga qo'shildi. Professor-o'qituvchilar almashinuvi, qo'shma ilmiy tadqiqotlar rejalashtirilgan." },
  { fileName: 'Talabalar_shikoyati_19.pdf', content: "Guruh talabalari oshxona sifati borasida shikoyat bildirmoqda. Ovqat sifati past, narxlar yuqori, tozalik talablarga javob bermaydi. Oshxona rahbariyati bilan suhbat o'tkazilishini so'raymiz." },
  { fileName: 'Yangi_bino_20.pdf', content: "Jizzax politexnika instituti yangi o'quv binosi qurilishi loyihasi. 5 qavatli bino, 2000 talabaga mo'ljallangan. Zamonaviy auditoriyalar, laboratoriyalar, kutubxona. Qurilish muddati: 3 yil. Narxi: 50 milliard so'm." }
];

// Bo'limlar notekis taqsimoti (7, 5, 4, 2, 1, 1)
const departmentAssignments = [
  "Oliy ta'lim boshqarmasi",           // 1
  "Oliy ta'lim boshqarmasi",           // 2
  "Oliy ta'lim boshqarmasi",           // 3
  "Oliy ta'lim boshqarmasi",           // 4
  "Oliy ta'lim boshqarmasi",           // 5
  "Oliy ta'lim boshqarmasi",           // 6
  "Oliy ta'lim boshqarmasi",           // 7 - jami 7 ta
  "Fan va innovatsiyalar departamenti", // 1
  "Fan va innovatsiyalar departamenti", // 2
  "Fan va innovatsiyalar departamenti", // 3
  "Fan va innovatsiyalar departamenti", // 4
  "Fan va innovatsiyalar departamenti", // 5 - jami 5 ta
  "Xalqaro hamkorlik bo'limi",          // 1
  "Xalqaro hamkorlik bo'limi",          // 2
  "Xalqaro hamkorlik bo'limi",          // 3
  "Xalqaro hamkorlik bo'limi",          // 4 - jami 4 ta
  "Moliya va iqtisodiyot boshqarmasi",  // 1
  "Moliya va iqtisodiyot boshqarmasi",  // 2 - jami 2 ta
  "Kadrlar bo'limi",                    // 1 - jami 1 ta
  "Talabalar ishlari boshqarmasi"       // 1 - jami 1 ta
];

// Oddiy tahlil funksiyasi
function analyzeText(text, index) {
  const urgencyKeywords = ['shoshilinch', 'zudlik', 'favqulodda', 'muddati tugamoqda'];
  const hasUrgency = urgencyKeywords.some(k => text.toLowerCase().includes(k));

  let docType = 'Rasmiy xat';
  if (text.toLowerCase().includes('ariza') || text.toLowerCase().includes('murojaat')) docType = 'Ariza';
  else if (text.toLowerCase().includes('loyiha')) docType = 'Loyiha';
  else if (text.toLowerCase().includes('hisobot')) docType = 'Hisobot';
  else if (text.toLowerCase().includes('shartnoma') || text.toLowerCase().includes('memorandum')) docType = 'Shartnoma';
  else if (text.toLowerCase().includes('bayonnoma') || text.toLowerCase().includes('saylov')) docType = 'Bayonnoma';
  else if (text.toLowerCase().includes('taklif')) docType = 'Taklif';

  // Notekis taqsimot
  const dept = departmentAssignments[index];

  return {
    docType,
    urgency: hasUrgency ? 'High' : (Math.random() > 0.5 ? 'Medium' : 'Low'),
    summary: text.slice(0, 200) + '...',
    grammarErrors: [],
    suggestions: ['Hujjat formatini tekshiring', 'Imlo xatolarini tuzating'],
    departmentOrigin: dept
  };
}

async function main() {
  console.log('Login qilish...');

  // Login
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    console.error('Login xatosi:', err);
    return;
  }

  const { token } = await loginRes.json();
  console.log('Login muvaffaqiyatli!');

  // Avval eski hujjatlarni o'chirish
  console.log('Eski hujjatlarni o\'chirish...');
  try {
    const existingRes = await fetch(`${API_URL}/api/documents?limit=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const existingData = await existingRes.json();
    if (existingData.documents && existingData.documents.length > 0) {
      const ids = existingData.documents.map(d => d.id);
      await fetch(`${API_URL}/api/documents/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids })
      });
      console.log(`${ids.length} ta eski hujjat o'chirildi`);
    }
  } catch (e) {
    console.log('Eski hujjatlar yo\'q yoki xato:', e.message);
  }

  // Hujjatlarni yaratish
  let created = 0;
  for (let i = 0; i < testDocs.length; i++) {
    const doc = testDocs[i];
    const analysis = analyzeText(doc.content, i);
    const timestamp = Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Oxirgi 30 kun

    const body = {
      fileName: doc.fileName,
      contentSnippet: doc.content.slice(0, 150) + '...',
      fullContent: doc.content,
      analysis,
      timestamp
    };

    try {
      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        created++;
        console.log(`✓ ${doc.fileName} yaratildi (${created}/20)`);
      } else {
        const err = await res.text();
        console.error(`✗ ${doc.fileName} xatosi:`, err);
      }
    } catch (e) {
      console.error(`✗ ${doc.fileName} xatosi:`, e.message);
    }

    // Rate limit uchun kutish
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nJami ${created} ta hujjat yaratildi!`);
}

main().catch(console.error);
