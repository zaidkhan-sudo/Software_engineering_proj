import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card, CardContent } from '../../components/common/Card';
import { getErrorMessage } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login({ email: email.trim(), password });

      // Redirect based on role
      if (user.role === ROLES.ADMIN) {
        navigate('/admin');
      } else if (user.role === ROLES.OFFICER) {
        navigate('/officer');
      } else {
        navigate('/citizen');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header & Municipal Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-50 border border-primary-100 text-primary-600 mb-2">
          <Landmark className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Public Grievance Portal
        </h1>
        <p className="text-sm text-slate-500">
          Sign in to report civic issues or monitor department resolution
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-none">
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                autoComplete="email"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full h-10 pl-9 pr-10 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full"
                >
                  Sign In
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Are you a citizen without an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-700 focus:outline-none hover:underline"
                >
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials Quick Switcher */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2.5">
          <div className="font-semibold text-slate-700">Demo Credentials (Click to pre-fill):</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillQuickCredentials('citizen1@grievance.local', 'citizen123')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Citizen (citizen1)
            </button>
            <button
              type="button"
              onClick={() => fillQuickCredentials('officer.roads@grievance.local', 'officer123')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Officer (Roads)
            </button>
            <button
              type="button"
              onClick={() => fillQuickCredentials('admin@grievance.local', 'admin123')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Administrator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
