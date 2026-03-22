import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

const Universe: React.FC = () => {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8])
  const y = useTransform(scrollYProgress, [0, 1], [100, -100])

  const smoothOpacity = useSpring(opacity, { damping: 20, stiffness: 100 })
  const smoothScale = useSpring(scale, { damping: 20, stiffness: 100 })
  const smoothY = useSpring(y, { damping: 20, stiffness: 100 })

  return (
    <section ref={targetRef} className="relative min-h-[100vh] md:min-h-[120vh] flex items-center justify-center px-4 sm:px-6 overflow-hidden bg-night-900">
      <motion.div
        style={{ 
          opacity: smoothOpacity, 
          scale: smoothScale, 
          y: smoothY 
        }}
        className="relative z-10 text-center max-w-5xl mx-auto px-4"
      >
        <div className="relative mb-8 md:mb-12">
          {/* Glowing Lantern Icon (Conceptual) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 bg-amber-500/20 blur-[40px] md:blur-[60px] rounded-full" />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-amber-500 text-4xl md:text-6xl drop-shadow-[0_0_20px_rgba(255,170,0,0.5)]"
          >
            🕯️
          </motion.div>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-7xl font-serif font-bold text-white mb-8 md:mb-12 leading-tight">
          À la tombée de la nuit, <br />
          <span className="text-amber-500 italic drop-shadow-[0_0_15px_rgba(255,170,0,0.3)]">
            la Lanterne s’allume…
          </span>
        </h2>
        
        <p className="text-base sm:text-xl md:text-3xl text-gray-400 font-light leading-relaxed max-w-3xl mx-auto opacity-80">
          Et attire ceux qui cherchent un lieu différent. Un espace hors du temps où chaque conversation est une lumière dans l'obscurité.
        </p>

        {/* Floating Smoke Elements - Hidden on mobile */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-20 hidden md:block">
          <motion.div 
            animate={{ x: [0, 100, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[300px] bg-white/5 blur-[120px] rounded-full rotate-45"
          />
          <motion.div 
            animate={{ x: [0, -100, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[250px] bg-violet-900/10 blur-[100px] rounded-full -rotate-12"
          />
        </div>
      </motion.div>

      {/* Background Mask Layer for Interactive Lighting Effect */}
      <div className="absolute inset-0 z-0 bg-night-900/50 pointer-events-none" />
    </section>
  )
}

export default Universe
