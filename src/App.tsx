import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import Hero from './components/sections/Hero'
import Statistics from './components/sections/Statistics'
import WhyJoin from './components/sections/WhyJoin'
import Universe from './components/sections/Universe'
import Testimonials from './components/sections/Testimonials'
import FinalCTA from './components/sections/FinalCTA'
import Backgrounds from './components/ui/Backgrounds'
import Effects from './components/ui/Effects'
import { AuthProvider, useAuth } from './components/AuthContext'
import { supabase } from './lib/supabase'
import AuthCallback from './components/AuthCallback'
import Dashboard from './components/sections/Dashboard'
import History from './components/sections/History'
import Members from './components/sections/Members'
import Shop from './components/sections/Shop'
import UserProfile from './components/sections/UserProfile'
import ProfileRedirect from './components/ui/ProfileRedirect'
import Legal from './components/sections/Legal'
import ScrollToTop from './components/ui/ScrollToTop'
import ProfileSettings from './components/sections/ProfileSettings'
import { LucideLogOut, LucideUser, LucideFlame, LucideMenu, LucideX, LucideBell, LucideMessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Header: React.FC = () => {
  const { user, login, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [hasNewNotif, setHasNewNotif] = React.useState(false)
  const [toast, setToast] = React.useState<{ id: string, from: string, content: string, type: string } | null>(null)

  React.useEffect(() => {
    if (!user) return

    const checkNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false)
        .limit(1)
      setHasNewNotif(!!(data && data.length > 0))
    }

    checkNotifs()

    const channel = supabase
      .channel(`header-notifs-${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload: any) => {
        if (payload.new.user_id === user.id) {
          setHasNewNotif(true)
          // Show Toast
          setToast({
            id: payload.new.id,
            from: payload.new.from_username,
            content: payload.new.content,
            type: payload.new.type
          })
          // Auto hide after 5 seconds
          setTimeout(() => setToast(null), 5000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const navLinks = [
    { name: 'Histoire', path: '/history' },
    { name: 'Membres', path: '/members' },
    { name: 'Boutique', path: '/shop' },
  ]

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-night-900/40 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
            <LucideFlame className="w-6 h-6 fill-current" />
          </div>
          <span className="text-xl font-serif font-bold text-white tracking-tight hidden xs:block">La Lanterne Nocturne</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              className="text-gray-400 hover:text-amber-500 font-medium transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group relative"
              >
                {hasNewNotif && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-night-900 animate-pulse" />
                )}
                <img 
                  src={user.avatar 
                    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` 
                    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`}
                  alt={user.username}
                  className="w-8 h-8 rounded-full border border-white/20"
                />
                <span className="font-bold text-sm group-hover:text-amber-500 transition-colors">{user.username}</span>
              </Link>
              <button
                onClick={logout}
                className="p-3 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 hidden sm:flex"
                title="Déconnexion"
              >
                <LucideLogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-black text-sm font-bold rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,170,0,0.2)]"
            >
              <LucideUser className="w-4 h-4" />
              <span className="hidden xs:inline">Connexion</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <LucideX size={28} /> : <LucideMenu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Background Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-full left-0 w-full bg-night-800 border-b border-white/5 p-6 flex flex-col gap-6 md:hidden backdrop-blur-2xl z-50 shadow-2xl origin-top"
            >
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  className="text-xl text-gray-300 hover:text-amber-500 font-medium py-2 transition-colors flex items-center justify-between group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                  <motion.span 
                    initial={{ x: -10, opacity: 0 }}
                    whileHover={{ x: 0, opacity: 1 }}
                    className="text-amber-500"
                  >
                    →
                  </motion.span>
                </Link>
              ))}
              {user && (
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 text-red-400 font-medium pt-6 border-t border-white/5 mt-2 text-xl"
                >
                  <LucideLogOut size={24} /> Déconnexion
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Real-time Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed top-24 right-6 z-[100] w-full max-w-sm"
          >
            <Link 
              to={toast.type === 'message' ? '/dashboard' : `/profile/${user?.id}`}
              onClick={() => setToast(null)}
              className="block p-5 bg-night-800/90 backdrop-blur-2xl border border-amber-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] group hover:border-amber-500/60 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${toast.type === 'message' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-500'}`}>
                  {toast.type === 'message' ? <LucideMessageCircle size={20} /> : <LucideBell size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm text-white">{toast.from}</h4>
                    <span className="text-[10px] text-gray-500">À l'instant</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate pr-4">
                    {toast.type === 'message' ? 'Vous a envoyé un message : ' : 'A commenté votre profil : '}
                    <span className="text-gray-300 italic">"{toast.content}"</span>
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); setToast(null); }}
                  className="p-1 text-gray-600 hover:text-white transition-colors"
                >
                  <LucideX size={16} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Cliquer pour voir
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1 }}>→</motion.span>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

const LandingPage: React.FC = () => (
  <main>
    <Hero />
    <Statistics />
    <WhyJoin />
    <Universe />
    <Testimonials />
    <FinalCTA />
  </main>
)

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="relative min-h-screen bg-night-900 overflow-x-hidden selection:bg-amber-500/30">
          <Backgrounds />
          <Effects />
          <Header />

          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/members" element={<Members />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/u/:username" element={<ProfileRedirect />} />
            <Route path="/settings" element={<ProfileSettings />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          <footer className="py-20 px-6 md:px-12 bg-black/40 border-t border-white/5 relative z-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <LucideFlame className="text-amber-500 w-8 h-8" />
                  <span className="text-2xl font-serif font-bold text-white tracking-tight">La Lanterne Nocturne</span>
                </div>
                <p className="text-gray-500 max-w-sm leading-relaxed">
                  Un refuge pour les noctambules, une communauté où chaque lumière compte. Rejoignez-nous pour vivre des nuits inoubliables.
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Navigation</h4>
                <ul className="space-y-4 text-gray-500">
                  <li><Link to="/history" className="hover:text-amber-500 transition-colors">Histoire</Link></li>
                  <li><Link to="/members" className="hover:text-amber-500 transition-colors">Membres</Link></li>
                  <li><Link to="/shop" className="hover:text-amber-500 transition-colors">Boutique</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Légal</h4>
                <ul className="space-y-4 text-gray-500">
                  <li><Link to="/legal" className="hover:text-amber-500 transition-colors">CGU</Link></li>
                  <li><Link to="/legal" className="hover:text-amber-500 transition-colors">Confidentialité</Link></li>
                  <li><Link to="/legal" className="hover:text-amber-500 transition-colors">Mentions Légales</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} La Lanterne Nocturne. Tous droits réservés.</p>
              <p className="text-gray-600 text-sm font-serif italic">Une lueur dans l'obscurité.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
