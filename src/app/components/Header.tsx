import Link from 'next/link';
import { signOut } from '@/app/actions';

export function Header() {
  return (
    <div className="sticky top-0 z-10 bg-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold leading-tight">PainEHR</div>
        <div className="flex items-center gap-3">
          <Link href="/announcements" className="text-slate-400 hover:text-white text-xs">announcements</Link>
          <form action={signOut}>
            <button className="text-slate-400 hover:text-white text-xs">sign out</button>
          </form>
        </div>
      </div>
    </div>
  );
}
