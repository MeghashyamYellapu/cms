import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Mail, Phone, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const formik = useFormik({
    initialValues: {
      identifier: '',
      password: '',
    },
    validationSchema: Yup.object({
      identifier: Yup.string()
        .required('Email or phone number is required')
        .test('email-or-phone', 'Enter a valid email or 10-digit phone number', (value) => {
          if (!value) return false;
          const isEmail = /\S+@\S+\.\S+/.test(value);
          const isPhone = /^[6-9]\d{9}$/.test(value);
          return isEmail || isPhone;
        }),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      const result = await login(values);
      setLoading(false);

      if (result.success) {
        toast.success('Login successful!');
        const stored = JSON.parse(localStorage.getItem('admin') || '{}');
        navigate(stored.role === 'Agent' ? '/customers' : '/dashboard');
      } else {
        toast.error(result.message || 'Login failed');
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <Lock className="text-white" size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Cable Billing System
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">Sign in to manage your cable operations</p>
        </div>

        {/* Login Form */}
        <div className="card shadow-xl border-gray-100">
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Email or Phone */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {/^[6-9]\d*$/.test(formik.values.identifier) && formik.values.identifier.length > 0
                    ? <Phone className="text-gray-400" size={20} />
                    : <Mail className="text-gray-400" size={20} />}
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  inputMode={/^[6-9]/.test(formik.values.identifier) ? 'numeric' : 'email'}
                  className={`input pl-10 ${
                    formik.touched.identifier && formik.errors.identifier
                      ? 'border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                  placeholder="admin@example.com or 9876543210"
                  {...formik.getFieldProps('identifier')}
                />
              </div>
              {formik.touched.identifier && formik.errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.identifier}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pl-10 pr-10 ${
                    formik.touched.password && formik.errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                  placeholder="••••••••"
                  {...formik.getFieldProps('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="text-gray-400" size={20} />
                  ) : (
                    <Eye className="text-gray-400" size={20} />
                  )}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          {/* <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</p>
            <p className="text-xs text-blue-700">
              Email: admin@cableoperator.com<br />
              Password: Admin@123
            </p>
          </div> */}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-600">
          © 2026 Cable Billing System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
