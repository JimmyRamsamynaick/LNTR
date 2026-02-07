import React, { useState, useEffect } from 'react';
import { BlurCard } from '../ui/Cards';
import { AnimatedCounter } from '../ui/TextAnimations';
import { PulseGlow } from '../ui/Effects';
import { Users } from 'lucide-react';

const MemberCounter: React.FC = () => {
  const [count, setCount] = useState(124);

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setCount(prev => prev + 1);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-900/30 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 flex justify-center">
            <BlurCard className="w-full max-w-3xl flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 border-gold-500/20">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <PulseGlow className="w-16 h-16 bg-gold-500/20" />
                        <div className="relative w-16 h-16 bg-night-800 rounded-full flex items-center justify-center border border-gold-500/50 text-gold-500">
                            <Users size={32} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Membres réunis
                        </h2>
                        <p className="text-gray-400">
                            Autour de la lanterne
                        </p>
                    </div>
                </div>

                <div className="text-5xl md:text-7xl font-bold font-mono text-gold-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                    <AnimatedCounter value={count} />
                </div>
            </BlurCard>
        </div>
    </section>
  );
};

export default MemberCounter;
