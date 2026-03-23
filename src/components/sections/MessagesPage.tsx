import React from 'react'
import { useAuth } from '../AuthContext'
import { LucideArrowLeft, LucideSend, LucideMail, LucideSearch, LucideMoreVertical } from 'lucide-react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const MessagesPage: React.FC = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  
  const [chats, setChats] = React.useState<any[]>(() => {
    const cached = localStorage.getItem(`cache_chats_${user?.id}`)
    return cached ? JSON.parse(cached) : []
  })
  const [selectedChat, setSelectedChat] = React.useState<any | null>(null)
  const [chatMessages, setChatMessages] = React.useState<any[]>(() => {
    // We don't cache individual chat messages for now to keep it simple, 
    // but the chat list is cached.
    return []
  })
  const [newMsg, setNewMsg] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)

  // Load chat list from cache on mount
  React.useEffect(() => {
    if (user?.id) {
      const cached = localStorage.getItem(`cache_chats_${user.id}`)
      if (cached) setChats(JSON.parse(cached))
    }
  }, [user?.id])

  const fetchData = React.useCallback(async () => {
    if (!user) return

    const { data: msgs } = await supabase
      .from('private_messages')
      .select('*')
      .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (msgs) {
      const contactIds = Array.from(new Set(msgs.map((m: any) => 
        m.from_id === user.id ? m.to_id : m.from_id
      )))

      const { data: contactsData } = await supabase
        .from('members')
        .select('id, username, avatar')
        .in('id', contactIds)

      const contactsMap = new Map(contactsData?.map(c => [c.id, c]))
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
      const finalChats = Array.from(chatMap.values())
      setChats(finalChats)
      localStorage.setItem(`cache_chats_${user.id}`, JSON.stringify(finalChats))
    }
  }, [user?.id])

  React.useEffect(() => {
    if (!user?.id) return
    
    fetchData()

    // Global realtime channel for new messages
    const channel = supabase
      .channel('global_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages'
      }, (payload: any) => {
        // Only refresh if the message is for US
        if (payload.new.to_id === user.id) {
          fetchData()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchData])

  React.useEffect(() => {
    if (!selectedChat || !user) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('private_messages')
        .select('*')
        .or(`from_id.eq.${user.id},from_id.eq.${selectedChat.id}`)
        .or(`to_id.eq.${user.id},to_id.eq.${selectedChat.id}`)
        .order('created_at', { ascending: true })
      
      if (data) {
        // Double check filter because nested OR/AND can be tricky in Supabase syntax
        const filtered = data.filter((m: any) => 
          (m.from_id === user.id && m.to_id === selectedChat.id) ||
          (m.from_id === selectedChat.id && m.to_id === user.id)
        )
        setChatMessages(filtered)
      }

      // Mark as read
      await supabase
        .from('private_messages')
        .update({ read: true })
        .eq('from_id', selectedChat.id)
        .eq('to_id', user.id)
        .eq('read', false)
    }

    fetchMessages()

    const channel = supabase
      .channel(`chat_${selectedChat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages'
      }, (payload: any) => {
        const newMsg = payload.new
        const isFromContact = newMsg.from_id === selectedChat.id && newMsg.to_id === user.id
        if (isFromContact) {
          setChatMessages(prev => [...prev, newMsg])
          supabase.from('private_messages').update({ read: true }).eq('id', newMsg.id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedChat, user])

  const handleSendMsg = async () => {
    if (!user || !selectedChat || !newMsg.trim()) return

    const messageContent = newMsg.trim()
    const tempId = Math.random().toString(36).substring(7)
    
    const optimisticMsg = {
      id: tempId,
      from_id: user.id,
      to_id: selectedChat.id,
      content: messageContent,
      from_username: user.username,
      read: false,
      created_at: new Date().toISOString()
    }
    
    setChatMessages(prev => [...prev, optimisticMsg])
    setNewMsg('')
    setIsTyping(false)

    const { error } = await supabase
      .from('private_messages')
      .insert({
        from_id: user.id,
        to_id: selectedChat.id,
        content: messageContent,
        from_username: user.username,
        read: false
      })

    if (error) {
      setChatMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMsg(messageContent)
      alert('Erreur d\'envoi')
    }
  }

  if (loading) return null
  if (!user) return <Navigate to="/" />

  const filteredChats = chats.filter(c => 
    c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-night-950 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="h-20 border-b border-white/5 bg-night-900/50 backdrop-blur-xl flex items-center px-8 justify-between shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <LucideArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/10">
              <LucideMail size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-widest">Messagerie</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Le Sanctuaire des Murmures</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase text-gray-400">Canal Sécurisé</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar - Contacts */}
        <div className={`w-full md:w-96 border-r border-white/5 flex flex-col bg-night-900/20 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6">
            <div className="relative">
              <LucideSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text"
                placeholder="Rechercher un veilleur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredChats.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-gray-600 text-sm italic">Aucun murmure trouvé...</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-6 flex items-center gap-4 transition-all border-l-4 ${
                    selectedChat?.id === chat.id 
                      ? 'bg-amber-500/10 border-amber-500' 
                      : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={chat.avatar 
                        ? `https://cdn.discordapp.com/avatars/${chat.id}/${chat.avatar}.png?size=128`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(chat.id) % 5}.png`
                      }
                      alt={chat.username}
                      className="w-14 h-14 rounded-2xl border-2 border-white/10 shadow-xl"
                    />
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-night-900 shadow-lg animate-bounce">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-white truncate text-sm">{chat.username}</h4>
                      <span className="text-[10px] text-gray-600 font-mono shrink-0 ml-2">
                        {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate italic font-light max-w-full">
                      {chat.lastMessage}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-black/20 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-night-900/30">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-500"
                  >
                    <LucideArrowLeft size={20} />
                  </button>
                  <Link to={`/profile/${selectedChat.id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                    <img
                      src={selectedChat.avatar 
                        ? `https://cdn.discordapp.com/avatars/${selectedChat.id}/${selectedChat.avatar}.png?size=64`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(selectedChat.id) % 5}.png`
                      }
                      alt={selectedChat.username}
                      className="w-10 h-10 rounded-xl border border-white/10"
                    />
                    <div>
                      <h4 className="font-bold text-amber-500 text-lg leading-none mb-1">{selectedChat.username}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">En ligne</p>
                    </div>
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-3 rounded-xl hover:bg-white/5 text-gray-500 transition-all">
                    <LucideMoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {chatMessages.map((m, idx) => {
                  const isMe = m.from_id === user.id
                  const prevMsg = chatMessages[idx - 1]
                  const showDate = !prevMsg || new Date(m.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()

                  return (
                    <React.Fragment key={m.id}>
                      {showDate && (
                        <div className="flex justify-center my-8">
                          <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {new Date(m.created_at).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] group relative`}>
                          <div className={`p-4 rounded-2xl shadow-2xl ${
                            isMe 
                              ? 'bg-amber-600 text-black font-medium rounded-tr-none' 
                              : 'bg-night-800 text-white rounded-tl-none border border-white/10'
                          }`}>
                            <p className="text-sm leading-relaxed">{m.content}</p>
                            <span className={`text-[8px] mt-2 block font-mono opacity-50 ${isMe ? 'text-black' : 'text-gray-500'}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })}
                <div id="messages-end" />
              </div>

              {/* Input Area */}
              <div className="p-8 bg-night-900/50 border-t border-white/5">
                <div className="max-w-4xl mx-auto relative">
                  {isTyping && (
                    <p className="absolute -top-6 left-2 text-[10px] text-amber-500/50 italic animate-pulse">En train d'écrire...</p>
                  )}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-2 focus-within:border-amber-500/50 transition-all shadow-inner">
                      <textarea 
                        value={newMsg}
                        onChange={(e) => {
                          setNewMsg(e.target.value)
                          setIsTyping(e.target.value.length > 0)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMsg()
                          }
                        }}
                        placeholder="Écris ton murmure ici..."
                        className="w-full bg-transparent border-none outline-none text-white px-4 py-3 text-sm resize-none min-h-[50px] max-h-40"
                      />
                    </div>
                    <button 
                      onClick={handleSendMsg}
                      disabled={!newMsg.trim()}
                      className="p-5 bg-amber-600 text-black rounded-3xl hover:bg-amber-500 transition-all disabled:opacity-50 shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95"
                    >
                      <LucideSend size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40">
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                <LucideMail size={48} className="text-gray-500" />
              </div>
              <h3 className="text-2xl font-serif font-black mb-4">Sélectionne un Veilleur</h3>
              <p className="max-w-xs text-sm italic font-light">"Chaque murmure est une lueur dans l'obscurité du sanctuaire."</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default MessagesPage
