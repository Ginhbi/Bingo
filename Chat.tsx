import React, { useState, useEffect, useRef } from "react";
import { ref, push, onChildAdded, DataSnapshot } from "firebase/database";
import { db } from "../lib/firebase";
import { Send } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";

type Message = {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: number;
};

export function Chat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    const chatRef = ref(db, `rooms/${roomId}/chat`);
    const unsubscribe = onChildAdded(chatRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setMessages((prev) => {
          // Prevent duplicates during React StrictMode re-mounts
          if (prev.some(msg => msg.id === snapshot.key)) return prev;
          return [...prev, { id: snapshot.key as string, ...data }];
        });
      }
    }, (error) => {
      console.error("Firebase Chat error:", error);
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const chatRef = ref(db, `rooms/${roomId}/chat`);
    await push(chatRef, {
      userId: user.uid,
      displayName: profile?.displayName || "Jogador",
      text: newMessage.trim(),
      timestamp: Date.now(),
    });
    setNewMessage("");
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-[16px] flex-1 flex flex-col overflow-hidden h-full min-h-[200px]">
      <div className="flex-1 p-[12px] text-[13px] flex flex-col gap-2 overflow-y-auto">
        {messages.map((msg) => {
          const isMe = msg.userId === user?.uid;
          return (
            <div 
              key={msg.id} 
              className={`p-[8px_12px] rounded-[12px] w-fit max-w-[90%] shadow-sm ${isMe ? 'self-end bg-blue-500 text-white rounded-tr-sm' : 'self-start bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}
            >
              {!isMe && <div className="text-bingo-neon font-bold text-[10px] uppercase tracking-wider mb-1 px-1">{msg.displayName}</div>}
              <span className="leading-tight block px-1">{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-[12px] bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Sua mensagem..."
          className="w-full bg-slate-50 border-none rounded-full px-4 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder-slate-400 text-slate-800"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="text-bingo-neon p-2 disabled:opacity-30 disabled:text-slate-400 hover:text-blue-600 transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
