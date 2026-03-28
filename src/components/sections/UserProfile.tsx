import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LucideArrowLeft, LucideCrown, LucideShieldCheck, LucideShield, LucideZap, LucideUsers, LucideActivity, LucideMessageCircle, LucideSend, LucideTrash2, LucideReply, LucideX, LucideSparkles, LucideFlame, LucideMessageSquare, LucideUserPlus, LucideUserMinus, LucideGift, LucideHeart, LucideLoader2 } from 'lucide-react'
import { DISCORD_CONFIG } from '../../lib/discord'
import { DiscordUser, useAuth } from '../AuthContext'
import StatusIndicator from '../ui/StatusIndicator'
import { supabase } from '../../lib/supabase'
import Companion, { CompanionType, EvolutionStage } from '../ui/Companion'

interface CompanionData {
  type: CompanionType
  stage: EvolutionStage
  color: string
  name: string
  level: number
  experience: number
}

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
  { id: DISCORD_CONFIG.ROLES.VIP_ECLAT, label: 'VIP Éclat', icon: LucideSparkles, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { id: DISCORD_CONFIG.ROLES.VIP_LANTERNE, label: 'VIP Lanterne', icon: LucideZap, color: 'text-violet-400', bgColor: 'bg-violet-400/10', borderColor: 'border-violet-400/30' },
  { id: DISCORD_CONFIG.ROLES.VIP_ETERNEL, label: 'VIP Éternel', icon: LucideCrown, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  { id: DISCORD_CONFIG.ROLES.MEMBRE, label: 'Membre', icon: LucideUsers, color: 'text-gray-400', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30' }
]

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user: currentUser } = useAuth()
  
  const [member, setMember] = useState<DiscordUser | null>(() => {
    if (location.state?.memberData) return location.state.memberData
    const cached = localStorage.getItem(`profile_${id}`)
    return cached ? JSON.parse(cached) : null
  })

  const [comments, setComments] = useState<Comment[]>(() => {
    const cached = localStorage.getItem(`comments_${id}`)
    return cached ? JSON.parse(cached) : []
  })

  const [gifts, setGifts] = useState<any[]>(() => {
    const cached = localStorage.getItem(`gifts_${id}`)
    return cached ? JSON.parse(cached) : []
  })

  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followCount, setFollowCount] = useState(0)
  const [showChatModal, setShowChatModal] = useState(false)
  const [showShoutModal, setShowShoutModal] = useState(false)
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [shoutMessage, setShoutMessage] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [selectedGiftType, setSelectedGiftType] = useState<'bougie' | 'etoile' | 'lanterne' | null>(null)
  const [isSendingGift, setIsSendingGift] = useState(false)
  const [loading, setLoading] = useState(!member)
  const [companion, setCompanion] = useState<CompanionData | null>(null)

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*, flames_count')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) {
          const userData = {
            id: data.id,
            username: data.username,
            avatar: data.avatar,
            roles: data.roles || [],
            status: data.status as any,
            bio: data.bio,
            bannerColor: data.banner_color,
            displayNameColor: data.display_name_color,
            nicknameGradientColor1: data.nickname_gradient_color1,
            nicknameGradientColor2: data.nickname_gradient_color2,
            featured_badges: data.featured_badges || [],
            premium_tier: data.premium_tier,
            gold_nickname: data.gold_nickname !== false,
            bannerUrl: data.banner_url,
            flames_count: data.flames_count || 0
          }
          setMember(userData)
          localStorage.setItem(`profile_${id}`, JSON.stringify(userData))
        }

        // Fetch Companion ACTIF
        const { data: companionData } = await supabase
          .from('user_companions')
          .select('*')
          .eq('user_id', id)
          .eq('is_active', true)
          .single()
        
        if (companionData) {
          setCompanion({
            type: companionData.type as CompanionType,
            stage: companionData.evolution_stage as EvolutionStage,
            color: companionData.color,
            name: companionData.name,
            level: companionData.level,
            experience: companionData.experience
          })
        }

        if (currentUser && id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', id)
            .single()
          setIsFollowing(!!followData)
        }

        if (id) {
          const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', id)
          setFollowCount(count || 0)
        }

        if (id) {
          const { data: giftsData } = await supabase
            .from('profile_gifts')
            .select('*')
            .eq('to_id', id)
            .order('created_at', { ascending: false })
          if (giftsData) {
            setGifts(giftsData)
            localStorage.setItem(`gifts_${id}`, JSON.stringify(giftsData))
          }
        }
      } catch (e) {
        console.error('Failed to fetch member:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchMember()

    const recordView = async () => {
      if (currentUser && id && currentUser.id !== id) {
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
      if (!id) return
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
          localStorage.setItem(`comments_${id}`, JSON.stringify(mappedComments))
        }
      } catch (e) {
        console.error('Failed to fetch comments:', e)
      }
    }
    fetchComments()

    const channel = supabase
      .channel(`comments-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_comments', filter: `profile_id=eq.${id}` }, () => fetchComments())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, currentUser])

  const handleFollow = async () => {
    if (!currentUser || !member || currentUser.id === member.id) return
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', member.id)
        setIsFollowing(false)
        setFollowCount(prev => Math.max(0, prev - 1))
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: member.id })
        setIsFollowing(true)
        setFollowCount(prev => prev + 1)
        
        const senderName = currentUser.incognito_mode ? 'Un membre anonyme' : currentUser.username;
        
        await supabase.from('notifications').insert({
          user_id: member.id,
          from_username: senderName,
          type: 'follow',
          content: 'a commencé à vous suivre !'
        })
      }
    } catch (e) {
      console.error('Follow failed:', e)
    }
  }

  const handleSendGift = async () => {
    if (!currentUser || !member || !selectedGiftType || isSendingGift) return
    setIsSendingGift(true)
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: recentGift } = await supabase
        .from('profile_gifts')
        .select('*')
        .eq('from_id', currentUser.id)
        .eq('to_id', member.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(1)

      if (recentGift && recentGift.length > 0) {
        alert('Vous ne pouvez envoyer qu\'un seul cadeau par semaine à ce membre !')
        return
      }

      const { data: newGift, error } = await supabase
        .from('profile_gifts')
        .insert({
          from_id: currentUser.id,
          to_id: member.id,
          gift_type: selectedGiftType,
          message: giftMessage.trim() || null,
          is_incognito: currentUser.incognito_mode || false
        })
        .select()
        .single()

      if (error) throw error
      
      const senderName = currentUser.incognito_mode ? 'Un membre anonyme' : currentUser.username;
      
      await supabase.from('notifications').insert({
        user_id: member.id,
        from_username: senderName,
        type: 'gift',
        content: `vous a offert un cadeau : ${selectedGiftType === 'bougie' ? 'Bougie' : selectedGiftType === 'etoile' ? 'Étoile' : 'Lanterne Rare'} !`
      })

      setGifts(prev => [newGift, ...prev])
      setShowGiftModal(false)
      setSelectedGiftType(null)
      setGiftMessage('')
      alert('Cadeau envoyé avec succès !')
    } catch (e) {
      console.error('Gift failed:', e)
      alert('Erreur lors de l\'envoi du cadeau.')
    } finally {
      setIsSendingGift(false)
    }
  }

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
      if (id !== currentUser.id) {
        const senderName = currentUser.incognito_mode ? 'Un membre anonyme' : currentUser.username;

        await supabase.from('notifications').insert({
          user_id: id,
          from_username: senderName,
          type: 'comment',
          content: commentContent.substring(0, 50) + (commentContent.length > 50 ? '...' : '')
        })

        // EXP pour le compagnon du visiteur (celui qui commente)
        await supabase.rpc('add_companion_exp', { user_id_param: currentUser.id, exp_amount: 50 })
      }
    } catch (e) {
      console.error('Failed to add comment:', e)
      setNewComment(commentContent)
      alert('Erreur lors de l\'ajout du commentaire.')
    }
  }

  const handleReplyComment = async (commentId: string) => {
    if (!currentUser || !replyContent.trim()) return
    const content = replyContent.trim()
    setReplyContent('')
    setReplyingTo(null)
    try {
      const { error } = await supabase
        .from('profile_comments')
        .insert({
          profile_id: id,
          user_id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          content: content,
          parent_id: commentId
        })
      if (error) throw error
      
      // EXP pour le compagnon du visiteur (celui qui répond)
      await supabase.rpc('add_companion_exp', { user_id_param: currentUser.id, exp_amount: 30 })
    } catch (e) {
      console.error('Failed to reply:', e)
      setReplyContent(content)
      setReplyingTo(commentId)
      alert('Erreur lors de la réponse.')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('profile_comments')
        .delete()
        .eq('id', commentId)
      if (error) throw error
    } catch (e) {
      console.error('Failed to delete comment:', e)
      alert('Erreur lors de la suppression.')
    }
  }

  const handleSendDM = async () => {
    if (!currentUser || !chatMessage.trim()) return
    try {
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
      const senderName = currentUser.incognito_mode ? 'Un membre anonyme' : currentUser.username;

      await supabase.from('notifications').insert({
        user_id: id,
        from_username: senderName,
        type: 'message',
        content: chatMessage.substring(0, 50) + (chatMessage.length > 50 ? '...' : '')
      })
      setChatMessage('')
      setShowChatModal(false)
      alert('Message envoyé avec succès !')
    } catch (e) {
      console.error('Failed to send DM:', e)
      alert('Erreur lors de l\'envoi du message.')
    }
  }

  const handleSendShout = async () => {
    if (!currentUser || !shoutMessage.trim() || !member) return
    try {
      const { error } = await supabase
        .from('shoutbox')
        .insert({
          user_id: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          content: shoutMessage.trim(),
          premium_tier: currentUser.premium_tier || 0,
          roles: currentUser.roles || [],
          recipient_id: member.id,
          recipient_username: member.username
        })
      if (error) throw error
      
      // Notification pour le destinataire
      const senderName = currentUser.incognito_mode ? 'Un membre anonyme' : currentUser.username;

      await supabase.from('notifications').insert({
        user_id: member.id,
        from_username: senderName,
        type: 'whisper',
        content: shoutMessage.trim().substring(0, 50) + (shoutMessage.length > 50 ? '...' : '')
      })

      setShoutMessage('')
      setShowShoutModal(false)
      alert(`Votre murmure privé a été envoyé à ${member.username} !`)
    } catch (e) {
      console.error('Failed to shout:', e)
      alert('Erreur lors de l\'envoi du murmure.')
    }
  }

  if (loading && !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-900 text-white">
        <div className="text-center">
          <LucideLoader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Chargement du profil...</p>
        </div>
      </div>
    )
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

  const isMemberStaff = member.roles.some(roleId => [
    DISCORD_CONFIG.ROLES.OWNER,
    DISCORD_CONFIG.ROLES.CO_OWNER,
    DISCORD_CONFIG.ROLES.ADMIN,
    DISCORD_CONFIG.ROLES.STAFF
  ].includes(roleId))

  const getAllBadges = () => {
    const badges: any[] = []
    const tiers = [
      { id: 'eclat', tier: 1, label: 'Pack Éclat', icon: LucideFlame, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
      { id: 'lanterne', tier: 2, label: 'Pack Lanterne', icon: LucideCrown, color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30' },
      { id: 'eternel', tier: 3, label: 'Pack Éternel', icon: LucideSparkles, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30' }
    ]
    const featuredIds = member.featured_badges || []
    const memberTier = isMemberStaff ? 3 : (member.premium_tier || 0)
    if (featuredIds.length === 0) {
      const highestTier = tiers.filter(t => t.tier <= memberTier).pop()
      if (highestTier) badges.push(highestTier)
    } else {
      tiers.forEach(t => { if (t.tier <= memberTier && featuredIds.includes(t.id)) badges.push(t) })
    }
    roleConfig.forEach(config => { if (member.roles.includes(config.id)) badges.push(config) })
    return badges
  }

  const userBadges = getAllBadges()
  const isCurrentUserStaff = currentUser?.roles?.some(roleId => [
    DISCORD_CONFIG.ROLES.OWNER,
    DISCORD_CONFIG.ROLES.CO_OWNER,
    DISCORD_CONFIG.ROLES.ADMIN,
    DISCORD_CONFIG.ROLES.STAFF
  ].includes(roleId))

  const isEternel = isMemberStaff || (member.premium_tier || 0) >= 3
  const hasGoldNickname = isEternel && member.gold_nickname !== false
  const hasGradientNickname = isEternel && !member.gold_nickname && member.nicknameGradientColor1 && member.nicknameGradientColor2

  const getFlameColor = (count: number) => {
    if (count >= 500) return 'text-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]'
    if (count >= 100) return 'text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
    if (count >= 50) return 'text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]'
    return 'text-gray-400'
  }

  const handleFlame = async () => {
    if (!currentUser || currentUser.id === member.id) return
    try {
      const { data, error } = await supabase.rpc('increment_flames', { member_id: member.id, visitor_id: currentUser.id })
      if (error) throw error
      if (data === true) {
        setMember(prev => prev ? { ...prev, flames_count: (prev.flames_count || 0) + 1 } : null)
        
        const senderName = currentUser.incognito_mode ? 'Un membre anonyme' : currentUser.username;
        
        // Notification pour le membre
        await supabase.from('notifications').insert({
          user_id: member.id,
          from_username: senderName,
          type: 'flame',
          content: 'a allumé une flamme sur votre profil !'
        })
      } else {
        alert("Vous avez déjà attribué une flamme à ce membre au cours des dernières 24 heures.")
      }
    } catch (e) { console.error('Failed to light flame:', e) }
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 md:px-12 bg-night-900 text-white overflow-x-hidden relative selection:bg-amber-500/30">
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-amber-600/5 blur-[100px] md:blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-violet-900/5 blur-[100px] md:blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/members')}
          className="flex items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors mb-8 md:mb-12 group touch-manipulation"
        >
          <LucideArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Retour aux membres</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10"
        >
          <div className="lg:col-span-4 xl:col-span-4">
            <div className="p-6 md:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden text-center shadow-2xl group/card">
              <div className="absolute top-0 left-0 w-full h-28 md:h-32 z-0 overflow-hidden">
                {member.bannerUrl ? (
                  <img src={member.bannerUrl} className="w-full h-full object-cover opacity-40 group-hover/card:scale-110 transition-transform duration-700" alt="Banner" />
                ) : (
                  <div className="w-full h-full opacity-30 transition-colors duration-700" style={{ backgroundColor: member.bannerColor || '#1a1a1a' }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-night-900/80" />
              </div>
              
              <div className="relative mb-6 mt-12 md:mt-16">
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-125 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-500/20 to-transparent">
                  <img
                    src={member.avatar ? `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=256` : `https://cdn.discordapp.com/embed/avatars/${parseInt(member.id) % 5}.png`}
                    alt={member.username}
                    className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-night-900 relative z-10 shadow-2xl mx-auto object-cover"
                  />
                </div>
                <StatusIndicator userId={member.id} size="lg" className="absolute bottom-2 right-1/4 z-20 border-4 border-night-900" />
              </div>

              <h2 
                className={`text-xl md:text-2xl font-serif font-black mb-2 tracking-tight truncate relative z-10 px-2 ${hasGoldNickname ? 'nickname-golden-animated' : (hasGradientNickname ? 'nickname-gradient-animated' : '')}`} 
                style={{ 
                  background: hasGradientNickname ? `linear-gradient(to right, ${member.nicknameGradientColor1} 0%, ${member.nicknameGradientColor2} 50%, ${member.nicknameGradientColor1} 100%)` : (hasGoldNickname ? undefined : 'none'),
                  WebkitBackgroundClip: (hasGradientNickname || hasGoldNickname) ? 'text' : 'initial',
                  color: (hasGoldNickname || hasGradientNickname) ? 'transparent' : (member.displayNameColor || '#FFFFFF'),
                  WebkitTextFillColor: (hasGoldNickname || hasGradientNickname) ? 'transparent' : 'initial'
                }}
              >
                {member.username}
              </h2>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6 relative z-10 px-2">
                {userBadges.map((badge, idx) => (
                  <div key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${badge.bgColor} border ${badge.borderColor} ${badge.color} text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-110 transition-transform cursor-default touch-manipulation`} title={badge.label}>
                    <badge.icon size={12} />
                    {badge.label}
                  </div>
                ))}
                {userBadges.length === 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    <LucideUsers size={12} />
                    Membre
                  </div>
                )}
              </div>

              {member.custom_status && (
                <div className="mb-6 relative z-10 px-4">
                  <p className="text-gray-400 italic text-sm font-light leading-relaxed">
                    <span className="text-amber-500/50 text-xl font-serif">"</span>
                    {member.custom_status}
                    <span className="text-amber-500/50 text-xl font-serif">"</span>
                  </p>
                </div>
              )}
              
              <div className="mb-8 flex justify-center relative z-10">
                <StatusIndicator userId={member.id} showText showCustomStatus className="bg-white/5 px-6 py-2.5 rounded-full border border-white/10 shadow-inner text-xs font-bold" />
              </div>

              <p className="text-gray-600 font-mono text-[10px] opacity-40 uppercase tracking-[0.2em] mb-8">ID: {member.id}</p>

              <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <button onClick={handleFlame} disabled={!currentUser || currentUser.id === member.id} className={`py-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 group transition-all hover:bg-white/10 active:scale-95 ${getFlameColor(member.flames_count || 0)}`}>
                  <LucideFlame size={20} className={`${(member.flames_count || 0) > 0 ? 'fill-current animate-pulse' : ''}`} />
                  <span className="font-bold uppercase tracking-widest text-[10px] md:text-xs">{(member.flames_count || 0)} Flammes</span>
                </button>

                <button onClick={handleFollow} disabled={!currentUser || currentUser.id === member.id} className={`py-4 rounded-2xl flex items-center justify-center gap-3 group transition-all active:scale-95 ${isFollowing ? 'bg-amber-500 text-black font-black border border-amber-500' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}>
                  {isFollowing ? <LucideUserMinus size={20} /> : <LucideUserPlus size={20} />}
                  <span className="font-bold uppercase tracking-widest text-[10px] md:text-xs">{isFollowing ? 'Suivi' : 'Suivre'} ({followCount})</span>
                </button>
              </div>

              <button onClick={() => setShowGiftModal(true)} disabled={!currentUser || currentUser.id === member.id} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-violet-400 group transition-all hover:bg-white/10 active:scale-95 mb-4">
                <LucideGift size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-sm">Offrir un Cadeau</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-8 space-y-6 md:gap-10">
            {/* Compagnon (Affiché pour tout le monde si le membre en a un) */}
            {companion && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group/companion"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none group-hover/companion:bg-amber-500/10 transition-colors duration-700" />
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <Companion 
                    type={companion.type} 
                    stage={companion.stage} 
                    color={companion.color} 
                    name={companion.name} 
                    level={companion.level} 
                  />

                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-serif font-black uppercase tracking-widest text-white">
                        {companion.name}
                      </h3>
                      <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest">
                        Niveau {companion.level}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        <span>Expérience</span>
                        <span>{companion.experience % 1000} / 1000 XP</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(companion.experience % 1000) / 10}%` }}
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 italic font-light leading-relaxed">
                      "Ce fidèle compagnon grandit au fil des nuits passées sous la Lanterne. 
                      {companion.stage === 'egg' ? ' Il semble sur le point d\'éclore...' : 
                       companion.stage === 'baby' ? ' Il est encore petit mais plein d\'énergie !' : 
                       companion.stage === 'teen' ? ' Il commence à devenir imposant.' : 
                       ' C\'est désormais un protecteur accompli.'}"
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4 mb-5">
                  <div className="p-3 rounded-2xl bg-violet-600/20 text-violet-400 group-hover:scale-110 transition-transform">
                    <LucideActivity size={24} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest">Activité</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed italic font-light">"Apparu pour la première fois sous la Lanterne via le site."</p>
              </div>

              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4 mb-5">
                  <div className="p-3 rounded-2xl bg-amber-600/20 text-amber-500 group-hover:scale-110 transition-transform">
                    <LucideMessageCircle size={24} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-amber-500">Certifié</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shadow-lg" title="Utilisateur certifié du site"><LucideCrown size={20} /></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Badge Site Officiel</span>
                </div>
              </div>

              <div className="p-6 md:p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-colors col-span-1 sm:col-span-2">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-pink-600/20 text-pink-400 group-hover:scale-110 transition-transform"><LucideHeart className="w-6 h-6" /></div>
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-center sm:text-left">Vitrine de Cadeaux</h3>
                  </div>
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">{gifts.length} Cadeaux reçus</span>
                </div>
                {gifts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4">
                    {gifts.map((gift) => (
                      <div key={gift.id} className="relative group/gift">
                        <div className={`p-4 rounded-2xl border transition-all ${gift.gift_type === 'bougie' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : gift.gift_type === 'etoile' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-violet-500/10 border-violet-500/30 text-violet-400'}`}>
                          {gift.gift_type === 'bougie' ? <LucideFlame size={24} /> : gift.gift_type === 'etoile' ? <LucideSparkles size={24} /> : <LucideCrown size={24} />}
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-night-800 border border-white/10 rounded-xl opacity-0 group-hover/gift:opacity-100 transition-opacity z-50 pointer-events-none shadow-2xl">
                          <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Offert par {gift.from_username || 'Anonyme'}</p>
                          {gift.message && <p className="text-[10px] text-gray-400 italic">"{gift.message}"</p>}
                          <p className="text-[8px] text-gray-600 mt-2">{new Date(gift.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-2xl"><p className="text-gray-600 text-sm italic">"Aucun cadeau dans la vitrine pour le moment..."</p></div>
                )}
              </div>
            </div>

            <div className="p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-md shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-serif font-black mb-8 flex items-center gap-4">À propos de {member.username}<div className="h-px flex-1 bg-white/5" /></h3>
              <p className="text-gray-400 leading-relaxed font-light text-lg italic md:text-xl">
                {member.bio || `Ce membre a rejoint la communauté de la Lanterne Nocturne. Vous pouvez le retrouver sur le serveur Discord pour discuter, jouer ou simplement passer du bon temps sous la même lueur.`}
              </p>
              <div className="mt-12 pt-10 border-t border-white/5 flex flex-wrap gap-4">
                <a href={DISCORD_CONFIG.INVITE_LINK} target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all hover:scale-105 flex items-center gap-3 uppercase tracking-widest text-xs touch-manipulation">
                  <LucideUsers size={20} className="text-amber-500" /> Discord
                </a>
                {currentUser && currentUser.id !== id && (
                  <div className="flex flex-wrap gap-4">
                    <button onClick={() => { setShowChatModal(true); setChatMessage(`Murmure de ${currentUser.username} : `); }} className="px-10 py-4 bg-amber-500 text-black font-black rounded-2xl hover:bg-amber-400 transition-all hover:scale-105 flex items-center gap-3 uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20 touch-manipulation">
                      <LucideMessageSquare size={20} /> Murmurer
                    </button>
                    <button onClick={() => setShowChatModal(true)} className="px-10 py-4 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-500 transition-all hover:scale-105 flex items-center gap-3 uppercase tracking-widest text-xs shadow-lg shadow-violet-600/20 touch-manipulation">
                      <LucideSend size={20} /> Message Privé
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <h3 className="text-2xl font-serif font-bold mb-8">Lanterne d'Or : Commentaires</h3>
              {currentUser ? (
                <div className="mb-12">
                  <div className="flex gap-4">
                    <img src={`https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=64`} alt={currentUser.username} className="w-12 h-12 rounded-full border border-white/10" />
                    <div className="flex-1">
                      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Laissez un mot sous cette lanterne..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all resize-none min-h-[100px]" />
                      <div className="flex justify-end mt-4">
                        <button onClick={handleAddComment} disabled={!newComment.trim()} className="px-6 py-2 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all flex items-center gap-2 disabled:opacity-50"><LucideSend size={18} /> Publier</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center mb-12"><p className="text-gray-400">Connectez-vous avec Discord pour laisser un commentaire.</p></div>
              )}
              <div className="space-y-8">
                {comments.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-8">Aucun commentaire pour le moment... Soyez le premier !</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="group">
                      <div className="flex gap-4">
                        <Link to={`/profile/${comment.userId}`} className="shrink-0"><img src={comment.avatar ? `https://cdn.discordapp.com/avatars/${comment.userId}/${comment.avatar}.png?size=64` : `https://cdn.discordapp.com/embed/avatars/${parseInt(comment.userId) % 5}.png`} alt={comment.username} className="w-12 h-12 rounded-full border border-white/10 hover:border-amber-500/50 transition-colors" /></Link>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <Link to={`/profile/${comment.userId}`} className="font-bold text-amber-500 hover:text-amber-400 transition-colors">{comment.username}</Link>
                            <span className="text-xs text-gray-600">{new Date(comment.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed mb-4">{comment.content}</p>
                          <div className="flex items-center gap-4">
                            {currentUser && <button onClick={() => setReplyingTo(comment.id)} className="text-xs text-gray-500 hover:text-amber-500 flex items-center gap-1 transition-colors"><LucideReply size={14} /> Répondre</button>}
                            {(currentUser?.id === comment.userId || currentUser?.id === id || isCurrentUserStaff) && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm('Supprimer ce commentaire ?')) handleDeleteComment(comment.id); }} className="text-xs text-red-500 font-bold hover:text-white flex items-center gap-1 transition-all bg-red-500/10 hover:bg-red-600 px-3 py-1.5 rounded-lg pointer-events-auto"><LucideTrash2 size={14} /> Supprimer</button>}
                          </div>
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-6 ml-4 pl-6 border-l border-white/5 space-y-6">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3">
                                  <Link to={`/profile/${reply.userId}`} className="shrink-0"><img src={reply.avatar ? `https://cdn.discordapp.com/avatars/${reply.userId}/${reply.avatar}.png?size=48` : `https://cdn.discordapp.com/embed/avatars/${parseInt(reply.userId) % 5}.png`} alt={reply.username} className="w-8 h-8 rounded-full border border-white/10 hover:border-amber-500/50 transition-colors" /></Link>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1"><Link to={`/profile/${reply.userId}`} className="font-bold text-sm text-amber-500/80 hover:text-amber-400 transition-colors">{reply.username}</Link><span className="text-[10px] text-gray-600">{new Date(reply.timestamp).toLocaleDateString()}</span></div>
                                    <p className="text-sm text-gray-400">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {replyingTo === comment.id && (
                            <div className="mt-6 ml-4">
                              <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Votre réponse..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500/50 transition-all resize-none" />
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setReplyingTo(null)} className="px-4 py-1.5 text-xs text-gray-500 hover:text-white transition-colors">Annuler</button>
                                <button onClick={() => handleReplyComment(comment.id)} disabled={!replyContent.trim()} className="px-4 py-1.5 text-xs bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all disabled:opacity-50">Répondre</button>
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

        {/* Modals */}
        <AnimatePresence>
          {showChatModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg bg-night-800 border border-white/10 rounded-3xl p-8 relative shadow-2xl">
                <button onClick={() => setShowChatModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><LucideX size={24} /></button>
                <h3 className="text-2xl font-serif font-bold mb-2">Message à {member.username}</h3>
                <textarea value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Votre message privé..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:border-amber-500/50 outline-none transition-all resize-none min-h-[150px] mb-6" />
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowChatModal(false)} className="px-6 py-3 text-gray-500 hover:text-white font-bold transition-colors">Annuler</button>
                  <button onClick={handleSendDM} disabled={!chatMessage.trim()} className="px-8 py-3 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all flex items-center gap-2 disabled:opacity-50"><LucideSend size={18} /> Envoyer</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showShoutModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg bg-night-800 border border-white/10 rounded-3xl p-8 relative shadow-2xl">
                <button onClick={() => setShowShoutModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><LucideX size={24} /></button>
                <h3 className="text-2xl font-serif font-bold mb-2">Murmurer à la communauté</h3>
                <textarea value={shoutMessage} onChange={(e) => setShoutMessage(e.target.value)} placeholder="Votre murmure..." maxLength={150} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:border-amber-500/50 outline-none transition-all resize-none min-h-[100px] mb-6" />
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowShoutModal(false)} className="px-6 py-3 text-gray-500 hover:text-white font-bold transition-colors">Annuler</button>
                  <button onClick={handleSendShout} disabled={!shoutMessage.trim()} className="px-8 py-3 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all flex items-center gap-2 disabled:opacity-50"><LucideSend size={18} /> Murmurer</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showGiftModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg bg-night-800 border border-white/10 rounded-3xl p-8 relative shadow-2xl">
                <button onClick={() => setShowGiftModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><LucideX size={24} /></button>
                <h3 className="text-2xl font-serif font-bold mb-2 text-violet-400 text-center">Offrir un Cadeau</h3>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { id: 'bougie', icon: LucideFlame, label: 'Bougie', color: 'text-orange-500' },
                    { id: 'etoile', icon: LucideSparkles, label: 'Étoile', color: 'text-blue-400' },
                    { id: 'lanterne', icon: LucideCrown, label: 'Lanterne', color: 'text-violet-400' }
                  ].map((gift) => (
                    <button key={gift.id} onClick={() => setSelectedGiftType(gift.id as any)} className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${selectedGiftType === gift.id ? `bg-white/10 border-violet-500 scale-105 ${gift.color}` : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
                      <gift.icon size={32} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{gift.label}</span>
                    </button>
                  ))}
                </div>
                <textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Petit mot doux (facultatif)..." maxLength={100} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:border-violet-500/50 outline-none transition-all resize-none min-h-[100px] mb-6" />
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowGiftModal(false)} className="px-6 py-3 text-gray-500 hover:text-white font-bold transition-colors">Annuler</button>
                  <button onClick={handleSendGift} disabled={!selectedGiftType || isSendingGift} className="px-8 py-3 bg-violet-600 text-white font-bold rounded-full hover:bg-violet-500 transition-all flex items-center gap-2 disabled:opacity-50">{isSendingGift ? <LucideLoader2 className="animate-spin" size={18} /> : <LucideGift size={18} />} Envoyer</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default UserProfile
