import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const ProfileRedirect: React.FC = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    const findUser = async () => {
      if (!username) {
        navigate('/members')
        return
      }

      // 1. Chercher par custom_url
      const { data: byUrl } = await supabase
        .from('members')
        .select('id')
        .eq('custom_url', username)
        .single()

      if (byUrl) {
        navigate(`/profile/${byUrl.id}`)
        return
      }

      // 2. Chercher par username (fallback)
      const { data: byName } = await supabase
        .from('members')
        .select('id')
        .ilike('username', username)
        .single()

      if (byName) {
        navigate(`/profile/${byName.id}`)
        return
      }

      // Sinon retour aux membres
      navigate('/members')
    }

    findUser()
  }, [username, navigate])

  return (
    <div className="min-h-screen bg-night-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
    </div>
  )
}

export default ProfileRedirect
