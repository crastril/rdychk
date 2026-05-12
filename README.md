# rdychk

Coordonne tes sorties avec tes amis — vote sur la date et le lieu, dis quand t'es prêt et partez ensemble.

**[rdychk.vercel.app](https://rdychk.vercel.app)**

---

## Ce que ça fait

- **Vote collectif** — chaque membre propose et vote pour une date et un lieu
- **Prêt / pas prêt** — un bouton par personne, tout le monde voit en temps réel qui est partant
- **Deux types de groupe** — sorties en personne ou sessions en ligne (jeux, etc.)
- **Partage facile** — lien direct, QR code, WhatsApp, Messenger, Instagram
- **Géolocalisation jour J** — en mode rendez-vous, suivi en direct de qui est en route et qui est arrivé
- **Historique** — retrouve tous les groupes que t'as rejoint

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Supabase** — base de données, auth, temps réel (WebSocket)
- **Tailwind CSS** + **Framer Motion**
- **Vercel** — déploiement continu depuis `main`

## Lancer en local

```bash
npm install
cp .env.example .env.local   # remplis les variables Supabase
npm run dev                  # http://localhost:3000
```

### Variables d'environnement requises

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=   # pour la recherche de lieux
```

## Design

Deux thèmes selon le type de groupe :

- **Néo-brutaliste** (sorties en personne) — bordures noires épaisses, ombres dures, typographie condensée bold
- **Cyberpunk** (sessions en ligne) — palette violette, monospace, effets glow
