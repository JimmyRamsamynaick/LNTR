import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleCallback } = useAuth()

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      handleCallback(code)
        .then(() => {
          // On force un rechargement pour être sûr que tout l'état React est propre
          window.location.href = '/dashboard'
        })
        .catch(() => navigate('/'))
    } else {
      navigate('/')
    }
  }, [searchParams, handleCallback, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen bg-night-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-white text-xl">Connexion en cours...</p>
      </div>
    </div>
  )
}

export default AuthCallback
