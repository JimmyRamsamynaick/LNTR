import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

import { supabase } from '../../lib/supabase'

export type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'streaming'

interface StatusIndicatorProps {
  userId: string
  showText?: boolean
  showCustomStatus?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const statusColors = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-gray-500',
  streaming: 'bg-[#593695]' // Discord Streaming Purple
}

const statusLabels = {
  online: 'En ligne',
  idle: 'Absent',
  dnd: 'Ne pas déranger',
  offline: 'Hors ligne',
  streaming: 'En live'
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  userId, 
  showText = false, 
  showCustomStatus = false,
  className = '',
  size = 'md'
}) => {
  const [status, setStatus] = useState<DiscordStatus>('offline')
  const [customStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('status, last_seen')
          .eq('id', userId)
          .single()

        if (error) throw error

        if (data) {
          // If status is 'offline', user explicitly chose to be invisible
          if (data.status === 'offline') {
            setStatus('offline')
          } else {
            // Otherwise check if they were active recently (within last 5 minutes)
            const lastSeenDate = new Date(data.last_seen).getTime()
            const now = Date.now()
            // We use a more generous window (10 minutes) and handle potential clock skew
            const isRecent = !isNaN(lastSeenDate) && (Math.abs(now - lastSeenDate) < 600000)
            setStatus(isRecent ? (data.status as DiscordStatus) : 'offline')
          }
        } else {
          setStatus('offline')
        }
      } catch (e) {
        // Silent fail for status
        setStatus('offline')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    // Refresh status every 15 seconds
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [userId])

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className={`${sizeClasses[size]} rounded-full ${statusColors[status]} border-2 border-night-900 shadow-lg relative z-10`} />
          
          {/* Pulse effect for Streaming/Live */}
          {status === 'streaming' && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              className={`absolute inset-0 rounded-full ${statusColors[status]} z-0`}
            />
          )}
          
          {/* Glow effect for Online */}
          {status === 'online' && (
            <div className={`absolute inset-0 rounded-full ${statusColors[status]} blur-sm opacity-50`} />
          )}
        </div>
        
        {showText && !loading && (
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${status === 'offline' ? 'text-gray-500' : 'text-gray-300'}`}>
              {statusLabels[status]}
            </span>
          </div>
        )}
      </div>

      {showCustomStatus && customStatus && (
        <motion.div 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-gray-400 italic truncate max-w-[150px]"
        >
          {customStatus}
        </motion.div>
      )}
    </div>
  )
}

export default StatusIndicator
