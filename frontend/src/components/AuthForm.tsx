import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signup, login, requestOtp, verifyOtp, resetPassword } from '../utils/auth';

interface AuthFormProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showOtpLogin, setShowOtpLogin] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = isLogin 
        ? await login(email, password)
        : await signup(email, password);
      if (result.success && result.user) {
        onAuthSuccess(result.user);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setLoading(true);
    setError('');
    setOtpSent(false);
    setOtpSuccess('');
    const res = await requestOtp(email);
    setLoading(false);
    if (res.success) {
      setOtpSent(true);
      setOtpSuccess(res.message);
    } else {
      setError(res.message);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    const res = await verifyOtp(email, otp);
    setLoading(false);
    if (res.success && res.user) {
      onAuthSuccess(res.user);
    } else {
      setError(res.message);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    setResetSuccess('');
    const res = await resetPassword(email, otp, newPassword);
    setLoading(false);
    if (res.success) {
      setResetSuccess(res.message);
      setShowForgot(false);
      setShowOtpLogin(false);
      setOtp('');
      setNewPassword('');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <span className="text-3xl text-white">👤</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Document Chat Assistant
            </h1>
            <p className="text-gray-600">
              {isLogin ? 'Welcome back! Please sign in.' : 'Create your account to get started.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {resetSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm">
              {resetSuccess}
            </div>
          )}
          {otpSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm">
              {otpSuccess}
            </div>
          )}

          {/* OTP Login Flow */}
          {showOtpLogin ? (
            <form className="space-y-6" autoComplete="on" onSubmit={e => { e.preventDefault(); handleVerifyOtp(); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                    placeholder="Enter your email"
                    required
                    autoComplete="username"
                    name="username"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleRequestOtp} disabled={loading || !email} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Send OTP</button>
              </div>
              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                    placeholder="Enter OTP"
                    required
                  />
                  <button type="submit" disabled={loading || !otp} className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium">Login with OTP</button>
                </div>
              )}
              <div className="mt-4 text-center">
                <button type="button" onClick={() => { setShowOtpLogin(false); setOtpSent(false); setOtp(''); setError(''); }} className="text-blue-600 hover:text-blue-700 font-medium">Back to Login</button>
              </div>
            </form>
          ) : showForgot ? (
            // Forgot Password Flow
            <form className="space-y-6" autoComplete="on" onSubmit={e => { e.preventDefault(); handleResetPassword(); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                    placeholder="Enter your email"
                    required
                    autoComplete="username"
                    name="username"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleRequestOtp} disabled={loading || !email} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Send OTP</button>
              </div>
              {otpSent && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      placeholder="Enter OTP"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading || !otp || !newPassword} className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium">Reset Password</button>
                </>
              )}
              <div className="mt-4 text-center">
                <button type="button" onClick={() => { setShowForgot(false); setOtpSent(false); setOtp(''); setNewPassword(''); setError(''); }} className="text-blue-600 hover:text-blue-700 font-medium">Back to Login</button>
              </div>
            </form>
          ) : (
            // Default Login/Signup Form
            <>
              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your email"
                      required
                      autoComplete="username"
                      name="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your password"
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      name="password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
              </form>
              <div className="mt-4 flex flex-col items-center gap-2">
                <button type="button" onClick={() => { setShowForgot(true); setShowOtpLogin(false); setOtpSent(false); setOtp(''); setError(''); }} className="text-blue-600 hover:text-blue-700 font-medium">Forgot Password?</button>
                <button type="button" onClick={() => { setShowOtpLogin(true); setShowForgot(false); setOtpSent(false); setOtp(''); setError(''); }} className="text-blue-600 hover:text-blue-700 font-medium">Login with OTP</button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setShowForgot(false);
                  setShowOtpLogin(false);
                  setOtpSent(false);
                  setOtp('');
                  setNewPassword('');
                  setResetSuccess('');
                  setOtpSuccess('');
                }}
                className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};