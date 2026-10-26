import React, { useState } from 'react';
import { X, Sparkles, Shuffle, Save, RotateCw, Shirt, Smile, Eye, Palette, Scissors, Footprints, Crown, Check } from 'lucide-react';
import { YA } from '../utils';

export interface AvatarElaboradoConfig {
  body: string;
  hair: string;
  eyes: string;
  nose: string;
  mouth: string;
  top: string;
  hat: string;
  shoes: string;
}

export const DEFAULT_AVATAR_ELABORADO: AvatarElaboradoConfig = {
  body: 'base_skin_1',
  hair: 'messy_brown',
  eyes: 'anime_brown',
  nose: 'button_small',
  mouth: 'smile_cute',
  top: 'denim_overalls_bear',
  hat: 'knit_beanie_blue',
  shoes: 'sneakers_yellow'
};

interface AvatarCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AvatarElaboradoConfig;
  onSave: (newConfig: AvatarElaboradoConfig) => void;
}

export const AvatarCreatorModal: React.FC<AvatarCreatorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  if (!isOpen) return null;

  const [draft, setDraft] = useState<AvatarElaboradoConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'customize' | 'shop'>('customize');
  const [activeSubTab, setActiveSubTab] = useState<'hair' | 'eyes' | 'nose' | 'mouth' | 'skin' | 'clothes' | 'shoes' | 'accessories'>('hair');
  const [rotation, setRotation] = useState(0);

  // Options catalogs matching 3D kawaii style
  const hairStyles = [
    { id: 'messy_brown', name: 'Messy Brown', color: '#4a3525' },
    { id: 'curly_blonde', name: 'Curly Blonde', color: '#fcd34d' },
    { id: 'pigtails_pink', name: 'Pigtails Pink', color: '#ec4899' },
    { id: 'wavy_black', name: 'Wavy Black', color: '#1e293b' },
    { id: 'spiky_blonde', name: 'Spiky Blonde', color: '#ca8a04' },
    { id: 'side_bun', name: 'Side Bun', color: '#b45309' },
    { id: 'bob_cut', name: 'Bob Cut', color: '#9333ea' },
    { id: 'fluffy_red', name: 'Fluffy Red', color: '#ea580c' },
    { id: 'short_blonde', name: 'Short Blonde', color: '#fde047' },
    { id: 'none', name: 'Sin Pelo', color: 'transparent' }
  ];

  const eyeOptions = [
    { id: 'anime_brown', name: 'Grande Marrón' },
    { id: 'anime_blue', name: 'Grande Azul' },
    { id: 'sparkle_green', name: 'Brillo Verde' },
    { id: 'happy_closed', name: 'Felices (^.^)' },
    { id: 'wink_star', name: 'Guiño Estrella' },
    { id: 'sleepy_zen', name: 'Tranquilos (- -)' }
  ];

  const noseOptions = [
    { id: 'button_small', name: 'Botón Pequeño' },
    { id: 'dot_cute', name: 'Puntito Kawaii' },
    { id: 'button_round', name: 'Redondo 3D' },
    { id: 'minimal', name: 'Minimalista' }
  ];

  const mouthOptions = [
    { id: 'smile_cute', name: 'Sonrisa Tierna' },
    { id: 'laugh_open', name: 'Rrisa Abierta' },
    { id: 'pacifier', name: 'Con Chupete' },
    { id: 'surprised_o', name: 'Sorprendido (o)' },
    { id: 'tongue_out', name: 'Sacando Lengua' },
    { id: 'neutral_sweet', name: 'Dulce Neutral' }
  ];

  const skinTones = [
    { id: 'skin_1', name: 'Claro 1', color: '#ffecd0' },
    { id: 'skin_2', name: 'Claro 2', color: '#ffd1b3' },
    { id: 'skin_3', name: 'Medio 1', color: '#f8b88b' },
    { id: 'skin_4', name: 'Medio 2', color: '#e09f7a' },
    { id: 'skin_5', name: 'Canela 1', color: '#b87353' },
    { id: 'skin_6', name: 'Canela 2', color: '#8c5237' },
    { id: 'skin_7', name: 'Oscuro 1', color: '#5c3822' },
    { id: 'skin_8', name: 'Oscuro 2', color: '#3d2314' }
  ];

  const clothesOptions = [
    { id: 'denim_overalls_bear', name: 'Overol Denim + Osito' },
    { id: 'dino_onesie', name: 'Pijama Dinosaurio' },
    { id: 'bear_onesie', name: 'Pijama Osito' },
    { id: 'super_hero_cape', name: 'Capa Superhéroe' },
    { id: 'striped_sailor', name: 'Marinero Rayas' },
    { id: 'pink_dress', name: 'Vestido Rosa' },
    { id: 'yellow_sweater', name: 'Sweater Pollito' },
    { id: 'tuxedo_baby', name: 'Esmoquin Bebé' },
    { id: 'green_romper', name: 'Mameluco Verde' },
    { id: 'rainbow_shirt', name: 'Camisa Arcoíris' },
    { id: 'astronaut_suit', name: 'Traje Espacial' },
    { id: 'pijama_stars', name: 'Pijama Estrellas' }
  ];

  const shoesOptions = [
    { id: 'sneakers_yellow', name: 'Zapatillas Amarillas' },
    { id: 'sneakers_white', name: 'Tenis Blancos' },
    { id: 'slippers_bunny', name: 'Pantuflas Conejito' },
    { id: 'booties_blue', name: 'Patucos Azules' }
  ];

  const hatOptions = [
    { id: 'knit_beanie_blue', name: 'Gorro Tejido Azul' },
    { id: 'knit_beanie_beige', name: 'Gorro Tejido Beige' },
    { id: 'crown_gold', name: 'Corona Real' },
    { id: 'bunny_ears', name: 'Orejas de Conejo' },
    { id: 'cap_baseball', name: 'Gorra Béisbol' },
    { id: 'none', name: 'Sin Gorro' }
  ];

  const handleRandomize = () => {
    setDraft({
      body: skinTones[Math.floor(Math.random() * skinTones.length)].id,
      hair: hairStyles[Math.floor(Math.random() * hairStyles.length)].id,
      eyes: eyeOptions[Math.floor(Math.random() * eyeOptions.length)].id,
      nose: noseOptions[Math.floor(Math.random() * noseOptions.length)].id,
      mouth: mouthOptions[Math.floor(Math.random() * mouthOptions.length)].id,
      top: clothesOptions[Math.floor(Math.random() * clothesOptions.length)].id,
      hat: hatOptions[Math.floor(Math.random() * hatOptions.length)].id,
      shoes: shoesOptions[Math.floor(Math.random() * shoesOptions.length)].id
    });
    YA('🎲 ¡Avatar 3D Kawaii aleatorio generado!');
  };

  const handleSave = () => {
    onSave(draft);
    localStorage.setItem('bubblo_avatar_elaborado', JSON.stringify(draft));
    YA('💾 ¡Avatar 3D guardado con éxito!');
    onClose();
  };

  // Helper skin color resolver
  const getSkinHex = (skinId: string) => {
    const found = skinTones.find(s => s.id === skinId);
    return found ? found.color : '#ffd1b3';
  };

  const getHairHex = (hairId: string) => {
    const found = hairStyles.find(h => h.id === hairId);
    return found ? found.color : '#4a3525';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-5xl h-[92vh] sm:h-[86vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white"
        style={{ backgroundColor: '#121212' }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xl shadow-md shadow-indigo-500/30">
              👶
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black font-heading tracking-tight">Baby Avatar Creator</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PWA • v2.1</span>
              </div>
              <p className="text-[11px] text-gray-400">Creador de Avatares Kawaii 3D con Capas Absolutas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Layout in 2 Parts (60% / 40%) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* PARTE A - LADO IZQUIERDO 60%: PREVIEW 300x400px CON CAPAS ABSOLUTAS */}
          <div className="w-full lg:w-[60%] p-6 flex flex-col items-center justify-between bg-[#161616] border-r border-white/10 relative overflow-hidden">
            {/* Background starry effect */}
            <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

            <div className="w-full flex items-center justify-between z-10 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Your Baby Avatar (Full Body)
              </span>
              <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
                300 x 400 px
              </span>
            </div>

            {/* Container 300x400px con capas absolute */}
            <div className="relative z-10 flex items-center justify-center flex-1 my-2">
              <div 
                className="relative w-[280px] h-[370px] sm:w-[300px] sm:h-[400px] rounded-3xl bg-gradient-to-b from-[#1e1e2f] to-[#12121a] border border-white/15 shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-500"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {/* CAPA 1: Cuerpo base PNG / Vector detallado 3D */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg viewBox="0 0 300 400" className="w-full h-full drop-shadow-2xl">
                    <defs>
                      <radialGradient id="skinGrad" cx="50%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor={getSkinHex(draft.body)} />
                      </radialGradient>
                      <filter id="shadow3D" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
                      </filter>
                    </defs>

                    {/* Base Body & Limbs */}
                    <g filter="url(#shadow3D)">
                      {/* Legs */}
                      <rect x="110" y="270" width="30" height="90" rx="15" fill={getSkinHex(draft.body)} />
                      <rect x="160" y="270" width="30" height="90" rx="15" fill={getSkinHex(draft.body)} />

                      {/* Torso */}
                      <rect x="100" y="160" width="100" height="130" rx="35" fill={getSkinHex(draft.body)} />

                      {/* Arms */}
                      <rect x="70" y="170" width="26" height="90" rx="13" transform="rotate(10 70 170)" fill={getSkinHex(draft.body)} />
                      <rect x="204" y="170" width="26" height="90" rx="13" transform="rotate(-10 204 170)" fill={getSkinHex(draft.body)} />

                      {/* Head Base */}
                      <circle cx="150" cy="115" r="55" fill="url(#skinGrad)" />
                      {/* Cheeks blush */}
                      <circle cx="120" cy="130" r="10" fill="#ff85a2" opacity="0.5" />
                      <circle cx="180" cy="130" r="10" fill="#ff85a2" opacity="0.5" />
                    </g>
                  </svg>
                </div>

                {/* CAPA 2: Ropa Body PNG con textura jean + bolsillo osito */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg viewBox="0 0 300 400" className="w-full h-full">
                    <defs>
                      <linearGradient id="denimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                      <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#f1f5f9" />
                      </linearGradient>
                    </defs>

                    {draft.top === 'denim_overalls_bear' ? (
                      <g>
                        {/* White inner shirt sleeves */}
                        <path d="M 96 170 L 70 210 L 85 220 L 105 185 Z" fill="url(#shirtGrad)" />
                        <path d="M 204 170 L 230 210 L 215 220 L 195 185 Z" fill="url(#shirtGrad)" />
                        
                        {/* Denim Overalls Body */}
                        <path d="M 105 195 L 195 195 L 200 320 C 200 345 185 355 150 355 C 115 355 100 345 100 320 Z" fill="url(#denimGrad)" />
                        
                        {/* Overalls Straps */}
                        <path d="M 120 195 L 125 155 L 140 155 L 135 195 Z" fill="url(#denimGrad)" />
                        <path d="M 180 195 L 175 155 L 160 155 L 165 195 Z" fill="url(#denimGrad)" />
                        <circle cx="127" cy="158" r="3" fill="#fde047" />
                        <circle cx="173" cy="158" r="3" fill="#fde047" />

                        {/* Pocket with cute Bear */}
                        <rect x="130" y="220" width="40" height="35" rx="6" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" />
                        {/* Bear head inside pocket */}
                        <circle cx="150" cy="235" r="10" fill="#d97706" />
                        <circle cx="143" cy="227" r="4" fill="#d97706" />
                        <circle cx="157" cy="227" r="4" fill="#d97706" />
                        <circle cx="147" cy="233" r="1.5" fill="#1e293b" />
                        <circle cx="153" cy="233" r="1.5" fill="#1e293b" />
                        <ellipse cx="150" cy="238" rx="2" ry="1.5" fill="#1e293b" />
                      </g>
                    ) : draft.top === 'dino_onesie' ? (
                      <g>
                        <path d="M 98 165 L 202 165 L 205 345 C 205 355 185 365 150 365 C 115 365 95 355 98 345 Z" fill="#22c55e" />
                        {/* Dino spikes */}
                        <polygon points="150,155 140,140 150,145 160,140" fill="#15803d" />
                        <polygon points="150,185 138,175 150,180 162,175" fill="#15803d" />
                      </g>
                    ) : (
                      <g>
                        <path d="M 98 165 L 202 165 L 205 345 C 205 355 185 365 150 365 C 115 365 95 355 98 345 Z" fill="#ec4899" />
                      </g>
                    )}
                  </svg>
                </div>

                {/* CAPA 3: Ojos, Nariz, Boca PNG 3D Kawaii */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg viewBox="0 0 300 400" className="w-full h-full">
                    {/* Eyes */}
                    {draft.eyes === 'anime_brown' || draft.eyes === 'anime_blue' ? (
                      <g>
                        <ellipse cx="128" cy="110" rx="11" ry="14" fill="#1e293b" />
                        <ellipse cx="172" cy="110" rx="11" ry="14" fill="#1e293b" />
                        <circle cx="131" cy="105" r="4" fill="#ffffff" />
                        <circle cx="175" cy="105" r="4" fill="#ffffff" />
                        <circle cx="125" cy="115" r="2" fill="#ffffff" />
                        <circle cx="169" cy="115" r="2" fill="#ffffff" />
                      </g>
                    ) : draft.eyes === 'happy_closed' ? (
                      <g stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none">
                        <path d="M 118 112 Q 128 102 138 112" />
                        <path d="M 162 112 Q 172 102 182 112" />
                      </g>
                    ) : (
                      <g>
                        <ellipse cx="128" cy="110" rx="10" ry="13" fill="#1e293b" />
                        <ellipse cx="172" cy="110" rx="10" ry="13" fill="#1e293b" />
                        <circle cx="130" cy="106" r="3" fill="#ffffff" />
                        <circle cx="174" cy="106" r="3" fill="#ffffff" />
                      </g>
                    )}

                    {/* Nose */}
                    <ellipse cx="150" cy="123" rx="4" ry="2.5" fill="#d99b82" />

                    {/* Mouth */}
                    {draft.mouth === 'smile_cute' ? (
                      <path d="M 138 133 Q 150 144 162 133" stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    ) : draft.mouth === 'laugh_open' ? (
                      <path d="M 136 132 Q 150 150 164 132" fill="#1e293b" />
                    ) : draft.mouth === 'pacifier' ? (
                      <g>
                        <ellipse cx="150" cy="138" rx="10" ry="8" fill="#ec4899" />
                        <rect x="146" y="130" width="8" height="6" rx="2" fill="#ffffff" />
                      </g>
                    ) : (
                      <path d="M 140 134 Q 150 140 160 134" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
                    )}
                  </svg>
                </div>

                {/* CAPA 4: Pelo con sombras 10 estilos */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg viewBox="0 0 300 400" className="w-full h-full">
                    {draft.hair !== 'none' && (
                      <g fill={getHairHex(draft.hair)}>
                        {/* Base hair volume */}
                        <path d="M 98 100 Q 150 55 202 100 Q 215 85 190 70 Q 150 45 110 70 Q 85 85 98 100 Z" />
                        {draft.hair === 'curly_blonde' ? (
                          <>
                            <circle cx="105" cy="80" r="16" />
                            <circle cx="125" cy="68" r="18" />
                            <circle cx="150" cy="65" r="19" />
                            <circle cx="175" cy="68" r="18" />
                            <circle cx="195" cy="80" r="16" />
                          </>
                        ) : draft.hair === 'pigtails_pink' ? (
                          <>
                            <circle cx="90" cy="85" r="18" />
                            <circle cx="210" cy="85" r="18" />
                          </>
                        ) : (
                          <path d="M 100 95 Q 150 50 200 95 Q 180 75 150 73 Q 120 75 100 95 Z" />
                        )}
                      </g>
                    )}
                  </svg>
                </div>

                {/* CAPA 5: Gorro PNG tejido / Zapatos */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg viewBox="0 0 300 400" className="w-full h-full">
                    {/* Shoes */}
                    <g>
                      <ellipse cx="120" cy="365" rx="20" ry="12" fill="#facc15" />
                      <ellipse cx="180" cy="365" rx="20" ry="12" fill="#facc15" />
                      <rect x="110" y="360" width="20" height="4" fill="#ca8a04" rx="2" />
                      <rect x="170" y="360" width="20" height="4" fill="#ca8a04" rx="2" />
                    </g>

                    {/* Hat / Beanie */}
                    {draft.hat === 'knit_beanie_blue' || draft.hat === 'knit_beanie_beige' ? (
                      <g>
                        <path d="M 95 95 Q 150 35 205 95 L 202 110 Q 150 85 98 110 Z" fill={draft.hat === 'knit_beanie_blue' ? '#3b82f6' : '#d4b28c'} />
                        {/* Pom pom */}
                        <circle cx="150" cy="32" r="14" fill={draft.hat === 'knit_beanie_blue' ? '#60a5fa' : '#e5d0b1'} />
                        {/* Ribbed band */}
                        <rect x="98" y="98" width="104" height="15" rx="4" fill={draft.hat === 'knit_beanie_blue' ? '#2563eb' : '#bc986c'} />
                      </g>
                    ) : draft.hat === 'crown_gold' ? (
                      <polygon points="120,70 135,45 150,65 165,45 180,70" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
                    ) : null}
                  </svg>
                </div>

              </div>
            </div>

            {/* 3 Botones abajo: Rotate / Randomize / Save */}
            <div className="w-full grid grid-cols-3 gap-3 z-10 mt-2">
              <button
                onClick={() => setRotation(r => (r + 45) % 360)}
                className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                Rotate
              </button>
              <button
                onClick={handleRandomize}
                className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-blue-400" />
                Randomize
              </button>
              <button
                onClick={handleSave}
                className="py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>

          {/* PARTE B - LADO DERECHO 40%: CONTROLES TAMAGOTCHI CON TABS Y SUB-TABS */}
          <div className="w-full lg:w-[40%] flex flex-col bg-[#141414] overflow-hidden">
            
            {/* Top Tabs: Customize | Tienda Shop */}
            <div className="flex border-b border-white/10 bg-[#181818] p-2 gap-1.5">
              {[
                { id: 'customize', label: 'Customize' },
                { id: 'shop', label: '🛍️ Tienda Shop' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-tabs pills (Hair, Eyes, Nose, Mouth, Skin Tone, Clothes, Shoes, Accessories) */}
            {activeTab === 'customize' && (
              <div className="flex flex-wrap gap-1.5 p-3 border-b border-white/5 bg-[#161616]">
                {[
                  { id: 'hair', label: 'Hair' },
                  { id: 'eyes', label: 'Eyes' },
                  { id: 'nose', label: 'Nose' },
                  { id: 'mouth', label: 'Mouth' },
                  { id: 'skin', label: 'Skin Tone' },
                  { id: 'clothes', label: 'Clothes' },
                  { id: 'shoes', label: 'Shoes' },
                  { id: 'accessories', label: 'Accessories' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubTab(sub.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeSubTab === sub.id
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-gray-400 hover:text-white bg-white/5 border border-transparent'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {/* Shop Tab View */}
            {activeTab === 'shop' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <span className="font-black">🛍️ Tienda Oficial Tamagotchi Shop:</span> Desbloquea y viste a tu bebé con trajes exclusivos interactuando con la app y completando registros diarios.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {clothesOptions.map(item => {
                    const isSelected = draft.top === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setDraft({ ...draft, top: item.id })}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 transition cursor-pointer ${
                          isSelected ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500' : 'bg-white/5 border-white/10 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">👕</span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Desbloqueado</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold">{item.name}</div>
                          <div className="text-[10px] text-gray-400">Estilo Tamagotchi 3D</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selector Options Content */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              
              {activeTab === 'customize' && (
                <>
                  {/* Hair Style options */}
                  {activeSubTab === 'hair' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Hair Style (10 styles)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {hairStyles.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setDraft({ ...draft, hair: item.id })}
                            className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                              draft.hair === item.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{item.name}</span>
                            {draft.hair === item.id && <Check className="w-4 h-4 text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eyes */}
                  {activeSubTab === 'eyes' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Eyes (6 options)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {eyeOptions.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setDraft({ ...draft, eyes: item.id })}
                            className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                              draft.eyes === item.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{item.name}</span>
                            {draft.eyes === item.id && <Check className="w-4 h-4 text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nose */}
                  {activeSubTab === 'nose' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Nose (4 options)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {noseOptions.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setDraft({ ...draft, nose: item.id })}
                            className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                              draft.nose === item.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{item.name}</span>
                            {draft.nose === item.id && <Check className="w-4 h-4 text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mouth */}
                  {activeSubTab === 'mouth' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Mouth (6 options)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {mouthOptions.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setDraft({ ...draft, mouth: item.id })}
                            className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                              draft.mouth === item.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{item.name}</span>
                            {draft.mouth === item.id && <Check className="w-4 h-4 text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skin Tone */}
                  {activeSubTab === 'skin' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Skin Tone (8 options)</h4>
                      <div className="grid grid-cols-4 gap-3">
                        {skinTones.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setDraft({ ...draft, body: item.id })}
                            className={`h-12 rounded-2xl border-2 transition cursor-pointer ${
                              draft.body === item.id ? 'border-indigo-500 scale-105 shadow-lg ring-2 ring-indigo-500/30' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: item.color }}
                            title={item.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clothes */}
                  {activeSubTab === 'clothes' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Clothes / Outfits (12 options)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {clothesOptions.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setDraft({ ...draft, top: item.id })}
                            className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                              draft.top === item.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span className="truncate">{item.name}</span>
                            {draft.top === item.id && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shoes */}
                  {activeSubTab === 'shoes' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Shoes (4 options)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {shoesOptions.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setDraft({ ...draft, shoes: item.id })}
                            className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                              draft.shoes === item.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{item.name}</span>
                            {draft.shoes === item.id && <Check className="w-4 h-4 text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accessories / Hats */}
                  {activeSubTab === 'accessories' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Hats & Accessories (6 options)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {hatOptions.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setDraft({ ...draft, hat: item.id })}
                            className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                              draft.hat === item.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span>{item.name}</span>
                            {draft.hat === item.id && <Check className="w-4 h-4 text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 border-t border-white/10 bg-[#181818] flex gap-3">
              <button
                onClick={() => {
                  setDraft({ ...config });
                  YA('🔄 Cambios restablecidos');
                }}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold transition cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Save & Share
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
