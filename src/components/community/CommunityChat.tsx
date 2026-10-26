import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Smile, 
  Heart, 
  Users, 
  Baby, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';

interface CommunityChatProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isDark: boolean;
  onNavigateProfile: (uid: string) => void;
}

interface ChatMessage {
  id: string;
  uid: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  timestamp: number | any;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
  onNavigateProfile
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const glassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(35, 35, 42, 0.65)' : 'rgba(255, 250, 240, 0.75)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.7)',
    boxShadow: isDark ? '0 12px 36px 0 rgba(0, 0, 0, 0.35)' : '0 12px 36px 0 rgba(190, 150, 120, 0.14)',
  };

  useEffect(() => {
    const q = query(
      collection(db, 'community_chat_messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ChatMessage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          uid: data.uid,
          authorName: data.authorName || 'Mamá',
          authorAvatar: data.authorAvatar,
          text: data.text || '',
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
        });
      });
      setMessages(list);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }, (err) => {
      console.warn("Chat listener:", err);
    });

    return () => unsub();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await addDoc(collection(db, 'community_chat_messages'), {
        uid: currentUserId,
        authorName: currentUserName || 'Mamá',
        authorAvatar: currentUserAvatar || '',
        text: textToSend,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed sending chat message:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] max-h-[720px] rounded-3xl overflow-hidden border" style={glassStyle}>
      {/* Chat Top Banner */}
      <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-black/5'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sala de Charla de Mamás
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-rose-500 font-medium">
              Espacio en vivo de acompañamiento y cariño
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Espacio Seguro</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <span className="text-4xl">💬</span>
            <p className="text-xs font-semibold">¡Comienza la conversación! Envía un mensaje a la comunidad de mamás.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.uid === currentUserId;
            return (
              <div 
                key={m.id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div 
                    onClick={() => onNavigateProfile(m.uid)}
                    className="w-7 h-7 rounded-xl overflow-hidden bg-rose-200 shrink-0 cursor-pointer shadow-sm mb-0.5"
                  >
                    {m.authorAvatar ? (
                      <img src={m.authorAvatar} alt={m.authorName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs flex items-center justify-center h-full">👶</span>
                    )}
                  </div>
                )}

                <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span 
                      onClick={() => onNavigateProfile(m.uid)}
                      className="text-[10px] font-bold text-rose-500 mb-0.5 cursor-pointer hover:underline px-1"
                    >
                      {m.authorName}
                    </span>
                  )}
                  <div 
                    className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                      isMe 
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-none' 
                        : isDark
                        ? 'bg-white/10 text-slate-200 rounded-bl-none border border-white/10'
                        : 'bg-white text-slate-800 rounded-bl-none border border-black/5'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendMessage} className={`p-3 border-t flex items-center gap-2 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
        <input
          id="chat-input"
          type="text"
          placeholder="Escribe un mensaje de apoyo o una consulta..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={`flex-1 py-2.5 px-4 rounded-2xl text-xs sm:text-sm outline-none border transition ${
            isDark 
              ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-rose-400' 
              : 'bg-white/80 border-black/10 text-slate-900 placeholder:text-slate-400 focus:border-rose-400'
          }`}
        />
        <button
          type="submit"
          id="send-chat-btn"
          disabled={!inputText.trim() || sending}
          className="p-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white shadow-lg transition active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
