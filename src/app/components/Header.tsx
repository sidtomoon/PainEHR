import Link from 'next/link';
import { signOut } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth-roles';

export async function Header() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="sticky top-0 z-10 bg-slate-900 text-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patients" className="font-semibold leading-tight hover:text-teal-300 transition">
            PainEHR
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/patients" className="text-slate-300 hover:text-white transition font-medium">
              patients
            </Link>
            <Link href="/calendar" className="text-teal-400 hover:text-teal-300 transition font-medium flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              calendar
            </Link>
            {isAdmin && (
              <>
                <Link href="/patients/export" className="text-slate-400 hover:text-white transition">
                  export
                </Link>
                <Link href="/staff" className="text-slate-400 hover:text-white transition">
                  staff
                </Link>
              </>
            )}
            <Link href="/announcements" className="text-slate-400 hover:text-white transition">
              announcements
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-teal-400' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300 font-medium">{user.displayName}</span>
              <span
                className={`text-[10px] uppercase font-bold px-1 rounded ${
                  isAdmin ? 'bg-teal-900 text-teal-300' : 'bg-amber-900 text-amber-300'
                }`}
              >
                {isAdmin ? 'Admin' : 'Data Entry'}
              </span>
            </div>
          )}
          <form action={signOut}>
            <button className="text-slate-400 hover:text-white text-xs">sign out</button>
          </form>
        </div>
      </div>
    </div>
  );
}
