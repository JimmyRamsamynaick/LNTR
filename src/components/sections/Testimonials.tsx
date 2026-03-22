import React from 'react'
import { motion } from 'framer-motion'
import { LucideQuote, LucideStar } from 'lucide-react'

const testimonials = [
  {
    pseudo: "Romi",
    avis: "J'adore ton serveur. Il est très bien structuré et accueillant. Je m'y sens super bien et je trouve les mini jeux intéressants. L'ambiance est très chill et agréable. Y a toujours du monde en voc et on s'y ennuie presque jamais.",
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
    avis: "Ce serveur dispose d’un staff d'exception toujours à l’écoute réactif et bienveillant. Ils savent créer un environnement sûr et accueillant pour tous les membres. On y trouve facilement sa place.",
    role: "Avis Disboard",
    rating: 5
  }
]

const Testimonials: React.FC = () => {
  return (
    <section className="relative py-16 md:py-32 px-4 sm:px-6 bg-night-900 overflow-hidden border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-24 px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold text-white mb-4 md:mb-6 tracking-tight"
          >
            Ce qu'on en dit...
          </motion.h2>
          <div className="w-16 md:w-24 h-1 bg-amber-500 mx-auto rounded-full drop-shadow-[0_0_10px_rgba(255,170,0,0.5)] opacity-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group p-8 md:p-12 rounded-[30px] md:rounded-[40px] bg-white/5 border border-white/10 hover:border-amber-500/20 transition-all duration-500 hover:bg-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.2)]"
            >
              {/* Quote Icon Background Decor */}
              <div className="absolute top-8 right-8 text-white/5 group-hover:text-amber-500/10 transition-colors duration-500">
                <LucideQuote size={80} />
              </div>

              <div className="relative z-10">
                <div className="flex gap-1 mb-6 text-amber-500">
                  {[...Array(t.rating)].map((_, i) => (
                    <LucideStar key={i} size={18} fill="currentColor" />
                  ))}
                </div>
                
                <p className="text-xl text-gray-300 leading-relaxed italic mb-10 opacity-90">
                  "{t.avis}"
                </p>

                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-amber-600 flex items-center justify-center text-xl font-bold text-white uppercase shadow-xl">
                    {t.pseudo[0]}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors duration-300">@{t.pseudo}</h4>
                    <p className="text-sm text-gray-500 font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
