import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LucideArrowLeft, LucideCrown, LucideShieldCheck, LucideShield, LucideZap, LucideUsers, LucideActivity, LucideMessageCircle, LucideSend, LucideTrash2, LucideReply, LucideX, LucideSparkles, LucideFlame, LucideMessageSquare } from 'lucide-react'
import { DISCORD_CONFIG } from '../../lib/discord'
import { DiscordUser, useAuth } from '../AuthContext'
import StatusIndicator from '../ui/StatusIndicator'
import { supabase } from '../../lib/supabase'

interface Comment {
  id: string
  userId: string
  username: string
  avatar: string
  content: string
  timestamp: number
  replies?: Comment[]
}

const roleConfig = [
  { id: DISCORD_CONFIG.ROLES.OWNER, label: 'Owner', icon: LucideCrown, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  { id: DISCORD_CONFIG.ROLES.CO_OWNER, label: 'Co-Owner', icon: LucideShield, color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { id: DISCORD_CONFIG.ROLES.ADMIN, label: 'Admin', icon: LucideShieldCheck, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  { id: DISCORD_CONFIG.ROLES.STAFF, label: 'Staff', icon: LucideShield, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { id: DISCORD_CONFIG.ROLES.ANIMATEUR, label: 'Animateur', icon: LucideZap, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { id: DISCORD_CONFIG.ROLES.BOOSTER, label: 'Booster', icon: LucideZap, color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
  { id: DISCORD_CONFIG.ROLES.MEMBRE, label: 'Membre', icon: LucideUsers, color: 'text-gray-400', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30' }
]

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [member, setMember] = useState<DiscordUser | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showChatModal, setShowChatModal] = useState(false)
  const [showShoutModal, setShowShoutModal] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [shoutMessage, setShoutMessage] = useState('')

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) {
          setMember({
            id: data.id,
            username: data.username,
            avatar: data.avatar,
            roles: data.roles || [],
            status: data.status as any,
            bio: data.bio,
            bannerColor: data.banner_color,
            displayNameColor: data.display_name_color,
            premium_tier: data.premium_tier,
            bannerUrl: data.banner_url
          })
        }
      } catch (e) {
        console.error('Failed to fetch member:', e)
      }
    }

    fetchMember()

    // Record profile view
    const recordView = async () => {
      if (currentUser && id && currentUser.id !== id) {
        // Check if current user is incognito
        if (currentUser.incognito_mode) return

        try {
          await supabase
            .from('profile_views')
            .upsert({
              profile_id: id,
              viewer_id: currentUser.id,
              viewer_username: currentUser.username,
              viewer_avatar: currentUser.avatar,
              viewed_at: new Date().toISOString()
            }, { onConflict: 'profile_id, viewer_id' })
        } catch (e) {
          console.error('Failed to record view:', e)
        }
      }
    }

    recordView()

    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('profile_comments')
          .select('*')
          .eq('profile_id', id)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
          const parents = data.filter(c => !c.parent_id)
          const replies = data.filter(c => c.parent_id)
          
          const mappedComments = parents.map(p => ({
            id: p.id,
            userId: p.user_id,
            username: p.username,
            avatar: p.avatar,
            content: p.content,
            timestamp: new Date(p.created_at).getTime(),
            replies: replies.filter(r => r.parent_id === p.id).map(r => ({
              id: r.id,
              userId: r.user_id,
              username: r.username,
              avatar: r.avatar,
              content: r.content,
              timestamp: new Date(r.created_at).getTime()
            }))
          }))
          setComments(mappedComments)
        }
      } catch (e) {
        console.error('Failed to fetch comments:', e)
        // Fallback to local storage if table doesn't exist yet
        const allComments = JSON.parse(localStorage.getItem(`comments_${id}`) || '[]')
        setComments(allComments)
      }
    }

    fetchComments()

    // Realtime comments
    const channel = supabase
      .channel(`comments-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_comments', filter: `profile_id=eq.${id}` }, () => fetchComments())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const handleAddComment = async () => {
    if (!currentUser || !newComment.trim()) return

    const commentContent = newComment.trim()
    setNewComment('')

    try {
      const { error } = await supabase
        .from('profile_comments')
        .insert({
          profile_id: id,
          user_id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          content: commentContent
        })

      if (error) throw error

      // Notify user
      if (id !== currentUser.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: id,
            from_username: currentUser.username,
            type: 'comment',
            content: commentContent.substring(0, 50) + (commentContent.length > 50 ? '...' : '')
          })
      }
    } catch (e) {
      console.error('Failed to add comment:', e)
      setNewComment(commentContent) // Restore content on error
      alert('Erreur lors de l\'ajout du commentaire.')
    }
  }

  const handleAddReply = async (commentId: string) => {
    if (!currentUser || !replyContent.trim()) return

    try {
      const { error } = await supabase
        .from('profile_comments')
        .insert({
          profile_id: id,
          user_id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          content: replyContent,
          parent_id: commentId
        })

      if (error) throw error

      setReplyContent('')
      setReplyingTo(null)
      // fetchComments sera appelé par le realtime
    } catch (e) {
      console.error('Failed to add reply:', e)
      alert('Erreur lors de l\'ajout de la réponse.')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('profile_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      // fetchComments sera appelé par le realtime
    } catch (e) {
      console.error('Failed to delete comment:', e)
      alert('Erreur lors de la suppression.')
    }
  }

  const handleSendDM = async () => {
    if (!currentUser || !chatMessage.trim()) return

    try {
      // 1. Send message to Supabase
      const { error: msgError } = await supabase
        .from('private_messages')
        .insert({
          from_id: currentUser.id,
          to_id: id,
          content: chatMessage,
          from_username: currentUser.username,
          read: false
        })

      if (msgError) throw msgError

      // 2. Create notification in Supabase
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: id,
          from_username: currentUser.username,
          type: 'message',
          content: chatMessage.substring(0, 50) + (chatMessage.length > 50 ? '...' : '')
        })

      if (notifError) throw notifError

      setChatMessage('')
      setShowChatModal(false)
      alert('Message envoyé avec succès !')
    } catch (e) {
      console.error('Failed to send DM:', e)
      alert('Erreur lors de l\'envoi du message.')
    }
  }

  const handleSendShout = async () => {
    if (!currentUser || !shoutMessage.trim()) return

    try {
      const { error } = await supabase
        .from('shoutbox')
        .insert({
          user_id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          content: shoutMessage.trim(),
          premium_tier: currentUser.premium_tier || 0,
          roles: currentUser.roles || []
        })

      if (error) throw error

      setShoutMessage('')
      setShowShoutModal(false)
      alert('Votre murmure a été envoyé au dashboard !')
    } catch (e) {
      console.error('Failed to shout:', e)
      alert('Erreur lors de l\'envoi du murmure.')
    }
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-900 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Membre introuvable</h2>
          <Link to="/members" className="text-amber-500 hover:underline flex items-center justify-center gap-2">
            <LucideArrowLeft size={20} /> Retour à la liste
          </Link>
        </div>
      </div>
    )
  }

  const getAllBadges = () => {
    const badges = []
    
    // Add premium tier badge
    const tiers = [
      { tier: 1, label: 'Pack Éclat', icon: LucideFlame, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
      { tier: 2, label: 'Pack Lanterne', icon: LucideCrown, color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30' },
      { tier: 3, label: 'Pack Éternel', icon: LucideSparkles, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30' }
    ]
    const tier = tiers.find(t => t.tier === member.premium_tier)
    if (tier) badges.push(tier)
    
    // Add all matching discord roles
    roleConfig.forEach(config => {
      if (member.roles.includes(config.id)) {
        badges.push(config)
      }
    })
    
    return badges
  }

  const userBadges = getAllBadges()
  const isCurrentUserStaff = currentUser?.roles?.some(roleId => [
    DISCORD_CONFIG.ROLES.OWNER,
    DISCORD_CONFIG.ROLES.CO_OWNER,
    DISCORD_CONFIG.ROLES.ADMIN,
    DISCORD_CONFIG.ROLES.STAFF
  ].includes(roleId))

  const isMemberStaff = member.roles.some(roleId => [
    DISCORD_CONFIG.ROLES.OWNER,
    DISCORD_CONFIG.ROLES.CO_OWNER,
    DISCORD_CONFIG.ROLES.ADMIN,
    DISCORD_CONFIG.ROLES.STAFF
  ].includes(roleId))
  const isEternel = isMemberStaff || (member.premium_tier || 0) >= 3
    if (!currentUser || currentUser.id === member.id) return
    
    try {
      const { error } = await supabase.rpc('increment_flames', { member_id: member.id })
      if (error) throw error
      
      setMember(prev => prev ? { ...prev, flames_count: (prev.flames_count || 0) + 1 } : null)
    } catch (e) {
      console.error('Failed to light flame:', e)
    }
  }

  return (
    <div className="min-h-screen pt-32 px-4 sm:px-6 md:px-12 bg-night-900 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-900/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/members')}
          className="flex items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors mb-12 group"
        >
          <LucideArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Retour aux membres
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-10"
        >
          {/* Main Info Card */}
          <div className="md:col-span-1">
            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden text-center">
              {/* Profile Banner */}
              {member.bannerUrl ? (
                <img 
                  src={member.bannerUrl} 
                  className="absolute top-0 left-0 w-full h-24 z-0 object-cover opacity-50" 
                  alt="Banner"
                />
              ) : (
                <div 
                  className="absolute top-0 left-0 w-full h-24 z-0 opacity-50" 
                  style={{ backgroundColor: member.bannerColor || 'transparent' }}
                />
              )}
              
              <div className="relative mb-6 mt-8">
                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-125" />
                <img
                  src={member.avatar 
                    ? `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=256`
                    : `https://cdn.discordapp.com/embed/avatars/${parseInt(member.id) % 5}.png`
                  }
                  alt={member.username}
                  className="w-32 h-32 rounded-full border-4 border-white/10 relative z-10 shadow-2xl mx-auto"
                />
                {/* Status Indicator (Dot only) */}
                <StatusIndicator 
                  userId={member.id} 
                  size="lg"
                  className="absolute bottom-2 right-1/4 z-20" 
                />
              </div>

              <h2 
                className={`text-3xl font-serif font-bold mb-1 tracking-tight truncate relative z-10 ${isEternel ? 'nickname-golden-animated' : ''}`} 
                style={{ 
                  color: isEternel ? 'transparent' : (member.displayNameColor || '#FFFFFF'),
                  WebkitTextFillColor: isEternel ? 'transparent' : 'initial'
                }}
              >
                {member.username}
              </h2>
              
              {/* Badges Display under Username */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-4 relative z-10 px-2">
                {userBadges.map((badge, idx) => (
                  <div 
                    key={idx} 
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${badge.bgColor} border ${badge.borderColor} ${badge.color} text-[9px] font-bold uppercase tracking-wider shadow-sm hover:scale-105 transition-transform cursor-default`}
                    title={badge.label}
                  >
                    <badge.icon size={10} />
                    {badge.label}
                  </div>
                ))}
                {userBadges.length === 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-500 text-[9px] font-bold uppercase tracking-wider">
                    <LucideUsers size={10} />
                    Membre
                  </div>
                )}
              </div>

              {member.custom_status && (
                <p className="text-gray-500 italic text-sm mb-4 relative z-10 px-4">"{member.custom_status}"</p>
              )}
              
              {/* Status Text */}
              <div className="mb-6 flex justify-center">
                <StatusIndicator 
                  userId={member.id} 
                  showText 
                  showCustomStatus
                  className="bg-white/5 px-4 py-2 rounded-full border border-white/10"
                />
              </div>

              <p className="text-gray-500 font-mono text-xs opacity-50 uppercase tracking-widest mb-6">ID: {member.id}</p>

              {/* Flames Button */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={handleFlame}
                  disabled={!currentUser || currentUser.id === member.id}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-500 group ${
                    currentUser?.id === member.id 
                      ? 'bg-white/5 text-gray-500 cursor-default' 
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                  }`}
                >
                  <div className="relative">
                    <LucideFlame size={20} className={currentUser?.id !== member.id ? "group-hover:animate-bounce" : ""} />
                    {currentUser?.id !== member.id && (
                      <LucideSparkles size={12} className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                    )}
                  </div>
                  <span className="font-bold">{member.flames_count || 0} Flammes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Details / Activity Area */}
          <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-violet-600/20 text-violet-400">
                    <LucideActivity className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Activité</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed italic">
                  "Apparu pour la première fois sous la Lanterne via le site."
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-amber-600/20 text-amber-500">
                    <LucideMessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Badge Spécial</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500" title="Utilisateur certifié du site">
                    <LucideCrown size={16} />
                  </div>
                  <span className="text-sm text-gray-400">Certifié Site</span>
                </div>
              </div>
            </div>

            <div className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-md">
              <h3 className="text-2xl font-serif font-bold mb-6">À propos de {member.username}</h3>
              <p className="text-gray-400 leading-relaxed font-light text-lg italic">
                {member.bio || `Ce membre a rejoint la communauté de la Lanterne Nocturne. Vous pouvez le retrouver sur le serveur Discord pour discuter, jouer ou simplement passer du bon temps sous la même lueur.`}
              </p>
              
              <div className="mt-10 pt-10 border-t border-white/5 flex flex-wrap gap-4">
                <a 
                  href={DISCORD_CONFIG.INVITE_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <LucideUsers size={18} /> Discord
                </a>
                
                {currentUser && currentUser.id !== id && (
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => {
                        setShoutMessage(`@${member.username} `)
                        setShowShoutModal(true)
                      }}
                      className="px-8 py-3 bg-amber-600/10 border border-amber-600/20 text-amber-500 font-bold rounded-full hover:bg-amber-600 hover:text-black transition-all flex items-center gap-2"
                    >
                      <LucideMessageSquare size={18} /> Murmurer
                    </button>
                    
                    <button 
                      onClick={() => setShowChatModal(true)}
                      className="px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <LucideMessageCircle size={18} /> Message Privé
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Private Message Modal */}
            <AnimatePresence>
              {showChatModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-lg bg-night-800 border border-white/10 rounded-3xl p-8 relative shadow-2xl"
                  >
                    <button 
                      onClick={() => setShowChatModal(false)}
                      className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                    >
                      <LucideX size={24} />
                    </button>
                    
                    <h3 className="text-2xl font-serif font-bold mb-2">Message à {member.username}</h3>
                    <p className="text-gray-500 text-sm mb-6 italic">"Que la lumière guide vos paroles."</p>
                    
                    <textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Votre message privé..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:border-amber-500/50 outline-none transition-all resize-none min-h-[150px] mb-6"
                    />
                    
                    <div className="flex justify-end gap-4">
                      <button 
                        onClick={() => setShowChatModal(false)}
                        className="px-6 py-3 text-gray-500 hover:text-white font-bold transition-colors"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={handleSendDM}
                        disabled={!chatMessage.trim()}
                        className="px-8 py-3 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <LucideSend size={18} /> Envoyer
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Shout Modal */}
            <AnimatePresence>
              {showShoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-lg bg-night-800 border border-white/10 rounded-3xl p-8 relative shadow-2xl"
                  >
                    <button 
                      onClick={() => setShowShoutModal(false)}
                      className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                    >
                      <LucideX size={24} />
                    </button>
                    
                    <h3 className="text-2xl font-serif font-bold mb-2">Murmurer à la communauté</h3>
                    <p className="text-gray-500 text-sm mb-6 italic">"Votre message sera visible par tous sur le Dashboard."</p>
                    
                    <textarea
                      value={shoutMessage}
                      onChange={(e) => setShoutMessage(e.target.value)}
                      placeholder="Votre murmure..."
                      maxLength={150}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:border-amber-500/50 outline-none transition-all resize-none min-h-[100px] mb-6"
                    />
                    
                    <div className="flex justify-end gap-4">
                      <button 
                        onClick={() => setShowShoutModal(false)}
                        className="px-6 py-3 text-gray-500 hover:text-white font-bold transition-colors"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={handleSendShout}
                        disabled={!shoutMessage.trim()}
                        className="px-8 py-3 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <LucideSend size={18} /> Murmurer
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Comments Section */}
            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <h3 className="text-2xl font-serif font-bold mb-8">Lanterne d'Or : Commentaires</h3>
              
              {currentUser ? (
                <div className="mb-12">
                  <div className="flex gap-4">
                    <img
                      src={`https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=64`}
                      alt={currentUser.username}
                      className="w-12 h-12 rounded-full border border-white/10"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Laissez un mot sous cette lanterne..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all resize-none min-h-[100px]"
                      />
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-6 py-2 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <LucideSend size={18} /> Publier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center mb-12">
                  <p className="text-gray-400">Connectez-vous avec Discord pour laisser un commentaire.</p>
                </div>
              )}

              <div className="space-y-8">
                {comments.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-8">Aucun commentaire pour le moment... Soyez le premier !</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="group">
                      <div className="flex gap-4">
                        <Link to={`/profile/${comment.userId}`} className="shrink-0">
                          <img
                            src={comment.avatar 
                              ? `https://cdn.discordapp.com/avatars/${comment.userId}/${comment.avatar}.png?size=64`
                              : `https://cdn.discordapp.com/embed/avatars/${parseInt(comment.userId) % 5}.png`
                            }
                            alt={comment.username}
                            className="w-12 h-12 rounded-full border border-white/10 hover:border-amber-500/50 transition-colors"
                          />
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <Link to={`/profile/${comment.userId}`} className="font-bold text-amber-500 hover:text-amber-400 transition-colors">
                              {comment.username}
                            </Link>
                            <span className="text-xs text-gray-600">{new Date(comment.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed mb-4">{comment.content}</p>
                          
                          <div className="flex items-center gap-4">
                            {currentUser && (
                              <button 
                                onClick={() => setReplyingTo(comment.id)}
                                className="text-xs text-gray-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
                              >
                                <LucideReply size={14} /> Répondre
                              </button>
                            )}
                            {(currentUser?.id === comment.userId || currentUser?.id === id || isCurrentUserStaff) && (
                              <button 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-red-500/70 hover:text-red-500 flex items-center gap-1 transition-colors bg-red-500/10 px-2 py-1 rounded-md"
                              >
                                <LucideTrash2 size={14} /> Supprimer
                              </button>
                            )}
                          </div>

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-6 ml-4 pl-6 border-l border-white/5 space-y-6">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3">
                                  <Link to={`/profile/${reply.userId}`} className="shrink-0">
                                    <img
                                      src={reply.avatar 
                                        ? `https://cdn.discordapp.com/avatars/${reply.userId}/${reply.avatar}.png?size=48`
                                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(reply.userId) % 5}.png`
                                      }
                                      alt={reply.username}
                                      className="w-8 h-8 rounded-full border border-white/10 hover:border-amber-500/50 transition-colors"
                                    />
                                  </Link>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <Link to={`/profile/${reply.userId}`} className="font-bold text-sm text-amber-500/80 hover:text-amber-400 transition-colors">
                                        {reply.username}
                                      </Link>
                                      <span className="text-[10px] text-gray-600">{new Date(reply.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply Input */}
                          {replyingTo === comment.id && (
                            <div className="mt-6 ml-4">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Votre réponse..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500/50 transition-all resize-none"
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button 
                                  onClick={() => setReplyingTo(null)}
                                  className="px-4 py-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                                >
                                  Annuler
                                </button>
                                <button 
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={!replyContent.trim()}
                                  className="px-4 py-1.5 text-xs bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all disabled:opacity-50"
                                >
                                  Répondre
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default UserProfile
