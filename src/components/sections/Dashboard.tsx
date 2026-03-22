import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../AuthContext'
import { LucideLogOut, LucideSettings, LucideActivity, LucideZap, LucideShield, LucideCrown, LucideShieldCheck, LucideUsers, LucideStar, LucideBell, LucideMail, LucideArrowLeft, LucideSend, LucideFlame, LucideSparkles, LucideMessageCircle, LucideReply, LucideX } from 'lucide-react'
import { Navigate, Link } from 'react-router-dom'
import StatusIndicator from '../ui/StatusIndicator'
import Shoutbox from '../ui/Shoutbox'
import { DISCORD_CONFIG } from '../../lib/discord'
import { supabase } from '../../lib/supabase'

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

const Dashboard: React.FC = () => {
  const { user, logout, loading, updateStatus, refreshUser } = useAuth()
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [chats, setChats] = React.useState<any[]>([])
  const [selectedChat, setSelectedChat] = React.useState<any | null>(null)
  const [chatMessages, setChatMessages] = React.useState<any[]>([])
  const [newMsg, setNewMsg] = React.useState('')
  const [showStatusMenu, setShowStatusMenu] = React.useState(false)
  const [recentVisitors, setRecentVisitors] = React.useState<any[]>([])
  const [profileComments, setProfileComments] = React.useState<any[]>([])
  const [replyingToComment, setReplyingToComment] = React.useState<string | null>(null)
  const [replyContent, setReplyContent] = React.useState('')

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

    // 1.5 Fetch Profile Comments
    const { data: comments } = await supabase
      .from('profile_comments')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (comments) {
      // For each comment, check if there's a reply from me (the profile owner)
      const parents = comments.filter(c => !c.parent_id)
      const replies = comments.filter(c => c.parent_id)
      
      const mappedComments = parents.map(p => ({
        ...p,
        replies: replies.filter(r => r.parent_id === p.id)
      }))
      setProfileComments(mappedComments)
    }

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

  const handleReplyComment = async (commentId: string) => {
    if (!user || !replyContent.trim()) return

    try {
      const { error } = await supabase
        .from('profile_comments')
        .insert({
          profile_id: user.id,
          user_id: user.id,
          username: user.username,
          avatar: user.avatar,
          content: replyContent,
          parent_id: commentId
        })

      if (error) throw error

      setReplyContent('')
      setReplyingToComment(null)
      fetchData() // Refresh comments
    } catch (e) {
      console.error('Failed to reply to comment:', e)
      alert('Erreur lors de la réponse au commentaire.')
    }
  }

  const isStaff = user?.roles?.some(roleId => [
    DISCORD_CONFIG.ROLES.OWNER,
    DISCORD_CONFIG.ROLES.CO_OWNER,
    DISCORD_CONFIG.ROLES.ADMIN,
    DISCORD_CONFIG.ROLES.STAFF
  ].includes(roleId))

  const isVipOnDiscord = user?.roles?.some(roleId => [
    DISCORD_CONFIG.ROLES.VIP_ECLAT,
    DISCORD_CONFIG.ROLES.VIP_LANTERNE,
    DISCORD_CONFIG.ROLES.VIP_ETERNEL
  ].includes(roleId))
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
  const hasGoldNickname = isEternel && user?.gold_nickname !== false

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
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 md:px-12 bg-night-900 text-white overflow-x-hidden selection:bg-amber-500/30">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-serif font-black text-amber-500 mb-2 italic tracking-tighter">Tableau de Bord</h1>
            <p className="text-gray-500 font-light italic">"L'obscurité est ton sanctuaire, la lumière est ta trace."</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl w-full sm:w-auto overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500 hidden xs:flex">
              <LucideActivity size={20} />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Dernière visite</p>
              <p className="text-sm font-black text-white">À l'instant</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
          {/* Sidebar Area */}
          <div className="lg:col-span-1 space-y-6 md:space-y-10">
            {/* Profile Info Card */}
            <div className="p-6 md:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-amber-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-6 group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img
                    src={user.avatar 
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256` 
                      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`}
                    alt={user.username}
                    className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-night-900 relative z-10 shadow-2xl object-cover"
                  />
                  <StatusIndicator 
                    userId={user.id} 
                    size="lg"
                    className="absolute bottom-2 right-2 z-20 border-4 border-night-900" 
                    statusOverride={user.status as any}
                  />
                </div>
                
                <h2 
                  className={`text-2xl md:text-3xl font-serif font-black mb-1 tracking-tight truncate w-full text-center ${hasGoldNickname ? 'nickname-golden-animated' : ''}`}
                  style={{ 
                    color: hasGoldNickname ? 'transparent' : (user.displayNameColor || '#FFFFFF'),
                    WebkitTextFillColor: hasGoldNickname ? 'transparent' : 'initial'
                  }}
                >
                  {user.username}
                </h2>
                
                {user.custom_status && (
                  <p className="text-gray-500 italic text-sm mb-4 px-4 line-clamp-2">"{user.custom_status}"</p>
                )}
                
                <p className="text-gray-600 font-mono text-[10px] opacity-40 uppercase tracking-[0.2em] mb-6">ID: {user.id}</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {userBadges.length > 0 ? (
                    userBadges.map((badge, idx) => (
                      <div key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${badge.bgColor} border ${badge.borderColor} ${badge.color} text-[9px] font-black uppercase tracking-widest shadow-lg`}>
                        <badge.icon size={10} />
                        {badge.label}
                      </div>
                    ))
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-500 text-[9px] font-black uppercase tracking-widest">
                      <LucideUsers size={10} />
                      Membre
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-white/5 mb-8" />
                
                <div className="w-full grid grid-cols-2 gap-3">
                  <Link to="/settings" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all group touch-manipulation">
                    <LucideSettings className="w-5 h-5 text-gray-500 group-hover:text-amber-500 group-hover:rotate-90 transition-all duration-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-amber-500 transition-colors">Paramètres</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all group touch-manipulation"
                  >
                    <LucideLogOut className="w-5 h-5 text-red-500/50 group-hover:translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500/50">Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6 md:space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">

              <div className={`p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all duration-500 backdrop-blur-md relative shadow-xl ${showStatusMenu ? 'z-50' : 'z-10'}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-violet-600/20 text-violet-400">
                    <LucideActivity className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest">Activité Discord</h3>
                </div>
                <p className="text-gray-500 text-sm italic font-light mb-6">"Gérez votre statut interne sur la plateforme."</p>
                
                <div className="relative">
                   <button 
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className="w-full bg-white/5 px-5 py-4 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-amber-500/40 transition-all touch-manipulation shadow-inner"
                   >
                     <StatusIndicator 
                       userId={user.id} 
                       showText 
                       statusOverride={user.status as any}
                     />
                     <div className="text-gray-500 group-hover:text-amber-500 transition-colors group-hover:rotate-180 duration-500">
                        <LucideSettings size={18} />
                     </div>
                   </button>

                   <AnimatePresence>
                     {showStatusMenu && (
                       <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 w-full mt-3 p-3 bg-night-800 border border-white/10 rounded-[2rem] shadow-2xl z-[100] space-y-2 backdrop-blur-3xl"
                       >
                         {statusOptions.map((opt) => (
                           <button
                            key={opt.id}
                            onClick={() => {
                              updateStatus(opt.id as any)
                              setShowStatusMenu(false)
                            }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-sm font-bold touch-manipulation ${user.status === opt.id ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5' : 'text-gray-400 hover:bg-white/5'}`}
                           >
                             <div className={`w-3.5 h-3.5 rounded-full ${opt.color} shadow-lg shadow-current/20`} />
                             {opt.label}
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all duration-500 backdrop-blur-md relative z-10 shadow-xl overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-600/20 text-amber-500 group-hover:scale-110 transition-transform">
                      <LucideBell className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-widest">Alertes</h3>
                  </div>
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={markAsRead}
                      className="text-[10px] uppercase tracking-widest text-amber-500 hover:text-amber-400 font-black transition-colors"
                    >
                      Tout lire
                    </button>
                  )}
                </div>
                
                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 opacity-30 italic">
                      <LucideBell size={32} className="mb-2" />
                      <p className="text-xs">Aucune notification.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-4 rounded-2xl border transition-all hover:translate-x-1 ${n.read ? 'bg-white/5 border-white/5 opacity-40 grayscale' : 'bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-500/5'} group/notif`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-gray-600' : 'bg-amber-500 animate-pulse'}`} />
                          <div>
                            <p className="text-xs text-gray-300 leading-relaxed">
                              <span className="font-black text-white uppercase tracking-tighter mr-1">{n.from_username}</span> 
                              <span className="font-light opacity-80 italic">
                                {n.type === 'comment' ? 'a laissé un commentaire sur ton profil.' : 't\'a envoyé un message privé.'}
                              </span>
                            </p>
                            <span className="text-[9px] text-gray-600 mt-2 block font-black uppercase tracking-widest italic">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
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

            {/* Profile Comments Management */}
            <div className="p-8 md:p-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
              
              <h3 className="text-2xl md:text-3xl font-serif font-black mb-10 flex items-center gap-4">
                Derniers mots sur ton profil
                <div className="h-px flex-1 bg-white/5" />
              </h3>

              <div className="space-y-6">
                {profileComments.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                    <LucideMessageCircle size={40} className="mx-auto mb-4 text-gray-700" />
                    <p className="text-gray-500 italic">"Le silence règne encore sur ton profil..."</p>
                  </div>
                ) : (
                  profileComments.map((comment) => (
                    <div key={comment.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all group/comment">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <Link to={`/profile/${comment.user_id}`}>
                            <img
                              src={comment.avatar 
                                ? `https://cdn.discordapp.com/avatars/${comment.user_id}/${comment.avatar}.png?size=64` 
                                : `https://cdn.discordapp.com/embed/avatars/${parseInt(comment.user_id) % 5}.png`}
                              alt={comment.username}
                              className="w-12 h-12 rounded-2xl border-2 border-white/5 group-hover/comment:border-amber-500/30 transition-all object-cover shadow-xl"
                            />
                          </Link>
                          <div>
                            <Link to={`/profile/${comment.user_id}`} className="font-black text-white hover:text-amber-500 transition-colors uppercase tracking-tighter">
                              {comment.username}
                            </Link>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {comment.replies?.length === 0 && (
                          <button
                            onClick={() => setReplyingToComment(replyingToComment === comment.id ? null : comment.id)}
                            className="p-3 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all shadow-lg"
                            title="Répondre"
                          >
                            <LucideReply size={18} />
                          </button>
                        )}
                      </div>

                      <p className="text-gray-300 leading-relaxed italic font-light px-2 mb-6">"{comment.content}"</p>

                      {/* Existing Replies */}
                      {comment.replies?.map((reply: any) => (
                        <div key={reply.id} className="ml-6 md:ml-12 p-4 rounded-2xl bg-amber-500/5 border-l-4 border-amber-500 flex gap-4 shadow-inner">
                          <div className="p-2 rounded-xl bg-amber-500 text-black shadow-lg">
                            <LucideReply size={12} className="transform scale-x-[-1]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Ta réponse</p>
                            <p className="text-sm text-gray-300 italic font-light leading-relaxed">"{reply.content}"</p>
                          </div>
                        </div>
                      ))}

                      {/* Reply Input Area */}
                      <AnimatePresence>
                        {replyingToComment === comment.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-6 md:ml-12 mt-4 space-y-4"
                          >
                            <div className="relative">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Écris ta réponse..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all resize-none min-h-[100px] shadow-inner"
                              />
                              <div className="absolute bottom-3 right-3 flex gap-3">
                                <button
                                  onClick={() => {
                                    setReplyingToComment(null)
                                    setReplyContent('')
                                  }}
                                  className="p-2.5 text-gray-500 hover:text-white transition-colors"
                                >
                                  <LucideX size={20} />
                                </button>
                                <button
                                  onClick={() => handleReplyComment(comment.id)}
                                  disabled={!replyContent.trim()}
                                  className="p-3 bg-amber-600 text-black rounded-xl hover:bg-amber-500 transition-all disabled:opacity-50 shadow-xl shadow-amber-500/20"
                                >
                                  <LucideSend size={20} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Shoutbox */}
            <div className="h-[450px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
              <Shoutbox />
            </div>

            <div className="p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-md relative overflow-hidden shadow-2xl">
              {/* VIP Badge Decor */}
              {isVip ? (
                <div className="absolute top-6 right-6 p-3 rounded-2xl bg-amber-500 text-black border border-amber-500 flex items-center gap-3 shadow-[0_10px_30px_rgba(255,170,0,0.4)] animate-pulse">
                  <LucideStar size={20} fill="currentColor" />
                  <span className="text-xs font-black uppercase tracking-widest">Veilleur VIP Actif</span>
                </div>
              ) : (
                <div className="absolute top-6 right-6 p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-3">
                  <LucideZap size={20} fill="currentColor" />
                  <span className="text-xs font-black uppercase tracking-widest">Grade VIP disponible</span>
                </div>
              )}

              <h3 className="text-2xl md:text-4xl font-serif font-black mb-6 pr-20 leading-tight">Bienvenue sous la Lanterne, {user.username} !</h3>
              <p className="text-gray-400 leading-relaxed mb-10 max-w-xl text-lg font-light italic">
                {isVip 
                  ? "Merci de soutenir la communauté ! En tant que membre privilégié, tu as accès à tous les avantages exclusifs du sanctuaire."
                  : "Heureux de te revoir parmi nous. Ton refuge nocturne est prêt. Explore les salons et profite de l'ambiance unique de la Lanterne Nocturne."}
              </p>
              
              <div className="flex flex-wrap gap-6 items-center">
                 {!isVip && (
                   <Link to="/shop" className="px-10 py-4 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-500 transition-all hover:scale-105 flex items-center gap-3 uppercase tracking-widest text-xs shadow-xl shadow-violet-600/20">
                      <LucideZap size={20} /> Devenir VIP (3€)
                   </Link>
                 )}
                 <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Serveur en ligne</span>
                 </div>
              </div>
            </div>

            {/* Recent Visitors - Only for Tier 3 / Staff */}
            {isEternel && (
              <div className="p-8 md:p-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                <h3 className="text-2xl font-serif font-black mb-8 flex items-center gap-4">
                  Veilleurs ayant visité ton profil
                  <LucideActivity size={20} className="text-amber-500 animate-pulse" />
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                  {recentVisitors.length === 0 ? (
                    <div className="col-span-full py-8 text-center bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-gray-600 italic text-sm">"Personne n'a encore franchi ton seuil..."</p>
                    </div>
                  ) : (
                    recentVisitors.map((v) => (
                      <Link 
                        key={v.viewer_id} 
                        to={`/profile/${v.viewer_id}`}
                        className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-white/5 transition-all group/visitor"
                      >
                        <div className="relative">
                          <img
                            src={v.viewer_avatar 
                              ? `https://cdn.discordapp.com/avatars/${v.viewer_id}/${v.viewer_avatar}.png?size=64` 
                              : `https://cdn.discordapp.com/embed/avatars/${parseInt(v.viewer_id) % 5}.png`}
                            alt={v.viewer_username}
                            className="w-16 h-16 rounded-2xl border-2 border-white/10 group-hover/visitor:border-amber-500/50 group-hover/visitor:scale-110 transition-all object-cover shadow-xl"
                          />
                          <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover/visitor:opacity-100 rounded-2xl transition-opacity" />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 group-hover/visitor:text-amber-500 transition-colors text-center uppercase tracking-tighter truncate w-full">
                          {v.viewer_username}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
