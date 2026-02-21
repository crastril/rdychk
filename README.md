# rdychk 🚀

**Real-time Group Readiness Check** - La solution ultime pour coordonner vos groupes en temps réel.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)

## ✨ Fonctionnalités Avancées

Une expérience de coordination complète et fluide :

- ⚡ **Synchronisation Temps Réel** - Voyez instantanément qui est prêt ou non.
- 🔐 **Authentification & Profils** - Connectez-vous pour conserver votre historique et personnaliser votre profil, ou rejoignez en tant qu'invité.
- 📍 **Gestion de Lieu** - Proposez un lieu de rendez-vous avec aperçu automatique (Open Graph) et lien Google Maps.
- ⏱️ **Minuteur Intelligent** - Indiquez "Prêt dans 5 min" avec un compte à rebours partagé en direct.
- 📅 **Propositions d'Horaires** - Suggérez une heure de rendez-vous directement depuis votre statut.
- 📜 **Historique des Groupes** - Retrouvez facilement tous les groupes que vous avez rejoints (nécessite un compte).
- 🌓 **Mode Sombre/Clair** - Une interface soignée qui s'adapte à vos préférences.
- 📱 **100% Responsive** - Parfait sur mobile comme sur desktop.
- 🎉 **Célébration** - Confettis automatiques quand tout le monde est prêt !

## 🎬 Démo Rapide

1. **Créez un groupe** en un clic.
2. **Partagez le lien** unique ou le QR Code.
3. Les membres rejoignent et **indiquent leur statut** (Prêt / Pas prêt / Minuteur).
4. **Visualisez la progression** globale en temps réel.

## 🚀 Installation

### Prérequis

- Node.js 20+
- Un compte [Supabase](https://supabase.com) gratuit

### 1. Cloner le projet

```bash
git clone https://github.com/VOTRE_USERNAME/rdychk.git
cd rdychk
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration Supabase

1. Créez un nouveau projet sur [supabase.com](https://supabase.com).
2. Allez dans l'éditeur SQL de votre projet Supabase.
3. **Important :** Exécutez les scripts SQL fournis dans le dossier `supabase/` **dans l'ordre suivant** :

   1. `supabase/schema.sql` (Structure de base)
   2. `supabase_migration.sql` (Ajout des fonctionnalités avancées : profils, minuteurs, lieux...)
   3. `fix_history_rls.sql` (Correction des permissions pour l'historique)

4. Récupérez vos clés API (URL et Anon Key) dans les paramètres du projet Supabase.

### 4. Variables d'Environnement

Copiez le fichier d'exemple et configurez vos clés :

```bash
cp .env.local.example .env.local
```

Modifiez `.env.local` avec vos informations :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir l'application.

## 📂 Structure du Projet

L'architecture suit les bonnes pratiques Next.js 14+ (App Router) :

```
rdychk/
├── app/
│   ├── group/[slug]/    # Page dynamique de groupe
│   ├── api/og/          # Génération d'images Open Graph
│   └── page.tsx         # Page d'accueil
├── components/
│   ├── ui/              # Composants réutilisables (Shadcn UI)
│   ├── MemberList.tsx   # Liste des membres en temps réel
│   ├── TimerPicker.tsx  # Sélecteur de minuteur
│   ├── JoinModal.tsx    # Modal de connexion/inscription
│   └── ...              # Autres composants métier
├── lib/
│   ├── supabase.ts      # Client Supabase configuré
│   └── utils.ts         # Utilitaires divers
├── supabase/            # Scripts de migration SQL
└── types/               # Définitions TypeScript
```

## 🛠️ Stack Technique

- **Framework** : [Next.js 16](https://nextjs.org) (App Router)
- **Langage** : [TypeScript](https://www.typescriptlang.org)
- **UI** : [React 19](https://react.dev), [TailwindCSS 4](https://tailwindcss.com), [Shadcn UI](https://ui.shadcn.com)
- **Backend/DB** : [Supabase](https://supabase.com) (PostgreSQL, Auth, Realtime)
- **Icônes** : [Lucide React](https://lucide.dev)

## 🎯 Cas d'Usage

Idéal pour synchroniser des groupes dans de nombreuses situations :
- 🎮 **Gaming** : "Qui est prêt pour la ranked ?"
- 🍕 **Repas** : "On commande quand tout le monde a choisi."
- 🚗 **Départ** : "On part dès que tout le monde est dans la voiture."
- 🏢 **Réunions** : "On commence quand tout le monde est connecté."

## 🤝 Contribution

Les contributions sont les bienvenues !
1. Forkez le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

---

**Astuce** : Installez l'application en tant que PWA sur votre mobile pour un accès encore plus rapide !
