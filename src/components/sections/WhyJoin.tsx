import React from 'react'
import { motion } from 'framer-motion'
import { LucideMoon, LucideFlame, LucideCigarette, LucideTheater } from 'lucide-react'

const features = [
  {
    icon: LucideMoon,
    title: "Ambiance unique",
    description: "Une atmosphère nocturne immersive et conviviale, où le temps semble s'arrêter.",
    color: "from-violet-500/20 to-transparent"
  },
  {
    icon: LucideFlame,
    title: "Communauté active",
    description: "Toujours quelqu’un avec qui discuter, peu importe l’heure, jour comme nuit.",
    color: "from-amber-500/20 to-transparent"
  },
  {
    icon: LucideCigarette,
    title: "Expérience personnalisée",
    description: "Rôles, salons et interactions sur mesure pour chaque membre de la lanterne.",
    color: "from-blue-500/20 to-transparent"
  },
  {
    icon: LucideTheater,
    title: "Events réguliers",
    description: "Jeux, discussions vocales, soirées à thème et moments de partage inoubliables.",
    color: "from-rose-500/20 to-transparent"
  },
]

const WhyJoin: React.FC = () => {
  return (
    <section className="relative py-16 md:py-32 px-4 sm:px-6 bg-night-900 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-24 px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold text-white mb-4 md:mb-6"
          >
            Pourquoi rejoindre ?
          </motion.h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto opacity-70">
            La Lanterne n'est pas qu'un serveur, c'est un refuge pour ceux qui s'épanouissent sous la lune.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative group p-8 sm:p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,170,0,0.1)] overflow-hidden`}
            >
              {/* Decorative Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-500">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 group-hover:text-amber-500 transition-colors duration-300">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyJoin
