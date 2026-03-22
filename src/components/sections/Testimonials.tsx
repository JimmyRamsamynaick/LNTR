import React from 'react'
import { motion } from 'framer-motion'
import { LucideQuote, LucideStar } from 'lucide-react'

// L'intégralité des 9 avis récupérés depuis https://disboard.org/fr/server/reviews/1352907337656176660
const reviews = [
  {
    pseudo: "Romi",
    avis: "Hellow MJ, oui je t'adresse directement vu que tu vas lire ça, je le sais. Bref, j'adore ton serveur. Il est très bien structuré et accueillant. Je m'y sent super bien et je trouve les mini jeux intéressants. L'ambiance est très chill et agréable. Les membres sont un peu chelous, mais sympas. Y a toujours du monde en voc et on s'y ennuie presque jamais. Merci de l'avoir créer MJ. Bisous à tout ceux qui vont lire cet avis!",
    role: "Avis Disboard",
    rating: 5
  },
  {
    pseudo: "Anonyme",
    avis: "Faut rejoindre les frr ils sont trop drôle et les gens sont tjrs actifs peut importe l'heure venez lv",
    role: "Avis Disboard",
    rating: 5
  },
  {
    pseudo: "Anonyme",
    avis: "TROPP COOL LE SERVEUUUR VENEZZZ TOUUS NOUS REJOINDRE YOUHOUU YA QUELQU'UN LETS GOOO",
    role: "Avis Disboard",
    rating: 5
  },
  {
    pseudo: "Anonyme",
    avis: "Ce serveur dispose d’un staff d'exception toujours à l’écoute réactif et bienveillant (mention spéciale à Error, Le J et Queenie). Ils savent créer un environnement sûr et accueillant pour tous les membres. La communauté est active, respectueuse et très soudée. On y trouve facilement sa place que ce soit pour discuter, se divertir ou simplement passer du bon temps.",
    role: "Avis Disboard",
    rating: 5
  },
  {
    pseudo: "Anonyme",
    avis: "Franchement, je ne m’attendais pas à ça. En rejoignant ce serveur, je pensais tomber sur un truc banal… mais j’ai vite compris que c’était bien plus que ça. L’ambiance est top, la communauté est active et bienveillante, et les modos font un super taf pour garder tout ça agréable. J’ai appris plein de choses, fait de belles rencontres, et je me surprends à y passer du temps tous les jours.",
    role: "Avis Disboard",
    rating: 5
  },
  {
    pseudo: "Anonyme",
    avis: "Franchement ça fais 5 jours que je suis sur le serveur et dès le début je me suis sentit a l’aise avec les autres membres du serveur. Même si c’est une petite commu on parle de tout et de rien et franchement c’est ça qui fais plaisir.",
    role: "Avis Disboard",
    rating: 5
  },
  {
    pseudo: "Anonyme",
    avis: "Même à 00h-1h on trouve des gens avec qui discuter, c'est cool! veneezzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
    role: "Avis Disboard",
    rating: 5
  },
  {
    pseudo: "Anonyme",
    avis: "Quand on rejoins le serveur les membre et le chef son très accueillant, ils mettent vite à l'aise , si vous êtes quelqu'un de réserver ce serveur va vous plaire. Le staff et le chef sont à l'écoute des membre et font tous pour leur confort. Franchement j'ai rejoins une dizaine de serveur mais celui là est le seul à être rester :)",
    role: "Avis Disboard",
    rating: 5
  },
  {
    pseudo: "Anonyme",
    avis: "Je pensais voir des personnes présentes en vocal mais je crois qu'il n'y a personne sur ce serveur. Il doit sûrement être vide. Youhou, y'a quelqu'un ?",
    role: "Avis Disboard",
    rating: 2
  }
]

const ReviewCard: React.FC<{ review: typeof reviews[0] }> = ({ review }) => (
  <div className="flex-shrink-0 w-[350px] md:w-[450px] p-8 md:p-10 mx-4 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl hover:border-amber-500/30 transition-all group relative overflow-hidden shadow-2xl">
    <div className="absolute top-8 right-8 text-white/5 group-hover:text-amber-500/10 transition-colors duration-500">
      <LucideQuote size={60} />
    </div>

    <div className="relative z-10">
      <div className="flex gap-1 mb-6 text-amber-500">
        {[...Array(5)].map((_, i) => (
          <LucideStar 
            key={i} 
            size={16} 
            fill={i < review.rating ? "currentColor" : "none"} 
            className={i < review.rating ? "text-amber-500" : "text-gray-600"}
          />
        ))}
      </div>
      
      <p className="text-lg md:text-xl text-gray-300 leading-relaxed italic mb-8 opacity-90 min-h-[120px]">
        "{review.avis}"
      </p>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white shadow-xl border-2 border-white/10">
          {review.pseudo[0]}
        </div>
        <div>
          <h4 className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors duration-300">@{review.pseudo}</h4>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{review.role}</p>
        </div>
      </div>
    </div>
  </div>
)

const Testimonials: React.FC = () => {
  // Triple the reviews for a very long seamless loop
  const duplicatedReviews = [...reviews, ...reviews, ...reviews]

  return (
    <section className="relative py-16 md:py-32 bg-night-900 overflow-hidden border-y border-white/5">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-600/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 md:mb-24">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-7xl font-serif font-bold text-white mb-6 tracking-tight italic"
          >
            L'Éclat de la Communauté
          </motion.h2>
          <p className="text-gray-500 font-light max-w-2xl mx-auto italic mb-8">
            "Ce que nos veilleurs disent de leur sanctuaire nocturne."
          </p>
          <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full drop-shadow-[0_0_10px_rgba(255,170,0,0.5)] opacity-50" />
        </div>
      </div>

      <div className="relative w-full overflow-hidden py-10">
        {/* Gradients for fading edges */}
        <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-night-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-night-900 to-transparent z-10 pointer-events-none" />

        <motion.div 
          className="flex"
          animate={{
            x: [0, -4338] // (Card width 450 + margin 32) * 9 = 4338
          }}
          transition={{
            duration: 80, // Slower duration for 9 cards to maintain readability
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {duplicatedReviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials
