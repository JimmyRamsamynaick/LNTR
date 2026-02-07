import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const GlowEffect: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("absolute rounded-full blur-[100px] opacity-30", className)} />
  );
};

export const PulseGlow: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
      className={cn("absolute rounded-full blur-[20px] bg-gold-500/30", className)}
    />
  );
};

export const FloatingElements: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  return (
    <motion.div
      animate={{ y: [-10, 10, -10] }}
      transition={{ duration: 6, repeat: Infinity, delay: delay, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
};

export const FadeInOnScroll: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggeredFadeIn: React.FC<{ children: React.ReactNode[]; className?: string }> = ({ children, className }) => {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

export const LightBeamEffect: React.FC = () => {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-gold-500/10 to-transparent blur-[100px] pointer-events-none" />
  );
};
