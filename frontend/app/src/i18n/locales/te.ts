import { en } from './en';

export const te: typeof en = {
  ...en,
  common: {
    ...en.common,
    appName: 'కారికర్ సాథీ',
    tagline: 'చేతివృత్తుల డిజిటలైజేషన్ మరియు క్రాఫ్ట్ పాస్‌పోర్ట్',
    back: 'వెనుకకు',
    continue: 'కొనసాగించండి',
    saveDraft: 'డ్రాఫ్ట్ సేవ్ చేయండి',
    savedDraft: 'డ్రాఫ్ట్ సేవ్ చేయబడింది',
    cancel: 'రద్దు చేయండి',
    confirm: 'ధృవీకరించండి',
    retry: 'మళ్ళీ ప్రయత్నించండి',
    listen: 'వినండి',
    stopListening: 'ఆడియో ఆపండి',
    synced: 'సింక్ చేయబడింది',
    pendingSync: 'సింక్ పెండింగ్‌లో ఉంది',
    offline: 'ఆఫ్‌లైన్ మోడ్',
  },
  auth: {
    ...en.auth,
    title: 'కారికర్ సాథీకి స్వాగతం',
    subtitle: 'మీ వర్క్‌షాప్ యాక్సెస్ చేయడానికి నమోదిత మొబైల్ నంబర్ నమోదు చేయండి.',
    emailSubtitle: 'మీ వర్క్‌షాప్ యాక్సెస్ చేయడానికి నమోదిత ఇమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి.',
    phoneLabel: 'మొబైల్ నంబర్',
    sendOtp: 'ధృవీకరణ కోడ్ పంపండి',
    verifyAndEnter: 'ధృవీకరించి ప్రవేశించండి',
  },
  language: {
    ...en.language,
    chooseTitle: 'మీ భాషను ఎంచుకోండి',
    chooseSubtitle: 'కారికర్ సాథీలో కొనసాగడానికి మీకు నచ్చిన భాషను ఎంచుకోండి.',
  },
  dashboard: {
    ...en.dashboard,
    greeting: 'నమస్కారం, {{name}}',
    addNewProduct: 'కొత్త ఉత్పత్తిని జోడించండి',
    resumeDraft: 'డ్రాఫ్ట్ కొనసాగించండి',
  },
};
