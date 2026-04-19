import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { BingoCard } from '../lib/bingoUtils';

export function BingoCardComponent({ card, drawnNumbers, onNumberClick, markedNumbers }: { 
  card: BingoCard, 
  drawnNumbers: number[], 
  onNumberClick: (num: number) => void,
  markedNumbers: Set<number>
}) {
  const columns = ['B', 'I', 'N', 'G', 'O'] as const;
  
  return (
    <div className="bg-white p-[12px] sm:p-[20px] rounded-[24px] border border-slate-200 text-slate-900 w-full max-w-sm mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {/* Headers */}
        {columns.map((letter) => (
          <div key={letter} className="text-center font-black text-xl sm:text-2xl pb-2 text-bingo-neon">
            {letter}
          </div>
        ))}
        
        {/* Cells - Processed row by row for grid layouts */}
        {[0, 1, 2, 3, 4].map(rowIndex => (
          columns.map((colKey, colIndex) => {
            const num = card[colKey.toLowerCase() as keyof BingoCard][rowIndex];
            const isFreeSpace = num === 0;
            const isMarked = isFreeSpace || markedNumbers.has(num);
            
            return (
              <motion.button
                whileTap={{ scale: 0.9 }}
                key={`${colIndex}-${rowIndex}`}
                onClick={() => !isFreeSpace && onNumberClick(num)}
                disabled={isFreeSpace}
                className={cn(
                  "aspect-square rounded-[12px] flex items-center justify-center font-bold text-sm sm:text-lg lg:text-xl transition-all border outline-none select-none",
                  isFreeSpace 
                    ? "bg-bingo-gold text-white border-transparent text-[10px] sm:text-xs uppercase shadow-md" 
                    : isMarked 
                      ? "bg-bingo-neon text-white border-bingo-neon scale-95 shadow-[0_4px_15px_rgba(59,130,246,0.3)]" 
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                )}
              >
                {isFreeSpace ? 'LIVRE' : num}
              </motion.button>
            );
          })
        ))}
      </div>
    </div>
  );
}
