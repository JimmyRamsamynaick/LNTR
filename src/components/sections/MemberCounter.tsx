import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

const MemberCounter: React.FC = () => {
  const [serverData, setServerData] = useState<any>(null);

  useEffect(() => {
    const fetchDiscordData = async () => {
      try {
        // On essaie de récupérer via l'API invite qui donne les comptes précis
        const response = await fetch('https://discord.com/api/v9/invites/EY3WSHPD?with_counts=true');
        const data = await response.json();
        setServerData(data);
      } catch (error) {
        console.error("Erreur fetch Discord:", error);
      }
    };

    fetchDiscordData();
    const interval = setInterval(fetchDiscordData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Fallback data si l'API échoue (basé sur le dernier check)
  const guildName = serverData?.guild?.name || "La Lanterne Nocturne";
  const onlineCount = serverData?.approximate_presence_count || 158;
  const memberCount = serverData?.approximate_member_count || 753;
  const iconHash = serverData?.guild?.icon || "a_867b994da9b0c520a010a1bff2b51cec";
  const bannerHash = serverData?.guild?.banner || "a_f0eab020e06ff5ed68b510c3028fa2e2";
  const guildId = "1352907337656176660";

  const iconUrl = `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${iconHash.startsWith('a_') ? 'gif' : 'png'}?size=256`;
  const bannerUrl = `https://cdn.discordapp.com/banners/${guildId}/${bannerHash}.${bannerHash.startsWith('a_') ? 'gif' : 'png'}?size=512`;
  const inviteLink = "https://discord.gg/EY3WSHPD";

  return (
    <section className="py-24 relative overflow-hidden bg-[#1e2124]/50">
        {/* Discord-like Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 bg-[#5865F2]/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#EB459E]/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row gap-12 items-center max-w-5xl mx-auto">
                
                {/* Left Side: Description */}
                <div className="flex-1 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Une communauté <br/>
                            <span className="text-[#5865F2]">active et vivante</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto md:mx-0">
                            Rejoignez-nous pour discuter, jouer et partager vos passions. 
                            La Lanterne ne s'éteint jamais vraiment.
                        </p>
                    </motion.div>
                </div>

                {/* Right Side: Custom Discord Invite Embed UI */}
                <div className="flex-1 w-full max-w-md flex justify-center md:justify-end">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="w-full max-w-[400px] bg-[#2f3136] rounded-xl overflow-hidden shadow-2xl font-sans"
                    >
                        {/* Banner Image */}
                        <div className="h-32 w-full bg-[#202225] relative">
                            {bannerHash && (
                                <img 
                                    src={bannerUrl} 
                                    alt="Server Banner" 
                                    className="w-full h-full object-cover opacity-90"
                                />
                            )}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#2f3136] to-transparent opacity-60"></div>
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-6 -mt-8 relative">
                            {/* Server Icon */}
                            <div className="w-24 h-24 rounded-[24px] border-[6px] border-[#2f3136] bg-[#2f3136] overflow-hidden mb-3 shadow-sm">
                                <img 
                                    src={iconUrl} 
                                    alt="Server Icon" 
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Server Name with Badge */}
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-white font-bold text-xl leading-tight">
                                    {guildName}
                                </h3>
                                {/* Verified/Partner Badge (mimic) */}
                                <div className="text-[#5865F2] bg-[#5865F2]/10 p-1 rounded-full" title="Serveur Communautaire">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                       <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.69L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2 3.4 1.46 1.91-3.19 1.89 3.19 3.4-1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
                                    </svg>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs font-semibold text-[#b9bbbe] mb-6">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#3ba55c]"></div>
                                    <span>{onlineCount} en ligne</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#747f8d]"></div>
                                    <span>{memberCount} membres</span>
                                </div>
                            </div>

                            {/* Join Button */}
                            <a 
                                href={inviteLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-2.5 bg-[#248046] hover:bg-[#1a6334] text-white font-medium rounded text-center transition-colors duration-200 ease-in-out"
                            >
                                Aller sur le serveur
                            </a>
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    </section>
  );
};

export default MemberCounter;
