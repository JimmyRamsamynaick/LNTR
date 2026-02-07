import React from 'react';
import { MagneticButton, AnimatedButton } from '../ui/Buttons';
import { GlowEffect, FloatingElements } from '../ui/Effects';
import { Sparkles, ArrowRight } from 'lucide-react';
import { BlurCard } from '../ui/Cards';

const JoinCTA: React.FC = () => {
  const handleJoin = () => {
    window.open('https://discord.gg/MB6UuuP4RT', '_blank');
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-night-900/80 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <BlurCard className="text-center p-12 md:p-20 border-gold-500/30 relative overflow-hidden group">
            <GlowEffect className="bg-gold-500/20 w-full h-full top-0 left-0 blur-[100px] group-hover:bg-gold-500/30 transition-colors duration-1000" />
            
            <FloatingElements delay={0.5}>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  Rejoins la lumière de la nuit
                </h2>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  La lanterne est allumée, et une place t’attend. Installe-toi, fais connaissance et partage des soirées chaleureuses.
                </p>
                
                <div className="flex flex-col items-center gap-6">
                  <MagneticButton onClick={handleJoin} className="text-lg px-10 py-4 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                    Rejoindre le Discord
                  </MagneticButton>
                  
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Communauté active maintenant
                  </p>
                </div>
              </div>
            </FloatingElements>
          </BlurCard>
        </div>
      </div>
    </section>
  );
};

export default JoinCTA;
