import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../AuthContext'
import { LucideLogOut, LucideSettings, LucideActivity, LucideZap, LucideShield, LucideCrown, LucideShieldCheck, LucideUsers, LucideStar, LucideBell, LucideMail, LucideArrowLeft, LucideSend, LucideFlame, LucideSparkles } from 'lucide-react'
import { Navigate, Link } from 'react-router-dom'
import StatusIndicator from '../ui/StatusIndicator'
import { DISCORD_CONFIG } from '../../lib/discord'
import { supabase } from '../../lib/supabase'

const roleConfig = [
  { id: DISCORD_CONFIG.ROLES.OWNER, label: 'Owner', icon: LucideCrown, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  { id: DISCORD_CONFIG.ROLES.CO_OWNER, label: 'Co-Owner', icon: LucideShield, color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { id: DISCORD_CONFIG.ROLES.ADMIN, label: 'Admin', icon: LucideShieldCheck, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  { id: DISCORD_CONFIG.ROLES.STAFF, label: 'Staff', icon: LucideShield, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { id: DISCORD_CONFIG.ROLES.ANIMATEUR, label: 'Animateur', icon: LucideZap, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { id: DISCORD_CONFIG.ROLES.BOOSTER, label: 'Booster', icon: LucideZap, color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
  { id: DISCORD_CONFIG.ROLES.VIP, label: 'VIP', icon: LucideStar, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { id: DISCORD_CONFIG.ROLES.MEMBRE, label: 'Membre', icon: LucideUsers, color: 'text-gray-400', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30' }
]

const Dashboard: React.FC = () => {
  const { user, logout, loading, updateStatus, refreshUser } = useAuth()
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [chats, setChats] = React.useState<any[]>([])
  const [selectedChat, setSelectedChat] = React.useState<any | null>(null)
  const [chatMessages, setChatMessages] = React.useState<any[]>([])
  const [newMsg, setNewMsg] = React.useState('')
  const [showStatusMenu, setShowStatusMenu] = React.useState(false)
  const [recentVisitors, setRecentVisitors] = React.useState<any[]>([])

  const fetchData = React.useCallback(async () => {
    if (!user) return

    // Refresh user data (premium tier, etc.)
    await refreshUser()

    // 1. Fetch Notifications
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (notifs) setNotifications(notifs)

    // 2. Fetch Recent Visitors (Tier 3 only)
    const isEternel = user?.roles?.some(roleId => [
      DISCORD_CONFIG.ROLES.OWNER,
      DISCORD_CONFIG.ROLES.CO_OWNER,
      DISCORD_CONFIG.ROLES.ADMIN,
      DISCORD_CONFIG.ROLES.STAFF
    ].includes(roleId)) || (user?.premium_tier || 0) >= 3

    if (isEternel) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: visitors } = await supabase
        .from('profile_views')
        .select('*')
        .eq('profile_id', user.id)
        .gte('viewed_at', sevenDaysAgo.toISOString())
        .order('viewed_at', { ascending: false })
        .limit(10)
      
      if (visitors) setRecentVisitors(visitors)
    }

    // 3. Fetch Conversations
    const { data: msgs } = await supabase
      .from('private_messages')
      .select('*')
      .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (msgs) {
      // Get all unique contact IDs
      const contactIds = Array.from(new Set(msgs.map((m: any) => 
        m.from_id === user.id ? m.to_id : m.from_id
      )))

      // Fetch contact details from members table
      const { data: contactsData } = await supabase
        .from('members')
        .select('id, username, avatar')
        .in('id', contactIds)

      const contactsMap = new Map(contactsData?.map(c => [c.id, c]))

      // Group messages by contact to create chat list
        const chatMap = new Map()
        msgs.forEach((m: any) => {
          const contactId = m.from_id === user.id ? m.to_id : m.from_id
          const contact = contactsMap.get(contactId)
          const isFromMe = m.from_id === user.id
          
          if (!chatMap.has(contactId)) {
            chatMap.set(contactId, {
              id: contactId,
              username: contact?.username || (isFromMe ? 'Contact' : m.from_username),
              avatar: contact?.avatar,
              lastMessage: m.content,
              timestamp: m.created_at,
              unreadCount: !isFromMe && m.read === false ? 1 : 0
            })
          } else if (!isFromMe && m.read === false) {
            const current = chatMap.get(contactId)
            chatMap.set(contactId, { ...current, unreadCount: current.unreadCount + 1 })
          }
        })
        setChats(Array.from(chatMap.values()))
      }
  }, [user?.id]) // Depend only on user.id to avoid loop

  // Fetch initial data
  React.useEffect(() => {
    if (!user) return

    fetchData()
    refreshUser() // Fetch latest profile data once on mount

    // 3. Realtime Subscription
    const channel = supabase
      .channel(`user-updates-${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages'
      }, (payload: any) => {
        if (payload.new.to_id === user.id) fetchData()
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications'
      }, (payload: any) => {
        if (payload.new.user_id === user.id) fetchData()
      })
      .subscribe()

    // Heartbeat
    const heartbeat = setInterval(() => {
      updateStatus((user.status as any) || 'online')
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(heartbeat)
    }
  }, [user, fetchData])

  // Fetch messages when chat selected
  React.useEffect(() => {
    if (!selectedChat || !user) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('private_messages')
        .select('*')
        .or(`and(from_id.eq.${user.id},to_id.eq.${selectedChat.id}),and(from_id.eq.${selectedChat.id},to_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      if (data) setChatMessages(data)

      // Mark messages as read
      const unreadIds = data?.filter(m => m.to_id === user.id && m.read === false).map(m => m.id) || []
      if (unreadIds.length > 0) {
        await supabase
          .from('private_messages')
          .update({ read: true })
          .in('id', unreadIds)
        
        // Update local state to remove badge immediately
        setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, unreadCount: 0 } : c))
      }
    }

    fetchMessages()

    // Realtime listener for CURRENT chat
    const channel = supabase
      .channel(`chat-${selectedChat.id}-${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages'
      }, (payload: any) => {
        const newMsg = payload.new
        // Only update if message belongs to THIS conversation
        const isFromContact = newMsg.from_id === selectedChat.id && newMsg.to_id === user.id
        const isFromMe = newMsg.from_id === user.id && newMsg.to_id === selectedChat.id
        
        if (isFromContact || isFromMe) {
          setChatMessages(prev => [...prev, newMsg])
          
          // If it's from contact, mark it read immediately since we are looking at the chat
          if (isFromContact) {
            supabase
              .from('private_messages')
              .update({ read: true })
              .eq('id', newMsg.id)
              .then(() => {
                setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, unreadCount: 0 } : c))
              })
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedChat, user])

  const handleSendMsg = async () => {
    if (!user || !selectedChat || !newMsg.trim()) return

    const { error: msgError } = await supabase
      .from('private_messages')
      .insert({
        from_id: user.id,
        to_id: selectedChat.id,
        content: newMsg,
        from_username: user.username,
        read: false
      })

    if (!msgError) {
      // Send notification to the recipient
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedChat.id,
          from_username: user.username,
          type: 'message',
          content: newMsg.substring(0, 50) + (newMsg.length > 50 ? '...' : '')
        })

      setNewMsg('')
      // fetchData() // On retire cet appel car le realtime va maintenant s'en charger proprement
    } else {
      console.error('Erreur lors de l\'envoi du message:', msgError)
      alert(`Erreur: ${msgError.message}`)
    }
  }

  const markAsRead = async () => {
    if (user) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
      
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    }
  }

  const isStaff = user?.roles?.some(roleId => [
    DISCORD_CONFIG.ROLES.OWNER,
    DISCORD_CONFIG.ROLES.CO_OWNER,
    DISCORD_CONFIG.ROLES.ADMIN,
    DISCORD_CONFIG.ROLES.STAFF
  ].includes(roleId))

  const isVipOnDiscord = user?.roles?.includes(DISCORD_CONFIG.ROLES.VIP)
  const isVip = isStaff || isVipOnDiscord || (user?.premium_tier || 0) >= 1

  const premiumTiers = [
    { tier: 1, label: 'Pack Éclat', icon: LucideFlame, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
    { tier: 2, label: 'Pack Lanterne', icon: LucideCrown, color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30' },
    { tier: 3, label: 'Pack Éternel', icon: LucideSparkles, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30' }
  ]

  const getAllBadges = () => {
    const badges = []
    
    // Add premium tier badge
    const tier = premiumTiers.find(p => p.tier === user?.premium_tier)
    if (tier) badges.push(tier)
    
    // Add all matching discord roles
    if (user?.roles) {
      roleConfig.forEach(config => {
        if (user.roles.includes(config.id)) {
          badges.push(config)
        }
      })
    }
    
    return badges
  }

  const userBadges = getAllBadges()

  const isEternel = isStaff || (user?.premium_tier || 0) >= 3

  const statusOptions = [
    { id: 'online', label: 'En ligne', color: 'bg-green-500' },
    { id: 'idle', label: 'Absent', color: 'bg-yellow-500' },
    { id: 'dnd', label: 'Ne pas déranger', color: 'bg-red-500' },
    { id: 'streaming', label: 'En live', color: 'bg-purple-600' },
    { id: 'offline', label: 'Invisible', color: 'bg-gray-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-night-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" />
  }

  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 bg-night-900 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-900/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-10"
        >
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-amber-600" />
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-125 group-hover:scale-150 transition-transform duration-500" />
                  <img
                    src={user.avatar 
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`
                    }
                    alt={user.username}
                    className="w-32 h-32 rounded-full border-4 border-amber-500/30 relative z-10 shadow-2xl"
                  />
                  <StatusIndicator 
                    userId={user.id} 
                    size="lg"
                    className="absolute bottom-1 right-1 z-20 scale-110" 
                  />
                </div>
                <h2 
                  className={`text-3xl font-serif font-bold mb-1 tracking-tight ${isEternel ? 'nickname-golden-animated' : ''}`}
                  style={{ 
                    color: isEternel ? 'transparent' : (user.displayNameColor || '#FFFFFF'),
                    WebkitTextFillColor: isEternel ? 'transparent' : 'initial'
                  }}
                >
                  {user.username}
                </h2>
                <p className="text-gray-500 font-mono text-sm mb-4">ID: {user.id}</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {userBadges.length > 0 ? (
                    userBadges.map((badge, idx) => (
                      <div key={idx} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badge.bgColor} border ${badge.borderColor} ${badge.color} text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,170,0,0.05)]`}>
                        <badge.icon size={12} />
                        {badge.label}
                      </div>
                    ))
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                      <LucideUsers size={12} />
                      Membre
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-white/10 mb-8" />
                <div className="w-full space-y-4">
                  <Link to="/settings" className="w-full flex items-center gap-4 px-6 py-4 rounded-xl hover:bg-white/5 transition-colors group">
                    <LucideSettings className="w-5 h-5 text-gray-500 group-hover:text-amber-500" />
                    <span className="font-medium group-hover:text-amber-500 transition-colors">Paramètres profil</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors group"
                  >
                    <LucideLogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span className="font-medium">Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className={`p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all duration-300 backdrop-blur-md relative ${showStatusMenu ? 'z-50' : 'z-10'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-violet-600/20 text-violet-400">
                    <LucideActivity className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Activité Discord</h3>
                </div>
                <p className="text-gray-400">Gérez votre statut interne.</p>
                <div className="mt-6 relative">
                   <button 
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className="w-full bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between group hover:border-amber-500/30 transition-all"
                   >
                     <StatusIndicator 
                       userId={user.id} 
                       showText 
                     />
                     <div className="text-gray-500 group-hover:text-amber-500 transition-colors">
                        <LucideSettings size={16} />
                     </div>
                   </button>

                   <AnimatePresence>
                     {showStatusMenu && (
                       <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 w-full mt-2 p-2 bg-night-800 border border-white/10 rounded-2xl shadow-2xl z-[100] space-y-1"
                       >
                         {statusOptions.map((opt) => (
                           <button
                            key={opt.id}
                            onClick={() => {
                              updateStatus(opt.id as any)
                              setShowStatusMenu(false)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-sm ${user.status === opt.id ? 'bg-white/5 text-amber-500' : 'text-gray-400'}`}
                           >
                             <div className={`w-3 h-3 rounded-full ${opt.color}`} />
                             {opt.label}
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all duration-300 backdrop-blur-md relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-600/20 text-amber-500">
                      <LucideBell className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Notifications</h3>
                  </div>
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={markAsRead}
                      className="text-[10px] uppercase tracking-widest text-amber-500 hover:text-amber-400 font-bold"
                    >
                      Tout lire
                    </button>
                  )}
                </div>
                <div className="space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="text-gray-600 text-sm italic">Aucune notification.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-3 rounded-xl border ${n.read ? 'bg-white/5 border-white/5 opacity-50' : 'bg-amber-500/10 border-amber-500/20'} transition-all`}>
                        <p className="text-xs text-gray-300">
                          <span className="font-bold text-amber-500">{n.from_username}</span> 
                          {n.type === 'comment' ? ' a laissé un commentaire sur ton profil.' : ' t\'a envoyé un message privé.'}
                        </p>
                        <span className="text-[10px] text-gray-600 mt-1 block">{new Date(n.created_at).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Visitors - Only for Tier 3 / Staff */}
              {isEternel && (
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all duration-300 backdrop-blur-md relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
                      <LucideUsers className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Visiteurs Récents</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentVisitors.length === 0 ? (
                      <p className="text-gray-600 text-sm italic py-4">Aucun visiteur récent.</p>
                    ) : (
                      recentVisitors.map((v) => (
                        <Link 
                          key={v.id} 
                          to={`/profile/${v.viewer_id}`}
                          title={`${v.viewer_username} - ${new Date(v.viewed_at).toLocaleDateString()}`}
                          className="relative group"
                        >
                          <img
                            src={v.viewer_avatar 
                              ? `https://cdn.discordapp.com/avatars/${v.viewer_id}/${v.viewer_avatar}.png?size=64`
                              : `https://cdn.discordapp.com/embed/avatars/${parseInt(v.viewer_id) % 5}.png`
                            }
                            alt={v.viewer_username}
                            className="w-10 h-10 rounded-full border border-white/10 group-hover:border-amber-500/50 transition-colors"
                          />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-night-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-bold">
                    Derniers 7 jours • Tier 3 Exclusif
                  </p>
                </div>
              )}

              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all duration-300 backdrop-blur-md flex flex-col min-h-[300px] relative z-10">
                {!selectedChat ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
                        <LucideMail className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold">Messages Privés</h3>
                    </div>
                    <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                      {chats.length === 0 ? (
                        <p className="text-gray-600 text-sm italic text-center py-10">Aucune discussion active.</p>
                      ) : (
                        chats.map((chat) => (
                          <button 
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 text-left relative group"
                          >
                            <img
                              src={chat.avatar 
                                ? `https://cdn.discordapp.com/avatars/${chat.id}/${chat.avatar}.png?size=64`
                                : `https://cdn.discordapp.com/embed/avatars/${parseInt(chat.id) % 5}.png`
                              }
                              alt={chat.username}
                              className="w-10 h-10 rounded-full border border-white/10"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-white group-hover:text-amber-500 transition-colors">{chat.username}</h4>
                              <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                            </div>
                            {chat.unreadCount > 0 && (
                              <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,170,0,0.5)]">
                                {chat.unreadCount}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                      <button 
                        onClick={() => setSelectedChat(null)}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                      >
                        <LucideArrowLeft size={20} />
                      </button>
                      <Link 
                        to={`/profile/${selectedChat.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={selectedChat.avatar 
                            ? `https://cdn.discordapp.com/avatars/${selectedChat.id}/${selectedChat.avatar}.png?size=64`
                            : `https://cdn.discordapp.com/embed/avatars/${parseInt(selectedChat.id) % 5}.png`
                          }
                          alt={selectedChat.username}
                          className="w-8 h-8 rounded-full border border-white/10"
                        />
                        <h4 className="font-bold text-amber-500">{selectedChat.username}</h4>
                      </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar max-h-[200px]">
                      {chatMessages.map((m) => (
                        <div key={m.id} className={`flex ${m.from_id === user.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                            m.from_id === user.id 
                              ? 'bg-amber-600 text-black font-medium rounded-tr-none' 
                              : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                          }`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex gap-2 p-1">
                      <input 
                        type="text"
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMsg()
                          }
                        }}
                        placeholder="Écrire un message..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                      />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          handleSendMsg()
                        }}
                        disabled={!newMsg.trim()}
                        className="p-2 bg-amber-600 text-black rounded-xl hover:bg-amber-500 transition-all disabled:opacity-50 flex items-center justify-center min-w-[40px]"
                      >
                        <LucideSend size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-md relative overflow-hidden">
              {/* VIP Badge Decor */}
              {isVip ? (
                <div className="absolute top-4 right-4 p-2 rounded-lg bg-amber-500 text-black border border-amber-500 flex items-center gap-2 shadow-[0_0_20px_rgba(255,170,0,0.4)] animate-pulse">
                  <LucideStar size={16} fill="currentColor" />
                  <span className="text-xs font-bold uppercase tracking-widest">Membre VIP Actif</span>
                </div>
              ) : (
                <div className="absolute top-4 right-4 p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-2">
                  <LucideZap size={16} fill="currentColor" />
                  <span className="text-xs font-bold uppercase tracking-widest">Offre VIP disponible</span>
                </div>
              )}

              <h3 className="text-2xl font-serif font-bold mb-6">Bienvenue sous la Lanterne, {user.username} !</h3>
              <p className="text-gray-400 leading-relaxed mb-8 max-w-xl">
                {isVip 
                  ? "Merci de soutenir la communauté ! En tant que membre VIP, tu as accès à tous les avantages exclusifs du site et du serveur."
                  : "Heureux de te revoir parmi nous. Ton refuge nocturne est prêt. Explore les salons, participe aux événements et profite de l'ambiance unique de la Lanterne Nocturne."}
              </p>
              
              <div className="flex flex-wrap gap-4 items-center">
                 <a 
                   href={DISCORD_CONFIG.INVITE_LINK}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="px-8 py-3 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all hover:scale-105"
                 >
                   Rejoindre un salon vocal
                 </a>
                 {!isVip && (
                   <Link to="/shop" className="px-8 py-3 bg-violet-600/20 border border-violet-500/30 text-violet-400 font-bold rounded-full hover:bg-violet-600/30 transition-all flex items-center gap-2">
                      <LucideZap size={18} /> Devenir VIP (3€)
                   </Link>
                 )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
