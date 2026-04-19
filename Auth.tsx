import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase";
import { motion } from "motion/react";
import { Mail, Lock, User, Monitor, Smartphone } from "lucide-react";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'mobile'>(
    (localStorage.getItem('bingoDeviceLayout') as 'desktop' | 'mobile') || 'desktop'
  );

  const handleLayoutToggle = (mode: 'desktop' | 'mobile') => {
    setLayoutMode(mode);
    localStorage.setItem('bingoDeviceLayout', mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
      }
      // Force reload to apply layout switch nicely to the App wrapper
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden"
      >
        <div className="p-8 text-center relative overflow-hidden flex flex-col items-center">
          <div className="w-[80px] h-[80px] bg-bingo-neon rounded-full flex flex-col items-center justify-center font-black text-white text-4xl mb-4 shadow-lg">
            B
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1 text-slate-900">Bingo em Família</h1>
          <p className="text-xs text-slate-500 tracking-widest uppercase font-bold">Multijogador em Tempo Real</p>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-200">
                {error}
              </div>
            )}

            {/* Layout Choice */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-2">Jogar pelo:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleLayoutToggle('desktop')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${layoutMode === 'desktop' ? 'border-bingo-neon bg-blue-50 text-bingo-neon' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                >
                  <Monitor size={18} /> Computador
                </button>
                <button
                  type="button"
                  onClick={() => handleLayoutToggle('mobile')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${layoutMode === 'mobile' ? 'border-bingo-neon bg-blue-50 text-bingo-neon' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                >
                  <Smartphone size={18} /> Celular
                </button>
              </div>
            </div>
            
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Apelido</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-3 focus-within:border-bingo-neon focus-within:ring-1 focus-within:ring-bingo-neon transition-all">
                  <User className="text-slate-400 mr-2 shrink-0" size={18} />
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400 text-sm" 
                    placeholder="Ganhador Sortudo" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">E-mail</label>
              <div className="flex bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-3 focus-within:border-bingo-neon focus-within:ring-1 focus-within:ring-bingo-neon transition-all">
                <Mail className="text-slate-400 mr-2 shrink-0" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400 text-sm" 
                  placeholder="você@email.com" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Senha</label>
              <div className="flex bg-slate-50 border border-slate-200 rounded-[20px] px-4 py-3 focus-within:border-bingo-neon focus-within:ring-1 focus-within:ring-bingo-neon transition-all">
                <Lock className="text-slate-400 mr-2 shrink-0" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400 text-sm" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-bingo-neon hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 border-none rounded-[20px] font-bold py-4 mt-8 text-sm tracking-[1px] uppercase transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Entrar na Sala' : 'Criar Conta'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-500 font-medium text-xs">
            {isLogin ? "Não tem uma conta?" : "Já possui conta?"}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-bingo-neon font-bold uppercase tracking-wider hover:underline"
            >
              {isLogin ? 'Cadastrar' : 'Entrar'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
