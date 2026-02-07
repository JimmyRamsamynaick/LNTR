import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const BlurCard: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl",
      className
    )}>
      {children}
    </div>
  );
};

export const GlassmorphismPanel: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "backdrop-blur-lg bg-night-800/40 border border-white/5 rounded-2xl shadow-2xl",
      className
    )}>
      {children}
    </div>
  );
};

export const HoverCard: React.FC<CardProps> = ({ children, className }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn(
        "bg-night-800/50 border border-white/5 rounded-xl p-6 transition-colors hover:bg-night-800/80 hover:border-gold-500/30 cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const TiltCard: React.FC<CardProps> = ({ children, className }) => {
  // Simple tilt using rotation
  return (
    <motion.div
      whileHover={{ rotateX: 5, rotateY: 5 }}
      className={cn("perspective-1000", className)}
    >
      <div className="bg-gradient-to-br from-night-800 to-night-900 border border-white/10 rounded-xl p-6 shadow-lg">
        {children}
      </div>
    </motion.div>
  );
};
