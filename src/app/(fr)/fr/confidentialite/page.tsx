import type { Metadata } from "next";

import LegalPage from "@/components/legal-page";
import { getSiteUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "Politique de confidentialite",
  description:
    "Politique de confidentialite de Spaxio Assistant pour notes IA, calendrier IA, rappels IA, capture vocale, facturation et transparence au Quebec.",
  alternates: {
    canonical: "/fr/confidentialite",
    languages: {
      en: "/privacy",
      fr: "/fr/confidentialite",
      "x-default": "/privacy",
    },
  },
};

const sections = [
  {
    title: "Responsable de la protection des renseignements personnels",
    body:
      "Spaxio Assistant est responsable des renseignements personnels traites par l'application. La personne responsable de la protection des renseignements personnels peut etre jointe a privacy@spaxio.app.",
  },
  {
    title: "Renseignements recueillis",
    items: [
      "Renseignements de compte, y compris l'adresse courriel, les donnees d'authentification traitees par Supabase, le nom de profil, le domaine d'attention, le code d'invitation et l'etat de l'abonnement.",
      "Contenu de l'espace de travail, y compris notes, transcriptions vocales, fichiers televerses, taches, rappels, elements de calendrier, dossiers partages, collaborateurs et activite de notification.",
      "Contenu des demandes IA lorsque vous utilisez la capture ou la recherche IA, y compris le prompt et un resume limite de l'espace de travail necessaire pour creer des notes, calendriers, rappels et reponses.",
      "Donnees de facturation necessaires aux abonnements Pro, y compris identifiants client Stripe, identifiants d'abonnement, etat du paiement et admissibilite aux invitations.",
      "Donnees techniques comme les cookies, identifiants de session, metadonnees d'appareil ou navigateur, journaux de securite et stockage local du navigateur lorsque Supabase n'est pas configure.",
    ],
  },
  {
    title: "Technologies, cookies et consentement",
    items: [
      "Les cookies et le stockage local strictement necessaires servent a maintenir la session, proteger le compte, memoriser le consentement et fournir les fonctions demandees.",
      "Les fonctions d'identification, de localisation ou de profilage non essentielles ne sont pas activees par defaut.",
      "Si Spaxio Assistant ajoute des mesures analytiques, publicitaires, de localisation ou de profilage non essentielles, elles devront etre presentees clairement et activees seulement apres votre consentement.",
      "Vous pouvez retirer ou modifier votre consentement aux usages non essentiels en supprimant le choix enregistre dans votre navigateur ou en ecrivant a privacy@spaxio.app.",
    ],
  },
  {
    title: "Finalites d'utilisation",
    items: [
      "Creer et securiser les comptes, authentifier les utilisateurs et maintenir les sessions.",
      "Sauvegarder, synchroniser, rechercher et afficher les notes, fichiers, taches, calendriers, rappels, dossiers partages et preferences.",
      "Transformer le texte ou la parole en notes IA, entrees de calendrier IA, rappels IA et suggestions de taches.",
      "Traiter les abonnements, annulations, factures, invitations et demandes de soutien en matiere de facturation au moyen de Stripe.",
      "Envoyer les courriels demandes pour le compte, le mot de passe et les rappels.",
      "Proteger le service, enqueter sur les erreurs, prevenir les abus, respecter la loi et repondre aux demandes de confidentialite.",
    ],
  },
  {
    title: "Capture vocale et traitement IA",
    body:
      "La capture vocale utilise la reconnaissance vocale du navigateur lorsqu'elle est disponible. Spaxio Assistant conserve la transcription comme contenu de l'espace de travail seulement lorsque vous la soumettez. Si les fonctions IA sont configurees, les prompts et un contexte compact de l'espace de travail sont transmis au fournisseur IA afin de generer des notes, rappels, elements de calendrier, taches et reponses. Les resultats IA peuvent etre inexacts et doivent etre verifies.",
  },
  {
    title: "Fournisseurs et transferts hors Quebec",
    body:
      "Spaxio Assistant peut utiliser des fournisseurs comme Supabase pour l'authentification, la base de donnees, le stockage et certains flux de courriel; Stripe pour les paiements; Anthropic pour le traitement IA configure; des fournisseurs SMTP/courriel pour les rappels; et des fournisseurs d'hebergement comme Vercel. Ces fournisseurs peuvent traiter des renseignements hors du Quebec ou du Canada. Lorsque requis, Spaxio Assistant doit evaluer les facteurs relatifs a la vie privee et limiter les renseignements transmis a ce qui est necessaire au service.",
  },
  {
    title: "Consentement et choix",
    items: [
      "Vous choisissez les notes, fichiers, rappels, calendriers, collaborateurs et prompts que vous ajoutez.",
      "Vous pouvez desactiver la capture vocale, eviter de televerser des fichiers et choisir de ne pas utiliser les prompts IA.",
      "Les consentements demandes doivent etre manifestes, libres, eclaires, donnes a des fins precises et demandes separement lorsque la loi l'exige.",
      "Vous pouvez retirer votre consentement aux utilisations non essentielles en modifiant vos reglages, en supprimant du contenu, en supprimant votre compte ou en ecrivant a privacy@spaxio.app.",
      "N'ajoutez pas de renseignements concernant une autre personne sans avoir le droit de le faire.",
    ],
  },
  {
    title: "Conservation et suppression",
    body:
      "Le contenu de l'espace de travail est conserve pendant que votre compte est actif ou pendant que le stockage local demeure sur votre appareil. Vous pouvez supprimer votre compte dans l'application; cela supprime les donnees sauvegardees controlees par Spaxio Assistant et annule les abonnements Stripe actifs lorsque cette fonction est configuree. Certains dossiers peuvent etre conserves pour la securite, la prevention de la fraude, la facturation, les taxes, les litiges, les sauvegardes ou la conformite legale.",
  },
  {
    title: "Securite et incidents",
    body:
      "Spaxio Assistant utilise la securite au niveau des lignes de Supabase, des politiques de stockage prive, des cookies securises, HTTPS en production et des en-tetes de securite. Aucun service en ligne ne peut garantir une securite absolue. Si un incident de confidentialite presente un risque de prejudice serieux, Spaxio Assistant evaluera l'incident, tiendra les registres requis et avisera les personnes concernees et les autorites quebecoises lorsque requis.",
  },
  {
    title: "Vos droits",
    items: [
      "Vous pouvez demander l'acces aux renseignements personnels que Spaxio Assistant detient a votre sujet.",
      "Vous pouvez demander la rectification de renseignements inexacts, incomplets ou equivoques.",
      "Vous pouvez demander la suppression, le retrait du consentement ou la fermeture du compte lorsque cela s'applique.",
      "Vous pouvez demander comment un traitement automatise assiste par IA a ete utilise pour une decision si Spaxio Assistant l'utilise pour rendre une decision vous concernant.",
      "Spaxio Assistant vise a repondre par ecrit aux demandes d'acces et de rectification dans les 30 jours lorsque la loi quebecoise applicable l'exige.",
    ],
  },
  {
    title: "Enfants",
    body:
      "Spaxio Assistant ne s'adresse pas aux enfants de moins de 14 ans. Ne creez pas de compte et ne soumettez pas de renseignements personnels concernant un enfant de moins de 14 ans, sauf si un parent ou tuteur a fourni un consentement valide et que l'utilisation est permise par la loi.",
  },
  {
    title: "Contact et plaintes",
    body:
      "Envoyez les demandes ou plaintes a privacy@spaxio.app. Indiquez l'adresse courriel du compte et assez de details pour identifier la demande. Si la reponse ne vous satisfait pas, vous pouvez contacter la Commission d'acces a l'information du Quebec ou toute autre autorite competente.",
  },
  {
    title: "Langue",
    body:
      "Cette politique est fournie en francais pour le Quebec. Une traduction anglaise peut etre disponible, mais la version francaise est la version principale pour les utilisateurs quebecois lorsque la loi l'exige.",
  },
];

export default function ConfidentialitePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Politique de confidentialite",
    url: `${getSiteUrl()}/fr/confidentialite`,
    inLanguage: "fr-CA",
    isPartOf: { "@type": "WebSite", name: "Spaxio Assistant", url: getSiteUrl() },
    description:
      "Politique de confidentialite de Spaxio Assistant pour notes IA, calendrier IA, rappels IA, capture vocale, facturation et transparence au Quebec.",
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LegalPage
        eyebrow="Confidentialite"
        homeHref="/fr"
        intro="Cette politique explique comment Spaxio Assistant traite les renseignements personnels pour les notes IA, la capture vocale, les rappels, le calendrier, la facturation et la gestion de compte."
        languageLinks={[{ href: "/privacy", hrefLang: "en", label: "English" }]}
        navLinks={[
          { href: "/fr/confidentialite", label: "Confidentialite" },
          { href: "/fr/conditions", label: "Conditions" },
        ]}
        sections={sections}
        tagline="Espace de travail IA"
        title="Politique de confidentialite"
        updated="24 mai 2026"
        updatedLabel="Derniere mise a jour"
      />
    </>
  );
}
