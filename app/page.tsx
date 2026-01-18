import CreateGroupForm from '@/components/CreateGroupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { AuthButton } from '@/components/auth-button';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <main className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold">
            rdychk
          </h1>
          <p className="text-lg text-muted-foreground">
            Sync Status, Instantly
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Créer un groupe</CardTitle>
            <CardDescription>
              Lancez un nouveau groupe et partagez le lien avec vos amis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateGroupForm />
          </CardContent>
        </Card>

        {/* Auth Button Area */}
        <div className="flex justify-center">
          <AuthButton />
        </div>
      </main>
    </div>
  );
}
