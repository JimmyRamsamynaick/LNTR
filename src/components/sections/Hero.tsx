import React from 'react';
import { AnimatedGradientBackground, ParticlesBackground } from '../ui/Backgrounds';
import { TextReveal } from '../ui/TextAnimations';
import { MagneticButton, AnimatedButton } from '../ui/Buttons';
import { GlowEffect, FloatingElements } from '../ui/Effects';
import { ArrowRight, Sparkles } from 'lucide-react';

const Lantern: React.FC = () => (
  <svg width="200" height="300" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_50px_rgba(251,191,36,0.6)]">
    <path d="M100 0V40" stroke="#F59E0B" strokeWidth="2" />
    <circle cx="100" cy="40" r="4" fill="#F59E0B" />
    {/* Top Cap */}
    <path d="M70 60L100 40L130 60" stroke="#F59E0B" strokeWidth="2" fill="rgba(245, 158, 11, 0.2)" />
    <path d="M70 60H130" stroke="#F59E0B" strokeWidth="2" />
    {/* Body */}
    <path d="M70 60L60 160L80 200H120L140 160L130 60" stroke="#F59E0B" strokeWidth="2" fill="url(#lanternGradient)" />
    {/* Bottom */}
    <path d="M80 200L100 220L120 200" stroke="#F59E0B" strokeWidth="2" fill="rgba(245, 158, 11, 0.2)" />
    {/* Glow Center */}
    <circle cx="100" cy="130" r="20" fill="white" fillOpacity="0.5" filter="url(#blur)" />
    
    <defs>
      <linearGradient id="lanternGradient" x1="100" y1="60" x2="100" y2="200" gradientUnits="userSpaceOnUse">
        <stop stopColor="rgba(245, 158, 11, 0.1)" />
        <stop offset="0.5" stopColor="rgba(245, 158, 11, 0.4)" />
        <stop offset="1" stopColor="rgba(245, 158, 11, 0.1)" />
      </linearGradient>
      <filter id="blur" x="60" y="90" width="80" height="80" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="10" />
      </filter>
    </defs>
  </svg>
);

const Hero: React.FC = () => {
  const handleScrollToActivities = () => {
    document.getElementById('activities')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoinDiscord = () => {
    window.open('https://discord.gg/MB6UuuP4RT', '_blank');
  };

  return (
    <section className="relative h-screen min-h-[800px] flex flex-col items-center justify-center overflow-hidden">
      <AnimatedGradientBackground className="absolute inset-0">
        <ParticlesBackground />
      </AnimatedGradientBackground>

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
        <FloatingElements>
            <div className="mb-8 relative">
                <GlowEffect className="bg-gold-500/40 w-40 h-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <Lantern />
            </div>
        </FloatingElements>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif text-white mb-6 drop-shadow-lg">
          <TextReveal text="Bienvenue à La Lanterne Nocturne" delay={0.2} />
        </h1>

        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed">
            <TextReveal text="Un refuge chaleureux pour discuter, jouer et partager à la lueur de la nuit." delay={0.8} />
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <MagneticButton onClick={handleJoinDiscord} className="flex items-center gap-2 group">
            <Sparkles className="w-5 h-5 group-hover:animate-spin" />
            Rejoindre le Discord
          </MagneticButton>
          
          <AnimatedButton onClick={handleScrollToActivities} className="flex items-center gap-2">
            Découvrir la communauté
            <ArrowRight className="w-4 h-4" />
          </AnimatedButton>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-10 animate-bounce text-gold-500/50">
        <ArrowRight className="w-6 h-6 rotate-90" />
      </div>
    </section>
  );
};

export default Hero;
