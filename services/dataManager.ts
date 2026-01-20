import { Student, ClassSummary, ClassGrade, HistoryEntry } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

const HISTORY_KEY = 'gemarathon_history_v1';

// We no longer store students in localStorage as primary source.
// We only use localStorage for History.

export const fetchStudentsFromSheet = async (): Promise<Student[]> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    console.warn("Google Script URL is not configured.");
    return [];
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log("Raw data from sheet:", data); // Debug log
    
    if (Array.isArray(data)) {
      // Relaxed filtering:
      // 1. We map first to handle data cleaning
      // 2. We allow students with 0 score or invalid score (defaulting to 0) to ensure names appear
      return data
        .map((s: any) => {
           // Must have a name
           if (!s.name || s.name.toString().trim() === '') return null;
           
           // safe score parsing
           let parsedScore = Number(s.score);
           if (isNaN(parsedScore)) {
              console.warn(`Invalid score for student ${s.name}: ${s.score}. Defaulting to 0.`);
              parsedScore = 0;
           }

           return {
              id: s.id || `temp_${Math.random().toString(36).substr(2, 9)}`, // Ensure ID exists
              name: s.name.toString().trim(),
              grade: s.grade || 'Unknown',
              score: parsedScore
           };
        })
        .filter((s: any) => s !== null) as Student[];
    }
    
    return [];
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return [];
  }
};

export const updateStudentScoreInSheet = async (student: Student, points: number): Promise<boolean> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    alert("Please configure the Google Apps Script URL in constants.ts");
    return false;
  }

  try {
    // We use no-cors or text/plain to avoid complex CORS preflight issues with GAS
    // Note: GAS doPost must handle the request payload accordingly.
    const payload = JSON.stringify({
      name: student.name,
      grade: student.grade,
      points: points
    });

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain', 
      },
    });
    
    // With GAS text/plain, we might receive an opaque response or a JSON text.
    // If we get here without error, we assume success or check response if possible.
    const result = await response.json();
    return result.result === 'success';
  } catch (error) {
    console.error("Failed to update score:", error);
    return false;
  }
};

export const getStoredHistory = (): HistoryEntry[] => {
  const stored = localStorage.getItem(HISTORY_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

export const saveHistory = (history: HistoryEntry[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const calculateClassSummaries = (students: Student[]): ClassSummary[] => {
  const map = new Map<string, number>();
  const countMap = new Map<string, number>();
  const grades = new Set<string>();

  students.forEach(s => {
    grades.add(s.grade);
    const currentScore = map.get(s.grade) || 0;
    const currentCount = countMap.get(s.grade) || 0;
    map.set(s.grade, currentScore + s.score);
    countMap.set(s.grade, currentCount + 1);
  });

  return Array.from(grades).map(grade => ({
    grade,
    totalScore: map.get(grade) || 0,
    studentCount: countMap.get(grade) || 0
  })).sort((a, b) => b.totalScore - a.totalScore);
};

export const getTopStudents = (students: Student[], limit: number = 10): Student[] => {
  return [...students].sort((a, b) => b.score - a.score).slice(0, limit);
};

export const exportToCSV = (students: Student[]) => {
  const headers = ['ID', 'שם התלמיד', 'כיתה', 'ניקוד'];
  const rows = students.map(s => [s.id, s.name, s.grade, s.score]);
  
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += headers.join(",") + "\r\n";
  
  rows.forEach(row => {
    csvContent += row.join(",") + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "gemarathon_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};