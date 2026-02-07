import React from 'react';
import { FadeInOnScroll, LightBeamEffect } from '../ui/Effects';

const SpiritValues: React.FC = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <LightBeamEffect />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-8">
              Esprit & Valeurs
            </h2>
          </FadeInOnScroll>
          
          <div className="space-y-8 text-lg md:text-2xl text-gray-300 font-light leading-relaxed">
            <FadeInOnScroll>
              <p>
                <span className="text-gold-400 font-normal">Un espace bienveillant</span>, chill et chaleureux.
              </p>
            </FadeInOnScroll>
            
            <FadeInOnScroll>
              <p>
                Ici, la nuit n'est pas sombre, elle est <span className="text-violet-400 font-normal">lumineuse</span>.
              </p>
            </FadeInOnScroll>

            <FadeInOnScroll>
              <p>
                Où rire, partager et se sentir à l’aise est une priorité absolue. 
                Que tu sois un oiseau de nuit ou juste de passage, tu trouveras toujours une place au coin du feu.
              </p>
            </FadeInOnScroll>
          </div>
          
          <FadeInOnScroll className="pt-12">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent mx-auto" />
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
};

export default SpiritValues;
