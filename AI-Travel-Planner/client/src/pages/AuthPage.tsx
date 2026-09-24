import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, User, Mail, Lock, KeyRound, ArrowRight, ArrowLeft, AlertCircle, Check, RotateCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SeoHead } from '@/components/SeoHead';

interface AuthPageProps {
  mode: 'signin' | 'signup';
}

export function AuthPage({ mode }: AuthPageProps) {
  const { signIn, signUp, requestOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [signUpStep, setSignUpStep] = useState<'details' | 'otp'>('details');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isSignUp = mode === 'signup';

  // Reset states when switching between signin and signup
  useEffect(() => {
    setError(null);
    setSignUpStep('details');
    setOtp('');
  }, [mode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const { error: otpError } = await requestOtp(email.trim());
    setLoading(false);

    if (otpError) {
      setError(otpError);
      return;
    }

    setSignUpStep('otp');
    setResendCooldown(45);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setLoading(true);
    const { error: otpError } = await requestOtp(email.trim());
    setLoading(false);

    if (otpError) {
      setError(otpError);
      return;
    }
    setResendCooldown(45);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSignUp) {
      // Sign In Flow
      setLoading(true);
      const { error: loginError } = await signIn(email, password);
      if (loginError) {
        setError(loginError);
        setLoading(false);
        return;
      }
      navigate(from);
      return;
    }

    // Sign Up Flow - Step 1
    if (signUpStep === 'details') {
      await handleSendOtp();
      return;
    }

    // Sign Up Flow - Step 2 (Verify OTP & Register)
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);
    const { error: registerError } = await signUp({
      name: name.trim(),
      email: email.trim(),
      password,
      otp: otp.trim(),
    });

    if (registerError) {
      setError(registerError);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    // Auto-navigate after brief success message
    setTimeout(() => navigate(from), 1200);
  };

  return (
    <div className="min-h-screen flex">
      <SeoHead
        title={mode === 'signin' ? 'Sign In | TripSync' : 'Create an Account | TripSync'}
        description="Access your TripSync travel workspace and plan extraordinary journeys across India."
        canonicalPath={mode === 'signin' ? '/signin' : '/signup'}
        noindex={true}
        nofollow={false}
      />
      {/* Left — form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 bg-white">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-lg text-slate-800">TripSync</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-slate-900">
            {isSignUp
              ? signUpStep === 'otp'
                ? 'Verify your email'
                : 'Create your account'
              : 'Welcome back'}
          </h1>
          <p className="mt-2 text-slate-500 text-sm sm:text-base">
            {isSignUp
              ? signUpStep === 'otp'
                ? `Enter the 6-digit code sent to ${email}`
                : 'Start planning smarter trips in seconds.'
              : 'Sign in to continue your journey.'}
          </p>

          {success && (
            <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-brand-50 border border-brand-200 animate-fade-in">
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-brand-800 font-medium">
                Account created! Taking you to your dashboard...
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Sign Up - Step 1: Details */}
            {isSignUp && signUpStep === 'details' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Alex Traveler"
                      className="input-field pl-11"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="input-field pl-11"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      className="input-field pl-11"
                      autoComplete="new-password"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
                </div>
              </>
            )}

            {/* Sign Up - Step 2: OTP Verification */}
            {isSignUp && signUpStep === 'otp' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Verification Code (OTP)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setSignUpStep('details');
                        setError(null);
                      }}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Edit details
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="Enter 6-digit OTP"
                      className="input-field pl-11 text-center font-mono tracking-widest text-lg font-semibold"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Didn't get the code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="font-semibold text-brand-600 hover:text-brand-700 disabled:text-slate-400 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  >
                    <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {/* Sign In Form */}
            {!isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="input-field pl-11"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="input-field pl-11"
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp
                    ? signUpStep === 'details'
                      ? 'Send Verification Code'
                      : 'Create account'
                    : 'Sign in'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link
              to={isSignUp ? '/signin' : '/signup'}
              className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up free'}
            </Link>
          </p>
        </div>
      </div>

      {/* Right — visual */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-brand-600 to-brand-800 items-center justify-center overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-sand-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-md px-12 text-center">
          <Compass className="w-16 h-16 text-white/90 mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="font-display text-3xl font-bold text-white leading-tight">
            "The world is a book, and those who do not travel read only one page."
          </h2>
          <p className="mt-4 text-brand-100 text-lg">— Saint Augustine</p>
          <div className="mt-12 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-white">AI</p>
              <p className="text-sm text-brand-200">Itineraries</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-white">360°</p>
              <p className="text-sm text-brand-200">Planning</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-white">Free</p>
              <p className="text-sm text-brand-200">Forever</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
