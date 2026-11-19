import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, formatDate } from '../../utils/helpers';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (password) {
      if (password.length < 8) {
        setError('New password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('New passwords do not match. Please verify both fields.');
        return;
      }
    }

    const payload = {};
    if (name.trim() !== user?.name) payload.name = name.trim();
    if (phone.trim() !== (user?.phone || '')) payload.phone = phone.trim();
    if (password) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setError('No changes detected to update.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(payload);
      toast.success('Profile updated successfully.');
      setSuccessMsg('Your account profile has been updated.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Profile & Settings"
        description="Update your contact information, credentials, and municipal registry preferences."
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Citizen Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Legal Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={User}
              />

              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                icon={Mail}
                helperText="Email address is fixed to your municipal citizen account."
              />

              <Input
                label="Primary Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={Phone}
                helperText="Used for automated critical status notices."
              />

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Update Password (Leave blank to keep current)
                </h4>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {password && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Account created on {formatDate(user?.createdAt)}
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
