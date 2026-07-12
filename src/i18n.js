/* UI strings in English, Hindi and Bengali.
   Keys missing from a language fall back to English. */

export const LANGS = { en: "English", hi: "हिन्दी", bn: "বাংলা" };
export const LOCALES = { en: "en-IN", hi: "hi-IN", bn: "bn-IN" };

const STRINGS = {
  en: {
    gm: "Good morning", ga: "Good afternoon", ge: "Good evening",
    navHome: "Home", navDiary: "Diary", navBusiness: "Business", navAdvisor: "Advisor", navProfile: "Profile",

    obTitle1: "Your farm,", obTitle2: "organised.",
    obSub: "AgriOS keeps your work, money and decisions in one place. Tell us about your farm to begin.",
    langLabel: "Language / भाषा / ভাষা",
    nameLabel: "Your name", namePh: "e.g. Ramesh Mandal",
    stateLabel: "State", acresLabel: "Land size (acres) — optional", acresPh: "e.g. 3.5",
    continueBtn: "Continue",
    obTitle3: "What do you farm?",
    obSub2: "Pick everything you run. Each one gets its own profit tracking, so you can see which part of the farm actually earns.",
    openFarm: "Open my farm",

    thisMonth: "This month", profit: "profit", loss: "loss", noEntries: "no entries",
    inWord: "in", outWord: "out", openLedger: "Open ledger →",
    addIncome: "Add income", addExpense: "Add expense",
    todaysWork: "Today's work", pendingWord: "pending",
    taskPh: "Add a task — e.g. irrigate north plot",
    nothingPlanned: "Nothing planned yet. Add what needs doing on the farm today.",
    loadSample: "Load sample farm data",

    wxClear: "Clear sky", wxCloudy: "Cloudy", wxFog: "Fog", wxDrizzle: "Drizzle",
    wxRainy: "Rain", wxStorm: "Thunderstorm", wxSnow: "Snow",
    advRain: "Rain likely within 24 hours. Hold off on spraying and top-dressing today.",
    advWind: "Strong winds today. Avoid spraying.",
    advClear: "Clear window today. Good conditions for spraying and field work.",
    wxLive: "Live forecast · Open-Meteo", wxOffline: "Couldn't fetch live weather — showing last saved.",
    wxLoading: "Fetching weather…", rainWord: "rain",

    allFarms: "All farms", profitMonth: "Profit this month", lossMonth: "Loss this month",
    noEntriesYet: "No entries yet", income: "Income", expense: "Expense",
    byEnterprise: "Profit by enterprise", whereMoney: "Where the money went", entriesLabel: "Entries",
    startLedger: "Start your farm ledger",
    startLedgerSub: "Record each sale and cost as it happens. Your profit updates on its own.",
    loadSampleEntries: "Load sample entries", noSelection: "No entries for this selection.",
    confirmDelete: "Delete this entry?",

    diaryTitle: "Farm diary",
    diarySub: "Log each day's work — this record is what makes the advisor smart.",
    logActivity: "Log activity", actLabel: "Activity", whichFarm: "Which farm",
    noteOpt: "Note (optional)", saveActivity: "Save",
    noDiary: "Nothing logged yet. Add today's first activity.",

    actSowing: "Sowing", actIrrigation: "Irrigation", actFertilizer: "Fertilizer",
    actSpraying: "Spraying", actWeeding: "Weeding", actHarvest: "Harvest",
    actFeeding: "Feeding", actVaccination: "Vaccination", actSale: "Sale", actOther: "Other",

    advTitle: "AI Farm Advisor",
    advSub: "Ask anything — answers use your farm, ledger, diary and weather.",
    advPh: "Ask about your farm…", advThinking: "Thinking…",
    advSetupTitle: "Turn on the advisor",
    advSetupBody: "Paste a Claude API key from console.anthropic.com. The key is stored only on this device.",
    advSaveKey: "Save", advInsights: "Farm snapshot",
    advErr: "Couldn't get an answer — check the key and your connection.",
    advDisclaimer: "For pesticides, medicines and animal treatment, confirm doses with your local agriculture officer or KVK.",
    sampleQ1: "What should I do tomorrow?", sampleQ2: "How can I cut costs?", sampleQ3: "Explain this month's accounts",
    insTopExpense: "Biggest expense",

    category: "Category", saveIncome: "Save income", saveExpense: "Save expense",

    myEnterprises: "My enterprises",
    entNote: "Your enterprises decide what the ledger, diary and advisor show you.",
    appLang: "App language",

    entPaddy: "Paddy", entWheat: "Wheat", entVeg: "Vegetables", entDairy: "Dairy",
    entPoultry: "Poultry", entGoat: "Goat", entFish: "Fish",

    cCrop: "Crop sale", cMilk: "Milk sale", cEgg: "Egg sale", cLivestock: "Livestock sale",
    cProduce: "Vegetable / fruit", cSubsidy: "Subsidy", cOtherIn: "Other income",
    cSeeds: "Seeds", cFertilizer: "Fertilizer", cPesticide: "Pesticide", cIrrigation: "Irrigation",
    cLabour: "Labour", cFeed: "Animal feed", cVet: "Veterinary", cMachinery: "Machinery / fuel",
    cTransport: "Transport", cElectricity: "Electricity", cRent: "Rent / lease", cEmi: "Loan EMI",
    cOtherEx: "Other expense",
  },

  hi: {
    gm: "सुप्रभात", ga: "नमस्ते", ge: "शुभ संध्या",
    navHome: "होम", navDiary: "डायरी", navBusiness: "हिसाब", navAdvisor: "सलाहकार", navProfile: "प्रोफ़ाइल",

    obTitle1: "आपका खेत,", obTitle2: "व्यवस्थित।",
    obSub: "AgriOS आपके काम, पैसे और फ़ैसलों को एक जगह रखता है। शुरू करने के लिए अपने खेत के बारे में बताएं।",
    nameLabel: "आपका नाम", namePh: "जैसे रमेश मंडल",
    stateLabel: "राज्य", acresLabel: "ज़मीन (एकड़) — वैकल्पिक", acresPh: "जैसे 3.5",
    continueBtn: "आगे बढ़ें",
    obTitle3: "आप क्या-क्या करते हैं?",
    obSub2: "जो भी करते हैं सब चुनें। हर एक का अलग नफ़ा-नुक़सान दिखेगा।",
    openFarm: "मेरा खेत खोलें",

    thisMonth: "इस महीने", profit: "मुनाफ़ा", loss: "घाटा", noEntries: "कोई एंट्री नहीं",
    inWord: "आय", outWord: "ख़र्च", openLedger: "खाता खोलें →",
    addIncome: "आय जोड़ें", addExpense: "ख़र्च जोड़ें",
    todaysWork: "आज का काम", pendingWord: "बाक़ी",
    taskPh: "काम जोड़ें — जैसे उत्तर वाले खेत की सिंचाई",
    nothingPlanned: "अभी कोई काम नहीं। आज खेत में जो करना है वह जोड़ें।",
    loadSample: "नमूना डेटा लोड करें",

    wxClear: "साफ़ आसमान", wxCloudy: "बादल", wxFog: "कोहरा", wxDrizzle: "फुहार",
    wxRainy: "बारिश", wxStorm: "आंधी-तूफ़ान", wxSnow: "बर्फ़",
    advRain: "अगले 24 घंटे में बारिश की संभावना है। आज छिड़काव और खाद डालना टालें।",
    advWind: "आज तेज़ हवा है। छिड़काव न करें।",
    advClear: "मौसम साफ़ है। छिड़काव और खेत के काम के लिए अच्छा समय।",
    wxLive: "लाइव मौसम · Open-Meteo", wxOffline: "लाइव मौसम नहीं मिला — पिछला सहेजा दिखा रहे हैं।",
    wxLoading: "मौसम ला रहे हैं…", rainWord: "बारिश",

    allFarms: "सभी", profitMonth: "इस महीने मुनाफ़ा", lossMonth: "इस महीने घाटा",
    noEntriesYet: "अभी कोई एंट्री नहीं", income: "आय", expense: "ख़र्च",
    byEnterprise: "किससे कितना मुनाफ़ा", whereMoney: "पैसा कहाँ गया", entriesLabel: "एंट्री",
    startLedger: "अपना खाता शुरू करें",
    startLedgerSub: "हर बिक्री और ख़र्च दर्ज करें। मुनाफ़ा अपने आप दिखेगा।",
    loadSampleEntries: "नमूना एंट्री लोड करें", noSelection: "इस चयन में कोई एंट्री नहीं।",
    confirmDelete: "यह एंट्री हटाएँ?",

    diaryTitle: "खेत डायरी",
    diarySub: "रोज़ का काम दर्ज करें — यही रिकॉर्ड सलाहकार को समझदार बनाता है।",
    logActivity: "काम दर्ज करें", actLabel: "काम", whichFarm: "कौन सा खेत",
    noteOpt: "नोट (वैकल्पिक)", saveActivity: "दर्ज करें",
    noDiary: "अभी कुछ दर्ज नहीं। आज का पहला काम जोड़ें।",

    actSowing: "बुआई", actIrrigation: "सिंचाई", actFertilizer: "खाद",
    actSpraying: "छिड़काव", actWeeding: "निराई", actHarvest: "कटाई",
    actFeeding: "चारा", actVaccination: "टीकाकरण", actSale: "बिक्री", actOther: "अन्य",

    advTitle: "AI सलाहकार",
    advSub: "कुछ भी पूछें — जवाब आपके खेत, हिसाब, डायरी और मौसम पर आधारित होंगे।",
    advPh: "अपने खेत के बारे में पूछें…", advThinking: "सोच रहा है…",
    advSetupTitle: "सलाहकार चालू करें",
    advSetupBody: "console.anthropic.com से Claude API key डालें। Key सिर्फ़ इसी डिवाइस पर रहती है।",
    advSaveKey: "सहेजें", advInsights: "खेत की झलक",
    advErr: "जवाब नहीं मिला — key और इंटरनेट जांचें।",
    advDisclaimer: "दवा, कीटनाशक और पशु इलाज से पहले स्थानीय कृषि अधिकारी या KVK से पुष्टि करें।",
    sampleQ1: "कल क्या काम करूँ?", sampleQ2: "ख़र्च कैसे घटाएँ?", sampleQ3: "इस महीने का हिसाब समझाओ",
    insTopExpense: "सबसे बड़ा ख़र्च",

    category: "श्रेणी", saveIncome: "आय सहेजें", saveExpense: "ख़र्च सहेजें",

    myEnterprises: "मेरे काम-धंधे",
    entNote: "यही तय करता है कि खाता, डायरी और सलाहकार क्या दिखाएँ।",
    appLang: "ऐप की भाषा",

    entPaddy: "धान", entWheat: "गेहूँ", entVeg: "सब्ज़ी", entDairy: "डेयरी",
    entPoultry: "मुर्गी पालन", entGoat: "बकरी पालन", entFish: "मछली पालन",

    cCrop: "फ़सल बिक्री", cMilk: "दूध बिक्री", cEgg: "अंडा बिक्री", cLivestock: "पशु बिक्री",
    cProduce: "सब्ज़ी / फल", cSubsidy: "सब्सिडी", cOtherIn: "अन्य आय",
    cSeeds: "बीज", cFertilizer: "खाद", cPesticide: "कीटनाशक", cIrrigation: "सिंचाई",
    cLabour: "मज़दूरी", cFeed: "पशु चारा", cVet: "पशु चिकित्सा", cMachinery: "मशीन / डीज़ल",
    cTransport: "ढुलाई", cElectricity: "बिजली", cRent: "किराया / पट्टा", cEmi: "लोन EMI",
    cOtherEx: "अन्य ख़र्च",
  },

  bn: {
    gm: "সুপ্রভাত", ga: "নমস্কার", ge: "শুভ সন্ধ্যা",
    navHome: "হোম", navDiary: "ডায়েরি", navBusiness: "হিসাব", navAdvisor: "পরামর্শ", navProfile: "প্রোফাইল",

    obTitle1: "আপনার খামার,", obTitle2: "গোছানো।",
    obSub: "AgriOS আপনার কাজ, টাকা-পয়সা আর সিদ্ধান্ত এক জায়গায় রাখে। শুরু করতে আপনার খামারের কথা বলুন।",
    nameLabel: "আপনার নাম", namePh: "যেমন রমেশ মণ্ডল",
    stateLabel: "রাজ্য", acresLabel: "জমি (একর) — ঐচ্ছিক", acresPh: "যেমন 3.5",
    continueBtn: "এগিয়ে যান",
    obTitle3: "আপনি কী কী চাষ করেন?",
    obSub2: "যা যা করেন সব বেছে নিন। প্রতিটির আলাদা লাভ-ক্ষতি দেখা যাবে।",
    openFarm: "আমার খামার খুলুন",

    thisMonth: "এই মাসে", profit: "লাভ", loss: "ক্ষতি", noEntries: "কোনো এন্ট্রি নেই",
    inWord: "আয়", outWord: "খরচ", openLedger: "খাতা খুলুন →",
    addIncome: "আয় যোগ করুন", addExpense: "খরচ যোগ করুন",
    todaysWork: "আজকের কাজ", pendingWord: "বাকি",
    taskPh: "কাজ যোগ করুন — যেমন উত্তরের জমিতে সেচ",
    nothingPlanned: "এখনও কিছু নেই। আজ খামারে যা করতে হবে যোগ করুন।",
    loadSample: "নমুনা ডেটা লোড করুন",

    wxClear: "পরিষ্কার আকাশ", wxCloudy: "মেঘলা", wxFog: "কুয়াশা", wxDrizzle: "গুঁড়ি গুঁড়ি বৃষ্টি",
    wxRainy: "বৃষ্টি", wxStorm: "ঝড়", wxSnow: "তুষার",
    advRain: "আগামী ২৪ ঘণ্টায় বৃষ্টির সম্ভাবনা। আজ স্প্রে ও সার দেওয়া বন্ধ রাখুন।",
    advWind: "আজ জোরে হাওয়া বইছে। স্প্রে করবেন না।",
    advClear: "আবহাওয়া পরিষ্কার। স্প্রে ও মাঠের কাজের জন্য ভালো সময়।",
    wxLive: "লাইভ আবহাওয়া · Open-Meteo", wxOffline: "লাইভ আবহাওয়া পাওয়া যায়নি — আগের তথ্য দেখানো হচ্ছে।",
    wxLoading: "আবহাওয়া আনা হচ্ছে…", rainWord: "বৃষ্টি",

    allFarms: "সব", profitMonth: "এই মাসে লাভ", lossMonth: "এই মাসে ক্ষতি",
    noEntriesYet: "এখনও কোনো এন্ট্রি নেই", income: "আয়", expense: "খরচ",
    byEnterprise: "কোন খাতে কত লাভ", whereMoney: "টাকা কোথায় গেল", entriesLabel: "এন্ট্রি",
    startLedger: "আপনার খাতা শুরু করুন",
    startLedgerSub: "প্রতিটি বিক্রি ও খরচ লিখে রাখুন। লাভ নিজে থেকেই দেখা যাবে।",
    loadSampleEntries: "নমুনা এন্ট্রি লোড করুন", noSelection: "এই বাছাইয়ে কোনো এন্ট্রি নেই।",
    confirmDelete: "এই এন্ট্রি মুছবেন?",

    diaryTitle: "খামার ডায়েরি",
    diarySub: "রোজকার কাজ লিখে রাখুন — এই তথ্যই পরামর্শদাতাকে বুদ্ধিমান করে।",
    logActivity: "কাজ লিখুন", actLabel: "কাজ", whichFarm: "কোন খামার",
    noteOpt: "নোট (ঐচ্ছিক)", saveActivity: "লিখে রাখুন",
    noDiary: "এখনও কিছু লেখা হয়নি। আজকের প্রথম কাজ যোগ করুন।",

    actSowing: "বপন", actIrrigation: "সেচ", actFertilizer: "সার",
    actSpraying: "স্প্রে", actWeeding: "নিড়ানি", actHarvest: "ফসল কাটা",
    actFeeding: "খাওয়ানো", actVaccination: "টিকা", actSale: "বিক্রি", actOther: "অন্যান্য",

    advTitle: "AI পরামর্শদাতা",
    advSub: "যা খুশি জিজ্ঞেস করুন — উত্তর আপনার খামার, হিসাব, ডায়েরি আর আবহাওয়ার ভিত্তিতে।",
    advPh: "আপনার খামার নিয়ে জিজ্ঞেস করুন…", advThinking: "ভাবছে…",
    advSetupTitle: "পরামর্শদাতা চালু করুন",
    advSetupBody: "console.anthropic.com থেকে Claude API key দিন। Key শুধু এই ডিভাইসেই থাকে।",
    advSaveKey: "সংরক্ষণ", advInsights: "খামারের ঝলক",
    advErr: "উত্তর পাওয়া যায়নি — key ও ইন্টারনেট দেখুন।",
    advDisclaimer: "ওষুধ, কীটনাশক ও পশু চিকিৎসার আগে স্থানীয় কৃষি অফিসার বা KVK-র সঙ্গে কথা বলুন।",
    sampleQ1: "কাল কী কাজ করব?", sampleQ2: "খরচ কীভাবে কমাব?", sampleQ3: "এই মাসের হিসাব বুঝিয়ে দাও",
    insTopExpense: "সবচেয়ে বড় খরচ",

    category: "খাত", saveIncome: "আয় সংরক্ষণ", saveExpense: "খরচ সংরক্ষণ",

    myEnterprises: "আমার চাষ-ব্যবসা",
    entNote: "এতেই ঠিক হয় খাতা, ডায়েরি ও পরামর্শদাতা কী দেখাবে।",
    appLang: "অ্যাপের ভাষা",

    entPaddy: "ধান", entWheat: "গম", entVeg: "সবজি", entDairy: "ডেয়ারি",
    entPoultry: "মুরগি পালন", entGoat: "ছাগল পালন", entFish: "মাছ চাষ",

    cCrop: "ফসল বিক্রি", cMilk: "দুধ বিক্রি", cEgg: "ডিম বিক্রি", cLivestock: "পশু বিক্রি",
    cProduce: "সবজি / ফল", cSubsidy: "ভর্তুকি", cOtherIn: "অন্যান্য আয়",
    cSeeds: "বীজ", cFertilizer: "সার", cPesticide: "কীটনাশক", cIrrigation: "সেচ",
    cLabour: "মজুরি", cFeed: "পশুখাদ্য", cVet: "পশু চিকিৎসা", cMachinery: "যন্ত্র / ডিজেল",
    cTransport: "পরিবহন", cElectricity: "বিদ্যুৎ", cRent: "ভাড়া / লিজ", cEmi: "ঋণের কিস্তি",
    cOtherEx: "অন্যান্য খরচ",
  },
};

export const makeT = (lang) => {
  const dict = STRINGS[lang] || STRINGS.en;
  return (key) => dict[key] ?? STRINGS.en[key] ?? key;
};

export const langName = (lang) => ({ en: "English", hi: "Hindi", bn: "Bengali" }[lang] || "English");
