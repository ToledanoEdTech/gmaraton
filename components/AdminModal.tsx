import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import { X, Check, Lock, Save, AlertTriangle } from 'lucide-react';

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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        setSearchQuery("");
        setPointsToAdd('');
        setSelectedStudentId("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentId && pointsToAdd && typeof pointsToAdd === 'number') {
      onAddPoints(selectedStudentId, pointsToAdd);
      setPointsToAdd('');
      alert("הנקודות עודכנו בהצלחה!");
    }
  };

  const filteredStudents = (students || []).filter(s => 
    (s.name || "").includes(searchQuery) || (s.grade || "").includes(searchQuery)
  );

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

              {/* Add Points Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">חפש תלמיד</label>
                    <input 
                      type="text" 
                      placeholder="הקלד שם או כיתה..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">בחר תלמיד מהרשימה</label>
                    <div className="relative">
                        <select 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        required
                        size={6} 
                        style={{ minHeight: '150px' }}
                        >
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map(s => (
                                <option key={s.id} value={s.id} className="p-2 hover:bg-slate-800 rounded cursor-pointer border-b border-slate-800/50">
                                {s.name} - {s.grade} (נ: {s.score})
                                </option>
                            ))
                        ) : (
                            <option disabled className="p-2 text-slate-500">לא נמצאו תלמידים</option>
                        )}
                        </select>
                    </div>
                 </div>

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

                 <button type="submit" disabled={!selectedStudentId} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20">
                   <Check className="w-5 h-5" />
                   עדכן ניקוד
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
