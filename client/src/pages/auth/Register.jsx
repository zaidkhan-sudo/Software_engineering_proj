import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card, CardContent } from '../../components/common/Card';
import { getErrorMessage } from '../../utils/helpers';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { name, email, phone, password, confirmPassword } = formData;

    if (!name.trim()) {
      setError('Please provide your full legal or registered name.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password) {
      setError('Please provide a password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password
      });

      toast.success('Registration successful! Welcome to the civic portal.');
      navigate('/citizen');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header & Municipal Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-50 border border-primary-100 text-primary-600 mb-2">
          <Landmark className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Create Citizen Account
        </h1>
        <p className="text-sm text-slate-500">
          Register with your municipal authority to file and track grievances
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
                label="Full Name"
                name="name"
                required
                placeholder="e.g. Jane Citizen"
                value={formData.name}
                onChange={handleChange}
                icon={User}
                autoComplete="name"
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                required
                placeholder="citizen@example.com"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                autoComplete="email"
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000 (optional)"
                value={formData.phone}
                onChange={handleChange}
                icon={Phone}
                autoComplete="tel"
                helperText="Used strictly for SMS notifications regarding urgent service escalations."
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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
                <p className="text-xs text-slate-500">Minimum 8 characters.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={loading}
                >
                  Create Account
                </Button>
              </div>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Already registered with the portal?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Civic notice */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Official Municipal Grievance Redressal System &bull; Secured Session
        </div>
      </div>
    </div>
  );
};

export default Register;
