import React from 'react'
import { motion } from 'framer-motion'
import { LucideFlame } from 'lucide-react'

const FinalCTA: React.FC = () => {
  return (
    <section className="relative py-48 px-6 bg-night-900 overflow-hidden flex items-center justify-center">
      {/* Intense Background Glow Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] md:w-[800px] h-[300px] sm:h-[500px] md:h-[800px] bg-amber-600/5 blur-[100px] md:blur-[200px] rounded-full z-0 pointer-events-none" />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-8xl font-serif font-bold text-white mb-6 md:mb-10 tracking-tight leading-none drop-shadow-[0_0_30px_rgba(255,170,0,0.2)]">
            La nuit t’attend.
          </h2>
          
          <p className="text-lg sm:text-xl md:text-3xl text-gray-400 font-light mb-10 md:mb-16 opacity-70">
            Prêt à allumer ta lanterne ?
          </p>

          <motion.a
            href="https://discord.gg/NnFFAQwmD4"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 0 50px rgba(255,170,0,0.4)",
              backgroundColor: "rgba(255,170,0,1)" 
            }}
            whileTap={{ scale: 0.98 }}
            className="px-8 sm:px-12 py-5 sm:py-6 bg-amber-600 text-black text-xl sm:text-2xl font-bold rounded-full transition-all duration-500 flex items-center justify-center gap-4 mx-auto shadow-[0_0_30px_rgba(255,170,0,0.3)] group overflow-hidden relative w-full sm:w-auto"
          >
            {/* Shimmer Effect */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"
            />
            
            <LucideFlame className="w-8 h-8 group-hover:rotate-12 transition-transform duration-500 fill-black" />
            <span className="relative z-10 text-center">Rejoindre La Lanterne Nocturne</span>
          </motion.a>
        </motion.div>
      </div>

      {/* Atmospheric Fog Layers */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black to-transparent z-0 pointer-events-none" />
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[300px] bg-white/5 blur-[100px] z-0 pointer-events-none rounded-[50%]"
      />
    </section>
  )
}

export default FinalCTA
