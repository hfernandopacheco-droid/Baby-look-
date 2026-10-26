import React, { useState } from 'react';
import { Users, Sparkles, MessageCircle, Heart, Check, Plus } from 'lucide-react';

interface CommunityGroupsProps {
  isDark: boolean;
  onSelectGroupTopic: (topicTag: string) => void;
}

export const CommunityGroups: React.FC<CommunityGroupsProps> = ({
  isDark,
  onSelectGroupTopic
}) => {
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>({
    'blw': true,
    'lactancia': true
  });

  const glassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(35, 35, 42, 0.65)' : 'rgba(255, 250, 240, 0.75)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.7)',
    boxShadow: isDark ? '0 12px 36px 0 rgba(0, 0, 0, 0.35)' : '0 12px 36px 0 rgba(190, 150, 120, 0.14)',
  };

  const groups = [
    {
      id: 'primerizos',
      tag: '#Primerizos',
      name: 'Mamás Primerizas & Dudas',
      emoji: '🌸',
      members: 342,
      description: 'El espacio para preguntar de todo sin pena: cólicos, brotes de crecimiento y primeras dudas.'
    },
    {
      id: 'lactancia',
      tag: '#Lactancia',
      name: 'Lactancia & Apego',
      emoji: '🤱',
      members: 512,
      description: 'Apoyo mutuo en lactancia materna exclusiva, mixta, banco de leche y destete respetuoso.'
    },
    {
      id: 'blw',
      tag: '#BLW',
      name: 'Alimentación Complementaria & BLW',
      emoji: '🥑',
      members: 428,
      description: 'Recetas, cortes seguros, texturas y primeros bocados de nuestros pequeños comensales.'
    },
    {
      id: 'sueno',
      tag: '#SueñoInfantil',
      name: 'Sueño Respetuoso & Descanso',
      emoji: '🌙',
      members: 290,
      description: 'Ventanas de sueño, rutinas de noche y cómo sobrevivir a las regresiones de sueño.'
    },
    {
      id: 'desarrollo',
      tag: '#LogrosDelBebé',
      name: 'Desarrollo & Estimulación Oportuna',
      emoji: '🧸',
      members: 198,
      description: 'Juegos sensoriales, gateo, primeros pasos y estimulación respetuosa por etapas.'
    }
  ];

  const handleToggleJoin = (groupId: string) => {
    setJoinedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="rounded-3xl p-5" style={glassStyle}>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-rose-500" />
          <h2 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Grupos y Tribus de Crianza
          </h2>
        </div>
        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Únete a comunidades según la etapa de tu bebé y comparte experiencias con mamás en tu misma sintonía.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {groups.map((grp) => {
          const isJoined = !!joinedGroups[grp.id];
          return (
            <div 
              key={grp.id}
              className="rounded-3xl p-4 sm:p-5 transition hover:scale-[1.01] border"
              style={glassStyle}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    {grp.emoji}
                  </span>
                  <div>
                    <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {grp.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-rose-500 font-semibold mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{grp.members} mamás activas</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleJoin(grp.id)}
                  className={`py-1.5 px-3.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isJoined
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-md'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Unida</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Unirme</span>
                    </>
                  )}
                </button>
              </div>

              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {grp.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10">
                <button
                  onClick={() => onSelectGroupTopic(grp.tag)}
                  className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Ver publicaciones de {grp.tag}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
