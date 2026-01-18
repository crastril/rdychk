import CreateGroupForm from '@/components/CreateGroupForm';
import { Icons } from '@/components/Icons';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="flex flex-col items-center text-center space-y-8 max-w-md w-full animate-scale-in">
        {/* Logo/Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/30 mb-4 animate-bounce-in">
          <Icons.Rocket className="w-14 h-14 text-white" />
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-50 tracking-tight">
            rdychk
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-medium px-4">
            Qui est prêt ? <br />
            Vérifiez en <span className="text-emerald-400 font-bold">temps réel</span> !
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full glass-strong rounded-3xl p-8 shadow-2xl border-2 border-slate-600/50">
          <CreateGroupForm />
        </div>

        {/* Footer Info */}
        <p className="text-slate-400 text-sm px-4">
          Créez un groupe, partagez le lien, et synchronisez-vous instantanément
        </p>
      </main>
    </div>
  );
}
