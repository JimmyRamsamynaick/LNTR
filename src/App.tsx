import Hero from './components/sections/Hero';
import MemberCounter from './components/sections/MemberCounter';
import Activities from './components/sections/Activities';
import SpiritValues from './components/sections/SpiritValues';
import JoinCTA from './components/sections/JoinCTA';
import Footer from './components/sections/Footer';

function App() {
  return (
    <div className="min-h-screen bg-night-900 text-gray-100 selection:bg-gold-500/30 font-sans overflow-x-hidden">
      <main className="relative z-10">
        <Hero />
        <MemberCounter />
        <Activities />
        <SpiritValues />
        <JoinCTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;
