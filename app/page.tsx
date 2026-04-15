import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'rdychk — Organisez vos sorties sans le chaos',
  description:
    'Créez un groupe, invitez vos amis, votez pour la date et le lieu. Fini les 50 messages pour savoir qui est prêt.',
  keywords: [
    'organisation sortie',
    'planifier sortie entre amis',
    'vote date groupe',
    'coordination groupe',
    'rdychk',
  ],
  openGraph: {
    title: 'rdychk — Organisez vos sorties sans le chaos',
    description:
      'Créez un groupe, invitez vos amis, votez pour la date et le lieu. Fini les 50 messages pour savoir qui est prêt.',
    siteName: 'rdychk',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'rdychk — Organisez vos sorties sans le chaos',
    description:
      'Créez un groupe, invitez vos amis, votez pour la date et le lieu. Fini les 50 messages pour savoir qui est prêt.',
  },
  alternates: {
    canonical: 'https://rdychk.xyz',
  },
};

export default function Page() {
  return <HomeClient />;
}
