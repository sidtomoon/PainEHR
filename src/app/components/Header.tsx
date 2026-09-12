import Link from 'next/link';
import { signOut } from '@/app/actions';

export function Header() {
  return (
    <div className="sticky top-0 z-10 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patients" className="font-semibold leading-tight hover:text-teal-300 transition">PainEHR</Link>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/patients" className="text-slate-300 hover:text-white transition font-medium">patients</Link>
            <Link href="/calendar" className="text-teal-400 hover:text-teal-300 transition font-medium flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              calendar
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/patients/export" className="text-slate-400 hover:text-white text-xs">export</Link>
          <Link href="/announcements" className="text-slate-400 hover:text-white text-xs">announcements</Link>
          <form action={signOut}>
            <button className="text-slate-400 hover:text-white text-xs">sign out</button>
          </form>
        </div>
      </div>
    </div>
  );
}
