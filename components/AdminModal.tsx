import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import { X, Check, Lock, Save, AlertTriangle, Search, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAddPoints: (studentId: string, points: number) => void;
  onExport: () => void;
}

export const AdminModal: React.FC<Props> = ({ isOpen, onClose, students, onAddPoints, onExport }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [pointsToAdd, setPointsToAdd] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        setSearchQuery("");
        setPointsToAdd('');
        setSelectedStudentId("");
        setSearchResults([]);
        setSelectedStudent(null);
        setIsSearchFocused(false);
        setSuccessMessage("");
        setIsSubmitting(false);
        setIsAuthenticated(false);
        setPasswordInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("סיסמא שגויה");
      setPasswordInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentId && pointsToAdd && typeof pointsToAdd === 'number' && !isSubmitting) {
      setIsSubmitting(true);
      setSuccessMessage("");

      try {
        await onAddPoints(selectedStudentId, pointsToAdd);
        const student = students.find(s => s.id === selectedStudentId);
        setSuccessMessage(`✓ ${pointsToAdd} נקודות נוספו ל${student?.name || 'התלמיד'}`);
        setPointsToAdd('');
        setSelectedStudentId("");
        setSelectedStudent(null);
        setSearchQuery("");
        setSearchResults([]);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        alert("שגיאה בעדכון הניקוד. אנא נסה שוב.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 0) {
      const filtered = students.filter(s =>
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.grade.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setSearchResults(filtered);
      if (filtered.length === 1 && filtered[0].name.toLowerCase() === q.toLowerCase()) {
        setSelectedStudent(filtered[0]);
        setSelectedStudentId(filtered[0].id);
      } else {
        setSelectedStudent(null);
        setSelectedStudentId("");
      }
    } else {
      setSearchResults([]);
      setSelectedStudent(null);
      setSelectedStudentId("");
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSelectedStudentId(student.id);
    setSearchQuery(student.name);
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-800 p-3 md:p-4 flex justify-between items-center border-b border-slate-700 shrink-0">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-white">
            <Lock className="w-5 h-5 text-amber-500" />
            ממשק ניהול
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto">
          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <Lock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400">אנא הזן סיסמת מנהל לביצוע שינויים</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">סיסמא</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  placeholder="****"
                />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-amber-900/20">
                כניסה למערכת
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              
              {students.length === 0 && (
                  <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      לא נטענו תלמידים. וודא שהחיבור תקין.
                  </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-300 p-3 rounded-lg text-center animate-in slide-in-from-top-2">
                  {successMessage}
                </div>
              )}

              {/* Add Points Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">חפש תלמיד</label>
                    <div className="relative">
                      <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 flex items-center gap-3 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="הקלד שם או כיתה..."
                          className="bg-transparent w-full text-white outline-none"
                          value={searchQuery}
                          onChange={handleSearch}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        />
                      </div>

                      {/* Search Results Dropdown */}
                      {isSearchFocused && searchQuery.length > 0 && searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-amber-500/30 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                          <div className="p-2">
                            {searchResults.map((student) => (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => handleSelectStudent(student)}
                                className="w-full text-right p-3 hover:bg-slate-800 rounded-lg transition-all flex items-center justify-between group"
                              >
                                <div className="text-left">
                                  <span className="text-xl font-bold text-amber-500">{student.score.toLocaleString()}</span>
                                  <span className="text-xs text-slate-500 block">נקודות</span>
                                </div>
                                <div className="flex-1 text-right mr-4">
                                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">{student.name}</h3>
                                  <p className="text-slate-400 text-sm">{student.grade}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Selected Student Display */}
                 {selectedStudent ? (
                   <div className="bg-slate-800/50 border border-amber-500/30 rounded-lg p-4">
                     <div className="flex justify-between items-center">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500 border border-amber-500/30">
                           <Sparkles className="w-6 h-6" />
                         </div>
                         <div>
                           <h3 className="text-xl font-bold text-white">{selectedStudent.name}</h3>
                           <p className="text-slate-400 text-sm">{selectedStudent.grade}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <span className="block text-3xl font-black text-amber-500">{selectedStudent.score.toLocaleString()}</span>
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">נקודות נוכחיות</span>
                       </div>
                     </div>
                   </div>
                 ) : searchQuery.length > 0 && searchResults.length === 0 ? (
                   <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 text-center">
                     <p className="text-slate-400">לא נמצאו תלמידים התואמים לחיפוש</p>
                   </div>
                 ) : null}

                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">נקודות להוספה</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500"
                      value={pointsToAdd}
                      onChange={(e) => setPointsToAdd(Number(e.target.value))}
                      placeholder="0"
                      required
                      min="1"
                    />
                 </div>

                 <button
                   type="submit"
                   disabled={!selectedStudentId || isSubmitting}
                   className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
                 >
                   {isSubmitting ? (
                     <>
                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       מעדכן...
                     </>
                   ) : (
                     <>
                       <Check className="w-5 h-5" />
                       עדכן ניקוד
                     </>
                   )}
                 </button>
              </form>

              <div className="pt-4 border-t border-slate-700">
                <button
                  onClick={onExport}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-5 h-5" />
                  ייצוא נתונים לאקסל
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
