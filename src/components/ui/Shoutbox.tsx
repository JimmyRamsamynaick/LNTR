import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { LucideSend, LucideMessageSquare, LucideFlame, LucideSparkles, LucideCrown, LucideX, LucideReply } from 'lucide-react'
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
  recipient_id?: string
  recipient_username?: string
}

const Shoutbox: React.FC = () => {
  const { user } = useAuth()
  const [shouts, setShouts] = useState<Shout[]>([])
  const [newShout, setNewShout] = useState('')
  const [loading, setLoading] = useState(false)
  const [whisperTarget, setWhisperTarget] = useState<{ id: string, username: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchShouts = async () => {
    if (!user) {
      const { data } = await supabase
        .from('shoutbox')
        .select('*')
        .is('recipient_id', null)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setShouts(data.reverse())
      return
    }

    // Fetch both global shouts and private whispers involving the user
    const { data } = await supabase
      .from('shoutbox')
      .select('*')
      .or(`recipient_id.is.null,recipient_id.eq.${user.id},user_id.eq.${user.id}`)
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
        const newShout = payload.new as Shout
        
        // Only add if it's global or involves the current user
        const isGlobal = !newShout.recipient_id
        const isForMe = newShout.recipient_id === user?.id
        const isFromMe = newShout.user_id === user?.id

        if (isGlobal || isForMe || isFromMe) {
          setShouts(prev => [...prev.slice(-49), newShout])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

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
      const payload: any = {
        user_id: user.id,
        username: user.username,
        avatar: user.avatar,
        content: newShout.trim(),
        premium_tier: user.premium_tier || 0,
        roles: user.roles || []
      }

      if (whisperTarget) {
        payload.recipient_id = whisperTarget.id
        payload.recipient_username = whisperTarget.username
        
        const senderName = user.incognito_mode ? 'Un membre anonyme' : user.username;
        
        // Notification pour le destinataire
        await supabase.from('notifications').insert({
          user_id: whisperTarget.id,
          from_username: senderName,
          type: 'whisper',
          content: newShout.trim().substring(0, 50) + (newShout.length > 50 ? '...' : '')
        })
      }

      const { error } = await supabase
        .from('shoutbox')
        .insert(payload)

      if (error) throw error
      setNewShout('')
      // On ne reset PAS le whisperTarget pour permettre de continuer l'échange
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
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
            <LucideMessageSquare size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest">Les Murmures</h3>
            <p className="text-[10px] text-gray-500 font-light italic">"Chat global et chuchotements privés."</p>
          </div>
        </div>
        {whisperTarget && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400"
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter">Murmure à {whisperTarget.username}</span>
            <button onClick={() => setWhisperTarget(null)} className="hover:text-white">
              <LucideX size={12} />
            </button>
          </motion.div>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide scroll-smooth"
      >
        {shouts.map((shout) => {
          const isWhisper = !!shout.recipient_id
          const isFromMe = shout.user_id === user?.id
          const isForMe = shout.recipient_id === user?.id

          return (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={shout.id} 
              className={`flex gap-3 group ${isWhisper ? 'bg-indigo-500/5 -mx-2 px-2 py-1 rounded-xl border border-indigo-500/10' : ''}`}
            >
              <img 
                src={shout.avatar 
                  ? `https://cdn.discordapp.com/avatars/${shout.user_id}/${shout.avatar}.png?size=64`
                  : `https://cdn.discordapp.com/embed/avatars/${parseInt(shout.user_id) % 5}.png`
                }
                className="w-8 h-8 rounded-full border border-white/10 mt-1 shrink-0"
                alt={shout.username}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span 
                    className={`text-xs font-bold cursor-pointer hover:underline ${shout.premium_tier === 3 ? 'nickname-golden-animated' : 'text-gray-400'}`}
                    onClick={() => {
                      if (user && shout.user_id !== user.id) {
                        setWhisperTarget({ id: shout.user_id, username: shout.username })
                      }
                    }}
                  >
                    {shout.username}
                  </span>
                  {getBadgeIcon(shout.premium_tier || 0, shout.roles || [])}
                  
                  {isWhisper && (
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded shadow-lg ${
                      isForMe 
                        ? 'bg-amber-500 text-black animate-pulse' 
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {isFromMe ? `à ${shout.recipient_username}` : 'vous murmure'}
                    </span>
                  )}

                  {!isFromMe && user && (
                    <button 
                      onClick={() => setWhisperTarget({ id: shout.user_id, username: shout.username })}
                      className="p-1 rounded bg-white/5 hover:bg-amber-500/20 text-gray-500 hover:text-amber-500 transition-all opacity-0 group-hover:opacity-100"
                      title="Répondre en murmurant"
                    >
                      <LucideReply size={12} />
                    </button>
                  )}

                  <span className="text-[8px] text-gray-600 font-mono ml-auto">
                    {new Date(shout.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-sm font-light leading-snug break-words ${isWhisper ? 'text-indigo-200' : 'text-gray-300'}`}>
                  {shout.content}
                </p>
              </div>
            </motion.div>
          )
        })}
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
              placeholder={whisperTarget ? `Murmurer à ${whisperTarget.username}...` : "Murmurer quelque chose..."}
              maxLength={150}
              className={`w-full bg-white/5 border rounded-xl pl-4 pr-12 py-3 text-sm outline-none transition-all placeholder:text-gray-600 ${whisperTarget ? 'border-indigo-500/50 focus:border-indigo-400' : 'border-white/10 focus:border-amber-500/50'}`}
            />
            <button 
              type="submit"
              disabled={!newShout.trim() || loading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 transition-colors ${whisperTarget ? 'text-indigo-400 hover:text-indigo-300' : 'text-amber-500 hover:text-amber-400'} disabled:text-gray-600`}
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
