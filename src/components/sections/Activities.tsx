import React from 'react';
import { HoverCard, TiltCard } from '../ui/Cards';
import { StaggeredFadeIn, GlowEffect } from '../ui/Effects';
import { Gamepad2, Mic, Coffee, MessageCircle } from 'lucide-react';

const Activities: React.FC = () => {
  const activities = [
    {
      icon: <Gamepad2 className="w-8 h-8 text-violet-400" />,
      title: "Gaming ensemble",
      description: "Des sessions multijoueurs endiablées ou chill, selon l'humeur du soir."
    },
    {
      icon: <Mic className="w-8 h-8 text-gold-400" />,
      title: "Vocaux chill",
      description: "On discute de tout et de rien, sans prise de tête, juste pour le plaisir d'être ensemble."
    },
    {
      icon: <Coffee className="w-8 h-8 text-orange-400" />,
      title: "Moments détente",
      description: "Pause café virtuelle, lecture, ou simplement écouter de la musique ensemble."
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-400" />,
      title: "Discussions libres",
      description: "Un espace pour débattre, raconter sa journée ou partager ses passions."
    }
  ];

  return (
    <section id="activities" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Au programme</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Il se passe toujours quelque chose sous la lueur de la lanterne.
          </p>
          <GlowEffect className="bg-violet-900/40 w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[80px]" />
        </div>

        <StaggeredFadeIn className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((activity, index) => (
            <TiltCard key={index} className="h-full">
              <HoverCard className="h-full flex flex-col items-start gap-4 bg-transparent border-none p-0 hover:bg-transparent">
                <div className="p-3 rounded-lg bg-night-900/50 border border-white/10 mb-2">
                  {activity.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{activity.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {activity.description}
                </p>
              </HoverCard>
            </TiltCard>
          ))}
        </StaggeredFadeIn>
      </div>
    </section>
  );
};

export default Activities;
