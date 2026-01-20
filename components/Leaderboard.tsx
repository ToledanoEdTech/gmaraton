import React from 'react';
import { Student } from '../types';
import { Trophy, Medal, Crown, Award, Star } from 'lucide-react';

interface Props {
  students: Student[];
}

// Mapping of positions to Hebrew titles
const POSITION_TITLES: { [key: number]: string } = {
  1: 'צורבא מרבנן',
  2: 'לא פסיק פומיה מגירסא',
  3: 'סיני ועוקר הרים',
  4: 'גמיר וסביר',
  5: 'בור סוד שאינו מאבד טיפה'
};

// Icons for top 5 positions
const POSITION_ICONS: { [key: number]: React.ReactNode } = {
  1: <Crown className="w-5 h-5 text-yellow-400" />,
  2: <Medal className="w-5 h-5 text-gray-300" />,
  3: <Award className="w-5 h-5 text-orange-400" />,
  4: <Star className="w-5 h-5 text-blue-400" />,
  5: <Star className="w-4 h-4 text-purple-400" />
};

// Colors for top 5 positions
const POSITION_COLORS: { [key: number]: string } = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-orange-400',
  4: 'text-blue-400',
  5: 'text-purple-400'
};

// Background colors for top 5 positions
const POSITION_BG_COLORS: { [key: number]: string } = {
  1: 'bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/40',
  2: 'bg-gradient-to-r from-gray-400/20 via-gray-400/10 to-transparent border-gray-400/40',
  3: 'bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent border-orange-500/40',
  4: 'bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/40',
  5: 'bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/40'
};

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
            const position = index + 1;
            const isTop5 = position <= 5;
            const isTop3 = position <= 3;
            const title = POSITION_TITLES[position];
            const icon = POSITION_ICONS[position];
            const titleColor = POSITION_COLORS[position] || 'text-slate-400';
            const bgColor = POSITION_BG_COLORS[position] || 'bg-slate-800/30';
            const borderColor = isTop5 ? 'border' : '';

            return (
              <li 
                key={student.id} 
                className={`flex flex-col p-4 rounded-xl transition-all duration-300 ${
                  isTop5 
                    ? `${bgColor} ${borderColor} shadow-lg hover:shadow-xl hover:scale-[1.02]` 
                    : 'bg-slate-800/30 hover:bg-slate-800/50'
                }`}
              >
                {/* Title/Position Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isTop5 && icon && (
                      <div className="flex-shrink-0">
                        {icon}
                      </div>
                    )}
                    {isTop5 && title ? (
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-base md:text-lg leading-relaxed ${titleColor} text-right break-words`}>
                          {title}
                        </div>
                      </div>
                    ) : (
                      <div className={`font-bold text-xl text-center w-10 flex-shrink-0 ${titleColor}`}>
                        {position}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {position === 1 && <Medal className="w-5 h-5 text-yellow-400" />}
                    <span className="font-mono font-bold text-amber-500 text-xl">
                      {student.score.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* Student Info Row */}
                <div className="flex items-center justify-between">
                  <div className="text-right flex-1">
                    <div className="font-bold text-white text-lg">{student.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{student.grade}</div>
                  </div>
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
