import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LucideShieldCheck, LucideCrown, LucideShield, LucideZap, LucideUsers, LucideFlame, LucideSparkles } from 'lucide-react'
import { DISCORD_CONFIG } from '../../lib/discord'
import { DiscordUser } from '../AuthContext'
import StatusIndicator from '../ui/StatusIndicator'
import { supabase } from '../../lib/supabase'

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
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 bg-night-900 text-white relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-amber-500 mb-4 tracking-tighter italic">Les Veilleurs</h1>
          <p className="text-gray-500 font-light max-w-2xl mx-auto italic">"Chaque membre est une flamme qui illumine notre sanctuaire nocturne."</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {connectedMembers.map((m) => {
            const badges = getMemberBadges(m)
            const isStaff = m.roles.some(roleId => [
              DISCORD_CONFIG.ROLES.OWNER,
              DISCORD_CONFIG.ROLES.CO_OWNER,
              DISCORD_CONFIG.ROLES.ADMIN,
              DISCORD_CONFIG.ROLES.STAFF
            ].includes(roleId))
            const isEternel = isStaff || (m.premium_tier || 0) >= 3

            return (
              <Link 
                key={m.id} 
                to={`/profile/${m.id}`}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group relative overflow-hidden backdrop-blur-xl"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img 
                      src={m.avatar 
                        ? `https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=128`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(m.id) % 5}.png`
                      }
                      alt={m.username}
                      className="w-20 h-20 rounded-full border-2 border-white/10 group-hover:border-amber-500/50 transition-colors shadow-2xl"
                    />
                    <StatusIndicator userId={m.id} className="absolute bottom-1 right-1" />
                  </div>

                  <h3 
                    className={`font-bold text-lg mb-4 group-hover:text-amber-500 transition-colors truncate w-full ${isEternel ? 'nickname-golden-animated' : ''}`} 
                    style={{ 
                      color: isEternel ? 'transparent' : (m.displayNameColor || '#FFFFFF'),
                      WebkitTextFillColor: isEternel ? 'transparent' : 'initial'
                    }}
                  >
                    {m.username}
                  </h3>
                  
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
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Members
