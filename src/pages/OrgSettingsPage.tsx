import { useState, useEffect, useCallback } from 'react';
import type { User, UserRole, Invite } from '../types';
import { useAuth } from '../context/AuthContext';
import { orgApi } from '../services/api';
import { toast } from '../components/Toast';
import { friendlyError } from '../utils/errors';

export function OrgSettingsPage() {
  const { organization, user, refreshUser } = useAuth();

  // Org name edit
  const [orgName, setOrgName] = useState(organization?.name ?? '');
  const [savingOrg, setSavingOrg] = useState(false);

  // Members
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Invites
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);

  // Reset password modal
  const [resetConfirm, setResetConfirm] = useState<User | null>(null);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Invite link modal (shown once after creation)
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await orgApi.members();
      setMembers(data ?? []);
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to load members.'));
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const fetchInvites = useCallback(async () => {
    try {
      const data = await orgApi.invites();
      setInvites(data ?? []);
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to load invites.'));
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchInvites();
  }, [fetchMembers, fetchInvites]);

  async function handleUpdateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || savingOrg) return;
    setSavingOrg(true);
    try {
      await orgApi.update({ name: orgName.trim() });
      await refreshUser();
      toast('success', 'Organization updated');
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to update organization.'));
    } finally {
      setSavingOrg(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the organization?`)) return;
    try {
      await orgApi.removeMember(memberId);
      toast('success', 'Member removed');
      fetchMembers();
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to remove member.'));
    }
  }

  async function handleChangeRole(memberId: string, newRole: UserRole) {
    try {
      await orgApi.changeRole(memberId, newRole);
      toast('success', 'Role updated');
      fetchMembers();
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to change role.'));
    }
  }

  async function handleResetPassword() {
    if (!resetConfirm || resetting) return;
    setResetting(true);
    try {
      const res = await orgApi.resetPassword(resetConfirm.id);
      setTempPassword(res.temporary_password);
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to reset password.'));
      setResetConfirm(null);
    } finally {
      setResetting(false);
    }
  }

  function closeResetModal() {
    setResetConfirm(null);
    setTempPassword(null);
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (creatingInvite) return;
    setCreatingInvite(true);
    try {
      const invite = await orgApi.createInvite(
        inviteEmail.trim() ? { email: inviteEmail.trim() } : {},
      );
      const url = invite.invite_url
        || (invite.token ? `${window.location.origin}/invite/${invite.token}` : null);
      if (url) {
        setCreatedInviteUrl(url);
      } else {
        toast('success', 'Invite created');
      }
      setInviteEmail('');
      fetchInvites();
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to create invite.'));
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleDeleteInvite(inviteId: string) {
    try {
      await orgApi.deleteInvite(inviteId);
      toast('success', 'Invite deleted');
      fetchInvites();
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to delete invite.'));
    }
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Organization</h1>

      {/* Org profile */}
      <form onSubmit={handleUpdateOrg} className="mb-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Organization profile</h2>
        <div className="mb-4">
          <label htmlFor="org_name" className="mb-1 block text-sm font-medium text-slate-300">
            Name
          </label>
          <input
            id="org_name"
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          {!isAdmin && (
            <p className="mt-1 text-xs text-slate-500">Only admins can change the organization name.</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!orgName.trim() || orgName === organization?.name || savingOrg}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {savingOrg ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </form>

      {/* Members */}
      <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Members</h2>
        {loadingMembers ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded bg-slate-800 p-3">
                <div className="h-4 w-48 rounded bg-slate-700" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg bg-slate-800/30 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {member.name}
                    {member.is_owner && (
                      <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                        Owner
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role selector */}
                  {isAdmin ? (
                    <select
                      value={member.role}
                      disabled={member.is_owner}
                      onChange={(e) => handleChangeRole(member.id, e.target.value as UserRole)}
                      className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      aria-label={`Role for ${member.name}`}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
                      {member.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  )}

                  {/* Reset password — only for admins, not for self */}
                  {isAdmin && member.id !== user?.id && (
                    <button
                      onClick={() => setResetConfirm(member)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-amber-400"
                      aria-label={`Reset password for ${member.name}`}
                      title="Reset password"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                  )}

                  {/* Remove member — only for admins, not for self */}
                  {isAdmin && member.id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400"
                      aria-label={`Remove ${member.name}`}
                      title="Remove member"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invites */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Invites</h2>

        {/* Create invite form */}
        {isAdmin && (
          <form onSubmit={handleCreateInvite} className="mb-4 flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              placeholder="Email (optional)"
            />
            <button
              type="submit"
              disabled={creatingInvite}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {creatingInvite ? 'Creating...' : 'Create invite'}
            </button>
          </form>
        )}

        {/* Invites list */}
        {loadingInvites ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded bg-slate-800 p-3">
                <div className="h-4 w-40 rounded bg-slate-700" />
              </div>
            ))}
          </div>
        ) : invites.length === 0 ? (
          <p className="text-sm text-slate-500">No pending invites</p>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg bg-slate-800/30 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">
                    {invite.email || 'Any email'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                    {invite.used_at && ' (used)'}
                  </p>
                </div>
                {!invite.used_at && (
                  <div className="flex items-center gap-1">
                    {/* Copy invite link */}
                    {invite.token && (
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/invite/${invite.token}`;
                          await navigator.clipboard.writeText(url);
                          toast('success', 'Invite link copied to clipboard');
                        }}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-blue-400"
                        aria-label="Copy invite link"
                        title="Copy invite link"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    {/* Delete invite */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteInvite(invite.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400"
                        aria-label="Delete invite"
                        title="Cancel invite"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset password confirmation / temporary password modal */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-xl">
            {tempPassword ? (
              <>
                <h2 className="mb-2 text-lg font-semibold text-white">Temporary Password</h2>
                <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="mb-2 text-xs font-medium text-amber-400">
                    This password will only be shown once. Copy it now.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-slate-900 px-3 py-2 font-mono text-sm text-white">
                      {tempPassword}
                    </code>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(tempPassword);
                        toast('success', 'Password copied to clipboard');
                      }}
                      className="rounded-md bg-slate-700 p-2 text-slate-300 hover:bg-slate-600 hover:text-white"
                      aria-label="Copy password"
                      title="Copy password"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mb-4 text-sm text-slate-400">
                  <span className="font-medium text-white">{resetConfirm.name}</span> will be required to change this password on next login.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={closeResetModal}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-2 text-lg font-semibold text-white">Reset Password</h2>
                <p className="mb-6 text-sm text-slate-400">
                  Reset the password for <span className="font-medium text-white">{resetConfirm.name}</span>?
                  They will receive a temporary password and must change it on next login.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeResetModal}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                  >
                    {resetting ? 'Resetting...' : 'Reset password'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Invite link modal — shown once after creation */}
      {createdInviteUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-white">Invite Link Created</h2>
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="mb-2 text-xs font-medium text-amber-400">
                This link will only be shown once. Copy it now.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-slate-900 px-3 py-2 font-mono text-sm text-white">
                  {createdInviteUrl}
                </code>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(createdInviteUrl);
                    toast('success', 'Link copied to clipboard');
                  }}
                  className="rounded-md bg-slate-700 p-2 text-slate-300 hover:bg-slate-600 hover:text-white"
                  aria-label="Copy invite link"
                  title="Copy link"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Share this link with the person you want to invite. For security, the link cannot be retrieved later.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setCreatedInviteUrl(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
