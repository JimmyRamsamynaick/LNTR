import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../AuthContext'
import { LucideUser, LucidePalette, LucideShield, LucideSave, LucideCheckCircle, LucideCrown, LucideSparkles, LucideArrowLeft, LucideFlame, LucideUpload, LucideLoader2, LucideTrash2, LucideLink, LucideCat } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { DISCORD_CONFIG } from '../../lib/discord'
import { supabase } from '../../lib/supabase'
import Companion, { CompanionType } from '../ui/Companion'

const ProfileSettings: React.FC = () => {
  const { user, updateProfile, loading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [bio, setBio] = useState('')
  const [bannerColor, setBannerColor] = useState('#1a1a1a')
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerError, setBannerError] = useState(false)
  const [displayNameColor, setDisplayNameColor] = useState('#FFFFFF')
  const [customStatus, setCustomStatus] = useState('')
  const [incognitoMode, setIncognitoMode] = useState(false)
  const [goldNickname, setGoldNickname] = useState(true)
  const [nicknameGradientColor1, setNicknameGradientColor1] = useState('#FFFFFF')
  const [nicknameGradientColor2, setNicknameGradientColor2] = useState('#FFFFFF')
  const [featuredBadges, setFeaturedBadges] = useState<string[]>([])
  const [customUrl, setCustomUrl] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Companion state
  const [companionName, setCompanionName] = useState('')
  const [companionType, setCompanionType] = useState<CompanionType>('wolf')
  const [companionColor, setCompanionColor] = useState('#f59e0b')
  const [allCompanions, setAllCompanions] = useState<any[]>([])
  const [companionData, setCompanionData] = useState<any>(null)
  const [hasManuallySelected, setHasManuallySelected] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!hasPackLanterne) {
      alert("L'upload de bannière est réservé au Pack Lanterne !")
      return
    }

    const isGif = file.type === 'image/gif'
    if (isGif && !hasPackEternel) {
      alert("Les GIFs en bannière sont réservés au Pack Éternel !")
      return
    }

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      // We upload directly to the bucket root
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file, {
          upsert: true
        })

      if (uploadError) {
        console.error('Upload Error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName)

      setBannerUrl(publicUrl)
      setBannerError(false)
      console.log('Successfully uploaded:', publicUrl)
    } catch (error: any) {
      console.error('Full Error Object:', error)
      alert(`Erreur lors de l'upload: ${error.message || 'Problème de connexion'}`)
    } finally {
      setUploading(false)
    }
  }

  // Initial refresh
  useEffect(() => {
    // Ne rafraîchir que si on n'a pas encore de user
    if (!user) {
      refreshUser()
    }
    
    // Fetch companions
    const fetchCompanions = async () => {
      if (!user) return
      const { data } = await supabase
        .from('user_companions')
        .select('*')
        .eq('user_id', user.id)
      
      if (data && data.length > 0) {
        setAllCompanions(data)
        // On ne force l'animal de la BDD que si l'utilisateur n'a pas encore fait de choix dans cette session
        if (!hasManuallySelected) {
          const active = data.find(c => c.is_active) || data[0]
          setCompanionData(active)
          setCompanionName(active.name)
          setCompanionType(active.type as CompanionType)
          setCompanionColor(active.color)
        }
      }
    }
    fetchCompanions()
  }, [user])

  // Gérer le changement d'espèce localement
  const handleSpeciesChange = (type: CompanionType) => {
    if (!hasPackLanterne) return
    
    // Sauvegarder le nom actuel de l'animal AVANT de changer d'espèce pour ne pas le perdre
    setAllCompanions(prev => prev.map(c => 
      c.type === companionType ? { ...c, name: companionName, color: companionColor } : c
    ))

    setCompanionType(type)
    setHasManuallySelected(true)
    
    // Chercher si on a déjà des données pour cette nouvelle espèce
    const existing = allCompanions.find(c => c.type === type)
    if (existing) {
      setCompanionData(existing)
      setCompanionName(existing.name)
      setCompanionColor(existing.color)
    } else {
      // Nouvel animal
      setCompanionData(null)
      setCompanionName('Mon Compagnon')
      setCompanionColor('#f59e0b')
    }
  }

  // Sync state when user data is loaded
  useEffect(() => {
    if (user) {
      setBio(user.bio || '')
      setBannerColor(user.bannerColor || '#1a1a1a')
      setBannerUrl(user.bannerUrl || '')
      setDisplayNameColor(user.displayNameColor || '#FFFFFF')
      setCustomStatus(user.custom_status || '')
      setIncognitoMode(user.incognito_mode || false)
      setGoldNickname(user.gold_nickname !== false)
      setNicknameGradientColor1(user.nicknameGradientColor1 || '#FFFFFF')
      setNicknameGradientColor2(user.nicknameGradientColor2 || '#FFFFFF')
      setFeaturedBadges(user.featured_badges || [])
      setCustomUrl(user.custom_url || '')
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

  const isVipOnDiscord = user?.roles?.some(roleId => [
    DISCORD_CONFIG.ROLES.VIP_ECLAT,
    DISCORD_CONFIG.ROLES.VIP_LANTERNE,
    DISCORD_CONFIG.ROLES.VIP_ETERNEL
  ].includes(roleId))

  const hasPackEclat = isStaff || isVipOnDiscord || (user?.premium_tier || 0) >= 1
  const hasPackLanterne = isStaff || (user?.premium_tier || 0) >= 2
  const hasPackEternel = isStaff || (user?.premium_tier || 0) >= 3

  const handleSave = async () => {
    if (!user) return

    try {
      setIsSaving(true)
      
      const savePromises = []

      // Fonction utilitaire pour ajouter un timeout à une promesse
      const withTimeout = (promise: Promise<any>, ms: number, label: string) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms))
        ])
      }

      // 1. Sauvegarde du profil principal
      savePromises.push(withTimeout(updateProfile({
        bio,
        bannerColor: hasPackLanterne ? bannerColor : '#1a1a1a',
        bannerUrl: hasPackLanterne ? bannerUrl : '',
        displayNameColor: hasPackEclat ? displayNameColor : '#FFFFFF',
        custom_status: hasPackEclat ? customStatus : '',
        incognito_mode: hasPackEternel ? incognitoMode : false,
        gold_nickname: hasPackEternel ? goldNickname : false,
        nicknameGradientColor1: hasPackEternel ? nicknameGradientColor1 : undefined,
        nicknameGradientColor2: hasPackEternel ? nicknameGradientColor2 : undefined,
        featured_badges: featuredBadges,
        custom_url: hasPackEternel ? customUrl.toLowerCase().trim() : undefined
      }), 15000, "Profil (Serveur lent)"))

      // 2. Sauvegarde du compagnon (Tiers 2+)
      if (hasPackLanterne) {
        console.log("Tentative de sauvegarde compagnon pour:", user.id);
        
        // On récupère toutes les données actuelles de l'animal sélectionné s'il existe
        const existing = allCompanions.find(c => c.type === companionType);

        // On désactive tous les compagnons de l'utilisateur
        await supabase
          .from('user_companions')
          .update({ is_active: false })
          .eq('user_id', user.id)

        // On active/crée celui sélectionné avec son propre nom et ses stats
        const companionPromise = supabase
          .from('user_companions')
          .upsert({
            user_id: user.id,
            name: (companionName || 'Mon Compagnon').trim(),
            type: companionType,
            color: companionColor,
            is_active: true,
            experience: existing?.experience || 0,
            level: existing?.level || 1,
            evolution_stage: existing?.evolution_stage || 'egg'
          }, { onConflict: 'user_id,type' }) // Crucial pour identifier l'animal par espèce
        
        savePromises.push(withTimeout(companionPromise as any, 15000, "Compagnon (Serveur lent)"))
      }

      await Promise.all(savePromises)
      
      setSaved(true)
      
      // On réduit le délai de redirection pour plus de réactivité
      setTimeout(() => {
        setSaved(false)
        navigate('/dashboard')
      }, 800)
    } catch (e: any) {
      console.error('Erreur globale:', e)
      alert(`Erreur: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 lg:px-12 bg-night-900 text-white relative">
      <div className="max-w-6xl mx-auto relative z-10">
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
                {bannerUrl && !bannerError ? (
                  <img 
                    src={bannerUrl} 
                    onError={() => setBannerError(true)}
                    className="h-24 w-full object-cover" 
                    alt="Banner" 
                  />
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
                    className={`text-2xl font-bold mb-1 ${hasPackEternel && goldNickname ? 'nickname-golden-animated' : (hasPackEternel && !goldNickname && nicknameGradientColor1 && nicknameGradientColor2 ? 'nickname-gradient-animated' : '')}`} 
                    style={{ 
                      background: hasPackEternel && !goldNickname && nicknameGradientColor1 && nicknameGradientColor2 
                        ? `linear-gradient(to right, ${nicknameGradientColor1} 0%, ${nicknameGradientColor2} 50%, ${nicknameGradientColor1} 100%)` 
                        : 'none',
                      WebkitBackgroundClip: (hasPackEternel && goldNickname) || (hasPackEternel && !goldNickname && nicknameGradientColor1 && nicknameGradientColor2) ? 'text' : 'initial',
                      color: (hasPackEternel && goldNickname) || (hasPackEternel && !goldNickname && nicknameGradientColor1 && nicknameGradientColor2)
                        ? 'transparent' 
                        : (displayNameColor || '#FFFFFF'),
                      WebkitTextFillColor: (hasPackEternel && goldNickname) || (hasPackEternel && !goldNickname && nicknameGradientColor1 && nicknameGradientColor2) ? 'transparent' : 'initial'
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
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
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
                            setBannerError(false)
                          }}
                          disabled={!hasPackLanterne}
                          placeholder={hasPackEternel ? "URL de l'image ou du GIF..." : "URL de l'image (GIF réservé Éternel)..."}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 outline-none transition-all"
                        />
                        
                        <div className="relative">
                          <input
                            type="file"
                            id="banner-upload-input"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!hasPackLanterne) {
                                alert("L'upload de bannière est réservé au Pack Lanterne !")
                                return
                              }
                              console.log('Button clicked, triggering input...');
                              const input = document.getElementById('banner-upload-input') as HTMLInputElement;
                              if (input) {
                                input.value = ''; // Reset to allow same file re-upload
                                input.click();
                              }
                            }}
                            disabled={uploading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                              uploading 
                                ? 'bg-amber-500/20 text-amber-500 cursor-wait' 
                                : hasPackLanterne 
                                  ? 'bg-amber-500 text-black hover:bg-amber-400 cursor-pointer active:scale-95' 
                                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {uploading ? (
                              <LucideLoader2 size={18} className="animate-spin" />
                            ) : (
                              <LucideUpload size={18} />
                            )}
                            {uploading ? 'Upload...' : 'Uploader'}
                          </button>
                        </div>

                        {bannerUrl && (
                          <button
                            onClick={() => setBannerUrl('')}
                            className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
                            title="Effacer la bannière"
                          >
                            <LucideTrash2 size={18} />
                          </button>
                        )}

                        {user?.discordBannerUrl && bannerUrl !== user.discordBannerUrl && (
                          <button
                            onClick={() => {
                              setBannerUrl(user.discordBannerUrl!)
                              setBannerError(false)
                            }}
                            className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                            title="Utiliser ma bannière Discord"
                          >
                            <LucideLink size={18} />
                          </button>
                        )}
                      </div>

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
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-mono focus:border-amber-500/50 outline-none transition-all"
                    />
                  </div>
                  {!hasPackEclat && <p className="text-[10px] text-amber-500/60 mt-2 font-bold uppercase">Requis: Pack Éclat</p>}
                </div>

                {/* Custom Status - Pack Eclat (Tier 1) */}
                <div className={`relative ${!hasPackEclat && 'opacity-40'}`}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                    Phrase de Statut
                    {!hasPackEclat && <LucideCrown size={10} className="text-amber-500" />}
                  </label>
                  <input 
                    type="text" 
                    value={customStatus}
                    onChange={(e) => hasPackEclat && setCustomStatus(e.target.value)}
                    disabled={!hasPackEclat}
                    placeholder="Quoi de neuf ?"
                    maxLength={100}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 outline-none transition-all"
                  />
                  {!hasPackEclat && <p className="text-[10px] text-amber-500/60 mt-2 font-bold uppercase">Requis: Pack Éclat</p>}
                </div>

                {/* Incognito Mode - Pack Eternel (Tier 3) */}
                <div className={`relative ${!hasPackEternel && 'opacity-40'} col-span-1 md:col-span-2 bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${hasPackEternel ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-gray-500'}`}>
                        <LucideShield size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                          Mode Incognito
                          {!hasPackEternel && <LucideCrown size={12} className="text-amber-500" />}
                        </h4>
                        <p className="text-xs text-gray-500">Visitez les profils des autres membres sans laisser de trace.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => hasPackEternel && setIncognitoMode(!incognitoMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        incognitoMode ? 'bg-amber-500' : 'bg-white/10'
                      } ${!hasPackEternel ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          incognitoMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {!hasPackEternel && <p className="text-[10px] text-amber-500/60 mt-4 font-bold uppercase">Requis: Pack Éternel</p>}
                </div>

                {/* Pseudo Gold Toggle - Pack Eternel (Tier 3) */}
                <div className={`relative ${!hasPackEternel && 'opacity-40'} col-span-1 md:col-span-2 bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${hasPackEternel ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-gray-500'}`}>
                        <LucideCrown size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                          Pseudo Gold Animé
                          {!hasPackEternel && <LucideCrown size={12} className="text-amber-500" />}
                        </h4>
                        <p className="text-xs text-gray-500">Activez l'effet doré animé sur votre pseudo (Tier 3 uniquement).</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => hasPackEternel && setGoldNickname(!goldNickname)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        goldNickname ? 'bg-amber-500' : 'bg-white/10'
                      } ${!hasPackEternel ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          goldNickname ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {!hasPackEternel && <p className="text-[10px] text-amber-500/60 mt-4 font-bold uppercase">Requis: Pack Éternel</p>}
                </div>

                {/* Nickname Gradient - Pack Eternel (Tier 3) */}
                <div className={`relative ${(!hasPackEternel || goldNickname) && 'opacity-40'} col-span-1 md:col-span-2 bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${hasPackEternel && !goldNickname ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-gray-500'}`}>
                        <LucidePalette size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                          Dégradé Personnalisé
                          {!hasPackEternel && <LucideCrown size={12} className="text-amber-500" />}
                        </h4>
                        <p className="text-xs text-gray-500">Choisissez deux couleurs pour un pseudo en dégradé (Désactivez le Gold d'abord).</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Couleur 1</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={nicknameGradientColor1}
                          onChange={(e) => hasPackEternel && !goldNickname && setNicknameGradientColor1(e.target.value)}
                          disabled={!hasPackEternel || goldNickname}
                          className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={nicknameGradientColor1}
                          onChange={(e) => hasPackEternel && !goldNickname && setNicknameGradientColor1(e.target.value)}
                          disabled={!hasPackEternel || goldNickname}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Couleur 2</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={nicknameGradientColor2}
                          onChange={(e) => hasPackEternel && !goldNickname && setNicknameGradientColor2(e.target.value)}
                          disabled={!hasPackEternel || goldNickname}
                          className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={nicknameGradientColor2}
                          onChange={(e) => hasPackEternel && !goldNickname && setNicknameGradientColor2(e.target.value)}
                          disabled={!hasPackEternel || goldNickname}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  {!hasPackEternel && <p className="text-[10px] text-amber-500/60 mt-4 font-bold uppercase">Requis: Pack Éternel</p>}
                  {hasPackEternel && goldNickname && <p className="text-[10px] text-amber-500/60 mt-4 font-bold uppercase">Désactivez le pseudo gold pour utiliser le dégradé</p>}
                </div>

                {/* Custom URL - Pack Eternel (Tier 3) */}
                <div className={`relative ${!hasPackEternel && 'opacity-40'} col-span-1 md:col-span-2 bg-violet-500/5 p-6 rounded-2xl border border-violet-500/10`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${hasPackEternel ? 'bg-violet-500/20 text-violet-500' : 'bg-white/5 text-gray-500'}`}>
                        <LucideLink size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                          URL Personnalisée
                          {!hasPackEternel && <LucideCrown size={12} className="text-amber-500" />}
                        </h4>
                        <p className="text-xs text-gray-500">Créez un lien court unique vers votre profil (lanterne-nocturne.duckdns.org/u/votre-pseudo).</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-black/20 rounded-xl border border-white/5">
                      <span className="text-gray-500 font-mono text-sm">lanterne-nocturne.duckdns.org/u/</span>
                      <input 
                        type="text" 
                        placeholder="votre-pseudo"
                        value={customUrl}
                        onChange={(e) => hasPackEternel && setCustomUrl(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                        disabled={!hasPackEternel}
                        className="bg-transparent border-none outline-none text-amber-500 font-bold w-full"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 italic">Uniquement lettres, chiffres, tirets et underscores.</p>
                  </div>
                  {!hasPackEternel && <p className="text-[10px] text-amber-500/60 mt-4 font-bold uppercase">Requis: Pack Éternel</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-12">
          {/* Companion Settings - Pack Lanterne (Tier 2+) */}
          <div className="relative group/comp-settings w-full">
            <div className={`relative bg-indigo-500/5 p-6 md:p-12 rounded-[3rem] border border-indigo-500/15 overflow-hidden shadow-2xl backdrop-blur-md ${!hasPackLanterne && 'opacity-50'}`}>
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none group-hover/comp-settings:bg-indigo-500/20 transition-all duration-1000" />
              
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">
                {/* Visual Preview - 4/12 on XL */}
                <div className="xl:col-span-4 flex flex-col items-center justify-center bg-black/40 p-10 rounded-[2.5rem] border border-white/5 shadow-inner min-h-[350px] relative overflow-hidden group/preview">
                  <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <div className="relative z-10 transition-transform duration-500 group-hover/preview:scale-110">
                    <Companion 
                      type={companionType} 
                      stage={companionData?.evolution_stage || 'egg'} 
                      color={companionColor} 
                      name={companionName || 'Mon Compagnon'} 
                      level={companionData?.level || 1} 
                    />
                  </div>
                </div>

                {/* Controls - 8/12 on XL */}
                <div className="xl:col-span-8 flex flex-col justify-between space-y-12">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-8">
                    <div className={`p-6 rounded-[2rem] ${hasPackLanterne ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-gray-500'}`}>
                      <LucideCat size={40} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-4xl font-black text-white flex items-center justify-center sm:justify-start gap-4 tracking-tighter">
                        Compagnon Fidèle
                        {!hasPackLanterne && <LucideCrown size={24} className="text-amber-500" />}
                      </h4>
                      <p className="text-gray-400 font-medium text-xl">Élevez et personnalisez votre animal légendaire.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Name Input */}
                    <div className="space-y-4">
                      <label className="text-[12px] uppercase font-black text-gray-500 tracking-[0.3em] px-2">Nom de l'animal</label>
                      <div className="relative group/input">
                        <input 
                          type="text" 
                          placeholder="Nommez votre compagnon..."
                          value={companionName}
                          onChange={(e) => hasPackLanterne && setCompanionName(e.target.value.substring(0, 20))}
                          disabled={!hasPackLanterne}
                          className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-8 py-6 text-2xl font-bold text-white placeholder:text-gray-800 focus:border-indigo-500/50 focus:bg-white/[0.08] outline-none transition-all shadow-2xl disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-gray-700 group-focus-within/input:text-indigo-400 transition-colors">
                          {companionName.length}/20
                        </div>
                      </div>
                    </div>

                    {/* Color selection */}
                    <div className="space-y-4">
                      <label className="text-[12px] uppercase font-black text-gray-500 tracking-[0.3em] px-2">Couleur d'aura</label>
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-wrap gap-3">
                          {['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#0ea5e9', '#10b981', '#ffffff', '#6b7280', '#000000'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => hasPackLanterne && setCompanionColor(c)}
                              disabled={!hasPackLanterne}
                              className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-125 shadow-lg ${companionColor.toLowerCase() === c.toLowerCase() ? 'border-white ring-4 ring-indigo-500/40 scale-125 z-10' : 'border-white/5 hover:border-white/20'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-4">
                          <div className="relative shrink-0">
                            <input 
                              type="color" 
                              value={companionColor}
                              onChange={(e) => hasPackLanterne && setCompanionColor(e.target.value)}
                              disabled={!hasPackLanterne}
                              className="w-16 h-16 rounded-2xl bg-transparent border-2 border-white/10 cursor-pointer disabled:cursor-not-allowed p-1 transition-all hover:border-indigo-500/50"
                            />
                          </div>
                          <input 
                            type="text" 
                            value={companionColor}
                            onChange={(e) => hasPackLanterne && setCompanionColor(e.target.value)}
                            disabled={!hasPackLanterne}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 text-xl font-mono font-bold text-indigo-400 focus:border-indigo-500/50 outline-none disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Species selection */}
                    <div className="col-span-full space-y-6">
                      <label className="text-[12px] uppercase font-black text-gray-500 tracking-[0.3em] px-2">Choix de l'Espèce</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                        {[
                          { id: 'lion', icon: "🦁", label: 'Lion' },
                          { id: 'penguin', icon: "🐧", label: 'Pingouin' },
                          { id: 'dragon', icon: "🐲", label: 'Dragon' },
                          { id: 'wolf', icon: "🐺", label: 'Loup' },
                          { id: 'pig', icon: "🐷", label: 'Cochon' }
                        ].map((pet) => (
                          <button
                            key={pet.id}
                            type="button"
                            onClick={() => handleSpeciesChange(pet.id as CompanionType)}
                            disabled={!hasPackLanterne}
                            className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${
                              companionType === pet.id 
                                ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-[0_20px_50px_rgba(99,102,241,0.3)] scale-[1.05]' 
                                : 'bg-white/5 border-white/5 text-gray-700 hover:bg-white/10 hover:border-white/10 hover:scale-[1.02]'
                            } disabled:cursor-not-allowed disabled:opacity-30`}
                          >
                            <span className={`text-5xl transition-all duration-700 ${companionType === pet.id ? 'scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'grayscale-[0.6]'}`}>{pet.icon}</span>
                            <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${companionType === pet.id ? 'text-white' : 'text-gray-800'}`}>{pet.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Info & Boost Banner */}
                  {hasPackLanterne && (
                    <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] relative overflow-hidden group/info shadow-2xl">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full -mr-40 -mt-40 group-hover:bg-indigo-500/20 transition-all duration-1000 pointer-events-none" />
                      <div className="flex flex-col sm:flex-row items-center gap-10 relative z-10">
                        <div className="p-6 rounded-2xl bg-indigo-500/25 text-indigo-400 shadow-xl">
                          <LucideSparkles size={32} className="animate-pulse" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <p className="text-[12px] text-indigo-400 font-black uppercase tracking-[0.5em] mb-2">Progression & Boost Légendaire</p>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6">
                            <p className="text-lg text-gray-400 font-medium">EXP gagnée à chaque action.</p>
                            {hasPackEternel ? (
                              <span className="text-amber-500 font-black inline-flex items-center gap-3 bg-amber-500/20 px-6 py-2 rounded-full border border-amber-500/40 shadow-2xl scale-110">
                                <LucideCrown size={18} />
                                BOOST x2 ACTIF
                              </span>
                            ) : (
                              <span className="text-indigo-300/80 italic font-bold text-sm bg-indigo-500/10 px-5 py-2 rounded-full border border-indigo-500/20">Boost x2 réservé à l'Éternel</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lock Screen Overlay - Ensuring it doesn't block other sections */}
              {!hasPackLanterne && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl p-10 text-center animate-in fade-in zoom-in duration-500">
                  <div className="max-w-xl bg-indigo-900/20 p-16 rounded-[4rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
                    <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mb-10 mx-auto shadow-amber-500/30 shadow-3xl">
                      <LucideCrown className="text-amber-500 w-12 h-12 animate-bounce" />
                    </div>
                    <h4 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">Pack Lanterne</h4>
                    <p className="text-gray-300 text-lg mb-12 font-medium leading-relaxed">
                      Débloquez votre propre animal de compagnie évolutif et personnalisable pour une aventure unique.
                    </p>
                    <button 
                      onClick={() => navigate('/shop')} 
                      className="px-16 py-6 bg-amber-600 text-black font-black rounded-full hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_60px_rgba(245,158,11,0.4)] text-lg uppercase tracking-[0.2em]"
                    >
                      Voir la boutique
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Badges (VIP) */}
          <div className={`p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden ${!hasPackEclat && 'opacity-60 cursor-not-allowed'}`}>
            {!hasPackEclat && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] p-6 text-center">
                <LucideSparkles className="text-amber-500 w-12 h-12 mb-4 animate-pulse" />
                <h4 className="text-xl font-bold mb-2">Packs Requis</h4>
                <p className="text-gray-300 text-sm mb-6 max-w-[250px]">Prenez un pack pour débloquer vos badges exclusifs !</p>
                <button onClick={() => navigate('/shop')} className="px-6 py-2 bg-amber-600 text-black font-black rounded-full hover:bg-amber-500 transition-all text-sm">Voir la Boutique</button>
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
                { id: 'eclat', icon: LucideFlame, label: "Éclat Nocturne", required: 'hasPackEclat' },
                { id: 'lanterne', icon: LucideCrown, label: "Lumière Royale", required: 'hasPackLanterne' },
                { id: 'eternel', icon: LucideSparkles, label: "Poussière d'Étoile", required: 'hasPackEternel' }
              ].map((badge, i) => {
                const isLocked = badge.required === 'hasPackLanterne' ? !hasPackLanterne : 
                                badge.required === 'hasPackEternel' ? !hasPackEternel : !hasPackEclat;
                const isFeatured = featuredBadges.includes(badge.id);

                const toggleBadge = () => {
                  if (isLocked) return;
                  if (isFeatured) {
                    setFeaturedBadges(prev => prev.filter(id => id !== badge.id));
                  } else {
                    setFeaturedBadges(prev => [...prev, badge.id]);
                  }
                };

                return (
                  <button 
                    key={i} 
                    type="button"
                    onClick={toggleBadge}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all group relative ${
                      isLocked 
                        ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed' 
                        : isFeatured
                          ? 'bg-amber-500/20 border-amber-500/50 cursor-pointer scale-105 shadow-[0_0_20px_rgba(255,170,0,0.2)]'
                          : 'bg-white/5 border-white/5 hover:border-amber-500/20 cursor-pointer'
                    }`}
                  >
                    <badge.icon className={`w-8 h-8 ${isLocked ? 'text-gray-700' : isFeatured ? 'text-amber-500' : 'text-gray-500 group-hover:text-amber-500'} transition-colors`} />
                    <span className={`text-[10px] uppercase font-bold ${isFeatured ? 'text-amber-500' : 'text-gray-600'}`}>{badge.label}</span>
                    {isLocked && (
                      <div className="absolute -top-1 -right-1">
                        <LucideShield size={12} className="text-gray-700" />
                      </div>
                    )}
                    {!isLocked && isFeatured && (
                      <div className="absolute -top-1 -right-1 bg-amber-500 text-black rounded-full p-0.5">
                        <LucideCheckCircle size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full py-5 ${isSaving ? 'bg-amber-600/50 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500'} text-black font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(255,170,0,0.2)] flex items-center justify-center gap-3 text-lg`}
            >
              {isSaving ? (
                <>
                  <LucideLoader2 size={24} className="animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : saved ? (
                <>
                  <LucideCheckCircle size={24} />
                  Profil Sauvegardé !
                </>
              ) : (
                <>
                  <LucideSave size={24} />
                  Sauvegarder les modifications
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings
