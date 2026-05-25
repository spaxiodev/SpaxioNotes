import type { Metadata } from "next";

import LegalPage from "@/components/legal-page";
import { getSiteUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Conditions de Spaxio Assistant pour notes IA, calendrier IA, rappels IA, capture vocale, abonnements, annulation et droits des consommateurs du Quebec.",
  alternates: {
    canonical: "/fr/conditions",
    languages: {
      en: "/terms",
      fr: "/fr/conditions",
      "x-default": "/terms",
    },
  },
};

const sections = [
  {
    title: "Entente",
    body:
      "Les presentes conditions regissent l'acces a Spaxio Assistant, une application Web pour notes, taches, rappels, planification de calendrier, dossiers partages, fichiers, capture vocale et fonctions d'espace de travail assistees par IA. En creant un compte, en utilisant l'application ou en achetant un abonnement, vous acceptez ces conditions. Pour la creation d'un compte, l'acceptation est demandee avant l'inscription.",
  },
  {
    title: "Fournisseur du service et contact",
    body:
      "Spaxio Assistant est fourni par l'exploitant de l'application Spaxio Assistant. Les demandes legales, de confidentialite et de soutien peuvent etre envoyees a privacy@spaxio.app.",
  },
  {
    title: "Comptes",
    items: [
      "Vous devez fournir des renseignements exacts et proteger vos identifiants.",
      "Vous etes responsable de l'activite de votre compte et du contenu que vous ajoutez.",
      "Vous ne pouvez pas partager l'acces d'une maniere qui compromet la vie privee d'une autre personne ou la securite du service.",
      "Spaxio Assistant peut suspendre ou fermer les comptes qui abusent du service, creent un risque de securite ou violent ces conditions.",
    ],
  },
  {
    title: "Forfaits, prix et paiement",
    items: [
      "Spaxio Assistant offre un forfait gratuit et un abonnement Pro. Le prix Pro mensuel standard indique dans l'application est de 15 $ CA par mois, et une option annuelle peut etre offerte, sauf si Stripe Checkout affiche un autre prix en vigueur.",
      "Les comptes admissibles par invitation peuvent obtenir Pro a 10 $ CA par mois pour un mois de parrainage tant que cette promotion est disponible et configuree.",
      "Les prix sont en dollars canadiens, sauf indication contraire dans Stripe Checkout. Les taxes applicables, s'il y en a, sont affichees ou percues par Stripe.",
      "Les paiements, factures, modes de paiement, renouvellements et echecs de paiement sont traites par Stripe.",
    ],
  },
  {
    title: "Informations avant achat",
    items: [
      "Avant un achat, l'application ou Stripe Checkout doit afficher les caracteristiques essentielles du service, le prix, la devise, les taxes applicables, la periodicite, les frais recurrents et les conditions d'annulation.",
      "Les contrats conclus a distance avec des consommateurs quebecois peuvent donner des droits particuliers, y compris des exigences d'information, d'annulation ou de resolution prevues par les lois applicables.",
      "Les communications commerciales, pages de commande et documents contractuels destines au Quebec doivent etre disponibles en francais sur des conditions au moins aussi favorables.",
    ],
  },
  {
    title: "Regles du rabais d'invitation",
    items: [
      "Chaque code d'invitation peut etre utilise par un nouveau compte. Apres une inscription reussie, ce code est considere comme utilise et la personne qui invite recoit un nouveau lien.",
      "Lorsqu'un ami s'inscrit avec votre lien, votre compte devient admissible au prix Pro de 10 $ CA pour le premier mois de parrainage. Pour conserver le prix mensuel de 10 $ CA, vous devez inviter un nouvel ami chaque mois.",
      "L'ami qui s'inscrit ne recoit pas le prix de 10 $ CA grace a votre invitation. Il commence au prix Pro standard de 15 $ CA, sauf s'il invite quelqu'un avec son propre lien.",
    ],
  },
  {
    title: "Renouvellement et annulation",
    body:
      "Les abonnements Pro se renouvellent chaque mois ou chaque annee, selon l'intervalle choisi au paiement, jusqu'a annulation. Vous pouvez gerer ou annuler un abonnement Pro depuis l'ecran de facturation de l'application au moyen du portail Stripe. L'annulation met fin aux renouvellements futurs, mais ne rembourse pas automatiquement les periodes deja payees, sauf si la loi l'exige ou si les conditions de facturation de Stripe ou Spaxio Assistant le prevoient. Ces conditions ne limitent pas vos droits imperatifs de consommateur, y compris les droits pouvant s'appliquer aux contrats conclus a distance au Quebec.",
  },
  {
    title: "Fonctions IA et vocales",
    items: [
      "La capture IA peut transformer du texte ou de la parole en notes, taches, calendriers, rappels, resumes et reponses.",
      "La capture vocale depend de la reconnaissance vocale du navigateur et peut ne pas fonctionner dans tous les navigateurs ou toutes les langues.",
      "Les resultats IA ou vocaux peuvent etre incomplets, inexacts ou inadaptes a votre situation. Verifiez-les avant de vous y fier.",
      "Spaxio Assistant est un outil de productivite et ne fournit pas de conseils juridiques, medicaux, financiers, academiques ou professionnels.",
    ],
  },
  {
    title: "Votre contenu",
    body:
      "Vous conservez la propriete des notes, prompts, fichiers, rappels, calendriers et autres contenus que vous ajoutez. Vous accordez a Spaxio Assistant les droits limites necessaires pour heberger, traiter, afficher, sauvegarder, transmettre et analyser ce contenu afin de fournir le service, y compris les fonctions IA que vous choisissez d'utiliser.",
  },
  {
    title: "Utilisation acceptable",
    items: [
      "Ne televersez pas de contenu illegal, de logiciels malveillants, d'identifiants que vous n'avez pas le droit de conserver ou de contenu portant atteinte aux droits d'autrui.",
      "N'utilisez pas Spaxio Assistant pour harceler, envoyer du pourriel, surveiller une personne ou prendre des decisions automatisees qui touchent illegalement autrui.",
      "Ne tentez pas de contourner l'authentification, les limites, les controles de paiement, les controles de stockage ou les protections de securite.",
      "Ne faites pas d'ingenierie inverse du service sauf si une loi applicable vous donne un droit non renoncable de le faire.",
    ],
  },
  {
    title: "Disponibilite et changements",
    body:
      "Spaxio Assistant peut modifier, ajouter ou retirer des fonctions, y compris les fournisseurs IA, la prise en charge vocale du navigateur, les limites de stockage, les caracteristiques des forfaits et les flux de facturation. Spaxio Assistant peut interrompre le service pour maintenance, securite, pannes de fournisseurs ou evenements hors de son controle raisonnable. Pour les contrats de service a duree indeterminee auxquels la loi quebecoise s'applique, les changements importants seront traites de la maniere exigee par la loi applicable.",
  },
  {
    title: "Confidentialite",
    body:
      "L'utilisation de Spaxio Assistant est aussi regie par la Politique de confidentialite. Elle explique les donnees de compte, le contenu de l'espace de travail, les prompts IA, les donnees de facturation, les fournisseurs, la conservation, la securite, les cookies, le consentement et les droits en matiere de vie privee au Quebec.",
  },
  {
    title: "Suppression du compte",
    body:
      "Vous pouvez demander ou declencher la suppression du compte dans l'application lorsque disponible. La suppression du compte retire les donnees d'espace de travail sauvegardees controlees par Spaxio Assistant et annule les abonnements Stripe actifs lorsque configure. Certains dossiers de facturation, taxes, securite, litiges, sauvegardes et conformite legale peuvent etre conserves comme la loi le permet ou l'exige.",
  },
  {
    title: "Limites de responsabilite",
    body:
      "Dans la mesure permise par la loi applicable, Spaxio Assistant est fourni tel quel et selon sa disponibilite. Spaxio Assistant n'est pas responsable des dommages indirects, accessoires, speciaux, consecutifs, exemplaires ou punitifs, ni des pertes de profits, donnees ou achalandage. Rien dans ces conditions n'exclut les garanties legales ou responsabilites qui ne peuvent etre exclues en vertu des lois quebecoises ou autres lois de protection du consommateur applicables.",
  },
  {
    title: "Droit applicable",
    body:
      "Ces conditions sont regies par les lois du Quebec et les lois federales du Canada qui s'y appliquent, sans limiter les droits imperatifs de protection du consommateur disponibles dans votre lieu de residence.",
  },
  {
    title: "Langue francaise",
    body:
      "Ces conditions sont fournies en francais pour le Quebec. Une version anglaise est disponible a /terms, mais la version francaise est la version principale pour les utilisateurs quebecois lorsque la loi l'exige. Si vous etes un consommateur quebecois, vous pouvez communiquer avec Spaxio Assistant en francais.",
  },
];

export default function ConditionsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Conditions d'utilisation",
    url: `${getSiteUrl()}/fr/conditions`,
    inLanguage: "fr-CA",
    isPartOf: { "@type": "WebSite", name: "Spaxio Assistant", url: getSiteUrl() },
    description:
      "Conditions de Spaxio Assistant pour notes IA, calendrier IA, rappels IA, capture vocale, abonnements, annulation et droits des consommateurs du Quebec.",
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LegalPage
        eyebrow="Conditions"
        homeHref="/fr"
        intro="Ces conditions expliquent les regles d'utilisation de Spaxio Assistant, y compris les comptes, abonnements, fonctions IA, capture vocale, calendriers, rappels et responsabilites liees au contenu."
        languageLinks={[{ href: "/terms", hrefLang: "en", label: "English" }]}
        navLinks={[
          { href: "/fr/confidentialite", label: "Confidentialite" },
          { href: "/fr/conditions", label: "Conditions" },
        ]}
        sections={sections}
        tagline="Espace de travail IA"
        title="Conditions d'utilisation"
        updated="24 mai 2026"
        updatedLabel="Derniere mise a jour"
      />
    </>
  );
}
