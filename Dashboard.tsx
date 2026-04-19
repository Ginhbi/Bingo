import React, { useEffect, useState } from "react";
import { ref, push, set, serverTimestamp, onValue } from "firebase/database";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LogOut, Plus, Users, Trophy, PlayCircle, Dices } from "lucide-react";
import { generateBingoCard } from "../lib/bingoUtils";

export function Dashboard() {
  const { user, profile, signOut, dbError } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    const roomsRef = ref(db, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const roomsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by newest
        setRooms(roomsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      } else {
        setRooms([]);
      }
    }, (error) => {
      console.error("Firebase fetch rooms error:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !user) return;
    setIsCreating(true);

    try {
      const roomRef = push(ref(db, 'rooms'));
      const newCard = generateBingoCard();
      await set(roomRef, {
        name: roomName.trim(),
        hostId: user.uid,
        hostName: profile?.displayName || user.email,
        status: 'waiting', // waiting, playing, finished
        createdAt: serverTimestamp(),
        drawnNumbers: false, // will become array
        players: {
          [user.uid]: {
            displayName: profile?.displayName || user.email,
            joinedAt: serverTimestamp(),
            card: newCard,
            bingo: false
          }
        }
      });
      navigate(`/room/${roomRef.key}`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to create room.");
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="flex-1 h-full bg-slate-50 text-slate-900 p-4 shrink-0 box-border flex flex-col mx-auto w-full gap-4 overflow-hidden">
      {/* Header */}
      <header className="bg-white rounded-[20px] border border-slate-200 shadow-sm flex items-center justify-between px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bingo-neon rounded-full flex items-center justify-center font-black text-white text-xl shadow-md">
            B
          </div>
          <div>
            <div className="font-black text-xl tracking-tighter leading-none text-slate-900">BINGO MESTRE</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Multijogador em Tempo Real</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold text-slate-800">{profile?.displayName}</div>
            <div className="text-[10px] text-bingo-neon font-black uppercase tracking-widest">Pontos: {profile?.score || 0}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-bingo-neon"></div>
          <button 
            onClick={signOut}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden min-h-0">
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
          {dbError && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-[16px] text-sm font-medium shadow-sm flex flex-col gap-1 shrink-0">
              <span className="font-bold flex items-center gap-2">⚠️ {dbError}</span>
              <span className="text-red-500 text-xs">Vá no Console do Firebase &gt; Realtime Database &gt; Regras, e configure para permitir leitura e escrita (.read: true, .write: true para testes ou usando autenticação).</span>
            </div>
          )}

          {/* Create Room Section */}
          <section className="bg-white border border-slate-200 shadow-sm rounded-[20px] p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-center shrink-0">
            <div className="flex-1 w-full text-center lg:text-left">
              <h2 className="text-3xl font-black mb-2 text-slate-900">Olá, <span className="text-bingo-neon">{profile?.displayName}</span></h2>
              <p className="text-slate-500 mb-6 text-sm">Pronto para testar sua sorte hoje? Entre em uma sala ativa ou crie uma nova para convidar seus amigos e família.</p>
              
              <form onSubmit={handleCreateRoom} className="flex gap-2 flex-col sm:flex-row w-full max-w-md mx-auto lg:mx-0">
                <input 
                  type="text" 
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="ex: Bingo de Domingo"
                  required
                  className="flex-1 bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bingo-neon rounded-[16px] px-4 py-3 placeholder-slate-400 text-sm font-medium"
                />
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="bg-bingo-neon hover:bg-blue-600 shadow-lg shadow-blue-500/20 text-white font-bold px-6 py-3 rounded-[16px] flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 text-xs uppercase tracking-widest sm:w-auto w-full"
                >
                  <Plus size={16} />
                  <span>Criar Sala</span>
                </button>
              </form>
            </div>
            
            <div className="w-full lg:w-48 bg-slate-50 rounded-[20px] p-6 text-center border border-slate-200 shrink-0">
              <div className="text-4xl font-black text-bingo-gold mb-1">{profile?.gamesPlayed || 0}</div>
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Partidas Jogadas</div>
            </div>
          </section>

          {/* Active Rooms */}
          <section className="mt-2 flex-1 shrink-0">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[12px] uppercase tracking-[1.5px] text-slate-800 font-black flex items-center gap-2">
                <PlayCircle size={16} className="text-bingo-neon" />
                Salas Disponíveis
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
              {rooms.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 bg-white shadow-sm rounded-[20px] border border-dashed border-slate-300">
                  <Dices className="mx-auto mb-2 text-slate-300" size={32} />
                  <p className="text-sm font-medium">Nenhuma sala ativa no momento.</p>
                </div>
              ) : (
                rooms.map((room) => {
                  const isFinished = room.status === 'finished';
                  const isPlaying = room.status === 'playing';
                  const playerCount = room.players ? Object.keys(room.players).length : 0;
                  
                  return (
                    <motion.div 
                      whileHover={{ y: -2 }}
                      key={room.id}
                      className={`bg-white rounded-[16px] p-5 flex flex-col border shadow-sm transition-all ${isFinished ? 'opacity-50 border-slate-200' : 'border-slate-200 hover:shadow-md'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-base leading-tight line-clamp-2 pr-2">{room.name}</h4>
                        <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shrink-0 ${
                          isFinished ? 'bg-slate-100 text-slate-500' : 
                          isPlaying ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isFinished ? 'Concluído' : isPlaying ? 'Ao Vivo' : 'Aguardando'}
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="text-[11px] text-slate-500 font-medium mb-4 flex items-center gap-1.5">
                          <Users size={14} className="text-slate-400" /> 
                          <span className="font-bold">{playerCount} Jogadores</span> • {room.hostName || 'Desconhecido'}
                        </div>
                        
                        <button 
                          onClick={() => joinRoom(room.id)}
                          className={`w-full py-3 rounded-[12px] font-black transition-all text-[11px] uppercase tracking-widest ${
                            isFinished ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 
                            'bg-bingo-neon text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                          }`}
                        >
                          {isFinished ? 'Ver Resultados' : 'Entrar na Sala'}
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </section>
        </main>

        {/* Global Ranks Sidebar */}
        <aside className="w-full lg:w-[260px] bg-white border border-slate-200 shadow-sm rounded-[20px] p-6 hidden lg:block shrink-0">
          <h3 className="text-[12px] uppercase tracking-[1.5px] text-slate-800 font-black mb-4 flex items-center gap-2">
             <Trophy size={16} className="text-bingo-gold" /> Ranking Global
          </h3>
          <div className="text-slate-400 text-[10px] uppercase text-center mt-12 font-bold tracking-widest">
            Sincronização de Placar <br/> em breve...
          </div>
        </aside>

      </div>
    </div>
  );
}