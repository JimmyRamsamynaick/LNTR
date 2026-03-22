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
  { id: DISCORD_CONFIG.ROLES.MEMBRE, label: 'Membre', icon: LucideUsers, color: 'text-gray-400', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30' }
]

const Members: React.FC = () => {
  const [connectedMembers, setConnectedMembers] = useState<DiscordUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<number | 'all'>('all')

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
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
            premium_tier: m.premium_tier || 0
          }))
          setConnectedMembers(mappedMembers)
        }
      } catch (e) {
        console.error('Failed to fetch members:', e)
      }
    }

    fetchMembers()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMembers, 30000)
    return () => clearInterval(interval)
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
    
    // Check premium tier first
    if ((m.premium_tier || 0) >= 1) {
      const tiers = [
        { tier: 1, label: 'Pack Éclat', icon: LucideFlame, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
        { tier: 2, label: 'Pack Lanterne', icon: LucideCrown, color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30' },
        { tier: 3, label: 'Pack Éternel', icon: LucideSparkles, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30' }
      ]
      const tier = tiers.find(t => t.tier === m.premium_tier)
      if (tier) badges.push(tier)
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
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
            <div className="relative flex-1">
              <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Rechercher un veilleur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:ring-0 outline-none"
              />
            </div>
            
            <div className="h-px md:h-8 md:w-px bg-white/10 my-auto" />

            <div className="flex items-center gap-2 px-2">
              <LucideFilter className="text-gray-500 w-4 h-4 mr-2" />
              <div className="flex gap-1">
                {[
                  { label: 'Tous', value: 'all' },
                  { label: 'Éclat', value: 1, color: 'text-amber-500' },
                  { label: 'Lanterne', value: 2, color: 'text-violet-400' },
                  { label: 'Éternel', value: 3, color: 'text-yellow-500' }
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setFilterTier(btn.value as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterTier === btn.value 
                        ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(255,170,0,0.3)]' 
                        : 'text-gray-500 hover:bg-white/5'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        className="w-full h-full opacity-30 group-hover:opacity-50 transition-opacity" 
                        style={{ backgroundColor: m.bannerColor || '#1a1a1a' }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-night-900/50" />
                  </div>

                  <div className="px-6 pb-6 -mt-10 flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-4">
                      <img 
                        src={m.avatar 
                          ? `https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=128`
                          : `https://cdn.discordapp.com/embed/avatars/${parseInt(m.id) % 5}.png`
                        }
                        alt={m.username}
                        className="w-20 h-20 rounded-full border-4 border-night-900 group-hover:border-amber-500/50 transition-colors shadow-2xl bg-night-900"
                      />
                      <StatusIndicator userId={m.id} className="absolute bottom-1 right-1" />
                    </div>

                    <h3 
                      className={`font-bold text-lg mb-1 group-hover:text-amber-500 transition-colors truncate w-full ${isEternel ? 'nickname-golden-animated' : ''}`} 
                      style={{ 
                        color: isEternel ? 'transparent' : (m.displayNameColor || '#FFFFFF'),
                        WebkitTextFillColor: isEternel ? 'transparent' : 'initial'
                      }}
                    >
                      {m.username}
                    </h3>
                    {m.custom_status && (
                      <p className="text-[10px] text-gray-500 italic mb-4 line-clamp-1">"{m.custom_status}"</p>
                    )}
                    
                    <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                      {badges.map((badge, idx) => (
                        <div key={idx} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badge.bgColor} border ${badge.borderColor} ${badge.color} text-[9px] font-bold uppercase tracking-wider`}>
                          <badge.icon size={10} />
                          {badge.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default Members
