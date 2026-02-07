import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const AnimatedGradientBackground: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-night-900", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(87,10,87,0.15),_transparent_70%)] animate-pulse-slow" />
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};

export const ParticlesBackground: React.FC = () => {
  // Simple static particles with CSS animation
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-gold-400 rounded-full opacity-20"
          style={{ top: p.top, left: p.left }}
          animate={{
            y: [0, -100],
            opacity: [0.2, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export const StarField: React.FC = () => {
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute bg-white rounded-full opacity-30"
          style={{ 
            top: s.top, 
            left: s.left, 
            width: s.size, 
            height: s.size 
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
