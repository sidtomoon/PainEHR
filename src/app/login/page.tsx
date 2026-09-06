'use client';

import { useActionState } from 'react';
import { requestCode, verifyCode } from './actions';

export default function LoginPage() {
  const [requestState, requestAction, requestPending] = useActionState(requestCode, null);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyCode, null);

  const email = verifyState?.email ?? (requestState?.status === 'sent' ? requestState.email : null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6">
        <h1 className="text-lg font-semibold text-slate-800 mb-1">PainEHR</h1>

        {!email ? (
          <>
            <p className="text-xs text-slate-400 mb-4">Sign in with a one-time code — no password needed.</p>
            <form action={requestAction} className="space-y-3">
              <input
                name="email"
                type="email"
                required
                defaultValue=""
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={requestPending}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium"
              >
                {requestPending ? 'Sending…' : 'Send code'}
              </button>
            </form>
            {requestState?.status === 'error' && (
              <p className="text-xs mt-3 text-rose-700">{requestState.message}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-4">Enter the code sent to {email}.</p>
            <form action={verifyAction} className="space-y-3">
              <input type="hidden" name="email" value={email} />
              <input
                name="token"
                required
                inputMode="numeric"
                autoFocus
                placeholder="123456"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={verifyPending}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium"
              >
                {verifyPending ? 'Verifying…' : 'Sign in'}
              </button>
            </form>
            {verifyState?.status === 'error' && (
              <p className="text-xs mt-3 text-rose-700">{verifyState.message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
