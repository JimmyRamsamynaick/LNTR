import React from 'react'
import { motion } from 'framer-motion'
import { LucideStar, LucideQuote } from 'lucide-react'

interface Review {
  id: string
  username: string
  avatar: string
  rating: number
  content: string
  date: string
}

const reviews: Review[] = [
  {
    id: '1',
    username: 'Léa',
    avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
    rating: 5,
    content: "Un serveur incroyable avec une ambiance unique. Les événements sont toujours bien organisés et la communauté est super accueillante !",
    date: 'Il y a 2 jours'
  },
  {
    id: '2',
    username: 'Démonia',
    avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
    rating: 5,
    content: "Le site est magnifique et reflète parfaitement l'ambiance du serveur. Je recommande à 100% pour ceux qui cherchent un endroit chill.",
    date: 'Il y a 1 semaine'
  },
  {
    id: '3',
    username: 'Shadow',
    avatar: 'https://cdn.discordapp.com/embed/avatars/3.png',
    rating: 5,
    content: "Les packs premium valent vraiment le coup, les avantages sont tops et ça soutient bien le projet. Merci au staff !",
    date: 'Il y a 3 jours'
  },
  {
    id: '4',
    username: 'Luna',
    avatar: 'https://cdn.discordapp.com/embed/avatars/4.png',
    rating: 5,
    content: "Une safe place pour tout le monde. On s'y sent vite chez soi. Hâte de voir les prochaines nouveautés !",
    date: 'Il y a 5 jours'
  },
  {
    id: '5',
    username: 'Arkan',
    avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
    rating: 5,
    content: "Le système de profil sur le site est génial. C'est rare de voir un serveur Discord avec une plateforme aussi aboutie.",
    date: 'Il y a 1 jour'
  }
]

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
  <div className="flex-shrink-0 w-[350px] p-6 mx-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-amber-500/30 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <LucideQuote size={40} className="text-amber-500" />
    </div>
    
    <div className="flex items-center gap-4 mb-4">
      <img 
        src={review.avatar} 
        alt={review.username}
        className="w-12 h-12 rounded-full border-2 border-amber-500/20 shadow-lg shadow-amber-500/10"
      />
      <div>
        <h4 className="font-bold text-white text-lg">{review.username}</h4>
        <div className="flex gap-1">
          {[...Array(review.rating)].map((_, i) => (
            <LucideStar key={i} size={12} className="fill-amber-500 text-amber-500" />
          ))}
        </div>
      </div>
    </div>
    
    <p className="text-gray-400 text-sm italic font-light leading-relaxed mb-4">
      "{review.content}"
    </p>
    
    <div className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
      {review.date} • Avis Disboard
    </div>
  </div>
)

const ReviewsCarousel: React.FC = () => {
  // Double the reviews for seamless loop
  const duplicatedReviews = [...reviews, ...reviews]

  return (
    <div className="w-full overflow-hidden py-10 relative">
      {/* Gradients for fading edges */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-night-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-night-900 to-transparent z-10 pointer-events-none" />

      <motion.div 
        className="flex"
        animate={{
          x: [0, -1750] // Adjusted based on card width + margin (350 + 32) * 5
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {duplicatedReviews.map((review, index) => (
          <ReviewCard key={`${review.id}-${index}`} review={review} />
        ))}
      </motion.div>
    </div>
  )
}

export default ReviewsCarousel
