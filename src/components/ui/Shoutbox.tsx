import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { LucideSend, LucideMessageSquare, LucideFlame, LucideSparkles, LucideCrown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../AuthContext'
import { DISCORD_CONFIG } from '../../lib/discord'

interface Shout {
  id: string
  user_id: string
  username: string
  avatar: string
  content: string
  created_at: string
  premium_tier?: number
  roles?: string[]
}

const Shoutbox: React.FC = () => {
  const { user } = useAuth()
  const [shouts, setShouts] = useState<Shout[]>([])
  const [newShout, setNewShout] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchShouts = async () => {
    const { data } = await supabase
      .from('shoutbox')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setShouts(data.reverse())
    }
  }

  useEffect(() => {
    fetchShouts()

    const channel = supabase
      .channel('shoutbox-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shoutbox' }, (payload) => {
        setShouts(prev => [...prev.slice(-49), payload.new as Shout])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [shouts])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newShout.trim() || loading) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('shoutbox')
        .insert({
          user_id: user.id,
          username: user.username,
          avatar: user.avatar,
          content: newShout.trim(),
          premium_tier: user.premium_tier || 0,
          roles: user.roles || []
        })

      if (error) throw error
      setNewShout('')
    } catch (e) {
      console.error('Failed to shout:', e)
    } finally {
      setLoading(false)
    }
  }

  const getBadgeIcon = (tier: number, roles: string[]) => {
    const isStaff = roles?.some(r => [
      DISCORD_CONFIG.ROLES.OWNER,
      DISCORD_CONFIG.ROLES.CO_OWNER,
      DISCORD_CONFIG.ROLES.ADMIN,
      DISCORD_CONFIG.ROLES.STAFF
    ].includes(r))

    if (isStaff) return <LucideCrown size={12} className="text-red-500" />
    if (tier === 3) return <LucideSparkles size={12} className="text-yellow-400" />
    if (tier === 2) return <LucideCrown size={12} className="text-amber-400" />
    if (tier === 1) return <LucideFlame size={12} className="text-amber-500" />
    return null
  }

  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
          <LucideMessageSquare size={18} />
        </div>
        <div>
          <h3 className="font-bold text-sm uppercase tracking-widest">Les Murmures</h3>
          <p className="text-[10px] text-gray-500 font-light italic">"Laissez votre trace dans l'obscurité."</p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide scroll-smooth"
      >
        {shouts.map((shout) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={shout.id} 
            className="flex gap-3 group"
          >
            <img 
              src={shout.avatar 
                ? `https://cdn.discordapp.com/avatars/${shout.user_id}/${shout.avatar}.png?size=64`
                : `https://cdn.discordapp.com/embed/avatars/${parseInt(shout.user_id) % 5}.png`
              }
              className="w-8 h-8 rounded-full border border-white/10 mt-1"
              alt={shout.username}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-bold ${shout.premium_tier === 3 ? 'nickname-golden-animated' : 'text-gray-400'}`}>
                  {shout.username}
                </span>
                {getBadgeIcon(shout.premium_tier || 0, shout.roles || [])}
                <span className="text-[8px] text-gray-600 font-mono">
                  {new Date(shout.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-300 font-light leading-snug break-words">
                {shout.content}
              </p>
            </div>
          </motion.div>
        ))}
        {shouts.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <LucideMessageSquare size={32} className="text-gray-700 mb-4" />
            <p className="text-gray-500 text-sm italic">"Aucun murmure pour le moment... Brisez le silence."</p>
          </div>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10">
          <div className="relative">
            <input 
              type="text" 
              value={newShout}
              onChange={(e) => setNewShout(e.target.value)}
              placeholder="Murmurer quelque chose..."
              maxLength={150}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:border-amber-500/50 outline-none transition-all placeholder:text-gray-600"
            />
            <button 
              type="submit"
              disabled={!newShout.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-amber-500 hover:text-amber-400 disabled:text-gray-600 transition-colors"
            >
              <LucideSend size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-white/5 border-t border-white/10 text-center">
          <p className="text-[10px] text-gray-500 italic">Connectez-vous pour murmurer.</p>
        </div>
      )}
    </div>
  )
}

export default Shoutbox
