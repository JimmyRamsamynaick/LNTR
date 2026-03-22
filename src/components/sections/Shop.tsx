import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LucideZap, LucideCrown, LucideCheck, LucideSparkles, LucideFlame, LucideStar, LucideX, LucidePartyPopper, LucideCreditCard } from 'lucide-react'

const packs = [
  {
    id: 'starter',
    name: 'Pack Éclat',
    price: '3€',
    duration: 'mois',
    icon: LucideFlame,
    color: 'text-amber-500',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    features: [
      'Badge "Éclat Nocturne" sur votre profil',
      'Couleur de pseudo personnalisée sur le site',
      'Accès aux salons privés sur le site',
      'Soutien direct au projet'
    ]
  },
  {
    id: 'premium',
    name: 'Pack Lanterne',
    price: '7€',
    duration: 'mois',
    icon: LucideZap,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/10',
    popular: true,
    features: [
      'Tout le Pack Éclat',
      'Bannière de profil personnalisée (Image)',
      'Badge "Lumière Royale" exclusif',
      'Accès anticipé aux nouveautés'
    ]
  },
  {
    id: 'legendary',
    name: 'Pack Éternel',
    price: '15€',
    duration: 'mois',
    icon: LucideCrown,
    color: 'text-yellow-500',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    features: [
      'Tout le Pack Lanterne',
      'Bannière animée (Support des GIFs)',
      'Système de vue de profil (10 derniers)',
      'Pseudo doré et animé sur le site',
      'Membre de légende (Page Histoire)'
    ]
  }
]

const Shop: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedPack, setSelectedPack] = useState<any>(null)

  const handlePurchase = (pack: any) => {
    setSelectedPack(pack)
    setShowSuccess(true)
  }

  const paymentLinks = [
    { name: 'PayPal', url: 'https://www.paypal.me/JimmyRamsamynaick', color: 'bg-[#003087]', icon: LucideCreditCard },
    { name: 'Revolut', url: 'https://revolut.me/jramsamynaick05', color: 'bg-black', icon: LucideZap }
  ]

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 md:px-12 bg-night-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-900/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif font-bold mb-6 text-amber-500"
          >
            Boutique de la Lanterne
          </motion.h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed mb-8">
            Soutenez la communauté et débloquez des avantages exclusifs sur le site et notre serveur Discord.
          </p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 max-w-2xl mx-auto inline-block text-amber-500/80 text-sm italic"
          >
            "Chaque contribution aide directement à maintenir nos serveurs de bots, l'hébergement du site web et le nom de domaine. Merci de faire briller la Lanterne !"
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packs.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 md:p-12 rounded-[2.5rem] bg-white/5 border ${pack.borderColor} backdrop-blur-xl flex flex-col h-full group hover:bg-white/[0.07] transition-all duration-500`}
            >
              {pack.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-amber-500 text-black text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(255,170,0,0.4)]">
                  Le plus populaire
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <div className={`p-4 rounded-2xl ${pack.bgColor} ${pack.color}`}>
                  <pack.icon size={32} />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white">{pack.price}</div>
                  <div className="text-gray-500 text-sm">par {pack.duration}</div>
                </div>
              </div>

              <h3 className="text-2xl font-serif font-bold mb-6 text-white">{pack.name}</h3>

              <ul className="space-y-4 mb-12 flex-1">
                {pack.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-400 text-sm leading-relaxed">
                    <LucideCheck size={18} className="text-green-500 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePurchase(pack)}
                className={`w-full py-4 rounded-2xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 ${
                  pack.popular 
                    ? 'bg-amber-600 text-black shadow-[0_0_30px_rgba(255,170,0,0.3)] hover:bg-amber-500' 
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                <LucideStar size={18} /> Choisir ce pack
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="p-4 rounded-2xl bg-amber-500/20 text-amber-500 animate-pulse">
              <LucideSparkles size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-500 mb-2">Activation Automatique</h3>
              <p className="text-gray-400 leading-relaxed max-w-2xl">
                Une fois votre achat terminé, vos avantages sont activés <strong className="text-amber-500">instantanément</strong> dès que vous recevez votre rôle sur Discord. Notre système synchronise vos rôles Discord avec le site en temps réel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl bg-night-800 border border-white/10 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 relative text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[95vh]"
            >
              <button 
                onClick={() => setShowSuccess(false)}
                className="absolute top-4 right-4 md:top-8 md:right-8 text-gray-500 hover:text-white transition-colors p-2"
              >
                <LucideX size={24} />
              </button>

              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 animate-pulse">
                <LucidePartyPopper size={32} className="md:w-10 md:h-10" />
              </div>

              <h2 className="text-2xl md:text-4xl font-serif font-bold text-white mb-4 md:mb-6">Merci pour votre soutien !</h2>
              <p className="text-sm md:text-lg text-amber-500 font-bold mb-6 md:mb-8 uppercase tracking-widest">Activation du {selectedPack?.name || 'Pack'}</p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 mb-6 md:mb-10 text-left">
                <h3 className="text-sm md:text-lg font-bold flex items-center gap-3 text-white mb-4 md:mb-6">
                  <LucideFlame size={18} className="text-amber-500 md:w-5 md:h-5" />
                  Choisissez votre moyen de paiement :
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                  {paymentLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl ${link.color} text-white text-sm md:text-base font-bold hover:scale-105 transition-all shadow-lg`}
                    >
                      <link.icon size={18} className="md:w-5 md:h-5" />
                      Payer via {link.name}
                    </a>
                  ))}
                </div>

                <div className="space-y-3 md:space-y-4 text-gray-400 text-[10px] md:text-xs border-t border-white/10 pt-4 md:pt-6">
                  <p className="font-bold text-white mb-1 md:mb-2 text-xs md:text-sm">Après le paiement :</p>
                  <li className="flex gap-3 md:gap-4">
                    <span className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-amber-500 text-black text-[8px] md:text-[10px] font-bold shrink-0">1</span>
                    <p>Vous recevez votre grade sur le serveur Discord.</p>
                  </li>
                  <li className="flex gap-3 md:gap-4">
                    <span className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-amber-500 text-black text-[8px] md:text-[10px] font-bold shrink-0">2</span>
                    <p>Reconnectez-vous au site pour activer vos avantages.</p>
                  </li>
                </div>
              </div>

              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full md:w-auto px-10 py-3 md:py-4 bg-white/5 text-gray-400 text-sm font-bold rounded-full hover:bg-white/10 transition-all"
              >
                Fermer la fenêtre
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Shop
