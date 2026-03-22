import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { DISCORD_CONFIG } from '../lib/discord'
import { supabase } from '../lib/supabase'

export type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'streaming'

export interface DiscordUser {
  id: string
  username: string
  avatar: string
  roles: string[]
  status?: string
  custom_status?: string
  bio?: string
  bannerColor?: string
  bannerUrl?: string
  displayNameColor?: string
  nicknameGradientColor1?: string
  nicknameGradientColor2?: string
  premium_tier?: number // 0: none, 1: Eclat, 2: Lanterne, 3: Eternel
  premium_since?: string
  incognito_mode?: boolean
  gold_nickname?: boolean
  flames_count?: number
}

interface AuthContextType {
  user: DiscordUser | null
  loading: boolean
  login: () => void
  logout: () => void
  handleCallback: (code: string) => Promise<void>
  updateStatus: (status: DiscordStatus) => void
  updateProfile: (data: Partial<DiscordUser>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DiscordUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (!user) return

    try {
      const accessToken = localStorage.getItem('discord_token')
      if (!accessToken) return

      // 1. Récupérer l'identité actuelle de l'utilisateur sur Discord (pour l'avatar)
      const userResponse = await axios.get(DISCORD_CONFIG.USER_API, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      // 2. Récupérer les rôles actuels de l'utilisateur sur le serveur
      let roles: string[] = []
      try {
        const guildMemberResponse = await axios.get(
          `https://discord.com/api/users/@me/guilds/${DISCORD_CONFIG.GUILD_ID}/member`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        roles = guildMemberResponse.data.roles
      } catch (e) {
        console.error('Error fetching roles during refresh:', e)
        roles = user.roles || []
      }

      // 3. Récupérer les données du profil depuis Supabase
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single()

      if (memberData || userResponse.data) {
        // Déterminer le premium_tier à partir des rôles
        let premium_tier = 0
        if (roles.includes(DISCORD_CONFIG.ROLES.VIP_ETERNEL)) premium_tier = 3
        else if (roles.includes(DISCORD_CONFIG.ROLES.VIP_LANTERNE)) premium_tier = 2
        else if (roles.includes(DISCORD_CONFIG.ROLES.VIP_ECLAT)) premium_tier = 1

        const updatedUser: DiscordUser = {
          ...user,
          username: userResponse.data?.username || user.username,
          avatar: userResponse.data?.avatar || user.avatar,
          roles: roles,
          status: memberData?.status || user.status,
          custom_status: memberData?.custom_status || user.custom_status,
          bio: memberData?.bio || user.bio,
          bannerColor: memberData?.banner_color || user.bannerColor,
          bannerUrl: memberData?.banner_url || user.bannerUrl,
          displayNameColor: memberData?.display_name_color || user.displayNameColor,
          nicknameGradientColor1: memberData?.nickname_gradient_color1 || user.nicknameGradientColor1,
          nicknameGradientColor2: memberData?.nickname_gradient_color2 || user.nicknameGradientColor2,
          premium_tier: premium_tier || memberData?.premium_tier || 0,
          premium_since: memberData?.premium_since || (premium_tier > 0 ? (user.premium_since || new Date().toISOString()) : undefined),
          incognito_mode: memberData?.incognito_mode || false,
          gold_nickname: memberData?.gold_nickname !== false,
          flames_count: memberData?.flames_count || 0
        }

        setUser(updatedUser)
        localStorage.setItem('discord_user', JSON.stringify(updatedUser))

        // Mettre à jour Supabase avec les nouvelles infos Discord (avatar/rôles)
        await supabase
          .from('members')
          .update({ 
            avatar: updatedUser.avatar,
            roles: updatedUser.roles,
            premium_tier: updatedUser.premium_tier,
            premium_since: updatedUser.premium_since,
            last_seen: new Date().toISOString()
          })
          .eq('id', user.id)
      }
    } catch (e) {
      console.error('Failed to refresh user:', e)
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('discord_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('discord_user')
      }
    }
    setLoading(false)
  }, [])

  const login = () => {
    const params = new URLSearchParams({
      client_id: DISCORD_CONFIG.CLIENT_ID,
      redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
      response_type: 'code',
      scope: DISCORD_CONFIG.SCOPES
    })
    window.location.href = `${DISCORD_CONFIG.AUTH_URL}?${params.toString()}`
  }

  const logout = () => {
    // On efface les données immédiatement pour la réactivité
    setUser(null)
    localStorage.removeItem('discord_token')
    localStorage.removeItem('discord_user')
    
    // On redirige vers l'accueil
    window.location.href = '/'
  }

  const updateStatus = async (newStatus: DiscordStatus) => {
    if (!user) return

    const updatedUser = { ...user, status: newStatus }
    setUser(updatedUser)
    localStorage.setItem('discord_user', JSON.stringify(updatedUser))

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('members')
        .upsert({ 
          id: updatedUser.id, 
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          roles: updatedUser.roles,
          status: newStatus,
          premium_tier: updatedUser.premium_tier || 0,
          last_seen: new Date().toISOString()
        })
      if (error) throw error
    } catch (e) {
      console.error('Supabase status update failed:', e)
    }
  }

  const updateProfile = async (data: Partial<DiscordUser>) => {
    if (!user) return

    const updatedUser = { ...user, ...data }
    setUser(updatedUser)
    localStorage.setItem('discord_user', JSON.stringify(updatedUser))

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('members')
        .upsert({ 
          id: updatedUser.id, 
          username: updatedUser.username || '',
          avatar: updatedUser.avatar || null,
          roles: updatedUser.roles || [],
          status: updatedUser.status || 'online',
          custom_status: updatedUser.custom_status || '',
          bio: updatedUser.bio || '',
          banner_color: updatedUser.bannerColor || '#1a1a1a',
          banner_url: updatedUser.bannerUrl || null,
          display_name_color: updatedUser.displayNameColor || '#FFFFFF',
          nickname_gradient_color1: updatedUser.nicknameGradientColor1 || null,
          nickname_gradient_color2: updatedUser.nicknameGradientColor2 || null,
          premium_tier: updatedUser.premium_tier || 0,
          premium_since: updatedUser.premium_since || null,
          incognito_mode: updatedUser.incognito_mode || false,
          gold_nickname: updatedUser.gold_nickname !== false,
          last_seen: new Date().toISOString()
        })
      if (error) {
        console.error('Supabase error detail:', error)
        throw error
      }
    } catch (e) {
      console.error('Supabase profile update failed:', e)
      throw e
    }
  }

  const saveMemberToHistory = async (userData: DiscordUser) => {
    try {
      const { error } = await supabase
        .from('members')
        .upsert({ 
          id: userData.id, 
          username: userData.username,
          avatar: userData.avatar,
          roles: userData.roles,
          status: userData.status || 'online',
          premium_tier: userData.premium_tier || 0,
          premium_since: userData.premium_since || null,
          last_seen: new Date().toISOString()
        })
      if (error) {
        console.error('Supabase member save failed:', error)
      } else {
        console.log('Member successfully saved to Supabase')
      }
    } catch (e) {
      console.error('Supabase member save exception:', e)
    }
  }

  const handleCallback = async (code: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        client_id: DISCORD_CONFIG.CLIENT_ID,
        client_secret: DISCORD_CONFIG.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
      })

      const tokenResponse = await axios.post(DISCORD_CONFIG.TOKEN_URL, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })

      const accessToken = tokenResponse.data.access_token
      localStorage.setItem('discord_token', accessToken)

      // Get user identity
      const userResponse = await axios.get(DISCORD_CONFIG.USER_API, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      // Get member info in guild (for roles)
      let roles: string[] = []
      try {
        const guildMemberResponse = await axios.get(
          `https://discord.com/api/users/@me/guilds/${DISCORD_CONFIG.GUILD_ID}/member`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        roles = guildMemberResponse.data.roles
      } catch (e) {
        console.error('User not in guild or error fetching roles:', e)
        // Rediriger vers une erreur ou afficher un message
        alert("Accès refusé : Vous devez être membre du serveur Discord La Lanterne Nocturne pour accéder au site.")
        throw new Error('NOT_IN_GUILD')
      }

      // Get existing profile from Supabase to preserve custom data
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('id', userResponse.data.id)
        .single()

      // Determine premium tier from roles
      let premium_tier = 0
      if (roles.includes(DISCORD_CONFIG.ROLES.VIP_ETERNEL)) premium_tier = 3
      else if (roles.includes(DISCORD_CONFIG.ROLES.VIP_LANTERNE)) premium_tier = 2
      else if (roles.includes(DISCORD_CONFIG.ROLES.VIP_ECLAT)) premium_tier = 1

      const userData: DiscordUser = {
        ...userResponse.data,
        roles: roles,
        status: memberData?.status || 'online',
        bio: memberData?.bio,
        bannerColor: memberData?.banner_color,
        bannerUrl: memberData?.banner_url,
        displayNameColor: memberData?.display_name_color,
        nicknameGradientColor1: memberData?.nickname_gradient_color1,
        nicknameGradientColor2: memberData?.nickname_gradient_color2,
        premium_tier: premium_tier || memberData?.premium_tier || 0,
        premium_since: memberData?.premium_since || (premium_tier > 0 ? new Date().toISOString() : undefined)
      }

      setUser(userData)
      localStorage.setItem('discord_user', JSON.stringify(userData))
      
      // On attend l'enregistrement pour être sûr
      await saveMemberToHistory(userData)
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to authenticate with Discord:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, handleCallback, updateStatus, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
