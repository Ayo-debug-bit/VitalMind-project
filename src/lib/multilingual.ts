export type Locale = 'en' | 'yo' | 'ig' | 'ha' | 'pcm';

export interface TranslationSet {
  welcome: string;
  dashboard: string;
  moodTracker: string;
  wellnessHistory: string;
  helpLibrary: string;
  crisisMode: string;
  getHelpNow: string;
  inDistress: string;
  distressSub: string;
  trackNew: string;
  reportNew: string;
  moodLog: string;
  symptoms: string;
  intelligenceCenter: string;
  preventiveHealth: string;
  recentActivity: string;
  fullHistory: string;
  weeklyMonthlyReports: string;
  personalizedTips: string;
  streakTracker: string;
  trustedContact: string;
  drNotes: string;
  journalPrompts: string;
  medReminder: string;
  communityPoll: string;
  offlineIndicator: string;
  privacyScreen: string;
  baselineAssessment: string;
}

export const LANGUAGES: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Ígbò', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'pcm', name: 'Nigerian Pidgin', flag: '🇳🇬' }
];

export const TRANSLATIONS: Record<Locale, TranslationSet> = {
  en: {
    welcome: "Good day",
    dashboard: "Dashboard",
    moodTracker: "Mood Tracker",
    wellnessHistory: "Wellness History",
    helpLibrary: "Help Library",
    crisisMode: "Crisis Mode",
    getHelpNow: "Get Help Now",
    inDistress: "In Distress?",
    distressSub: "If you find it too hard to use the trackers right now, tap for immediate support.",
    trackNew: "Track New",
    reportNew: "Report New",
    moodLog: "Mood Log",
    symptoms: "Symptoms",
    intelligenceCenter: "Intelligence Center",
    preventiveHealth: "Preventive Health",
    recentActivity: "Recent Activity",
    fullHistory: "Full History",
    weeklyMonthlyReports: "Wellness Reports & Insights",
    personalizedTips: "Personalized Support Tip",
    streakTracker: "Check-in Streak Counter",
    trustedContact: "Trusted Safety Contacts",
    drNotes: "Doctor Notes & Consultations",
    journalPrompts: "Guided Journal Prompts",
    medReminder: "Medication & Supplement Alerts",
    communityPoll: "Anonymous Community Pulse",
    offlineIndicator: "Offline Mode Status",
    privacyScreen: "Privacy & Encryption Transparency",
    baselineAssessment: "Initial Baseline Assessment"
  },
  yo: {
    welcome: "Ẹ n lẹ o",
    dashboard: "Iwe Iṣakoso",
    moodTracker: "Olójúfò Iṣesi",
    wellnessHistory: "Ìtàn Alafia Rẹ",
    helpLibrary: "Ikáwé Ìrànlọ́wọ́",
    crisisMode: "Ìrànlọ́wọ́ Pajawiri",
    getHelpNow: "Gba Ìrànlọ́wọ́ Níyǐn",
    inDistress: "Ní Ìdààmú?",
    distressSub: "Tí o bá rí i pé o nira láti lo olójúfò alafia lọ́wọ́lọ́wọ́, tẹ ibi fun iranlọwọ lẹsẹkẹsẹ.",
    trackNew: "Ṣe Tuntun",
    reportNew: "Fi Èsì Tuntun",
    moodLog: "Iṣesi Rẹ",
    symptoms: "Awọn Àmì",
    intelligenceCenter: "Ibùdó Imọ-jinlẹ",
    preventiveHealth: "Ìlera Aláfíà",
    recentActivity: "Iṣẹ́ Láìpẹ́",
    fullHistory: "Gbogbo Ìtàn",
    weeklyMonthlyReports: "Àyẹ̀wò & Ìròyìn Alafia",
    personalizedTips: "Ìtọ́nisọ́nà Ìlera Kanṣoṣo",
    streakTracker: "Ìbáṣepọ̀ Ọjọ́ Gbigbasilẹ",
    trustedContact: "Àwọn Olubasọrọ Aláàbò",
    drNotes: "Àkọsílẹ̀ Dókítà & Àyẹ̀wò",
    journalPrompts: "Àwọn Ìbéèrè Atọ́nisọ́nà",
    medReminder: "Olùránnilétí Oògùn Rẹ",
    communityPoll: "Ojúfò Agbègbè Aláìlórúkọ",
    offlineIndicator: "Ipo Laisi Intanẹẹti",
    privacyScreen: "Àṣírí Data & Ìfiyèsí Alaye",
    baselineAssessment: "Àyẹ̀wò Ìbẹ̀rẹ̀ Aláfíà"
  },
  ig: {
    welcome: "Nnọọ",
    dashboard: "Onye Nchịkwa",
    moodTracker: "Usoro Obi",
    wellnessHistory: "Akụkọ Ahụike Gị",
    helpLibrary: "Ebe Enyemaka",
    crisisMode: "Enyemaka Ọsọọsọ",
    getHelpNow: "Nye Aka Ugbu A",
    inDistress: "Ị Nọ n'Ihe Ndihie?",
    distressSub: "Ọ bụrụ na ọ na-esiri gị ike iji usoro nlekọta ahụike anyị ugbu a, pịa maka enyemaka ngwa ngwa.",
    trackNew: "Tọọ Nke Ọhụrụ",
    reportNew: "Kọọ Nke Ọhụrụ",
    moodLog: "Ebe Ndekọ Obi",
    symptoms: "Mgbaàmà Gị",
    intelligenceCenter: "Ebe Ọgụgụ Isi",
    preventiveHealth: "Nlekọta Mgbochi",
    recentActivity: "Ihe Mere Na nso nso a",
    fullHistory: "Akụkọ Ezuru Ezu",
    weeklyMonthlyReports: "Akụkọ Ahụike Izu & Ọnwa",
    personalizedTips: "Atụmatụ Enyemaka Ahụike",
    streakTracker: "Nleba Anya Ọganihu Ụbọchị",
    trustedContact: "Ndị Nchebe Obi Gị",
    drNotes: "Ihe Ndide Dọkịta",
    journalPrompts: "Ajụjụ Nduzi Maka Ide Journal",
    medReminder: "Ihe Ncheta Ọgwụ Gị",
    communityPoll: "Nlele Obi Obodo Nwunye Anụ",
    offlineIndicator: "Ipo Enweghị Ịntanetị",
    privacyScreen: "Nzuzo Data & Nchebe Ọha",
    baselineAssessment: "Nnyocha Mbụ Nke Ahụike"
  },
  ha: {
    welcome: "Barka da rana",
    dashboard: "Allon Gudanarwa",
    moodTracker: "Bibiyar Yanayi",
    wellnessHistory: "Tarihin Lafiyarka",
    helpLibrary: "Laburaren Taimako",
    crisisMode: "Gaggawar Neman Taimako",
    getHelpNow: "Sami Taimako Yanzu",
    inDistress: "Kuna cikin Matsala?",
    distressSub: "Idan yana muku wahala ku yi amfani da na'uran a halin yanzu, danna nan don taimako na gaggawa.",
    trackNew: "Bincika Sabo",
    reportNew: "Ruhoto Sabo",
    moodLog: "Yanayin Zuciya",
    symptoms: "Alamomin Lafiya",
    intelligenceCenter: "Cibiyar Hikima",
    preventiveHealth: "Kariya da Rigakafi",
    recentActivity: "Ayyukan Kwanan Nan",
    fullHistory: "Cikakken Tarihi",
    weeklyMonthlyReports: "Rahoton Lafiya na Sati & Wata",
    personalizedTips: "Hanyoyin Kula da Lafiya",
    streakTracker: "Bibiyar Kwanaki a Jere",
    trustedContact: "Amintattun Lambobin Sadarwa",
    drNotes: "Bayanin Likita da Alƙawura",
    journalPrompts: "Yarjejeniyar Tambayoyi",
    medReminder: "Tuna Shan Magani na Kullum",
    communityPoll: "Yanayin Al'umma na Sirri",
    offlineIndicator: "Yanayin Lada ba Intanet",
    privacyScreen: "Sirrin Bayanai da Fassara",
    baselineAssessment: "Gwajin Matakin Lafiya na Farko"
  },
  pcm: {
    welcome: "How body",
    dashboard: "Dashboard",
    moodTracker: "Mood Tracker",
    wellnessHistory: "Wellness History",
    helpLibrary: "Help Library",
    crisisMode: "Help for Emergency",
    getHelpNow: "Get Help Now",
    inDistress: "You dey Distress?",
    distressSub: "If body dey do you some how and trackers hard to use now, tap for quick support.",
    trackNew: "Track New One",
    reportNew: "Report New One",
    moodLog: "Mood Log",
    symptoms: "How Body Dey Feel",
    intelligenceCenter: "Sense Center",
    preventiveHealth: "Safe Advise",
    recentActivity: "Wetain You Do Recently",
    fullHistory: "Full History",
    weeklyMonthlyReports: "Reports and Insights",
    personalizedTips: "Advice as You Dey Feel",
    streakTracker: "Active Day Counter",
    trustedContact: "Safe Contact People",
    drNotes: "Doctor Notes & Checking",
    journalPrompts: "Journal Writing Guide",
    medReminder: "Medicine Supplement Prompter",
    communityPoll: "People Balloting Poll",
    offlineIndicator: "Offline Mode Checker",
    privacyScreen: "Data Privacy & Protection",
    baselineAssessment: "First Health Assessment Check"
  }
};
