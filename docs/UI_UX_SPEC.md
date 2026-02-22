# ReadyCheck (rdychk) - UI/UX & Design Specifications

Ce document est destiné à servir de base de travail pour un designer UX/UI (ou une IA spécialisée) afin de concevoir ou d'affiner l'interface de l'application web mobile-first **ReadyCheck**.

---

## 1. Vision du Produit

**Le problème :** Coordonner un groupe (amis pour une sortie, ou joueurs pour une partie en ligne) est chaotique. Les messages comme "T'es où ?", "T'es prêt ?", "On va où ?" se noient dans des fils de discussion WhatsApp ou Discord.
**La solution :** Une application web ultra-rapide, accessible via un simple lien sans inscription obligatoire, qui sert de "salle d'attente visuelle" (lobby).
**L'objectif UX :** L'application doit être **immédiate, satisfaisante à utiliser et libératrice**. L'utilisateur doit pouvoir ouvrir le lien, voir visuellement qui est prêt, cliquer sur un bouton géant "Je suis prêt", et refermer son téléphone en sachant que les autres seront notifiés.

## 2. Ambiance Globale & Direction Artistique (DA)

L'application vise une esthétique **Premium, Moderne et Professionnelle**.

* **Thème Principal :** "Hybrid Fintech" / "Premium Dark Mode". L'application doit donner une sensation de fiabilité et de technologie de pointe, similaire à des applications comme Stripe, Vercel ou Linear.
* **Palette de Couleurs (Suggestions) :**
  * **Fond :** Noir profond pur (`#000000`) ou un gris extrêmement foncé (`#09090B`) pour maximiser le contraste et économiser la batterie sur les écrans OLED.
  * **Surfaces/Cartes :** Gris très sombres légèrement transparents (Glassmorphism subtil) avec des bordures très fines et délicates (`border-white/10`).
  * **Accents (Prêt / Actif) :** Un vert électrique ou un bleu cyan vibrant pour signifier l'action positive ("Prêt") et attirer l'œil immédiatement.
  * **Accents (En attente) :** Des tons neutres (gris clair) ou subtilement chauds (orange/ambre discret) pour indiquer l'attente ou une action requise.
* **Typographie :** Linéaire, sans-serif, géométrique et lisible (ex: Inter, Roboto, Outfit, ou Geist). Utilisation forte du contraste de graisse (Bold pour les noms/titres, Regular/Light pour les détails).
* **Formes :** Des coins arrondis (border-radius généreux mais structurels, ex: `xl` ou `2xl` en Tailwind) pour adoucir le côté "tech" et rendre l'interface accueillante. Espace ("Whitespace") ample pour éviter la surcharge cognitive.
* **Micro-interactions & Feedback :** L'application doit sembler "vivante". Retours haptiques (vibrations) au toucher sur mobile, animations de transition fluides (Fade, Slide), et utilisation du "Skeleton loading" gracieux pour masquer les temps de latence matériels.

---

## 3. Fonctionnalités Clés et Parcours Utilisateur (User Flow)

L'écran principal d'un groupe (la "Room") est le cœur de l'application. Tout se passe sur cette page unique de type Dashboard mobile. L'application supporte deux types de groupes : **En Ligne** (pour les jeux/réunions virtuelles) et **En Personne** (sorties physiques).

### 3.1. L'Entrée (Onboarding / Guest Join)

* **Scénario :** Un utilisateur clique sur un lien partagé (ex: `rdychk.app/group/mon-super-groupe`).
* **UI :** Si l'utilisateur n'est pas reconnu (pas de cookie/session), une modale élégante ("JoinModal") bloque l'accès visuel complet au groupe (avec un effet de flou en arrière-plan).
* **UX :** L'utilisateur n'a qu'un seul champ à remplir : son **Prénom**. Il clique sur "Rejoindre" et entre immédiatement. Pas de mot de passe, pas de confirmation d'email. (L'app gère la sécurité par cookie en arrière-plan). L'interface doit lui rendre ce processus transparent et immédiat.

### 3.2. Le Header et le Compteur Global

* **Éléments :** En haut de l'écran, le titre du groupe cliquable/éditable, un bouton de partage simplifié, et surtout, un composant visuel critique : **La Jauge de Progression** (ProgressCounter).
* **UX/UI de la Jauge :** Elle doit montrer instantanément la proportion de membres prêts (ex: 3/5). Il faut privilégier un design circulaire ou une barre de progression très stylisée, potentiellement avec une lueur douce (Glow effect) et des transitions animées lorsque le nombre change (compteur qui roule de 3 à 4). C'est la première chose que l'on regarde en ouvrant l'app.

### 3.3. **LE BOUTON** (Statut Personnel)

* **Le cœur de l'interaction :** La carte de statut personnel. C'est l'élément interactif principal.
* **UI du Bouton :** Il doit être massif, clair, et satisfaisant à presser ("Thumb-friendly" sur mobile).
  * *État "Pas Prêt" :* Visuellement atténué mais appelant l'action. Texte : "Je suis prêt !".
  * *État "Prêt" :* Couleurs vibrantes (vert/cyan), lueur (glow). Texte : "Prêt" ou "En attente des autres...".
* **UX de Gestion du Temps (Time Management) :**
  * Sous ou autour du gros bouton central, des options secondaires permettent de nuancer "Pas prêt".
  * *Timer :* Boutons rapides "+5m", "+15m", "+30m". Lorsqu'un timer est actif, il s'affiche (idéalement avec un cercle de progression) et décompte visuellement.
  * *Heure Fixe :* Un petit `DatePicker` ou un simple input pour dire "Prêt vers 19h30".
  * La transition entre ces différents modes temporels et le "Je suis prêt" immédiat doit être fluide et ne pas surcharger la carte personnelle.

### 3.4. La Gestion du Lieu (Uniquement pour les groupes "En Personne")

* **Objectif :** Décider ou afficher simplement où tout le monde se retrouve.
* **UI de la Carte "Lieu" (LocationCard) :**
  * Si un lieu est défini avec un lien (ex: Google Maps), cette section **doit ressembler à un "Link Preview" enrichi** (style iMessage ou Twitter). Elle doit extraire et afficher (si possible) une image de couverture de l'endroit, son nom, et son adresse.
  * Si aucun lien, un texte clair et imposant.
* **Interaction de Vote :** Chaque membre peut donner son avis sur le lieu (pour inciter à la modification).
  * Boutons discrets "Pouce en l'air" / "Pouce en bas" (ou Upvote/Downvote à la Reddit) avec le score total affiché.
* **Modification :** Un bouton "Éditer" (souvent réservé à l'Admin ou à celui qui a suggéré) ouvre une modale (`EditLocationModal`) propre pour changer le nom ou coller une nouvelle URL.

### 3.5. La Liste des Membres (MemberList)

* **UI :** Une liste verticale sous forme de cartes d'identité minimalistes (avatars + noms) en bas du dashboard.
* **Information Statut :** Directement à côté de chaque nom, une pastille, un badge ou une icône indiquant leur statut en un coup d'œil.
  * Exemple : Pastille verte qui pulse = "Prêt".
  * Exemple : "15:00" en orange = "Timer actif, prêt dans 15 minutes".
  * Exemple : Pastille grise = "Pas prêt, pas de précision".
* **Signes distinctifs :** Le créateur du groupe (l'Admin) doit avoir une distinction visuelle subtile (ex: une petite icône couronne 👑 ou un badge discret "Admin").
* **UX Admin (Panneau de gestion) :** Si l'utilisateur en cours est l'Admin, l'interface lui donne accès à des fonctionnalités cachées (un composant `ManageGroupModal` ou des petits boutons "X" à côté des noms pour exclure un membre inactif).

### 3.6. Notifications Visuelles Asynchrones

* L'application utilise un système de `NotificationManager` (style Toasters / Snackbars en bas ou en haut de l'écran).
* Quand l'utilisateur n'a pas les yeux rivés sur "qui fait quoi", ces petits pop-ups élégants (flottants sur fond sombre) le préviennent (ex: "Alexandre est prêt !", "Le lieu a été mis à jour"). Ils doivent être non intrusifs et s'effacer d'eux-mêmes rapidement.

## 5. Arborescence & Détail des Écrans (Screen-by-Screen Breakdown)

L'application est délibérément minimaliste dans sa structure (Single Page Application paradigm). Voici la déclinaison exhaustive des écrans et de leurs états pour guider la conception des composants.

### 5.1. Écran d'Accueil (Home Page / Landing)

* **Objectif :** Accueillir l'utilisateur, expliquer la proposition de valeur en 3 secondes, et pousser à l'action principale : créer un groupe.
* **Éléments UI :**
  * **Header :** Logo minimaliste (ex: typographie "rdychk" avec un point cyan). Bouton d'avatar/connexion discret en haut à droite.
  * **Hero Section :** Un titre accrocheur (ex: "Arrêtez de demander *T'es prêt ?*"). Un sous-titre explicatif.
  * **Call-to-Action (CTA) Principal :** Un formulaire "CreateGroupForm" sous forme de grosse carte centrale.
    * *Input 1 :* Nom du groupe (ex: "Soirée Bar", "Raid WoW").
    * *Toggle/Tabs :* Choix entre "En Ligne" 🎮 et "En Personne" 📍.
    * *Bouton de soumission :* Large, contrasté, avec animation de chargement au clic.
  * **Footer :** Liens légaux simples, version de l'app.
* **États :**
  * *Visiteur non connecté :* Invite forte à créer un groupe à la volée.
  * *Visiteur connecté :* (Futur) Affichage d'une section "Groupes récents" (History) sous le CTA.

### 5.2. Modale de Connexion / Inscription (Social Auth)

* **Objectif :** Permettre de lier son identité à l'application de façon permanente.
* **Éléments UI :**
  * Modale (Dialog) centrée, fond très sombre avec un léger overlay (Backdrop blur) sur le reste de la page.
  * Bouton massif "Continuer avec Google".
  * Bouton massif "Continuer avec Discord".
* **États :**
  * *Loading :* Lorsqu'un bouton est cliqué, un spinner remplace l'icône du réseau social.

### 5.3. Écran du Groupe (The "Room" - Core View)

C'est la vue principale (`/group/[slug]`). Elle est conditionnée par l'authentification (Guest ou User).

#### 5.3.A. État 1 : La porte d'entrée (JoinModal - Accès Utilisateur Inconnu)

* **Objectif :** Bloquer l'accès aux données du groupe tant qu'un nom n'est pas fourni.
* **UI/Expérience :**
  * Le contenu du groupe (membres, timers) est visible en arrière-plan mais **fortement flouté** (blur-md) et désactivé.
  * Une modale non-fermable flotte au centre.
  * Titre : "Rejoindre [Nom du groupe]".
  * *Contenu :* Un simple champ de texte "Ton prénom ou pseudo" et un bouton "Go !".
  * *Sub-feature (Reclaim) :* Si l'appareil reconnaît d'anciennes sessions (Guest existant), la modale affiche des petits boutons "Rejoindre en tant que [Nom Précédent]" pour éviter de retaper.

#### 5.3.B. État 2 : Dashboard Principal (Mode Utilisateur Authentifié/Guest)

Une fois à l'intérieur, l'interface se divise en blocs fonctionnels verticaux empilés (Mobile) ou en grille (Desktop).

#### 1. Le Header & Résumé (Sticky ou Top)

* **Bouton Retour :** Icône flèche gauche discrète.
* **Titre du groupe & Sous-titre :** "Nom du groupe" et "X membres".
* **Bouton Partage (ShareMenu) :** Icône "Partager". Au clic, ouvre un menu déroulant ou bottom-sheet : "Copier le lien d'invitation", "Afficher le QR Code".
* **Bouton Paramètres (Admins uniquement) :** Icône roue crantée.
* **La Jauge (ProgressCounter) :** Un bloc très visuel. Ex: "3/5 Prêts". La barre de progression doit être épaisse, avec un fond gris foncé et la partie remplie en couleur d'accentuation (cyan/vert).

#### 2. La Carte de Statut Personnel (Your Status Card)

C'est le composant qui demande la meilleure UX.

* *Header de la carte :* "Ton Statut" + Nom de l'utilisateur + Bouton "Quitter le groupe" (délicat, couleur destructive/rouge foncé en hover).
* *Le cœur :* Le gros bouton "Statut" (`ReadyButton`).
  * **Condition "Pas Prêt" :** Le bouton dit "Je suis prêt !". Il a souvent l'air cliquable et invite à l'action.
  * **Condition "Prêt" :** Le bouton change drastiquement d'apparence. Il dit "Prêt", brille légèrement, et devient peut-être un bouton "Annuler" plus discret si on a cliqué par erreur.
* *Les Actions Temporelles (TimerPicker & TimeProposalModal) :*
  * Placées sous le bouton principal.
  * Boutons pilules courts : "+5m", "+15m".
  * Bouton "Proposer une heure" (ouvre une petite modale native avec un selecteur d'heure).
  * *Si un timer est actif :* L'UI temporelle se transforme pour afficher le décompte (ex: "Prêt dans 12:34") avec un bouton "Stop/Annuler" à côté.

#### 3. La Carte de Lieu (LocationCard) - Si le groupe est "En Personne"

* *Vide (Aucun lieu défini) :* Zone "Placeholder" vide avec contour en pointillés et bouton "Définir un lieu".
* *Remplie (Lieu défini) :*
  * Titre robuste (ex: "Le Bar du Coin").
  * Image d'aperçu générée si un lien web a été fourni.
  * Texte discret : "Proposé par [Nom]".
  * Ligne d'interaction : Bouton "👍 (Score)" et Bouton "👎".
* *Mode Édition (Admin/Auteur) :* Clic sur l'icône Crayon -> Ouvre la modale `EditLocationModal`.

#### 4. La Liste des Membres (MemberList)

* *Header :* Titre "Membres" + Icône groupe. Si Admin : Bouton "Gérer" à droite.
* *Liste de lignes (Rows) :* Chaque ligne représente un membre.
  * Avatar (généré à partir de la 1ère lettre du nom, avec une couleur déterministe basée sur le nom).
  * Nom. Si c'est l'utilisateur lui-même, mention "(Toi)". Si c'est l'Admin, icône 👑.
  * Indicateur de statut à droite :
    * ✅ (Vert) = Prêt.
    * ⏳ "15m" (Orange) = Timer.
    * 🕒 "19h30" (Gris/Bleu) = Heure proposée.
    * Rien/Gris = Pas prêt.

### 5.4. Modales Administratives (Admin Only)

#### Modale de Gestion du Groupe (GroupSettingsModal)

* Déclenchée via l'icône paramètre du Header.
* *Nom du groupe :* Champ texte modifiable.
* *Type de groupe :* Switch/Toggle (En Ligne <-> En Personne).
* Peut inclure à l'avenir la suppression totale du groupe (Bouton Danger Area).

#### Modale de Gestion des Membres (ManageGroupModal)

* Déclenchée via le bouton "Gérer" dans la liste des membres.
* Affiche une réplique de la MemberList, mais chaque ligne possède un bouton "Expulser" (Kick) avec une icône corbeille/croix rouge.
* Un clic sur expulser retire le membre de la base de données instantanément.

### 5.5. États Globaux & Edge Cases (Corner Cases)

* **Offline Mode (Perte de connexion) :** Le composant `ConnectionStatus` (en haut fixe) passe en orange/rouge avec "Hors ligne - Reconnexion...". Les boutons d'action (Prêt, Modifier) deviennent "disabled" ou "opacity-50" pour éviter des clics fantômes impossibles à résoudre avec le serveur.
* **Toast Notifications :** Coins inférieurs ou supérieurs (`NotificationManager`). Utilisées pour les événements passifs : "Machin a rejoint le groupe", "Le lieu a été mis à jour". Fond noir, bordure argent, texte blanc. Doit disparaître après 3 secondes.

---

## 6. Points Clés pour le Designer de l'Interface

1. **Mobile d'abord, Desktop ensuite :** Tout doit être pensé pour l'ergonomie du pouce. Les boutons d'action (Join, Ready, etc.) doivent idéalement se situer dans le tiers inférieur ou central de l'écran. Sur Desktop, le contenu de type mobile peut être centré dans une colonne max-w-2xl élégante.
2. **Affordance :** Ce qui est cliquable doit "paraître cliquable". Les états "Prêt" doivent se démarquer fortement par la couleur par rapport au reste de l'interface majoritairement grise sombre.
3. **Skeleton Screens :** Penser l'interface lorsqu'elle est "en cours de chargement réseau". Les composants principaux (Header, Carte de Statut, Carte de Lieu, Liste) doivent avoir des états de chargement stylisés (pulsations de blocs gris) pour que l'app paraisse instantanée.
4. **Transitions :** L'interface change beaucoup (quelqu'un vote, le compte à rebours défile, un membre s'ajoute). Utiliser de l'Auto-Animate (ex: un membre prêt remonte dans la liste, ou la barre de progression s'allonge en douceur). Les changements brusques génèrent de la fatigue visuelle.
5. **Accessibilité (A11y) :** Les contrastes texte/fond doivent être suffisants malgré le thème ultra-sombre. Les icônes (Lucide Icons recommandées pour s'aligner avec le code existant) doivent toujours être accompagnées d'explications contextuelles claires si elles prêtent à confusion.
