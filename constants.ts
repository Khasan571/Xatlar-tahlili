import { HierarchyNode, LetterType } from './types';

export const INITIAL_HIERARCHY: HierarchyNode[] = [
  {
    id: 'root',
    name: "Oliy ta'lim, fan va innovatsiyalar vazirligi",
    type: 'Ministry',
    children: [
      // --- RAHBARIYAT ---
      { id: 'vazir', name: "Vazir", type: 'Ministry' },
      { id: 'first-deputy', name: "Vazirning birinchi o'rinbosari", type: 'Deputy' },
      { id: 'deputy-science', name: "Vazir o'rinbosari", type: 'Deputy' },
      { id: 'deputy-digital', name: "Vazir o'rinbosari (Raqamlashtirish)", type: 'Deputy' },
      { id: 'chief-staff', name: "Vazir kotibiyati", type: 'Division' },
      { id: 'advisor-spiritual', name: "Vazir maslahatchisi (Ma'naviy-ma'rifiy ishlar va davlat tili)", type: 'Advisor' },
      { id: 'advisor-control', name: "Vazir maslahatchisi (Tashkiliy nazorat masalalari)", type: 'Advisor' },
      { id: 'assistant', name: "Vazir yordamchisi", type: 'Advisor' },

      // --- MARKAZIY APPARAT (Mustaqil boshqarma va bo'limlar) ---
      { 
        id: 'hr-dept', 
        name: "Inson resurslarini rivojlantirish va boshqarish boshqarmasi", 
        type: 'Department' 
      },
      { 
        id: 'acc-div', 
        name: "Buxgalteriya hisobi va hisoboti bo'limi", 
        type: 'Division' 
      },
      { 
        id: 'anticorrupt', 
        name: "Korrupsiyaga qarshi kurashish bo'limi", 
        type: 'Division' 
      },
      { 
        id: 'press', 
        name: "Axborot xizmati bo'limi", 
        type: 'Division' 
      },
      { 
        id: 'intl-dept', 
        name: "Xalqaro hamkorlik va reytinglar boshqarmasi", 
        type: 'Department' 
      },
      { 
        id: 'protocol', 
        name: "Protokol bo'limi", 
        type: 'Division' 
      },
      { 
        id: 'first-div', 
        name: "Birinchi bo'lim", 
        type: 'Division' 
      },
      { 
        id: 'office-manager', 
        name: "Ishlar boshqaruvchisi", 
        type: 'Division' 
      },
      { 
        id: 'strategy-dept', 
        name: "Strategik tahlil, metodologiya va JST masalalari boshqarmasi", 
        type: 'Department' 
      },
      { 
        id: 'legal-div', 
        name: "Yuridik ta'minlash bo'limi", 
        type: 'Division' 
      },
      { 
        id: 'exec-control', 
        name: "Ijro intizomi va nazorat bo'limi", 
        type: 'Division' 
      },
      { 
        id: 'info-analysis', 
        name: "Yig'ma axborot-tahlil bo'limi", 
        type: 'Division' 
      },
      { 
        id: 'chancellery', 
        name: "Devonxona", 
        type: 'Division' 
      },
      { 
        id: 'appeals', 
        name: "Murojaatlar bilan ishlash bo'limi", 
        type: 'Division' 
      },

      // --- OLIY TA'LIM TASHKILOTLARI DEPARTAMENTI ---
      {
        id: 'he-dept',
        name: "Oliy ta'lim tashkilotlari departamenti",
        type: 'Department',
        children: [
          { id: 'he-coord', name: "Oliy ta'lim muassasalari faoliyatini muvofiqlashtirish boshqarmasi", type: 'Department' },
          { id: 'edu-proc', name: "O'quv jarayonini tashkil etish va xorijiy tillarni o'qitish boshqarmasi", type: 'Department' },
          { id: 'license', name: "Ta'lim tashkilotlarini litsenziyalash bo'limi", type: 'Division' },
          { id: 'admission', name: "Qabul jarayonlari va akademik mobillik bo'limi", type: 'Division' }
        ]
      },

      // --- ENERGIYA VA EKOLOGIYA ---
      { 
        id: 'energy-dept', 
        name: "Energiya samaradorligi va ta'lim-ishlab chiqarish boshqarmasi", 
        type: 'Department' 
      },
      { 
        id: 'quals-eco', 
        name: "Kadrlar malakasini oshirish va ekologik madaniyat bo'limi", 
        type: 'Division' 
      },

      // --- MOLIYA-IQTISODIYOT DEPARTAMENTI ---
      {
        id: 'finance-dept',
        name: "Moliya-iqtisodiyot va infratuzilmani rivojlantirish boshqarmasi", // As per text provided
        type: 'Department',
        children: [
           { id: 'fin-plan', name: "Moliyalashtirish va rejalashtirish bo'limi", type: 'Division' },
           { id: 'logistics', name: "Moddiy-texnik ta'minot bo'limi", type: 'Division' },
           { id: 'inv-dev', name: "Investitsiyalarni rivojlantirish va monitoring qilish bo'limi", type: 'Division' },
           { id: 'foreign-inv', name: "Xorijiy investitsiyalar va grantlar bilan ishlash bo'limi", type: 'Division' }
        ]
      },

      // --- AUDIT VA MALAKA ---
      { 
        id: 'audit', 
        name: "Ichki audit boshqarmasi", 
        type: 'Department' 
      },
      { 
        id: 'prof-dev', 
        name: "Kasbiy malakalarni rivojlantirish bo'limi", 
        type: 'Division' 
      },

      // --- YOSHLAR SIYOSATI ---
      {
         id: 'youth-dept',
         name: "Yoshlar siyosati va ma'naviy-ma'rifiy ishlar boshqarmasi",
         type: 'Department',
         children: [
            { id: 'soc-edu', name: "Yoshlar siyosati, ijtimoiy-ma'rifiy va tarbiyaviy ishlar bo'limi", type: 'Division' },
            { id: 'academy-act', name: "Talabalar akademiyasi faoliyatini muvofiqlashtirish bo'limi", type: 'Division' }
         ]
      },

      // --- FAN VA INNOVATSIYA ---
      { 
        id: 'science-inn', 
        name: "Fan va innovatsion faoliyatni rivojlantirish boshqarmasi", 
        type: 'Department' 
      },

      // --- RAQAMLASHTIRISH ---
      {
         id: 'digital-dept',
         name: "Raqamlashtirish va sun'iy intellekt texnologiyalarini joriy etish boshqarmasi",
         type: 'Department',
         children: [
            { id: 'comm-tech', name: "Kommunikatsiya texnologiyalarini joriy etish va raqamlashtirish bo'limi", type: 'Division' },
            { id: 'ai-tech', name: "Sun'iy intellekt texnologiyalarini joriy etish bo'limi", type: 'Division' }
         ]
      }
    ]
  }
];

export const INITIAL_LETTER_TYPES: LetterType[] = [
  // Ta'lim jarayoni va Sifat
  { id: 'lt-1', name: "Ta'lim sifatini nazorat qilish", description: "Dars o'tish sifati va davomat bo'yicha ko'rsatmalar" },
  { id: 'lt-2', name: "O'quv reja va dasturlar", description: "Yangi o'quv rejalarni tasdiqlash va joriy etish" },
  { id: 'lt-3', name: "Kredit-modul tizimi", description: "Kredit-modul tizimi ijrosi va muammolari" },
  { id: 'lt-4', name: "Yakuniy nazorat va sessiya", description: "Imtihon jarayonlarini tashkil etish" },
  { id: 'lt-5', name: "Talabalar o'qishini ko'chirish", description: "Perevod va tiklash masalalari (O'qishni ko'chirish)" },
  { id: 'lt-6', name: "Bitiruv va Diplom", description: "Diplom berish va bitiruv malakaviy ishlari" },
  { id: 'lt-7', name: "Amaliyot va Stajirovka", description: "Talabalar amaliyotini tashkil etish" },
  { id: 'lt-8', name: "Qabul jarayonlari", description: "Kvota va qabul komissiyasi faoliyati" },
  { id: 'lt-9', name: "Masofaviy ta'lim", description: "Onlayn darslar va platformalar bo'yicha" },
  
  // Ilmiy faoliyat va Innovatsiyalar
  { id: 'lt-10', name: "Ilmiy daraja va unvonlar", description: "PhD va DSc himoyalari, professor-o'qituvchilar ilmiy salohiyati" },
  { id: 'lt-11', name: "Ilmiy loyihalar va grantlar", description: "Davlat grantlari va ilmiy tanlovlar" },
  { id: 'lt-12', name: "Innovatsion g'oyalar", description: "Startaplar va innovatsion ishlanmalar ko'rgazmasi" },
  { id: 'lt-13', name: "Maqola va Nashrlar", description: "Scopus, Web of Science va mahalliy jurnallarda nashr" },
  { id: 'lt-14', name: "Intellektual mulk", description: "Patent va guvohnomalar olish" },
  { id: 'lt-15', name: "Iqtidorli talabalar", description: "Olimpiadalar va iqtidorli yoshlar bilan ishlash" },

  // Ma'naviyat va Yoshlar bilan ishlash
  { id: 'lt-16', name: "Ma'naviy-ma'rifiy tadbirlar", description: "Bayramlar va uchrashuvlar tashkili" },
  { id: 'lt-17', name: "Talabalar turar joyi (TTJ)", description: "Yotoqxona bilan ta'minlash va sharoitlar" },
  { id: 'lt-18', name: "Ijtimoiy himoya", description: "Yetim va nogironligi bor talabalarni qo'llab-quvvatlash" },
  { id: 'lt-19', name: "Beshta tashabbus", description: "Prezidentning 5 tashabbusi doirasidagi tadbirlar" },
  { id: 'lt-20', name: "Diniy ekstremizm profilaktikasi", description: "Yot g'oyalarga qarshi kurashish" },
  { id: 'lt-21', name: "Sport tadbirlari", description: "Musobaqalar, spartakiadalar va sportga jalb qilish" },
  { id: 'lt-22', name: "Madaniy tashriflar", description: "Teatr, muzey va kinoga talabalarni olib borish" },
  { id: 'lt-23', name: "Tyutorlar faoliyati", description: "Guruh murabbiylari va tyutorlar ishi" },
  { id: 'lt-24', name: "Yoshlar ittifoqi", description: "Yoshlar tashkilotlari faoliyati" },
  { id: 'lt-25', name: "Jinoyatchilikni oldini olish", description: "Talabalar o'rtasida huquqbuzarlik profilaktikasi" },

  // Moliya va Iqtisodiyot
  { id: 'lt-26', name: "Kontrakt to'lovlari", description: "To'lov-shartnoma tushumlari va muddatlari" },
  { id: 'lt-27', name: "Stipendiya va Ish haqi", description: "To'lovlar kechikishi va hisob-kitoblar" },
  { id: 'lt-28', name: "Moliyaviy hisobot", description: "Buxgalteriya balanslari va smeta ijrosi" },
  { id: 'lt-29', name: "Davlat xaridlari", description: "Tender va birja savdolari" },
  { id: 'lt-30', name: "Moddiy-texnik baza", description: "Jihozlash, mebel va kompyuterlar xaridi" },
  
  // Kadrlar va Ijro
  { id: 'lt-31', name: "Pedagoglar malakasini oshirish", description: "Qayta tayyorlash va malaka oshirish kurslari" },
  { id: 'lt-32', name: "Professor-o'qituvchilar reytingi", description: "KPI va ish samaradorligini baholash" },
  { id: 'lt-33', name: "Vakansiyalar", description: "Bo'sh ish o'rinlari va tanlovlar" },
  { id: 'lt-34', name: "Ijro intizomi", description: "Moddiy javobgarlik va intizomiy choralar" },
  { id: 'lt-35', name: "Buyruq va Qarorlar ijrosi", description: "Vazirlik va Hukumat qarorlari ijrosi nazorati" },

  // Xalqaro aloqalar
  { id: 'lt-36', name: "Xorijiy talabalar", description: "Chet ellik talabalarni jalb qilish va vizalar" },
  { id: 'lt-37', name: "Xalqaro hamkorlik", description: "Memorandumlar va qo'shma dasturlar" },
  { id: 'lt-38', name: "Xalqaro reytinglar", description: "QS, THE va boshqa reytinglarga kirish" },
  { id: 'lt-39', name: "Xalqaro konferensiyalar", description: "Xalqaro miqyosdagi ilmiy anjumanlar" },

  // Infratuzilma va Raqamlashtirish
  { id: 'lt-40', name: "HEMIS tizimi", description: "Raqamli universitet tizimiga ma'lumot kiritish" },
  { id: 'lt-41', name: "Veb-sayt va PR", description: "Matbuot xizmati va saytni yuritish" },
  { id: 'lt-42', name: "Raqamli kutubxona", description: "Elektron resurslardan foydalanish" },
  { id: 'lt-43', name: "Qurilish va Ta'mirlash", description: "Binolarni ta'mirlash va yangi qurilishlar" },
  { id: 'lt-44', name: "Kuz-qish mavsumi", description: "Isitish tizimi va mavsumga tayyorgarlik" },
  { id: 'lt-45', name: "Obodonlashtirish", description: "Yashil makon va hashar tadbirlari" },

  // Boshqa
  { id: 'lt-46', name: "Korrupsiyaga qarshi kurash", description: "Komplayens nazorat va anonim so'rovlar" },
  { id: 'lt-47', name: "Fuqarolar murojaati", description: "Ariza va shikoyatlarni o'rganish" },
  { id: 'lt-48', name: "Statistik ma'lumotlar", description: "Turli yo'nalishlar bo'yicha raqamli hisobotlar" },
  { id: 'lt-49', name: "Bitiruvchilar bandligi", description: "Ishga joylashish ko'rsatkichlari" },
  { id: 'lt-50', name: "Favqulodda vaziyatlar", description: "Yong'in xavfsizligi va texnika xavfsizligi" },
];