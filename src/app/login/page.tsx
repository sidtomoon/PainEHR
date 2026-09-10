'use client';

import { useActionState } from 'react';
import { requestCode, verifyCode, devLogin } from './actions';

export default function LoginPage() {
  const [requestState, requestAction, requestPending] = useActionState(requestCode, null);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyCode, null);

  const email = verifyState?.email ?? (requestState?.status === 'sent' ? requestState.email : null);
  const actionLink = requestState?.status === 'sent' ? requestState.actionLink : null;
  const emailOtp = requestState?.status === 'sent' ? requestState.emailOtp : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-800 mb-1">PainEHR</h1>

        {!email ? (
          <>
            <p className="text-xs text-slate-400 mb-4">Sign in with a one-time code — no password needed.</p>

            {/* Quick 1-click dev login button for local testing */}
            <form action={devLogin} className="mb-4 pb-4 border-b border-slate-100">
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <span>⚡</span>
                <span>1-Click Login as Dr. Varun (Local Dev)</span>
              </button>
            </form>

            <form action={requestAction} className="space-y-3">
              <input
                name="email"
                type="email"
                required
                defaultValue="drvarunsinglapgi@gmail.com"
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={requestPending}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition"
              >
                {requestPending ? 'Sending…' : 'Send code'}
              </button>
            </form>
            {requestState?.status === 'error' && (
              <p className="text-xs mt-3 text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded">{requestState.message}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-3">Enter the code sent to {email}.</p>

            {actionLink && (
              <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800">
                <div className="font-medium mb-1">Local Testing Bypass:</div>
                <div className="mb-2">Your OTP code is: <strong className="font-mono text-sm tracking-wider">{emailOtp}</strong></div>
                <a
                  href={actionLink}
                  className="inline-block bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded font-medium text-xs transition"
                >
                  Direct 1-Click Login Link →
                </a>
              </div>
            )}

            <form action={verifyAction} className="space-y-3">
              <input type="hidden" name="email" value={email} />
              <input
                name="token"
                required
                inputMode="numeric"
                autoFocus
                defaultValue={emailOtp || ''}
                placeholder="123456"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={verifyPending}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition"
              >
                {verifyPending ? 'Verifying…' : 'Sign in'}
              </button>
            </form>
            {verifyState?.status === 'error' && (
              <p className="text-xs mt-3 text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded">{verifyState.message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
