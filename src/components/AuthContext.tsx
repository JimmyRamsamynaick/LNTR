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
  bio?: string
  bannerColor?: string
  bannerUrl?: string
  displayNameColor?: string
  premium_tier?: number // 0: none, 1: Eclat, 2: Lanterne, 3: Eternel
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
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .single()

      if (memberData) {
        const updatedUser: DiscordUser = {
          ...user,
          status: memberData.status || user.status,
          bio: memberData.bio || user.bio,
          bannerColor: memberData.banner_color || user.bannerColor,
          bannerUrl: memberData.banner_url || user.bannerUrl,
          displayNameColor: memberData.display_name_color || user.displayNameColor,
          premium_tier: memberData.premium_tier || 0
        }
        setUser(updatedUser)
        localStorage.setItem('discord_user', JSON.stringify(updatedUser))
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

  const logout = async () => {
    if (user) {
      await updateStatus('offline')
    }
    setUser(null)
    localStorage.removeItem('discord_token')
    localStorage.removeItem('discord_user')
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
          bio: updatedUser.bio || '',
          banner_color: updatedUser.bannerColor || '#1a1a1a',
          banner_url: updatedUser.bannerUrl || null,
          display_name_color: updatedUser.displayNameColor || '#FFFFFF',
          premium_tier: updatedUser.premium_tier || 0,
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
    // Supprimé car on utilise Supabase maintenant
    try {
      await supabase
        .from('members')
        .upsert({ 
          id: userData.id, 
          username: userData.username,
          avatar: userData.avatar,
          roles: userData.roles,
          status: userData.status || 'online',
          last_seen: new Date().toISOString()
        })
    } catch (e) {
      console.error('Supabase member save failed:', e)
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
        console.warn('Could not fetch guild roles - maybe user is not in guild yet')
      }

      // Get existing profile from Supabase to preserve custom data
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('id', userResponse.data.id)
        .single()

      const userData: DiscordUser = {
        ...userResponse.data,
        roles: roles,
        status: memberData?.status || 'online',
        bio: memberData?.bio,
        bannerColor: memberData?.banner_color,
        bannerUrl: memberData?.banner_url,
        displayNameColor: memberData?.display_name_color,
        premium_tier: memberData?.premium_tier || 0
      }

      setUser(userData)
      localStorage.setItem('discord_user', JSON.stringify(userData))
      saveMemberToHistory(userData)
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
