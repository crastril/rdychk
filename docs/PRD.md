# Product Requirements Document (PRD) : ReadyCheck (rdychk)

## 1. Vision et Objectifs

**ReadyCheck (rdychk)** est une application web mobile-first conçue pour résoudre le problème classique de synchronisation d'un groupe d'amis ou de collègues avant une sortie (en personne) ou une session de jeu (en ligne).
L'objectif est d'éliminer la friction des messages constants du type "T'es prêt ?", "On se retrouve où ?" ou "Dans combien de temps ?" en centralisant le statut de chacun de manière visuelle et en temps réel.

## 2. Utilisateurs Cibles

- Groupes d'amis organisant des sorties réelles (bars, restaurants, événements).
- Groupes de joueurs (gamers) attendant que toute l'équipe soit disponible pour lancer une partie.
- Toute équipe cherchant à coordonner un départ commun de manière asynchrone sans spammer une messagerie.

## 3. Fonctionnalités Principales (Core Features)

### 3.1. Gestion des Groupes (Rooms)

- **Création Rapide :** Un utilisateur peut créer un groupe instantanément. Un groupe peut être désigné comme étant "En ligne" (Online) ou "En personne" (In Person).
- **Partage Facile :** Chaque groupe possède une URL unique (slug) partageable. Le partage peut se faire via un lien classique ou via un **Code QR** généré directement dans l'application.
- **Accès Sans Inscription (Guest Mode) :** Un utilisateur peut rejoindre un groupe simplement en entrant son prénom. L'application génère alors un accès par cookie sécurisé (HMAC) permettant de garder son statut actif sans avoir à créer de compte complet.
- **Conversion de Compte :** Si un utilisateur rejoint en tant qu'invité puis se connecte à son compte, sa session invité est automatiquement rattachée à son profil utilisateur officiel.

### 3.2. Système de Statut (Prêt / Pas Prêt)

- **Bouton d'État :** Un gros bouton interactif et engageant ("JE SUIS PRÊT !" / "PAS PRÊT") avec des retours haptiques sur mobile.
- **Mise à Jour en Temps Réel :** Grâce à Supabase Realtime, chaque changement de statut est reflété instantanément chez tous les autres membres du fichier sans rechargement de la page.
- **Compteur de Progression :** Une jauge visuelle indique la proportion de membres prêts par rapport au total (ex: 3/5 membres prêts).

### 3.3. Gestion du Temps

- **Chronomètre Induel (Timer) :** Un utilisateur non prêt peut indiquer un compte à rebours ("Prêt dans X minutes"). Le statut passe brièvement en "Bientôt Prêt" à l'expiration.
- **Proposition d'Heure Fixe :** Possibilité d'indiquer "Je serai prêt à 19h30".

### 3.4. Gestion du Lieu (Groupes "En Personne" Uniquement)

- **Proposition de Lieu :** Les membres peuvent proposer un lieu de rendez-vous avec un nom et un lien (ex: Google Maps).
- **Aperçu Visuel (Link Preview) :** Le lien est analysé côté serveur via un endpoint (`/api/og`) pour générer automatiquement une image, un titre et une description du lieu, créant une interface riche rappelant une "carte" (Card).
- **Système de Vote :** Les membres peuvent voter positivement (+1) ou négativement (-1) pour un lieu. Le score cumulé est mis à jour en temps réel.
- **Modification par l'Admin :** L'administrateur garde le contrôle exclusif sur la modification formelle du lieu.

### 3.5. Système de Rôles et Sécurité (Admin & Membres)

- **Rôles :** Le créateur du groupe est automatiquement désigné comme "Admin". Les autres sont "Membres". Une couronne 👑 couronne l'avatar de l'Admin.
- **Gestion des Membres (Manage) :** Un modale réservée à l'administratrice/administrateur permet de :
  - Exclure ("kicker") des membres.
  - Sauvegarder indéfiniment le noyau de sécurité.
- **Server Actions & RLS (Row Level Security) :**
  - La sécurité est assurée par des Server Actions Next.js qui vérifient le jeton cryptographique (`Hmac`) stocké dans un cookie `httpOnly` pour éviter toute manipulation des statuts inter-groupes.
  - Les modifications des profils, de statuts et des rôles outrepassent les manipulations directes par le navigateur.

### 3.6. Expérience Utilisateur et Tolérance aux Pannes

- **Offline Tolerance :** Détection native des baisses de réseau. L'interface affiche un bandeau "Hors ligne" ou "Synchronisation". Lorsque l'appareil sort de veille ou reconnecte au réseau, un *Smart Refresh* synchronise l'état avec la base de données afin d'éviter la désynchronisation de l'UI.
- **Skeleton Loaders :** Animations douces mimant la structure des données pendant leur chargement (au lieu d'un simple spinner), limitant les tressautements visuels sur terminaux lents.

---

## 4. Spécifications Techniques

### 4.1. Stack Technique

- **Framework :** Next.js 16 (App Router)
- **Langage :** TypeScript strict
- **Backend / Database :** Supabase (PostgreSQL)
- **Authentification :** Supabase Auth (Implicit Flow), couplé à des "Guest Sessions" internes basées sur des Cookies chiffrés.
- **Composants d'UI :** `shadcn/ui` (Tailwind CSS, Radix UI)
- **Déploiement :** Vercel

### 4.2. Base de Données (Schéma simplifié)

- **`groups`** : `id`, `slug`, `name`, `type`, `location` (JSON), `created_at`, `created_by`.
- **`members`** : `id`, `group_id`, `user_id` (nullable), `name`, `role` (admin/member), `is_ready`, `timer_end_time`, `proposed_time`, `joined_at`.
- **`location_votes`** : `id`, `group_id`, `member_id`, `vote` (int: 1 ou -1).
- **`profiles`** : Identités permanentes (`id`, `display_name`, `avatar_url`).

### 4.3. Sécurité

L'application requiert que les requêtes directes côté-client à la base de données pour toute opération d'écriture soient bloquées par des règles RLS (Row Level Security). Les écritures se font via `Server Actions` qui vérifient :

- L'intégrité de l'identité du visiteur via un Cookie signé (HMAC).
- L'appartenance effective du membre au groupe (empêchant l'édition à cross-tenant).

## 5. UI/UX & Design System

L'application cherche à être **Haut de gamme, Professionnelle et Claire** ("Premium & Clean").

- **Thème :** Priorité au Mode Sombre (Dark Mode imposant ou préférentiel), design "Hybrid Fintech".
- **Composants :** Formes géométriques harmonieuses avec des coins arrondis (border-radius), vastes zones fonctionnelles.
- **Feedback :** Vibrations du téléphone via l'API Navigator (Haptic feedback) lors des manipulations et animations modérées via CSS/Tailwind (Pulse, Slides).

## 6. Prochaines Étapes Envisagées

- Historique global des anciens groupes de l'utilisateur.
- Système avancé de "Contre-propositions" liées aux lieux.
- Personnalisation esthétique de la room avec des bannières basées sur le lieu.
