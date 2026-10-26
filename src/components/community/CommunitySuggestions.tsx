import React, { useState, useEffect } from 'react';
import { UserPlus, Check, Sparkles } from 'lucide-react';
import { CommunityProfile } from '../../types';
import { getSuggestedMothers, toggleFollowUser } from './communityService';

interface CommunitySuggestionsProps {
  myUid: string;
  isDark: boolean;
  onNavigateProfile: (uid: string) => void;
}

export const CommunitySuggestions: React.FC<CommunitySuggestionsProps> = ({
  myUid,
  isDark,
  onNavigateProfile
}) => {
  const [suggestions, setSuggestions] = useState<CommunityProfile[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getSuggestedMothers(myUid, 5).then((moms) => {
      if (isMounted) {
        setSuggestions(moms);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [myUid]);

  const handleFollowToggle = async (targetUid: string) => {
    const isCurrentlyFollowing = !!followingMap[targetUid];
    setFollowingMap(prev => ({ ...prev, [targetUid]: !isCurrentlyFollowing }));

    try {
      await toggleFollowUser(myUid, targetUid, isCurrentlyFollowing);
    } catch (e) {
      console.warn("Follow toggle failed:", e);
      setFollowingMap(prev => ({ ...prev, [targetUid]: isCurrentlyFollowing }));
    }
  };

  if (!loading && suggestions.length === 0) return null;

  return (
    <div 
      className="rounded-3xl p-4 sm:p-5 mb-4 border transition-all duration-300"
      style={{
        background: isDark ? 'rgba(35, 35, 42, 0.65)' : 'rgba(255, 250, 240, 0.75)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)',
        boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)' : '0 8px 32px 0 rgba(190, 150, 120, 0.12)'
      }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <h3 className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Mamás que quizás conozcas
          </h3>
        </div>
        <span className="text-[11px] font-bold text-rose-500">Sugerencias</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
        {loading ? (
          <div className="flex gap-3 w-full py-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-40 h-44 rounded-2xl animate-pulse shrink-0 ${isDark ? 'bg-white/5' : 'bg-black/5'}`} 
              />
            ))}
          </div>
        ) : (
          suggestions.map((mom) => {
            const isFollowing = !!followingMap[mom.uid];
            return (
              <div
                key={mom.uid}
                className="w-40 sm:w-44 shrink-0 rounded-2xl p-3 flex flex-col items-center text-center snap-start transition hover:scale-[1.02] border"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Avatar */}
                <div 
                  onClick={() => onNavigateProfile(mom.uid)}
                  className="w-14 h-14 rounded-2xl overflow-hidden bg-rose-200 shadow-md mb-2 cursor-pointer border-2 border-rose-300/50"
                >
                  {mom.avatarUrl ? (
                    <img 
                      src={mom.avatarUrl} 
                      alt={mom.displayName} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-2xl flex items-center justify-center h-full">👩‍🍼</span>
                  )}
                </div>

                {/* Name */}
                <h4 
                  onClick={() => onNavigateProfile(mom.uid)}
                  className={`font-bold text-xs sm:text-sm line-clamp-1 cursor-pointer hover:text-rose-500 transition mb-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {mom.displayName}
                </h4>

                {/* Bebe edad */}
                <span className="text-[10px] text-rose-500 font-semibold mb-2 line-clamp-1">
                  {mom.bebeEdad || 'Mamá en Baby Day'}
                </span>

                {/* Follow Button */}
                <button
                  id={`follow-btn-${mom.uid}`}
                  onClick={() => handleFollowToggle(mom.uid)}
                  className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition mt-auto active:scale-95 cursor-pointer ${
                    isFollowing
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-md'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Siguiendo</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Seguir</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
