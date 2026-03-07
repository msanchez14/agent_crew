import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { toast } from '../components/Toast';
import { friendlyError } from '../utils/errors';

export function UserProfilePage() {
  const { user, mustChangePassword, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const passwordValid = newPassword.length >= 8
    && /[A-Z]/.test(newPassword)
    && /[a-z]/.test(newPassword)
    && /[0-9]/.test(newPassword);

  const passwordsMatch = newPassword === confirmPassword;

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await authApi.updateProfile({ name: name.trim() });
      await refreshUser();
      toast('success', 'Profile updated');
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !passwordValid || !passwordsMatch || changingPassword) return;
    setChangingPassword(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      await refreshUser();
      toast('success', 'Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast('error', friendlyError(err, 'Failed to change password.'));
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Profile</h1>

      {mustChangePassword && (
        <div className="mb-6 rounded-lg border border-amber-600/40 bg-amber-900/20 px-4 py-3">
          <p className="text-sm font-medium text-amber-300">
            You must change your password before continuing. Please set a new password below.
          </p>
        </div>
      )}

      {/* Profile info */}
      <form onSubmit={handleUpdateProfile} className="mb-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Account information</h2>

        <div className="mb-4">
          <label htmlFor="profile_email" className="mb-1 block text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="profile_email"
            type="email"
            value={user?.email ?? ''}
            disabled
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-400 opacity-60"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="profile_name" className="mb-1 block text-sm font-medium text-slate-300">
            Name
          </label>
          <input
            id="profile_name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!name.trim() || name === user?.name || saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

      {/* Password change */}
      <form onSubmit={handleChangePassword} className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Change password</h2>

        <div className="mb-4">
          <label htmlFor="current_pw" className="mb-1 block text-sm font-medium text-slate-300">
            Current password
          </label>
          <input
            id="current_pw"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="new_pw" className="mb-1 block text-sm font-medium text-slate-300">
            New password
          </label>
          <input
            id="new_pw"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            placeholder="Min 8 chars, upper, lower, digit"
          />
          {newPassword && !passwordValid && (
            <p className="mt-1 text-xs text-amber-400">
              Must be 8+ chars with uppercase, lowercase, and a digit
            </p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="confirm_new_pw" className="mb-1 block text-sm font-medium text-slate-300">
            Confirm new password
          </label>
          <input
            id="confirm_new_pw"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!currentPassword || !passwordValid || !passwordsMatch || changingPassword}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {changingPassword ? 'Changing...' : 'Change password'}
          </button>
        </div>
      </form>
    </div>
  );
}
