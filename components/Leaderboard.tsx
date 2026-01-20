import React from 'react';
import { Student } from '../types';
import { Trophy, Medal } from 'lucide-react';

interface Props {
  students: Student[];
}

export const Leaderboard: React.FC<Props> = ({ students }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 shadow-2xl h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
        <Trophy className="w-8 h-8 text-torah-gold animate-pulse-slow" />
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-amber-200 to-amber-500">
          עשרת המובילים
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <ul className="space-y-3">
          {students.map((student, index) => {
            const isTop3 = index < 3;
            let iconColor = 'text-slate-400';
            if (index === 0) iconColor = 'text-yellow-400';
            if (index === 1) iconColor = 'text-gray-300';
            if (index === 2) iconColor = 'text-orange-400';

            return (
              <li 
                key={student.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${isTop3 ? 'bg-slate-800/80 border border-slate-600' : 'bg-slate-800/30'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`font-bold w-6 text-center ${iconColor}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{student.name}</div>
                    <div className="text-xs text-slate-400">{student.grade}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {index === 0 && <Medal className="w-4 h-4 text-yellow-400" />}
                    <span className="font-mono font-bold text-amber-500 text-xl">
                        {student.score.toLocaleString()}
                    </span>
                </div>
              </li>
            );
          })}
          {students.length === 0 && (
             <li className="text-center text-slate-500 py-4">עדיין אין נתונים</li>
          )}
        </ul>
      </div>
    </div>
  );
};
