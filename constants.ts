import { Student } from './types';

// Password for admin actions
export const ADMIN_PASSWORD = "zviagmara123";

// ---------------------------------------------------------
// Google Apps Script Web App URL
// ---------------------------------------------------------
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvXpFcjGPktAZ3lOEBpm9Ja80czaBLQl3h1hMLDjWuTUmTu5eD28nEh1JsV17oxamBzA/exec"; 

// Initial Mock Data is empty now. Data comes from Google Sheets.
export const INITIAL_STUDENTS: Student[] = [];

// --- סוגיות וכרטיסיות ---
export const TOTAL_SUGIOT = 35;
export const TOTAL_KARTISIOT = 11;
export const POINTS_PER_SUGIA = 10;
export const POINTS_PER_KARTISIA = 10;
/** בונוס לכיתה כשכל התלמידים מסיימים סוגיה או כרטיסייה */
export const BONUS_FOR_FULL_CLASS_COMPLETION = 300;
