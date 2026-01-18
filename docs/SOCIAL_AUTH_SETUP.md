# Configuration des Connexions Sociales (Social Auth)

Pour permettre aux utilisateurs de se connecter via Google ou Apple, vous devez configurer chaque service séparément. Voici comment obtenir les "Client IDs" nécessaires pour Supabase.

---

## 1. Google Auth

### Étape 1 : Google Cloud Console
1.  Allez sur la [Google Cloud Console](https://console.cloud.google.com/).
2.  Créez un **Nouveau Projet** (ex: `rdychk-auth`).
3.  Dans le menu latéral, allez dans **APIs & Services > OAuth consent screen**.
    *   Choisissez **External**.
    *   Remplissez les informations obligatoires (Nom de l'app, email support, etc.).
    *   Pas besoin d'ajouter de "Scopes" particuliers pour l'instant.
    *   Ajoutez votre email dans les "Test users" si vous restez en mode test.
4.  Allez dans **Credentials** (Identifiants).
5.  Cliquez sur **Create Credentials > OAuth client ID**.
    *   **Application type**: Web application.
    *   **Authorized JavaScript origins**: `https://<votre-projet>.supabase.co` (L'URL de votre projet Supabase).
    *   **Authorized redirect URIs**: `https://<votre-projet>.supabase.co/auth/v1/callback` .
6.  Copiez le **Client ID** et le **Client Secret**.

### Étape 2 : Supabase
1.  Allez dans votre dashboard Supabase > **Authentication > Providers**.
2.  Activez **Google**.
3.  Collez le `Client ID` et `Client Secret`.
4.  Sauvegardez.

---

## 2. Apple Auth

*Note : Apple Auth nécessite un compte développeur Apple payant (99$/an).*

### Étape 1 : Apple Developer Portal
1.  Allez sur [developer.apple.com](https://developer.apple.com/account/).
2.  Allez dans **Certificates, Identifiers & Profiles**.
3.  **Identifiers** : Créez un App ID pour votre app (si ce n'est pas déjà fait).
4.  **Services IDs** : Créez un nouveau Service ID.
    *   Cochez "Sign In with Apple".
    *   Configurez le service : Ajoutez votre domaine (ex: `votre-site.vercel.app`) et l'URL de retour Supabase (`https://<votre-projet>.supabase.co/auth/v1/callback`).
5.  **Keys** : Créez une nouvelle clé privée.
    *   Cochez "Sign In with Apple".
    *   Téléchargez le fichier `.p8`.
    *   Notez le **Key ID** et votre **Team ID**.

### Étape 2 : Supabase
1.  Allez dans Supabase > **Authentication > Providers**.
2.  Activez **Apple**.
3.  Remplissez :
    *   **Client ID** : Le "Service ID" créé (ex `com.rdychk.web`).
    *   **Team ID** : (Depuis votre compte Apple).
    *   **Key ID** : (Depuis la section Keys).
    *   **Private Key** : Le contenu du fichier `.p8`.
4.  Sauvegardez.

---

## 3. URLs de Redirection

Assurez-vous que votre URL de site est bien configurée dans Supabase :
1.  Supabase > **Authentication > URL Configuration**.
2.  **Site URL** : `https://Votre-App-Vercel.app` (votre URL de production).
3.  **Redirect URLs** : Ajoutez `http://localhost:3000` pour tester en local.
