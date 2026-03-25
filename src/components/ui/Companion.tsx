import React from 'react'
import { motion } from 'framer-motion'

export type CompanionType = 'lion' | 'penguin' | 'dragon' | 'wolf' | 'pig'
export type EvolutionStage = 'egg' | 'baby' | 'teen' | 'adult'

interface CompanionProps {
  type: CompanionType
  stage: EvolutionStage
  color: string
  name: string
  level: number
  animate?: boolean
}

const Companion: React.FC<CompanionProps> = ({ 
  type, 
  stage, 
  color, 
  name, 
  level,
  animate = true 
}) => {
  
  const getIcon = () => {
    if (stage === 'egg') return <span className="text-4xl md:text-5xl">🥚</span>
    
    const sizeClass = stage === 'baby' 
      ? 'text-4xl md:text-5xl' 
      : stage === 'teen' 
        ? 'text-6xl md:text-7xl' 
        : 'text-7xl md:text-8xl'

    switch (type) {
      case 'lion': return <span className={sizeClass}>🦁</span>
      case 'penguin': return <span className={sizeClass}>🐧</span>
      case 'dragon': return <span className={sizeClass}>🐲</span>
      case 'wolf': return <span className={sizeClass}>🐺</span>
      case 'pig': return <span className={sizeClass}>🐷</span>
      default: return <span className={sizeClass}>🐾</span>
    }
  }

  const getStageLabel = () => {
    switch (stage) {
      case 'egg': return 'Œuf'
      case 'baby': return 'Petit'
      case 'teen': return 'Moyen'
      case 'adult': return 'Adulte'
      default: return ''
    }
  }

  // Animations personnalisées
  const floatAnim = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }

  const shakeAnim = {
    rotate: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={animate ? (stage === 'egg' ? shakeAnim : floatAnim) : {}}
        className="relative p-6 rounded-full bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md"
        style={{ color: color }}
      >
        {/* Halo lumineux derrière l'animal */}
        <div 
          className="absolute inset-0 blur-2xl opacity-20 rounded-full" 
          style={{ backgroundColor: color }}
        />
        
        {getIcon()}

        {/* Badge de niveau */}
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-night-900 shadow-lg">
          NIV.{level}
        </div>
      </motion.div>

      <div className="text-center">
        <h4 className="font-bold text-sm text-white uppercase tracking-widest">{name}</h4>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">
          {getStageLabel()} • {type}
        </p>
      </div>
    </div>
  )
}

export default Companion
