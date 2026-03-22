import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LucideUsers, LucideActivity, LucideHeart } from 'lucide-react'
import axios from 'axios'

const Statistics: React.FC = () => {
  const [stats, setStats] = useState({
    total: 'Chargement...',
    online: '...',
    status: 'Active'
  })

  useEffect(() => {
    const fetchDiscordStats = async () => {
      try {
        // Fetch approximate member count via invite API (more reliable for total count)
        const inviteResponse = await axios.get(`https://discord.com/api/v9/invites/NnFFAQwmD4?with_counts=true`)
        const totalCount = inviteResponse.data.approximate_member_count
        const onlineCount = inviteResponse.data.approximate_presence_count

        setStats({
          total: totalCount ? `${totalCount}+` : '750+',
          online: onlineCount ? `${onlineCount}` : '150',
          status: 'Active'
        })
      } catch (error) {
        console.error('Error fetching Discord stats:', error)
        // Fallback to static data if API fails
        setStats({
          total: '750+',
          online: '150',
          status: 'Active'
        })
      }
    }

    fetchDiscordStats()
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchDiscordStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    { label: "Membres au total", value: stats.total, icon: LucideUsers, color: "text-violet-400" },
    { label: "En ligne maintenant", value: stats.online, icon: LucideActivity, color: "text-blue-400" },
    { label: "Communauté engagée", value: stats.status, icon: LucideHeart, color: "text-rose-400" },
  ]

  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all duration-300 hover:bg-white/10 shadow-2xl backdrop-blur-sm"
            >
              <div className={`p-3 sm:p-4 rounded-full bg-white/5 mb-4 group-hover:scale-110 transition-transform duration-300 ${stat.color}`}>
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 font-serif tracking-tight">{stat.value}</h3>
              <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-widest text-center font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Statistics
