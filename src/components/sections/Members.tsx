import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LucideShield, LucideZap, LucideCrown, LucideUsers, LucideSparkles, LucideFlame, LucideSearch, LucideFilter, LucideShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DiscordUser } from '../AuthContext'
import { supabase } from '../../lib/supabase'
import { DISCORD_CONFIG } from '../../lib/discord'
import StatusIndicator from '../ui/StatusIndicator'

const roleConfig = [
  { id: DISCORD_CONFIG.ROLES.OWNER, label: 'Owner', icon: LucideCrown, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  { id: DISCORD_CONFIG.ROLES.CO_OWNER, label: 'Co-Owner', icon: LucideShield, color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { id: DISCORD_CONFIG.ROLES.ADMIN, label: 'Admin', icon: LucideShieldCheck, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  { id: DISCORD_CONFIG.ROLES.STAFF, label: 'Staff', icon: LucideShield, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { id: DISCORD_CONFIG.ROLES.ANIMATEUR, label: 'Animateur', icon: LucideZap, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { id: DISCORD_CONFIG.ROLES.BOOSTER, label: 'Booster', icon: LucideZap, color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
  { id: DISCORD_CONFIG.ROLES.VIP_ECLAT, label: 'VIP Éclat', icon: LucideSparkles, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { id: DISCORD_CONFIG.ROLES.VIP_LANTERNE, label: 'VIP Lanterne', icon: LucideZap, color: 'text-violet-400', bgColor: 'bg-violet-400/10', borderColor: 'border-violet-400/30' },
  { id: DISCORD_CONFIG.ROLES.VIP_ETERNEL, label: 'VIP Éternel', icon: LucideCrown, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  { id: DISCORD_CONFIG.ROLES.MEMBRE, label: 'Membre', icon: LucideUsers, color: 'text-gray-400', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30' }
]

const Members: React.FC = () => {
  // Charger les membres depuis le cache local immédiatement pour un affichage instantané
  const [connectedMembers, setConnectedMembers] = useState<DiscordUser[]>(() => {
    const cached = localStorage.getItem('cached_members')
    return cached ? JSON.parse(cached) : []
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(connectedMembers.length === 0)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, username, avatar, roles, status, bio, banner_color, banner_url, display_name_color, nickname_gradient_color1, nickname_gradient_color2, featured_badges, premium_tier, gold_nickname, flames_count, streak_count')
          .order('last_seen', { ascending: false })

        if (error) throw error

        if (data) {
          const mappedMembers: DiscordUser[] = data.map(m => ({
            id: m.id,
            username: m.username,
            avatar: m.avatar,
            roles: m.roles || [],
            status: m.status as any,
            bio: m.bio,
            bannerColor: m.banner_color,
            bannerUrl: m.banner_url,
            displayNameColor: m.display_name_color,
            nicknameGradientColor1: m.nickname_gradient_color1,
            nicknameGradientColor2: m.nickname_gradient_color2,
            featured_badges: m.featured_badges || [],
            premium_tier: m.premium_tier || 0,
            gold_nickname: m.gold_nickname !== false,
            flames_count: m.flames_count || 0,
            streak_count: m.streak_count || 0
          }))
          setConnectedMembers(mappedMembers)
          // Mettre à jour le cache local
          localStorage.setItem('cached_members', JSON.stringify(mappedMembers))
        }
      } catch (e) {
        console.error('Failed to fetch members:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
    
    // Refresh with Realtime
    const channel = supabase
      .channel('members-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        fetchMembers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredMembers = useMemo(() => {
    return connectedMembers.filter(m => {
      const matchesSearch = m.username.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterTier === 'all' || m.premium_tier === filterTier
      return matchesSearch && matchesFilter
    })
  }, [connectedMembers, searchQuery, filterTier])

  const getMemberBadges = (m: DiscordUser) => {
    const badges = []
    
    const isStaff = m.roles.some(roleId => [
      DISCORD_CONFIG.ROLES.OWNER,
      DISCORD_CONFIG.ROLES.CO_OWNER,
      DISCORD_CONFIG.ROLES.ADMIN,
      DISCORD_CONFIG.ROLES.STAFF
    ].includes(roleId))

    // Add premium tier badges based on selection
    const tiers = [
      { id: 'eclat', tier: 1, label: 'Pack Éclat', icon: LucideFlame, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
      { id: 'lanterne', tier: 2, label: 'Pack Lanterne', icon: LucideCrown, color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30' },
      { id: 'eternel', tier: 3, label: 'Pack Éternel', icon: LucideSparkles, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30' }
    ]
    
    const featuredIds = m.featured_badges || []
    const memberTier = isStaff ? 3 : (m.premium_tier || 0)
    
    if (featuredIds.length === 0) {
      // Default behavior: only show the highest tier badge they have access to
      const highestTier = tiers.filter(t => t.tier <= memberTier).pop()
      if (highestTier) badges.push(highestTier)
    } else {
      // Show all selected badges they have access to
      tiers.forEach(t => {
        if (t.tier <= memberTier && featuredIds.includes(t.id)) {
          badges.push(t)
        }
      })
    }

    // Add discord roles
    roleConfig.forEach(config => {
      if (m.roles.includes(config.id)) {
        badges.push(config)
      }
    })

    // Default to Membre if no badges
    if (badges.length === 0) {
      badges.push(roleConfig[roleConfig.length - 1])
    }

    return badges
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 md:px-12 bg-night-900 text-white relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-amber-500 mb-4 tracking-tighter italic">Les Veilleurs</h1>
          <p className="text-gray-500 font-light max-w-2xl mx-auto italic mb-12">"Chaque membre est une flamme qui illumine notre sanctuaire nocturne."</p>

          {/* Search and Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 max-w-5xl mx-auto bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl pointer-events-none" />
              <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher un veilleur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:ring-0 outline-none text-base"
              />
            </div>
            
            <div className="hidden lg:block w-px h-8 bg-white/10 my-auto" />
            <div className="lg:hidden h-px w-full bg-white/5 mx-auto" />

            <div className="flex items-center gap-3 px-3 py-2 lg:py-0 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 text-gray-500 shrink-0">
                <LucideFilter className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Filtrer :</span>
              </div>
              <div className="flex gap-2 shrink-0">
                {[
                  { label: 'Tous', value: 'all' },
                  { label: 'Éclat', value: 1, color: 'text-amber-500' },
                  { label: 'Lanterne', value: 2, color: 'text-violet-400' },
                  { label: 'Éternel', value: 3, color: 'text-yellow-500' }
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setFilterTier(btn.value as any)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all shrink-0 active:scale-95 touch-manipulation ${
                      filterTier === btn.value 
                        ? 'bg-amber-500 text-black shadow-[0_5px_20px_rgba(255,170,0,0.4)] scale-105 z-10' 
                        : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {loading && connectedMembers.length === 0 ? (
            // Squelette de chargement
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
            ))
          ) : filteredMembers.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((m) => {
                const badges = getMemberBadges(m)
                const isStaff = m.roles.some(roleId => [
                  DISCORD_CONFIG.ROLES.OWNER,
                  DISCORD_CONFIG.ROLES.CO_OWNER,
                  DISCORD_CONFIG.ROLES.ADMIN,
                  DISCORD_CONFIG.ROLES.STAFF
                ].includes(roleId))
                const isEternel = isStaff || (m.premium_tier || 0) >= 3
                const hasGoldNickname = isEternel && m.gold_nickname !== false
                const hasGradientNickname = isEternel && !m.gold_nickname && m.nicknameGradientColor1 && m.nicknameGradientColor2

                return (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link 
                      to={`/profile/${m.id}`}
                      state={{ memberData: m }}
                      className="rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group relative overflow-hidden backdrop-blur-xl flex flex-col h-full"
                    >
                      {/* Banner Area */}
                      <div className="h-20 w-full relative overflow-hidden">
                        {m.bannerUrl ? (
                          <img 
                            src={m.bannerUrl} 
                            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" 
                            alt="Banner"
                          />
                        ) : (
                          <div 
                            className="w-full h-full opacity-30" 
                            style={{ backgroundColor: m.bannerColor || '#1a1a1a' }}
                          />
                        )}
                      </div>

                      <div className="px-6 pb-8 pt-10 relative flex-1 flex flex-col items-center">
                        {/* Avatar */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                          <div className="relative group-hover:scale-110 transition-transform duration-500">
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <img
                              src={m.avatar 
                                ? `https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=128`
                                : `https://cdn.discordapp.com/embed/avatars/${parseInt(m.id) % 5}.png`
                              }
                              alt={m.username}
                              className="w-20 h-20 rounded-full border-4 border-night-900 relative z-10 shadow-2xl"
                            />
                            <StatusIndicator 
                              userId={m.id} 
                              size="sm"
                              className="absolute bottom-1 right-1 z-20 border-2 border-night-900" 
                            />
                          </div>
                        </div>

                        <h3 
                          className={`text-lg font-bold mb-4 text-center truncate w-full ${hasGoldNickname ? 'nickname-golden-animated' : (hasGradientNickname ? 'nickname-gradient-animated' : '')}`}
                          style={{ 
                            background: hasGradientNickname 
                              ? `linear-gradient(to right, ${m.nicknameGradientColor1} 0%, ${m.nicknameGradientColor2} 50%, ${m.nicknameGradientColor1} 100%)` 
                              : (hasGoldNickname ? undefined : 'none'),
                            WebkitBackgroundClip: (hasGradientNickname || hasGoldNickname) ? 'text' : 'initial',
                            color: (hasGoldNickname || hasGradientNickname) ? 'transparent' : (m.displayNameColor || '#FFFFFF'),
                            WebkitTextFillColor: (hasGoldNickname || hasGradientNickname) ? 'transparent' : 'initial'
                          }}
                        >
                          {m.username}
                        </h3>

                        <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                          {badges.slice(0, 3).map((badge, idx) => (
                            <div 
                              key={idx} 
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${badge.bgColor} border ${badge.borderColor} ${badge.color} text-[8px] font-bold uppercase tracking-wider`}
                            >
                              <badge.icon size={8} />
                              {badge.label}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Stats Section - Moved from absolute to relative for better stability */}
                      <div className="px-6 pb-6 mt-auto">
                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                          {/* Série de connexion (Streak) */}
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                            <LucideFlame size={12} className="fill-current animate-pulse" />
                            <span>{m.streak_count || 0}</span>
                          </div>
                          
                          {/* Flammes / Popularité (Heart) */}
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-pink-500 bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/20">
                            <LucideSparkles size={12} />
                            <span>{m.flames_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          ) : (
            <div className="col-span-full py-20 text-center">
              <LucideUsers size={48} className="mx-auto mb-4 text-gray-700" />
              <p className="text-gray-500 italic">Aucun veilleur ne correspond à ta recherche...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Members
