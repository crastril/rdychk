import CreateGroupForm from '@/components/CreateGroupForm';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="flex flex-col items-center text-center space-y-8 max-w-md w-full animate-scale-in">
        {/* Logo/Icon */}
        <div className="text-8xl mb-4 animate-bounce-in">
          🚀
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-6xl md:text-7xl font-extrabold text-white tracking-tight">
            rdychk
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium px-4">
            Qui est prêt ? <br />
            Vérifiez en <span className="text-yellow-300 font-bold">temps réel</span> ! ⚡
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full glass-strong rounded-3xl p-8 shadow-2xl">
          <CreateGroupForm />
        </div>

        {/* Footer Info */}
        <p className="text-white/60 text-sm px-4">
          Créez un groupe, partagez le lien, et synchronisez-vous instantanément
        </p>
      </main>
    </div>
  );
}
