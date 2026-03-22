import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../AuthContext'
import { LucideUser, LucidePalette, LucideShield, LucideSave, LucideCheckCircle, LucideCrown, LucideSparkles, LucideArrowLeft, LucideFlame } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { DISCORD_CONFIG } from '../../lib/discord'

const ProfileSettings: React.FC = () => {
  const { user, updateProfile, loading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [bio, setBio] = useState('')
  const [bannerColor, setBannerColor] = useState('#1a1a1a')
  const [bannerUrl, setBannerUrl] = useState('')
  const [displayNameColor, setDisplayNameColor] = useState('#FFFFFF')
  const [saved, setSaved] = useState(false)

  // Initial refresh
  useEffect(() => {
    refreshUser()
  }, [])

  // Sync state when user data is loaded
  useEffect(() => {
    if (user) {
      setBio(user.bio || '')
      setBannerColor(user.bannerColor || '#1a1a1a')
      setBannerUrl(user.bannerUrl || '')
      setDisplayNameColor(user.displayNameColor || '#FFFFFF')
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-night-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!user) return <Navigate to="/" />

  const isStaff = user?.roles?.some(roleId => [
    DISCORD_CONFIG.ROLES.OWNER,
    DISCORD_CONFIG.ROLES.CO_OWNER,
    DISCORD_CONFIG.ROLES.ADMIN,
    DISCORD_CONFIG.ROLES.STAFF
  ].includes(roleId))

  const isVipOnDiscord = user?.roles?.includes(DISCORD_CONFIG.ROLES.VIP)

  const hasPackEclat = isStaff || isVipOnDiscord || (user?.premium_tier || 0) >= 1
  const hasPackLanterne = isStaff || (user?.premium_tier || 0) >= 2
  const hasPackEternel = isStaff || (user?.premium_tier || 0) >= 3

  const handleSave = async () => {
    try {
      await updateProfile({
        bio,
        bannerColor: hasPackLanterne ? bannerColor : '#1a1a1a',
        bannerUrl: hasPackLanterne ? bannerUrl : '',
        displayNameColor: hasPackEclat ? displayNameColor : '#FFFFFF'
      })
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        navigate('/dashboard')
      }, 2000)
    } catch (e) {
      alert('Erreur lors de la sauvegarde du profil.')
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 bg-night-900 text-white relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors mb-12 group"
        >
          <LucideArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Retour au Dashboard
        </button>

        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-amber-500 mb-2">Paramètres Profil</h1>
            <p className="text-gray-400 font-light italic">"Personnalisez votre présence sous la lanterne."</p>
          </div>
          {saved && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20"
            >
              <LucideCheckCircle size={18} />
              Sauvegardé
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Aperçu direct</h3>
              <div className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl relative">
                {bannerUrl ? (
                  <img src={bannerUrl} className="h-24 w-full object-cover" alt="Banner" />
                ) : (
                  <div className="h-24 w-full" style={{ backgroundColor: bannerColor }} />
                )}
                <div className="px-8 pb-8 -mt-12">
                  <div className="relative mb-4">
                    <img 
                      src={user.avatar 
                        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`
                      }
                      className="w-24 h-24 rounded-full border-4 border-night-900 shadow-xl"
                      alt={user.username}
                    />
                  </div>
                  <h4 
                    className={`text-2xl font-bold mb-1 ${hasPackEternel ? 'nickname-golden-animated' : ''}`} 
                    style={{ 
                      color: hasPackEternel ? 'transparent' : (displayNameColor || '#FFFFFF'),
                      WebkitTextFillColor: hasPackEternel ? 'transparent' : 'initial'
                    }}
                  >
                    {user.username}
                  </h4>
                  <p className="text-gray-500 text-xs font-mono mb-4 uppercase tracking-tighter">ID: {user.id}</p>
                  <p className="text-gray-400 text-sm italic font-light leading-relaxed">
                    {bio || "Aucune biographie définie..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-violet-600/20 text-violet-400">
                  <LucideUser size={24} />
                </div>
                <h3 className="text-xl font-bold">Biographie</h3>
              </div>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Racontez votre histoire sous la lanterne..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:border-amber-500/50 outline-none transition-all min-h-[150px] resize-none font-light"
              />
            </div>

            {/* Visual Customization (Premium) */}
            <div className={`p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden ${!hasPackEclat && 'opacity-60 cursor-not-allowed'}`}>
              {!hasPackEclat && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] p-6 text-center">
                  <LucideCrown className="text-amber-500 w-12 h-12 mb-4 animate-bounce" />
                  <h4 className="text-xl font-bold mb-2">Pack VIP Requis</h4>
                  <p className="text-gray-300 text-sm mb-6 max-w-[250px]">Passez au Pack Éclat pour débloquer la personnalisation visuelle !</p>
                  <button onClick={() => navigate('/shop')} className="px-6 py-2 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all text-sm">Voir la Boutique</button>
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-xl bg-amber-600/20 text-amber-500">
                  <LucidePalette size={24} />
                </div>
                <h3 className="text-xl font-bold">Personnalisation Visuelle</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Banner Customization - Pack Lanterne+ (Tier 2+) */}
                <div className={`relative ${!hasPackLanterne && 'opacity-40'}`}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                    Bannière du Profil
                    {!hasPackLanterne && <LucideCrown size={10} className="text-amber-500" />}
                  </label>
                  
                  <div className="space-y-4">
                    {/* Color Picker */}
                    <div className="flex gap-3">
                      <input 
                        type="color" 
                        value={bannerColor}
                        onChange={(e) => hasPackLanterne && setBannerColor(e.target.value)}
                        disabled={!hasPackLanterne}
                        className={`w-12 h-12 rounded-xl bg-transparent border-none ${hasPackLanterne ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      />
                      <input 
                        type="text" 
                        value={bannerColor}
                        onChange={(e) => hasPackLanterne && setBannerColor(e.target.value)}
                        disabled={!hasPackLanterne}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-mono"
                        placeholder="#1a1a1a"
                      />
                    </div>

                    {/* Image URL Input */}
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        value={bannerUrl}
                        onChange={(e) => {
                          if (!hasPackLanterne) return
                          const val = e.target.value
                          if (val.toLowerCase().endsWith('.gif') && !hasPackEternel) {
                            alert("Les GIFs en bannière sont réservés au Pack Éternel !")
                            return
                          }
                          setBannerUrl(val)
                        }}
                        disabled={!hasPackLanterne}
                        placeholder={hasPackEternel ? "URL de l'image ou du GIF..." : "URL de l'image (GIF réservé Éternel)..."}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 outline-none transition-all"
                      />
                      <p className="text-[10px] text-gray-500 italic">
                        {hasPackEternel 
                          ? "Supporte les images (PNG, JPG) et les GIFs." 
                          : hasPackLanterne 
                            ? "Supporte les images (PNG, JPG). Passez à l'Éternel pour les GIFs !" 
                            : "Requis: Pack Lanterne (Image) ou Éternel (GIF)"}
                      </p>
                    </div>
                  </div>
                  {!hasPackLanterne && <p className="text-[10px] text-amber-500/60 mt-2 font-bold uppercase">Requis: Pack Lanterne</p>}
                </div>

                {/* Display Name Color - Pack Eclat (Tier 1) */}
                <div className={`relative ${!hasPackEclat && 'opacity-40'}`}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                    Couleur du Pseudo
                    {!hasPackEclat && <LucideCrown size={10} className="text-amber-500" />}
                  </label>
                  <div className="flex gap-3">
                    <div className="relative">
                      <input 
                        type="color" 
                        value={displayNameColor}
                        onChange={(e) => hasPackEclat && setDisplayNameColor(e.target.value)}
                        disabled={!hasPackEclat}
                        className={`w-12 h-12 rounded-xl bg-transparent border-2 border-white/10 ${hasPackEclat ? 'cursor-pointer hover:border-amber-500/50' : 'cursor-not-allowed'} transition-colors`}
                      />
                      {hasPackEclat && (
                        <div className="absolute inset-0 pointer-events-none rounded-xl border border-white/5" />
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={displayNameColor}
                      onChange={(e) => hasPackEclat && setDisplayNameColor(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
                      disabled={!hasPackEclat}
                      placeholder="#FFFFFF"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-mono focus:border-amber-500/50 outline-none transition-colors"
                    />
                  </div>
                  {!hasPackEclat && <p className="text-[10px] text-amber-500/60 mt-2 font-bold uppercase">Requis: Pack Éclat</p>}
                </div>
              </div>
            </div>

            {/* Badges (VIP) */}
            <div className={`p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden ${!hasPackEclat && 'opacity-60 cursor-not-allowed'}`}>
              {!hasPackEclat && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] p-6 text-center">
                  <LucideSparkles className="text-amber-500 w-12 h-12 mb-4 animate-pulse" />
                  <h4 className="text-xl font-bold mb-2">Packs Requis</h4>
                  <p className="text-gray-300 text-sm mb-6 max-w-[250px]">Prenez un pack pour débloquer vos badges exclusifs !</p>
                  <button onClick={() => navigate('/shop')} className="px-6 py-2 bg-amber-600 text-black font-bold rounded-full hover:bg-amber-500 transition-all text-sm">Voir la Boutique</button>
                </div>
              )}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
                  <LucideSparkles size={24} />
                </div>
                <h3 className="text-xl font-bold">Badges Exclusifs</h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: LucideFlame, label: "Éclat Nocturne", required: 'hasPackEclat' },
                  { icon: LucideCrown, label: "Lumière Royale", required: 'hasPackLanterne' },
                  { icon: LucideSparkles, label: "Poussière d'Étoile", required: 'hasPackEternel' }
                ].map((badge, i) => {
                  const isLocked = badge.required === 'hasPackLanterne' ? !hasPackLanterne : 
                                  badge.required === 'hasPackEternel' ? !hasPackEternel : !hasPackEclat;
                  return (
                    <div key={i} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all group relative ${isLocked ? 'bg-white/[0.02] border-white/5 opacity-40' : 'bg-white/5 border-white/5 hover:border-amber-500/20 cursor-pointer'}`}>
                      <badge.icon className={`w-8 h-8 ${isLocked ? 'text-gray-700' : 'text-gray-500 group-hover:text-amber-500'} transition-colors`} />
                      <span className="text-[10px] uppercase font-bold text-gray-600">{badge.label}</span>
                      {isLocked && (
                        <div className="absolute -top-1 -right-1">
                          <LucideShield size={12} className="text-gray-700" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSave}
                className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(255,170,0,0.2)] flex items-center justify-center gap-3 text-lg"
              >
                <LucideSave size={24} /> Sauvegarder les modifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings
