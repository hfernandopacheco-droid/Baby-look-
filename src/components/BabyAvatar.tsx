import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BabyEvent, BabyUser, EventType } from '../types';

interface BabyAvatarProps {
  events: BabyEvent[];
  user: BabyUser;
  timerState?: { type: 'lactancia' | 'biberon' | 'sueno' | 'panal' | null; active: boolean; paused?: boolean };
  isCrying?: boolean;
  onOpenAvatarCustomizer?: () => void;
  onOpenLogModal?: (type: EventType) => void;
}

export const BabyAvatar: React.FC<BabyAvatarProps> = ({
  events,
  user,
  timerState,
  isCrying = false,
  onOpenAvatarCustomizer
}) => {
  const [currentMessage, setCurrentMessage] = useState<string>("¡Hola mamá! Estoy feliz 😊");
  const [mood, setMood] = useState<'happy' | 'sleeping' | 'eating' | 'sad' | 'excited'>('happy');
  const [lastMsgIndex, setLastMsgIndex] = useState<number>(-1);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  // Blinking effect every 3 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Analyze events, timer, and AI rules to determine exact message & mood
  useEffect(() => {
    // 1. Check active timers
    if (timerState?.active) {
      if (timerState.type === 'sueno') {
        setCurrentMessage("Descansaré un poco mami 🌙");
        setMood('sleeping');
        return;
      }
      if (timerState.type === 'lactancia' || timerState.type === 'biberon') {
        setCurrentMessage("Estoy comiendo rico 🍼");
        setMood('eating');
        return;
      }
    }

    // 2. Check last event for recent completion / thank you messages (within last 5 mins)
    if (events && events.length > 0) {
      const lastEvent = events[0];
      const eventTime = new Date(`${lastEvent.date}T${lastEvent.time}`).getTime();
      const minsSinceEvent = (Date.now() - eventTime) / (1000 * 60);

      if (minsSinceEvent < 5) {
        if (lastEvent.type === 'sueno') {
          setCurrentMessage("Ya dormí mami soñé bonito ✨");
          setMood('happy');
          return;
        }
        if (lastEvent.type === 'lactancia' || lastEvent.type === 'biberon') {
          setCurrentMessage("Estoy llenito 😋");
          setMood('happy');
          return;
        }
        if (lastEvent.type === 'panal') {
          setCurrentMessage("Gracias mami 🧷");
          setMood('excited');
          return;
        }
      }

      // 3. Cerebro AI diagnosis & technical manual rules
      const lastFeeding = events.find(e => e.type === 'biberon' || e.type === 'lactancia');
      const lastFeedingTime = lastFeeding ? new Date(`${lastFeeding.date}T${lastFeeding.time}`).getTime() : Date.now() - 4 * 3600 * 1000;
      const hoursSinceFeeding = (Date.now() - lastFeedingTime) / (1000 * 60 * 60);

      if (hoursSinceFeeding > 3) {
        const hungerMsgs = ["Mamá tengo hambre 🥺", "ñam ñam mamá? 😋", "tengo hambrecita mami!"];
        setCurrentMessage(hungerMsgs[Math.floor(Math.random() * hungerMsgs.length)]);
        setMood('sad');
        return;
      }

      const lastSleep = events.find(e => e.type === 'sueno');
      const lastSleepTime = lastSleep ? new Date(`${lastSleep.date}T${lastSleep.time}`).getTime() : Date.now() - 2.5 * 3600 * 1000;
      const minsSinceSleep = Math.floor((Date.now() - lastSleepTime) / (1000 * 60));

      if (minsSinceSleep > 90) {
        const sleepMsgs = ["Mami tengo sueño 😴", "quiero mimitos para dormir mami", "tengo sueñito..."];
        setCurrentMessage(sleepMsgs[Math.floor(Math.random() * sleepMsgs.length)]);
        setMood('sleeping');
        return;
      }
    }

    if (isCrying) {
      const cryMsgs = ["waaa necesito abracito mami 😢", "estoy chiquito triste", "no estoy de buen humor hoy"];
      setCurrentMessage(cryMsgs[Math.floor(Math.random() * cryMsgs.length)]);
      setMood('sad');
      return;
    }

    // Default random non-repeating happy/anime messages
    const generalMsgs = [
      "¡estoy muy feliz contigo mami! 😊",
      "¡mira mi ropita de osito!",
      "soy tu bebé favorito verdad? ✨",
      "te quiero mucho mami ❤️",
      "¡estoy sonriendo para ti!"
    ];
    let idx = Math.floor(Math.random() * generalMsgs.length);
    if (idx === lastMsgIndex) idx = (idx + 1) % generalMsgs.length;
    setLastMsgIndex(idx);
    setCurrentMessage(generalMsgs[idx]);
    setMood('happy');

  }, [events, timerState, isCrying]);

  // Periodic rotation of messages every 15s if no timer/event active
  useEffect(() => {
    if (timerState?.active) return;
    const interval = setInterval(() => {
      const generalMsgs = [
        "¡estoy muy feliz contigo mami! 😊",
        "¡mira mi ropita de osito!",
        "soy tu bebé favorito verdad? ✨",
        "te quiero mucho mami ❤️",
        "¡estoy sonriendo para ti!"
      ];
      let idx = Math.floor(Math.random() * generalMsgs.length);
      if (idx === lastMsgIndex) idx = (idx + 1) % generalMsgs.length;
      setLastMsgIndex(idx);
      setCurrentMessage(generalMsgs[idx]);
    }, 15000);
    return () => clearInterval(interval);
  }, [timerState, lastMsgIndex]);

  return (
    <div className="w-full flex flex-col items-center my-3 px-3 select-none bg-transparent relative">
      
      {/* Speech Bubble positioned cleanly ABOVE the avatar so it never covers it */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessage}
          initial={{ opacity: 0, y: -12, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.85 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 220 }}
          className="relative z-30 mb-2 max-w-[280px]"
        >
          <div 
            className="relative px-4 py-2.5 rounded-[22px] shadow-xl border-2 text-xs sm:text-sm font-bold leading-snug text-center"
            style={{
              backgroundColor: '#FFF8E7',
              borderColor: '#e5d4bc',
              color: '#5A3A2A',
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)'
            }}
          >
            {/* Tail pointing down towards the avatar */}
            <div 
              className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#FFF8E7] drop-shadow-sm"
            />
            <span>{currentMessage}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 3D Animated Cartoon Baby Caricature */}
      <motion.div
        onClick={() => {
          if (onOpenAvatarCustomizer) onOpenAvatarCustomizer();
        }}
        className="relative cursor-pointer group"
        animate={{ scale: [1, 1.03, 1], rotate: mood === 'excited' ? [0, 2, -2, 0] : 0 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className={`absolute inset-0 rounded-full blur-2xl transition-all opacity-60 ${
          mood === 'sleeping' ? 'bg-indigo-500/50 animate-pulse' :
          mood === 'eating' ? 'bg-blue-500/50 animate-pulse' :
          mood === 'sad' ? 'bg-rose-500/50 animate-pulse' : 'bg-amber-400/50'
        }`} />

        <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center drop-shadow-2xl">
          <svg viewBox="0 0 350 350" className="w-full h-full drop-shadow-2xl overflow-visible">
            <defs>
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#fed7aa" />
              </linearGradient>
              <linearGradient id="beanieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
              <linearGradient id="overallsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>

            {/* Body & Overalls */}
            <path d="M 115 220 C 100 220 90 250 95 335 L 255 335 C 260 250 250 220 235 220 Z" fill="url(#overallsGrad)" stroke="#1e40af" strokeWidth="3" />
            <path d="M 130 220 L 140 200" stroke="url(#overallsGrad)" strokeWidth="14" strokeLinecap="round" />
            <path d="M 220 220 L 210 200" stroke="url(#overallsGrad)" strokeWidth="14" strokeLinecap="round" />
            <circle cx="132" cy="216" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            <circle cx="218" cy="216" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />

            {/* Pocket with cloud embroidery */}
            <rect x="150" y="240" width="50" height="42" rx="10" fill="#2563eb" stroke="#60a5fa" strokeWidth="2" />
            <path d="M 163 262 Q 166 256 172 258 Q 177 254 182 258 Q 187 256 190 262 Z" fill="#ffffff" opacity="0.9" />

            {/* Head / Face */}
            <circle cx="175" cy="145" r="75" fill="url(#skinGrad)" stroke="#fdbmo7" strokeWidth="2" />
            
            {/* Rosy Cheeks */}
            <ellipse cx="130" cy="155" rx="12" ry="8" fill="#fda4af" opacity="0.7" />
            <ellipse cx="220" cy="155" rx="12" ry="8" fill="#fda4af" opacity="0.7" />

            {/* Knit Beanie with Pompom */}
            <path d="M 100 135 C 100 70 140 50 175 50 C 210 50 250 70 250 135 C 230 120 120 120 100 135 Z" fill="url(#beanieGrad)" />
            <path d="M 98 128 Q 175 145 252 128 L 250 145 Q 175 162 100 145 Z" fill="#fb7185" />
            <circle cx="175" cy="38" r="16" fill="#ffffff" stroke="#f43f5e" strokeWidth="2" />
            <circle cx="172" cy="35" r="4" fill="#f43f5e" opacity="0.6" />

            {/* Eyes */}
            {mood === 'sleeping' ? (
              <>
                <path d="M 135 140 Q 150 150 165 140" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M 185 140 Q 200 150 215 140" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="145" cy="138" rx="14" ry={isBlinking ? 2 : 18} fill="#1e293b" />
                <ellipse cx="205" cy="138" rx="14" ry={isBlinking ? 2 : 18} fill="#1e293b" />
                <circle cx="150" cy="130" rx="5" ry="6" fill="#ffffff" />
                <circle cx="210" cy="130" rx="5" ry="6" fill="#ffffff" />
                <circle cx="140" cy="144" r="2.5" fill="#ffffff" />
                <circle cx="200" cy="144" r="2.5" fill="#ffffff" />
              </>
            )}

            {/* Nose */}
            <ellipse cx="175" cy="152" rx="4" ry="2.5" fill="#e28743" opacity="0.7" />

            {/* Mouth */}
            {mood === 'eating' ? (
              <circle cx="175" cy="166" r="7" fill="#1e293b" />
            ) : mood === 'sleeping' ? (
              <path d="M 168 165 Q 175 170 182 165" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M 162 162 Q 175 178 188 162" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
            )}

            {/* Hands / Shoulders */}
            <circle cx="105" cy="240" r="15" fill="url(#skinGrad)" />
            <circle cx="245" cy="240" r="15" fill="url(#skinGrad)" />
          </svg>

          {mood === 'sleeping' && (
            <motion.div
              initial={{ opacity: 0, y: 5, x: 5 }}
              animate={{ opacity: [0, 1, 0], y: [-15, -35, -55], x: [5, 15, 25] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute -top-2 right-2 text-indigo-200 font-black text-lg drop-shadow-lg"
            >
              Zzz...
            </motion.div>
          )}

          {mood === 'eating' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-2 left-2 text-2xl drop-shadow-md"
            >
              🍼
            </motion.div>
          )}
        </div>
      </motion.div>

    </div>
  );
};

