import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LucideSend, 
  LucideArrowLeft, 
  LucideMessageSquare, 
  LucideSearch,
  LucideMoreVertical,
  LucideShieldCheck,
  LucideFlame
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../AuthContext'
import { Link, useNavigate } from 'react-router-dom'

interface Message {
  id: string
  from_id: string
  to_id: string
  content: string
  from_username: string
  read: boolean
  created_at: string
}

interface Contact {
  id: string
  username: string
  avatar: string | null
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  premium_tier?: number
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const quickReplies = ["Hello ! 👋", "Merci ! ✨", "On joue ?", "À plus tard ! 🌙", "Trop cool ! 🔥"]

  // 1. Charger la liste des contacts (les personnes avec qui on a discuté)
  useEffect(() => {
    if (!user) return

    const fetchContacts = async () => {
      try {
        // Récupérer tous les messages où l'utilisateur est impliqué
        const { data: msgs, error } = await supabase
          .from('private_messages')
          .select('*')
          .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Grouper par contact
        const contactMap = new Map<string, { lastMsg: string, lastAt: string, unread: number }>()
        const contactIds = new Set<string>()

        msgs?.forEach(m => {
          const otherId = m.from_id === user.id ? m.to_id : m.from_id
          contactIds.add(otherId)
          
          if (!contactMap.has(otherId)) {
            contactMap.set(otherId, {
              lastMsg: m.content,
              lastAt: m.created_at,
              unread: (m.to_id === user.id && !m.read) ? 1 : 0
            })
          } else if (m.to_id === user.id && !m.read) {
            const current = contactMap.get(otherId)!
            contactMap.set(otherId, { ...current, unread: current.unread + 1 })
          }
        })

        // Récupérer les infos des profils de ces contacts
        if (contactIds.size > 0) {
          const { data: profiles } = await supabase
            .from('members')
            .select('id, username, avatar, premium_tier')
            .in('id', Array.from(contactIds))

          const formattedContacts: Contact[] = profiles?.map(p => ({
            id: p.id,
            username: p.username,
            avatar: p.avatar,
            premium_tier: p.premium_tier,
            lastMessage: contactMap.get(p.id)?.lastMsg,
            lastMessageAt: contactMap.get(p.id)?.lastAt,
            unreadCount: contactMap.get(p.id)?.unread || 0
          })).sort((a, b) => 
            new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
          ) || []

          setContacts(formattedContacts)
        }
      } catch (err) {
        console.error('Error fetching contacts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()

    // Realtime pour les nouveaux messages (mise à jour de la liste des contacts)
    const channel = supabase
      .channel(`contacts-list-${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages',
        filter: `to_id=eq.${user.id}`
      }, () => {
        fetchContacts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  // 2. Charger les messages de la conversation sélectionnée
  useEffect(() => {
    if (!user || !selectedContact) {
      setMessages([])
      return
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`and(from_id.eq.${user.id},to_id.eq.${selectedContact.id}),and(from_id.eq.${selectedContact.id},to_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
        
        // Marquer comme lu
        const unreadIds = data.filter(m => m.to_id === user.id && !m.read).map(m => m.id)
        if (unreadIds.length > 0) {
          await supabase.from('private_messages').update({ read: true }).in('id', unreadIds)
          setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, unreadCount: 0 } : c))
        }
      }
    }

    fetchMessages()

    // Realtime pour les messages de CETTE conversation
    const channel = supabase
      .channel(`chat-direct-${user.id}-${selectedContact.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages',
        filter: `or=(and(from_id.eq.${selectedContact.id},to_id.eq.${user.id}),and(from_id.eq.${user.id},to_id.eq.${selectedContact.id}))`
      }, (payload) => {
        const newMsg = payload.new as Message
        
        // Ajoute le message s'il n'est pas déjà là (évite doublon avec l'optimistic UI)
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })

        // Marque comme lu si on reçoit un message
        if (newMsg.to_id === user.id) {
          supabase.from('private_messages').update({ read: true }).eq('id', newMsg.id).then()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedContact, user])

  // Scroll automatique vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!user || !selectedContact || !newMessage.trim()) return

    const msgContent = newMessage.trim()
    setNewMessage('')

    // Optimistic UI
    const tempId = Math.random().toString(36).substring(7)
    const optimisticMsg: Message = {
      id: tempId,
      from_id: user.id,
      to_id: selectedContact.id,
      from_username: user.username,
      content: msgContent,
      read: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const { error } = await supabase.from('private_messages').insert({
        from_id: user.id,
        to_id: selectedContact.id,
        from_username: user.username,
        content: msgContent,
        read: false
      })

      if (error) throw error

      // Notification
      await supabase.from('notifications').insert({
        user_id: selectedContact.id,
        from_username: user.username,
        type: 'message',
        content: msgContent.substring(0, 50) + (msgContent.length > 50 ? '...' : '')
      })

      // EXP pour le compagnon
      await supabase.rpc('add_companion_exp', { user_id_param: user.id, exp_amount: 10 })
    } catch (err) {
      console.error('Failed to send:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  const filteredContacts = contacts.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-night-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-10 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
          <LucideShieldCheck size={64} className="mx-auto text-amber-500 mb-6" />
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Accès Restreint</h2>
          <p className="text-gray-400 mb-8 font-light italic">"Vous devez être connecté pour murmurer dans l'obscurité."</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all shadow-lg shadow-amber-600/20">
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-night-900 flex flex-col md:flex-row overflow-hidden pt-0 z-[100]">
      {/* Sidebar - Contacts */}
      <div className={`
        ${selectedContact ? 'hidden md:flex' : 'flex'} 
        w-full md:w-[380px] flex-shrink-0 flex-col bg-night-800 border-r border-white/5 h-full relative z-20
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 bg-night-900/50">
          <div className="flex items-center justify-between mb-6">
            <Link to="/dashboard" className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors">
              <LucideArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-serif font-bold text-white">Messages Privés</h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
          
          <div className="relative group">
            <LucideSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher un contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:border-amber-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-gray-500 italic">Chargement...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                <LucideMessageSquare size={24} />
              </div>
              <p className="text-gray-500 text-sm italic">Aucune conversation trouvée.</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`
                    w-full px-6 py-4 flex items-center gap-4 transition-all hover:bg-white/5 relative
                    ${selectedContact?.id === contact.id ? 'bg-white/10' : ''}
                  `}
                >
                  {selectedContact?.id === contact.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full" />
                  )}
                  
                  <div className="relative flex-shrink-0">
                    <img 
                      src={contact.avatar 
                        ? `https://cdn.discordapp.com/avatars/${contact.id}/${contact.avatar}.png?size=128` 
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(contact.id) % 5}.png`}
                      alt={contact.username}
                      className="w-12 h-12 rounded-2xl border border-white/10"
                    />
                    {contact.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-night-800">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-bold text-sm truncate ${contact.premium_tier === 3 ? 'nickname-golden-animated' : 'text-white'}`}>
                        {contact.username}
                      </span>
                      {contact.lastMessageAt && (
                        <span className="text-[10px] text-gray-600 font-mono">
                          {new Date(contact.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate pr-2">
                      {contact.lastMessage || 'Démarrer la discussion...'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`
        ${selectedContact ? 'flex' : 'hidden md:flex'} 
        flex-1 flex-col h-full bg-night-900 relative
      `}>
        <AnimatePresence mode="wait">
          {selectedContact ? (
            <motion.div 
              key={selectedContact.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              {/* Chat Header */}
              <div className="p-4 md:p-6 border-b border-white/5 bg-night-800/50 backdrop-blur-xl flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
                    <LucideArrowLeft size={24} />
                  </button>
                  <Link to={`/profile/${selectedContact.id}`} className="flex items-center gap-3 group">
                    <img 
                      src={selectedContact.avatar 
                        ? `https://cdn.discordapp.com/avatars/${selectedContact.id}/${selectedContact.avatar}.png?size=128` 
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(selectedContact.id) % 5}.png`}
                      alt={selectedContact.username}
                      className="w-10 h-10 rounded-xl border border-white/10 group-hover:border-amber-500/50 transition-all"
                    />
                    <div>
                      <h2 className={`font-bold text-base leading-tight ${selectedContact.premium_tier === 3 ? 'nickname-golden-animated' : 'text-white'}`}>
                        {selectedContact.username}
                      </h2>
                      <span className="text-[10px] text-amber-500/60 uppercase tracking-widest font-black">Voir le profil</span>
                    </div>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-3 text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5">
                    <LucideMoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <LucideMessageSquare size={48} className="mb-4" />
                    <p className="font-serif italic text-lg">"Que le silence soit rompu..."</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.from_id === user.id
                    const showDate = idx === 0 || 
                      new Date(msg.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 3600000

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center mb-8">
                            <span className="px-4 py-1 bg-white/5 rounded-full text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                              {new Date(msg.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`
                            max-w-[85%] md:max-w-[70%] p-4 rounded-3xl text-sm md:text-base leading-relaxed relative group
                            ${isMe 
                              ? 'bg-amber-600 text-black font-medium rounded-tr-none shadow-xl shadow-amber-600/10' 
                              : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none backdrop-blur-sm'}
                          `}>
                            {msg.content}
                            <span className={`
                              absolute bottom-[-18px] text-[9px] opacity-0 group-hover:opacity-100 transition-opacity font-mono
                              ${isMe ? 'right-0 text-amber-500' : 'left-0 text-gray-600'}
                            `}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-8 border-t border-white/5 bg-night-900/50 backdrop-blur-xl">
                {/* Quick Replies */}
                <div className="max-w-4xl mx-auto flex flex-wrap gap-2 mb-6">
                  {quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setNewMessage(reply)
                      }}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-amber-500 hover:border-amber-500/30 hover:bg-white/10 transition-all"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                <form 
                  onSubmit={handleSendMessage}
                  className="max-w-4xl mx-auto flex items-end gap-3"
                >
                  <div className="flex-1 relative">
                    <textarea 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Murmurer quelque chose..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-14 text-white placeholder-gray-500 focus:border-amber-500/50 outline-none transition-all resize-none min-h-[60px] max-h-[150px] custom-scrollbar"
                      rows={1}
                    />
                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                      <LucideFlame className={`w-5 h-5 transition-colors ${newMessage.length > 100 ? 'text-amber-500 animate-pulse' : 'text-gray-700'}`} />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-4 bg-amber-600 text-black rounded-2xl hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-600/20"
                  >
                    <LucideSend size={24} />
                  </button>
                </form>
                <p className="text-center mt-3 text-[10px] text-gray-600 italic">
                  Appuyez sur Entrée pour envoyer
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 animate-pulse">
                <LucideMessageSquare size={40} className="text-gray-700" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mb-2">Vos Murmures</h3>
              <p className="text-gray-500 max-w-sm font-light italic leading-relaxed">
                "Choisissez une âme à qui murmurer vos secrets dans le silence de la nuit."
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MessagesPage
