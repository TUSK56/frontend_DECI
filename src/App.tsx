import { useAuth } from "./auth/AuthContext";
import { FirstLoginProfileModal } from "./components/FirstLoginProfileModal";
import DeciRemixApp from "./remix/DeciRemixApp";
import { RemixLoginPage } from "./remix/RemixLoginPage";

export default function App() {
  const { user, loading } = useAuth();
  const profileIncomplete = user?.profileCompleted === false;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-600">Loading…</div>
      </div>
    );
  }

  if (!user) return <RemixLoginPage />;

  if (profileIncomplete) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <p className="m-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Finish the security dialog to unlock the portal (one-time setup).
        </p>
        <div className="mx-auto max-w-3xl flex-1 rounded-2xl border border-dashed border-slate-200 bg-white/80 p-12 text-center text-slate-500">
          Your profile will be available after you set your work email and password.
        </div>
        <FirstLoginProfileModal />
      </div>
    );
  }

  return <DeciRemixApp />;
}
