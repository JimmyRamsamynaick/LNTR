import React from 'react';
import CircularGallery from '../ui/CircularGallery';
import { GlowEffect } from '../ui/Effects';

const Activities: React.FC = () => {
  const galleryItems = [
    {
      image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
      text: "Gaming ensemble"
    },
    {
      image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800&auto=format&fit=crop",
      text: "Vocaux chill"
    },
    {
      image: "https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?q=80&w=800&auto=format&fit=crop",
      text: "Moments détente"
    },
    {
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop",
      text: "Discussions libres"
    }
  ];

  return (
    <section id="activities" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Au programme</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Il se passe toujours quelque chose sous la lueur de la lanterne.
          </p>
          <GlowEffect className="bg-violet-900/40 w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[80px]" />
        </div>

        <div style={{ height: '600px', position: 'relative' }}>
          <CircularGallery 
            items={galleryItems}
            bend={3} 
            textColor="#ffffff" 
            borderRadius={0.05} 
            scrollSpeed={2} 
            scrollEase={0.05}
            font="bold 30px 'Inter', sans-serif"
          />
        </div>
      </div>
    </section>
  );
};

export default Activities;
