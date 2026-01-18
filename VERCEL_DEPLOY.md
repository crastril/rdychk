# Guide de Déploiement Vercel pour rdychk

## Erreur : "Build failed - npm run build exited with 1"

Cette erreur survient lorsque les variables d'environnement Supabase ne sont pas configurées dans Vercel.

## Solution : Configuration des Variables d'Environnement

### Étape 1 : Accéder aux Paramètres du Projet

1. Allez sur [vercel.com](https://vercel.com)
2. Ouvrez votre projet `rdychk`
3. Cliquez sur **Settings** (Paramètres)
4. Dans le menu de gauche, cliquez sur **Environment Variables**

### Étape 2 : Ajouter les Variables

Ajoutez les deux variables suivantes :

#### Variable 1 : NEXT_PUBLIC_SUPABASE_URL
- **Name** : `NEXT_PUBLIC_SUPABASE_URL`
- **Value** : `https://uxbysuticqecwovyzten.supabase.co`
- **Environment** : Cochez `Production`, `Preview`, et `Development`

#### Variable 2 : NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value** : `sb_publishable_LVEIuczHMaEw0ILbiSsRpg_Ami4Dinu`
- **Environment** : Cochez `Production`, `Preview`, et `Development`

### Étape 3 : Redéployer

1. Retournez dans l'onglet **Deployments**
2. Trouvez le dernier déploiement échoué
3. Cliquez sur les `...` (trois points) à droite
4. Sélectionnez **Redeploy**
5. Confirmez le redéploiement

OU

1. Allez dans l'onglet **Deployments**
2. Cliquez sur le bouton **Redeploy** en haut à droite

## Vérification

Le build devrait maintenant réussir ! Vous verrez :

```
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

## Alternative : Configuration via Interface lors du déploiement

Si vous n'avez pas encore déployé, lors de l'import depuis GitHub :

1. Après avoir sélectionné le repository
2. Avant de cliquer "Deploy"
3. Cliquez sur **Environment Variables** pour les déplier
4. Ajoutez les deux variables mentionnées ci-dessus
5. Cliquez sur **Deploy**

## Commande pour Tester Localement

Pour vérifier que tout fonctionne avant de déployer :

\`\`\`bash
npm run build
\`\`\`

Cette commande doit réussir sans erreur.

## Notes Importantes

- ⚠️ Les variables `NEXT_PUBLIC_*` sont exposées au client (navigateur)
- ✅ C'est normal et sécurisé pour Supabase (ce sont des clés publiques)
- 🔒 La sécurité est gérée par les Row Level Security (RLS) policies dans Supabase

## Besoin d'Aide ?

Si le problème persiste :
1. Vérifiez que les variables sont bien sauvegardées
2. Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
3. Essayez de supprimer et recréer les variables
4. Contactez le support Vercel si nécessaire
