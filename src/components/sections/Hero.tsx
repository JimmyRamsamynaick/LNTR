import React from 'react'
import { motion } from 'framer-motion'
import { LucideCompass, LucideFlame, LucideUser } from 'lucide-react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import { DISCORD_CONFIG } from '../../lib/discord'

const Hero: React.FC = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden pt-20">
      {/* Lantern Imagery Overlay - Optimized for mobile */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-amber-600/10 blur-[80px] md:blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif font-bold tracking-tight text-white mb-6 drop-shadow-[0_0_20px_rgba(255,170,0,0.3)]">
            Entre dans la <br />
            <span className="text-amber-500 italic drop-shadow-[0_0_15px_rgba(255,170,0,0.5)]">
              Lanterne Nocturne
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg md:text-2xl text-gray-300 mb-10 font-sans font-light tracking-wide max-w-2xl mx-auto opacity-80 px-4">
            Une communauté active où la nuit ne s’arrête jamais. Un refuge pour les noctambules, les rêveurs et les passionnés.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
            {user ? (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(255,170,0,0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,170,0,0.2)]"
              >
                <LucideUser className="w-5 h-5 fill-black" />
                Mon Profil
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(255,170,0,0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={login}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,170,0,0.2)]"
              >
                <LucideFlame className="w-5 h-5 fill-black" />
                Se connecter avec Discord
              </motion.button>
            )}
            
            <a
              href={DISCORD_CONFIG.INVITE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-white/5 border border-white/10 hover:border-white/20 text-white font-medium rounded-full transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-md"
            >
              <LucideCompass className="w-5 h-5" />
              Rejoindre le Discord
            </a>
          </div>
        </motion.div>
      </div>

      {/* Decorative Lantern Elements */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-[10%] w-32 h-48 opacity-20 hidden md:block"
      >
        <div className="w-1 h-full bg-amber-600/20 absolute top-[-100%] left-1/2 -translate-x-1/2" />
        <div className="w-full h-full bg-amber-600/30 rounded-xl blur-[30px]" />
      </motion.div>
    </section>
  )
}

export default Hero
