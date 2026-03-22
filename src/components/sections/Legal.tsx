import React from 'react'
import { motion } from 'framer-motion'
import { LucideShield, LucideFileText, LucideLock, LucideScale } from 'lucide-react'

interface LegalSectionProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}

const LegalSection: React.FC<LegalSectionProps> = ({ title, icon: Icon, children }) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="mb-16 p-8 md:p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md"
  >
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500">
        <Icon size={28} />
      </div>
      <h2 className="text-3xl font-serif font-bold text-white">{title}</h2>
    </div>
    <div className="prose prose-invert prose-amber max-w-none text-gray-400 leading-relaxed space-y-6">
      {children}
    </div>
  </motion.section>
)

const Legal: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 md:px-12 bg-night-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-amber-500">
            Informations Légales
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto italic">
            "La clarté sous la lanterne : nos engagements et vos droits."
          </p>
        </div>

        {/* CGU */}
        <LegalSection title="Conditions Générales d'Utilisation (CGU)" icon={LucideFileText}>
          <p>Bienvenue sur le site de La Lanterne Nocturne. En accédant à ce site, vous acceptez les présentes conditions.</p>
          <h3 className="text-white font-bold text-xl mt-8">1. Accès au service</h3>
          <p>L'accès au site est gratuit pour tout utilisateur disposant d'un accès à internet. Tous les frais supportés par l'utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge.</p>
          <h3 className="text-white font-bold text-xl mt-8">2. Propriété intellectuelle</h3>
          <p>Les marques, logos, signes ainsi que tous les contenus du site (textes, images, son...) font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur.</p>
          <h3 className="text-white font-bold text-xl mt-8">3. Responsabilité</h3>
          <p>Les sources des informations diffusées sur le site sont réputées fiables mais le site ne garantit pas qu’il soit exempt de défauts, d’erreurs ou d’omissions.</p>
        </LegalSection>

        {/* CGV */}
        <LegalSection title="Conditions Générales de Vente (CGV)" icon={LucideScale}>
          <p>Les présentes CGV s'appliquent à tous les achats effectués sur la boutique de La Lanterne Nocturne (Grades VIP, Boosters, etc.).</p>
          <h3 className="text-white font-bold text-xl mt-8">1. Produits et Services</h3>
          <p>Les services vendus sont des avantages numériques sur notre serveur Discord et notre site web. Ils n'ont aucune valeur monétaire réelle en dehors de notre écosystème.</p>
          <h3 className="text-white font-bold text-xl mt-8">2. Tarifs et Paiement</h3>
          <p>Les prix sont indiqués en Euros (€). Le paiement est exigible immédiatement à la commande. Nous utilisons des solutions de paiement sécurisées tierces.</p>
          <h3 className="text-white font-bold text-xl mt-8">3. Droit de rétractation</h3>
          <p>S'agissant de contenu numérique fourni sur un support immatériel dont l'exécution a commencé après accord préalable exprès du consommateur, le droit de rétractation ne s'applique pas (Article L221-28 du Code de la consommation).</p>
        </LegalSection>

        {/* Confidentialité */}
        <LegalSection title="Politique de Confidentialité" icon={LucideLock}>
          <p>Nous accordons une importance capitale à la protection de vos données personnelles.</p>
          <h3 className="text-white font-bold text-xl mt-8">1. Collecte des données</h3>
          <p>Nous collectons uniquement les données nécessaires via l'authentification Discord (ID Discord, Username, Avatar, Rôles) pour vous fournir nos services personnalisés.</p>
          <h3 className="text-white font-bold text-xl mt-8">2. Utilisation des données</h3>
          <p>Vos données sont utilisées exclusivement pour la gestion de votre profil sur le site, l'attribution de vos avantages VIP et l'affichage de votre statut Discord.</p>
          <h3 className="text-white font-bold text-xl mt-8">3. Conservation</h3>
          <p>Les données sont conservées tant que votre compte est actif ou que vous ne demandez pas leur suppression via notre support.</p>
        </LegalSection>

        {/* Mentions Légales */}
        <LegalSection title="Mentions Légales" icon={LucideShield}>
          <h3 className="text-white font-bold text-xl mt-8">Éditeur du site</h3>
          <p>Le site La Lanterne Nocturne est édité par l'équipe d'administration de la communauté.</p>
          <h3 className="text-white font-bold text-xl mt-8">Hébergement</h3>
          <p>Ce site est hébergé par <strong>Contabo GmbH</strong> - Aschauer Straße 32a, 81549 Munich, Allemagne.</p>
          <h3 className="text-white font-bold text-xl mt-8">Contact</h3>
          <p>Pour toute question, vous pouvez nous contacter via notre serveur Discord officiel ou à l'adresse email : <strong>jimmybcorpo@gmail.com</strong></p>
        </LegalSection>

        <div className="text-center text-gray-600 text-sm mt-20">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  )
}

export default Legal
