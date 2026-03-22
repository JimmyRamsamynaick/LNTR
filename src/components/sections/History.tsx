import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LucideFlame, LucideSparkles, LucideMoon, LucideCompass, LucideHistory, LucideCrown, LucideStar } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const timeline = [
  {
    date: "L'Origine",
    title: "La Première Étincelle",
    content: "Dans les tréfonds d'une nuit calme, l'idée d'un refuge pour les noctambules est née. Une simple lanterne allumée pour guider ceux qui ne trouvaient pas leur place dans l'agitation du jour.",
    icon: LucideFlame,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    date: "L'Éveil",
    title: "Le Rassemblement des Âmes",
    content: "Petit à petit, la lueur a attiré les premiers membres. Des passionnés, des joueurs, des rêveurs... Chacun apportant son histoire et sa propre lumière au cercle grandissant.",
    icon: LucideMoon,
    color: "text-violet-400",
    bg: "bg-violet-400/10"
  },
  {
    date: "L'Expansion",
    title: "L'Horizon Nocturne",
    content: "La Lanterne Nocturne est devenue plus qu'un serveur : une famille. Des événements réguliers, des salons vocaux animés et une entraide constante ont forgé l'identité unique de notre communauté.",
    icon: LucideCompass,
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    date: "Aujourd'hui",
    title: "Une Lueur Éternelle",
    content: "Aujourd'hui, nous continuons d'écrire cette histoire ensemble. Chaque nouveau membre est une nouvelle étoile dans notre ciel nocturne, contribuant à faire briller la Lanterne toujours plus fort.",
    icon: LucideSparkles,
    color: "text-pink-400",
    bg: "bg-pink-400/10"
  }
]

const History: React.FC = () => {
  const [legendaryDonors, setLegendaryDonors] = useState<any[]>([])

  const calculateMonths = (since: string) => {
    if (!since) return 1
    const startDate = new Date(since)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - startDate.getTime())
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
    return diffMonths || 1
  }

  useEffect(() => {
    const fetchLegendaryDonors = async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('premium_tier', 3)
      if (data) {
        const mappedData = data.map(m => ({
          id: m.id,
          username: m.username,
          avatar: m.avatar,
          roles: m.roles || [],
          status: m.status as any,
          bio: m.bio,
          bannerColor: m.banner_color,
          bannerUrl: m.banner_url,
          displayNameColor: m.display_name_color,
          premium_tier: m.premium_tier,
          premium_since: m.premium_since,
          gold_nickname: m.gold_nickname !== false,
          flames_count: m.flames_count || 0
        }))
        setLegendaryDonors(mappedData)
      }
    }
    fetchLegendaryDonors()
  }, [])

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 bg-night-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-900/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-amber-500 text-sm font-bold uppercase tracking-widest mb-8"
          >
            <LucideHistory size={18} />
            Notre Épopée
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-serif font-bold mb-8 text-white leading-tight"
          >
            L'Histoire de la <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Lanterne Nocturne</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed italic"
          >
            "Ici, le temps n'existe plus. Seule la lueur de nos échanges compte."
          </motion.p>
        </div>

        {/* Timeline Section */}
        <div className="relative space-y-24 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          {timeline.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group`}
            >
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-night-800 text-white shadow md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 z-20 group-hover:border-amber-500/50 transition-colors duration-500">
                <item.icon size={18} className={item.color} />
              </div>

              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-8 md:p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-500 group-hover:bg-white/[0.07] shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className={`font-bold uppercase tracking-widest text-xs ${item.color}`}>{item.date}</div>
                </div>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed font-light text-lg">
                  {item.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Eternal Thanks Section */}
        {legendaryDonors.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
              <LucideCrown size={12} />
              Membres de Légende
            </div>
            <h2 className="text-4xl font-serif font-bold text-white mb-4">Ceux qui gravent l'histoire</h2>
            <p className="text-gray-500 max-w-2xl mx-auto mb-12 font-light italic">
              "Un immense merci à nos piliers qui soutiennent la Lanterne et permettent à sa lueur de briller chaque jour davantage."
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {legendaryDonors.map((donor) => (
                <Link 
                  key={donor.id} 
                  to={`/profile/${donor.id}`}
                  state={{ memberData: donor }}
                  className="group flex flex-col items-center hover:scale-105 transition-transform duration-300"
                >
                  <div className="relative mb-4 inline-block">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                      src={donor.avatar 
                        ? `https://cdn.discordapp.com/avatars/${donor.id}/${donor.avatar}.png?size=128`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(donor.id) % 5}.png`
                      }
                      alt={donor.username}
                      className="w-20 h-20 rounded-full border-2 border-yellow-500/30 relative z-10 group-hover:border-yellow-500 transition-colors"
                    />
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full z-20 shadow-lg">
                      <LucideStar size={12} fill="currentColor" />
                    </div>
                  </div>
                  <h4 className="nickname-golden-animated text-sm font-bold truncate px-2 w-full text-center">{donor.username}</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Soutien depuis {calculateMonths(donor.premium_since)} mois</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Closing Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 rounded-[3rem] bg-gradient-to-br from-amber-600/20 to-violet-900/20 border border-white/10 text-center backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-8">Et le prochain chapitre ?</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
            Le prochain chapitre, c'est vous qui l'écrivez en nous rejoignant. La Lanterne Nocturne n'est pas qu'une histoire passée, c'est un futur que nous construisons ensemble chaque nuit.
          </p>
          <a 
            href="https://discord.gg/NnFFAQwmD4"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-4 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-full transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,170,0,0.3)]"
          >
            Devenir part de l'histoire
          </a>
        </motion.div>
      </div>
    </div>
  )
}

export default History
