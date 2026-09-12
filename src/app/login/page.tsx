'use client';

import { useState, useActionState } from 'react';
import { requestCode, verifyCode, devLogin, devStaffLogin, signInWithPassword } from './actions';

export default function LoginPage() {
  const [tab, setTab] = useState<'admin' | 'staff'>('admin');

  // Admin OTP states
  const [requestState, requestAction, requestPending] = useActionState(requestCode, null);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyCode, null);

  // Staff Password state
  const [passwordState, passwordAction, passwordPending] = useActionState(signInWithPassword, null);

  const email = verifyState?.email ?? (requestState?.status === 'sent' ? requestState.email : null);
  const actionLink = requestState?.status === 'sent' ? requestState.actionLink : null;
  const emailOtp = requestState?.status === 'sent' ? requestState.emailOtp : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-8">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">PainEHR</h1>
            <p className="text-xs text-slate-400">Personal Pain-Medicine Registry & Clinic CRM</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium">
            Multi-User
          </span>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`py-2 rounded-md transition text-center ${
              tab === 'admin'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            👨‍⚕️ 1 Admin Login
          </button>
          <button
            type="button"
            onClick={() => setTab('staff')}
            className={`py-2 rounded-md transition text-center ${
              tab === 'staff'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            👥 Data Entry Logins
          </button>
        </div>

        {/* ADMIN TAB */}
        {tab === 'admin' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Admin Account</span>
              <p className="mt-0.5 text-slate-500">
                Full clinic control: view/edit all records, manage staff accounts, block doctor leaves, and export research CSV.
              </p>
            </div>

            {/* 1-Click Dev / Demo Login for Admin */}
            <form action={devLogin} className="pb-3 border-b border-slate-100">
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <span>⚡</span>
                <span>1-Click Login as Admin (sidtomoon@gmail.com)</span>
              </button>
            </form>

            {/* OTP Code Login */}
            {!email ? (
              <form action={requestAction} className="space-y-3 pt-1">
                <div className="text-xs text-slate-500 font-medium">Or sign in with email OTP code:</div>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue="sidtomoon@gmail.com"
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={requestPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition"
                >
                  {requestPending ? 'Sending code…' : 'Send login code'}
                </button>
                {requestState?.status === 'error' && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded">
                    {requestState.message}
                  </p>
                )}
              </form>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-500">Enter the verification code sent to {email}.</p>

                {actionLink && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800">
                    <div className="font-medium mb-1">Testing Bypass:</div>
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
                  {verifyState?.status === 'error' && (
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded">
                      {verifyState.message}
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        )}

        {/* STAFF / DATA ENTRY TAB */}
        {tab === 'staff' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
              <span className="font-semibold">Data Entry Staff</span>
              <p className="mt-0.5 text-amber-800">
                Register patients, record follow-up / procedure encounters, and schedule appointments. (Sensitive research exports and leave blocking are restricted to Admin).
              </p>
            </div>

            {/* Quick 1-Click Logins for Staff */}
            <div className="space-y-2 pb-3 border-b border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Quick 1-Click Staff Logins:</div>
              <div className="grid grid-cols-2 gap-2">
                <form action={() => devStaffLogin(1)}>
                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2 text-xs font-semibold transition shadow-sm text-center"
                  >
                    ⚡ Staff Operator 1
                  </button>
                </form>
                <form action={() => devStaffLogin(2)}>
                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2 text-xs font-semibold transition shadow-sm text-center"
                  >
                    ⚡ Staff Operator 2
                  </button>
                </form>
              </div>
            </div>

            {/* Email & Password login for custom staff */}
            <form action={passwordAction} className="space-y-3 pt-1">
              <div className="text-xs text-slate-500 font-medium">Sign in with Email & Password:</div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Staff Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="staff@painehr.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordPending}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition"
              >
                {passwordPending ? 'Signing in…' : 'Sign In as Staff'}
              </button>

              {passwordState?.status === 'error' && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded">
                  {passwordState.message}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
