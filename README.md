# rdychk 🚀

**Real-time Group Readiness Check** - Une application web minimaliste pour vérifier en temps réel qui est prêt dans un groupe.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)

## ✨ Fonctionnalités

- 🎯 **Création de groupe** instantanée avec URL unique
- 👥 **Multi-utilisateurs** - Rejoignez avec votre prénom
- ⚡ **Temps réel** - Synchronisation instantanée via Supabase
- ✅ **Toggle de statut** - Indiquez si vous êtes prêt d'un simple clic
- 📊 **Compteur dynamique** - Suivez combien de personnes sont prêtes
- 🎉 **Célébration automatique** quand tout le monde est prêt
- 📱 **Responsive** - Fonctionne sur tous les appareils
- 🔒 **Sans authentification** - Pas besoin de compte

## 🎬 Démo

Créez un groupe, partagez le lien avec vos amis, et voyez en temps réel qui est prêt !

## 🚀 Installation

### Prérequis

- Node.js 20+
- Un compte Supabase gratuit

### 1. Cloner le repository

\`\`\`bash
git clone https://github.com/VOTRE_USERNAME/rdychk.git
cd rdychk
\`\`\`

### 2. Installer les dépendances

\`\`\`bash
npm install
\`\`\`

### 3. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Copiez `.env.local.example` vers `.env.local`
3. Ajoutez vos credentials Supabase dans `.env.local` :

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
\`\`\`

### 4. Initialiser la base de données

Dans le SQL Editor de Supabase, exécutez le script `supabase/schema.sql` :

\`\`\`sql
-- Voir le fichier supabase/schema.sql pour le script complet
\`\`\`

### 5. Lancer l'application

\`\`\`bash
npm run dev
\`\`\`

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📂 Structure du Projet

\`\`\`
rdychk/
├── app/
│   ├── page.tsx                 # Page d'accueil
│   └── group/[slug]/
│       └── page.tsx             # Page dynamique du groupe
├── components/
│   ├── CreateGroupForm.tsx      # Formulaire création
│   ├── JoinModal.tsx            # Modal de jonction
│   ├── MemberList.tsx           # Liste temps réel
│   └── ReadyButton.tsx          # Bouton toggle
├── lib/
│   └── supabase.ts              # Client Supabase
├── types/
│   └── database.ts              # Types TypeScript
└── supabase/
    └── schema.sql               # Schéma de BDD
\`\`\`

## 🛠️ Technologies

- **[Next.js 16](https://nextjs.org)** - Framework React
- **[React 19](https://react.dev)** - Bibliothèque UI
- **[TypeScript](https://www.typescriptlang.org)** - Typage statique
- **[TailwindCSS 4](https://tailwindcss.com)** - Styling
- **[Supabase](https://supabase.com)** - Base de données PostgreSQL + Realtime

## 🎯 Cas d'Usage

Parfait pour :
- 🍕 Savoir qui est prêt pour commander à manger
- 🎮 Vérifier qui est prêt pour lancer une partie
- 🚗 Coordonner un départ en groupe
- 🎬 Organiser une soirée ciné
- 🏃 Partir pour un running collectif

## 📝 Utilisation

1. **Créez un groupe** sur la page d'accueil
2. **Partagez le lien** avec vos amis
3. Chacun **rejoint avec son prénom**
4. **Cliquez** sur le bouton pour indiquer votre statut
5. **Regardez** la liste se mettre à jour en temps réel !

## 🔐 Base de Données

### Tables Supabase

- **groups** : Stocke les groupes créés
  - `id`, `name`, `slug`, `created_at`

- **members** : Stocke les membres de chaque groupe
  - `id`, `group_id`, `name`, `is_ready`, `joined_at`, `updated_at`

### Row Level Security (RLS)

L'application utilise RLS pour permettre l'accès public sans authentification tout en sécurisant les données.

## 🚀 Déploiement

### Vercel (Recommandé)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/VOTRE_USERNAME/rdychk)

1. Connectez votre repository GitHub
2. Ajoutez les variables d'environnement
3. Déployez !

### Variables d'Environnement

N'oubliez pas de configurer :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- 🐛 Signaler des bugs
- 💡 Proposer des nouvelles fonctionnalités
- 🔧 Soumettre des pull requests

## 📄 Licence

MIT

## 👨‍💻 Auteur

Créé avec ❤️ pour simplifier la coordination en groupe.

---

**Astuce** : Ajoutez cette app à l'écran d'accueil de votre mobile pour un accès rapide !
\`\`\`

