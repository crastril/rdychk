import CreateGroupForm from '@/components/CreateGroupForm';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <main className="flex flex-col items-center text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900">
            rdychk
          </h1>
          <p className="text-xl text-gray-600 max-w-md">
            Créez un groupe et vérifiez en temps réel qui est prêt 🚀
          </p>
        </div>
        <CreateGroupForm />
      </main>
    </div>
  );
}
