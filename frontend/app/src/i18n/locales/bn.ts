import { en } from './en';

export const bn: typeof en = {
  ...en,
  common: {
    ...en.common,
    appName: 'কারিগর সাথী',
    tagline: 'কারুশিল্পী ডিজিটাইজেশন এবং ক্রাফট পাসপোর্ট',
    back: 'পিছনে',
    continue: 'এগিয়ে যান',
    saveDraft: 'খসড়া সংরক্ষণ করুন',
    savedDraft: 'খসড়া সংরক্ষিত',
    cancel: 'বাতিল',
    confirm: 'নিশ্চিত করুন',
    retry: 'আবার চেষ্টা করুন',
    listen: 'শুনুন',
    stopListening: 'অডিও বন্ধ করুন',
    synced: 'সিঙ্ক হয়েছে',
    pendingSync: 'সিঙ্ক বাকি আছে',
    offline: 'অফলাইন মোড',
  },
  auth: {
    ...en.auth,
    title: 'কারিগর সাথীতে প্রবেশ করুন',
    subtitle: 'আপনার কর্মশালায় প্রবেশ করতে নিবন্ধিত মোবাইল নম্বর দিন।',
    emailSubtitle: 'আপনার কর্মশালায় প্রবেশ করতে নিবন্ধিত ইমেল এবং পাসওয়ার্ড দিন।',
    phoneLabel: 'মোবাইল নম্বর',
    sendOtp: 'যাচাইকরণ কোড পাঠান',
    verifyAndEnter: 'যাচাই করে প্রবেশ করুন',
  },
  language: {
    ...en.language,
    chooseTitle: 'আপনার ভাষা নির্বাচন করুন',
    chooseSubtitle: 'কারিগর সাথীতে চালিয়ে যেতে ভাষা পছন্দ করুন।',
  },
  dashboard: {
    ...en.dashboard,
    greeting: 'নমস্কার, {{name}}',
    addNewProduct: 'নতুন পণ্য যোগ করুন',
    resumeDraft: 'খসড়া শুরু করুন',
  },
};
