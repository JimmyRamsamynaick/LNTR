import React from 'react'
import { motion } from 'framer-motion'

const Backgrounds: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-night-900">
      {/* Deep Ambiance Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(42,31,61,0.2)_0%,_transparent_70%)]" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-900/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
      
      {/* Moving Mist / Smoke Effect */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 3 }}
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 80%)',
          filter: 'blur(40px)'
        }}
      />

      {/* Floating Particles - Hidden on mobile for performance */}
      <div className="hidden md:block">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, (Math.random() - 0.5) * 100 + "px"],
              opacity: [null, Math.random() * 0.3 + 0.1, null],
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute w-1 h-1 bg-amber-500 rounded-full blur-[1px]"
          />
        ))}
      </div>
    </div>
  )
}

export default Backgrounds
