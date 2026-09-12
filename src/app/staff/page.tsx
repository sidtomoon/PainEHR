import { requireAdmin, ADMIN_EMAIL } from '@/lib/auth-roles';
import { Header } from '@/app/components/Header';
import { createServiceClient } from '@/lib/supabase/service';
import { createStaffMember, deleteStaffMember } from './actions';
import type { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface StaffItem {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export default async function StaffManagementPage() {
  const currentAdmin = await requireAdmin();
  const serviceClient = createServiceClient();

  // 1. Fetch auth users
  let staffList: StaffItem[] = [];
  try {
    const { data: authData } = await serviceClient.auth.admin.listUsers();
    const users = authData?.users || [];

    // 2. Fetch user_roles table if available
    const { data: rolesData } = await serviceClient.from('user_roles').select('*');
    const rolesMap = new Map<string, { role: UserRole; display_name: string | null }>();
    if (rolesData) {
      rolesData.forEach((r: { user_id: string; role: UserRole; display_name: string | null }) => {
        rolesMap.set(r.user_id, { role: r.role, display_name: r.display_name });
      });
    }

    staffList = users.map((u) => {
      const dbRole = rolesMap.get(u.id);
      const isLeadAdmin = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const role: UserRole =
        dbRole?.role ||
        (u.user_metadata?.role as UserRole) ||
        (isLeadAdmin ? 'admin' : 'data_entry');

      const displayName =
        dbRole?.display_name ||
        u.user_metadata?.display_name ||
        (isLeadAdmin ? 'Dr. Varun Singla' : u.email?.split('@')[0] || 'Staff Member');

      return {
        id: u.id,
        email: u.email || '',
        displayName,
        role,
        createdAt: u.created_at,
      };
    });
  } catch (err) {
    console.error('Failed to list staff users:', err);
  }

  // Count by role
  const adminCount = staffList.filter((s) => s.role === 'admin').length;
  const dataEntryCount = staffList.filter((s) => s.role === 'data_entry').length;

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 pb-24 pt-6 w-full">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Clinic Staff & Login Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage accounts for the lead doctor and multiple data entry operators.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-medium">
              👨‍⚕️ {adminCount} Admin
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              👥 {dataEntryCount} Data Entry {dataEntryCount === 1 ? 'Login' : 'Logins'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create new staff user form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-1">+ Add Data Entry Login</h2>
              <p className="text-xs text-slate-400 mb-4">
                Create a login account for reception, clinical assistants, or nurses.
              </p>

              <form action={createStaffMember} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Staff Full Name</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Front Desk Operator 1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Login Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="e.g. dataentry1@painehr.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Role</label>
                  <select
                    name="role"
                    defaultValue="data_entry"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="data_entry">Data Entry Staff (Patient Entry, Calendar, Visits)</option>
                    <option value="admin">Admin (Full Control, Export, Leaves, Staff)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition text-xs shadow-sm mt-2"
                >
                  Create Staff Account
                </button>
              </form>
            </div>
          </div>

          {/* Existing staff accounts list */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Clinic Accounts ({staffList.length})
                </span>
                <span className="text-xs text-slate-400">
                  Signed in as: <strong className="text-slate-700">{currentAdmin.displayName}</strong>
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {staffList.map((staff) => {
                  const isCurrent = staff.id === currentAdmin.id;
                  return (
                    <div
                      key={staff.id}
                      className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">{staff.displayName}</span>
                          {staff.role === 'admin' ? (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold uppercase tracking-wider">
                              Admin
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">
                              Data Entry
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] text-slate-400 font-medium">(You)</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                          {staff.email}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isCurrent && (
                          <form
                            action={async () => {
                              'use server';
                              await deleteStaffMember(staff.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="text-rose-600 hover:text-rose-700 text-xs px-2.5 py-1 rounded border border-rose-200 hover:bg-rose-50 transition"
                            >
                              Remove
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Explanations */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900">
                <span className="font-bold">Admin Permissions:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-teal-800">
                  <li>Full patient & encounter access</li>
                  <li>Export research & clinical CSV</li>
                  <li>Block doctor leaves / OT days</li>
                  <li>Create and remove staff logins</li>
                </ul>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <span className="font-bold">Data Entry Staff Permissions:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                  <li>Register new patients with UID</li>
                  <li>Search and view all clinic patients</li>
                  <li>Record follow-up and procedure visits</li>
                  <li>Book and reschedule appointments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
