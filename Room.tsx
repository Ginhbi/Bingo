import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, set, update, get } from "firebase/database";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { BingoCardComponent } from "../components/BingoCard";
import { BingoCard as IBingoCard, generateBingoCard, checkBingo, drawNextCombinations } from "../lib/bingoUtils";
import { Chat } from "../components/Chat";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Flag, Play, Users, Trophy, Dices } from "lucide-react";

export function Room() {
  const { roomId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [myCard, setMyCard] = useState<IBingoCard | null>(null);
  const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set());
  const [hasBingoLocal, setHasBingoLocal] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setRoom(data);
        
        const myPlayerData = data.players?.[user.uid];
        // Auto-initialize my player state if missing
        if (!myPlayerData?.card && !myCard) {
          joinRoomAsPlayer(roomId, user.uid);
        } else if (myPlayerData?.card && !myCard) {
          setMyCard(myPlayerData.card);
        }

      } else {
        navigate('/'); // Room not found
      }
    }, (error) => {
      console.error("Firebase Room error:", error);
    });

    return () => unsubscribe();
  }, [roomId, user]);

  const joinRoomAsPlayer = async (rId: string, uId: string) => {
    const card = generateBingoCard();
    setMyCard(card); // Local optimistic update
    await update(ref(db, `rooms/${rId}/players/${uId}`), {
      displayName: profile?.displayName || user?.email,
      card,
      bingo: false
    });
  };

  const isHost = room?.hostId === user?.uid;
  const drawnNumbers = room?.drawnNumbers ? Object.values(room.drawnNumbers) as number[] : [];
  const latestDrawn = drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null;

  const handleNumberClick = (num: number) => {
    if (room?.status !== 'playing') return;
    
    setMarkedNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(num)) {
        newSet.delete(num);
      } else {
        newSet.add(num);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (myCard && room?.status === 'playing') {
      const validMarked = (Array.from(markedNumbers) as number[]).filter((n: number) => drawnNumbers.includes(n));
      const hasWon = checkBingo(myCard, validMarked);
      setHasBingoLocal(hasWon);
    }
  }, [markedNumbers, myCard, drawnNumbers, room?.status]);

  const declareBingo = async () => {
    if (!hasBingoLocal || !roomId || !user || room.status === 'finished') return;
    confetti({ particleCount: 200, spread: 90, zIndex: 9999, colors: ['#3B82F6', '#F59E0B', '#10B981'] });
    
    const roomRef = ref(db, `rooms/${roomId}`);
    await update(roomRef, {
      status: 'finished',
      [`winners/${user.uid}`]: true
    });
    await update(ref(db, `rooms/${roomId}/players/${user.uid}`), {
      bingo: true
    });
    
    await update(ref(db, `users/${user.uid}`), {
      score: (profile?.score || 0) + 1
    });
  };

  const startGame = async () => {
    if (!isHost || !roomId) return;
    await update(ref(db, `rooms/${roomId}`), {
      status: 'playing',
      drawnNumbers: false // Reset
    });
  };

  const drawNumber = async () => {
    if (!isHost || !roomId || room.status !== 'playing') return;
    const nextNum = drawNextCombinations(drawnNumbers);
    if (nextNum === 0) return; // All drawn
    
    const newIdx = drawnNumbers.length;
    await set(ref(db, `rooms/${roomId}/drawnNumbers/${newIdx}`), nextNum);
  };

  if (!room) return <div className="flex-1 h-full bg-slate-50 flex items-center justify-center font-bold text-slate-800">Carregando...</div>;

  const playersList = Object.values(room.players || {});

  return (
    <div className="flex-1 h-full bg-slate-50 text-slate-900 p-4 shrink-0 box-border flex flex-col mx-auto w-full gap-4 overflow-hidden">
      
      {/* Top Navbar */}
      <header className="bg-white rounded-[20px] border border-slate-200 shadow-sm flex items-center justify-between px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors flex items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wide leading-tight text-slate-900">{room.name}</h1>
            <div className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${room.status === 'playing' ? 'text-bingo-neon' : 'text-slate-500'}`}>
              STATUS: {room.status === 'finished' ? 'CONCLUÍDO' : room.status === 'playing' ? 'AO VIVO' : 'AGUARDANDO'}
            </div>
          </div>
        </div>
        
        {isHost && room.status === 'waiting' && (
          <button 
            onClick={startGame}
            className="bg-bingo-neon hover:bg-blue-600 text-white px-6 py-2.5 rounded-[12px] font-bold uppercase text-[10px] tracking-[1px] shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
          >
            Iniciar Jogo
          </button>
        )}
        
        {isHost && room.status === 'playing' && (
          <button 
            onClick={drawNumber}
            className="bg-bingo-gold hover:bg-amber-400 text-white px-6 py-2.5 rounded-[12px] font-bold uppercase text-[10px] tracking-[1px] shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-transform active:scale-95"
          >
            <Dices size={16} /> Sortear
          </button>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 container mx-auto pr-1">
        
        {/* Left Info Panel (Desktop) */}
        <aside className="hidden lg:flex flex-col w-[260px] bg-white border border-slate-200 rounded-[20px] p-6 shrink-0 h-full overflow-y-auto">
          <h3 className="text-[12px] uppercase tracking-[1.5px] text-slate-800 font-black mb-4">INFO DA SALA</h3>
          <div className="space-y-4">
             <div>
               <div className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Anfitrião</div>
               <div className="font-bold text-sm mt-1 text-slate-900">{room.hostName}</div>
             </div>
             <div>
               <div className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Jogadores</div>
               <div className="font-bold text-sm mt-1 text-slate-900">{playersList.length}</div>
             </div>
             <div>
               <div className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Status</div>
               <div className="font-bold text-sm mt-1 capitalize text-slate-900">{room.status === 'finished' ? 'Concluído' : room.status === 'playing' ? 'Ao vivo' : 'Aguardando'}</div>
             </div>
          </div>
          
          <h3 className="text-[12px] uppercase tracking-[1.5px] text-slate-800 font-black mt-8 mb-4">JOGADORES</h3>
          <div className="flex-1 flex flex-col gap-2 text-sm overflow-y-auto pr-2">
            {playersList.map((p: any, i) => (
              <div key={i} className="flex justify-between border-b border-slate-100 py-2">
                 <span className="font-medium text-slate-700">{p.displayName}</span>
                 {p.bingo && <span className="text-[10px] text-bingo-gold font-black uppercase">VENCEU</span>}
              </div>
            ))}
          </div>
        </aside>

        {/* Center Main Action */}
        <main className="flex-1 flex flex-col gap-4 min-w-0">
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400 rounded-[20px] p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center justify-between shadow-lg min-h-[140px] text-white gap-y-4 gap-x-2 shrink-0">
            
            <div className="flex flex-col items-center w-1/2 sm:w-auto">
              <div className="text-[10px] uppercase opacity-80 mb-2 font-bold tracking-wider text-white">Agora</div>
              <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] bg-white rounded-full text-bingo-neon flex flex-col items-center justify-center shadow-lg relative">
                 <AnimatePresence mode="popLayout">
                   {latestDrawn ? (
                     <motion.div
                       key={latestDrawn}
                       initial={{ scale: 0, rotate: -180 }}
                       animate={{ scale: 1, rotate: 0 }}
                       exit={{ scale: 0, opacity: 0 }}
                       transition={{ type: "spring", stiffness: 200, damping: 15 }}
                       className="text-4xl sm:text-5xl font-black font-sans z-10 leading-none mt-2"
                     >
                       {latestDrawn}
                     </motion.div>
                   ) : (
                     <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2">...</span>
                   )}
                 </AnimatePresence>
              </div>
            </div>

            <div className="w-full sm:flex-1 order-last sm:order-none flex flex-col items-center sm:items-start px-2 sm:px-8">
               <div className="text-[9px] sm:text-[10px] uppercase opacity-80 mb-2 font-bold tracking-wider text-white">Últimos Sorteados</div>
               <div className="flex gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                 {drawnNumbers.slice(0, -1).reverse().slice(0, 5).map((num, idx) => (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     key={`${num}-${idx}`} 
                     className="w-[36px] h-[36px] sm:w-[45px] sm:h-[45px] bg-white/20 border border-white/30 shrink-0 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm text-white shadow-sm"
                   >
                     {num}
                   </motion.div>
                 ))}
                 {drawnNumbers.length <= 1 && <div className="text-white/50 italic text-xs sm:text-sm font-medium">Nenhum histórico</div>}
               </div>
            </div>

            <div className="w-1/2 sm:w-auto flex justify-center">
              <button 
                disabled={!hasBingoLocal}
                onClick={declareBingo}
                className={`font-black px-5 sm:px-8 py-3 sm:py-4 rounded-[14px] sm:rounded-[16px] shadow-lg border-b-4 uppercase tracking-widest text-xs sm:text-lg transition-all active:translate-y-1 active:border-b-0 ${
                  hasBingoLocal ? 'bg-red-500 text-white border-red-700 animate-pulse' : 'bg-white/10 text-white/40 border-transparent shadow-none'
                }`}
              >
                BINGO!
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-[20px] p-4 flex items-center justify-center relative overflow-y-auto">
            {myCard ? (
              <BingoCardComponent 
                card={myCard} 
                drawnNumbers={drawnNumbers} 
                onNumberClick={handleNumberClick}
                markedNumbers={markedNumbers}
              />
            ) : (
               <div className="text-slate-400 text-sm font-bold">Carregando cartela...</div>
            )}
            
            {room.status === 'finished' && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-8 rounded-[20px]">
                <div className="bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 px-12 py-8 rounded-[24px] shadow-xl border-4 border-amber-200">
                  <div className="text-4xl font-black uppercase mb-4 tracking-tighter">Fim de Jogo!</div>
                  <div className="text-sm font-bold uppercase tracking-widest opacity-80">Vencedores</div>
                  <div className="text-3xl font-black mt-2">
                    {Object.keys(room.winners || {}).map(winId => room.players?.[winId]?.displayName).join(', ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Chat Panel */}
        <aside className="w-full lg:w-[260px] bg-white border border-slate-200 shadow-sm rounded-[20px] p-4 flex flex-col shrink-0 h-[280px] lg:h-full overflow-hidden">
          <h3 className="text-[12px] uppercase tracking-[1.5px] text-slate-800 font-black mb-3 shrink-0">CHAT DA SALA</h3>
          <Chat roomId={roomId || ''} />
        </aside>

      </div>
    </div>
  );
}

