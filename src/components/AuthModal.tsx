import React, { useState } from 'react';
import { api } from '../services/api.js';
import { User, AccountType, UserSummary } from '../types/trust.js';
import { ShieldCheck, X, CheckCircle2, AlertCircle, Building2, User as UserIcon, LogOut, Eye, EyeOff, Key, Database, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
  availableUsers: UserSummary[];
  currentUser?: User | null;
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onSuccess,
  availableUsers,
  currentUser,
  onLogout,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Software Engineering');
  const [phone, setPhone] = useState('+234 ');
  const [city, setCity] = useState('Lagos');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSentMessage, setResetSentMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login) return;
    setLoading(true);
    setError(null);
    try {
      let res;
      if (login.includes('@')) {
        res = await api.loginWithSupabaseEmail(login, password);
      } else {
        res = await api.signIn(login, password);
      }
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.switchUser(userId);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to switch profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email) return;
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.signUp({
        fullName,
        username,
        email,
        password,
        accountType,
        businessName: accountType === 'business' ? businessName : undefined,
        category,
        phone,
        city,
      });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.resetPassword(email);
      setResetSentMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate password recovery.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative z-10 bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5 my-auto max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Devolution Trust Access
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {mode === 'signin' && 'Sign In to Your Trust Ledger'}
              {mode === 'signup' && 'Register Evidence Profile'}
              {mode === 'reset' && 'Account Recovery'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Session & Log Out Banner */}
        {currentUser && onLogout && mode === 'signin' && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.fullName.charAt(0)}
                </div>
              )}
              <div className="truncate">
                <div className="text-[10px] text-indigo-700 font-semibold uppercase tracking-wider">
                  Active Session:
                </div>
                <div className="font-bold text-slate-900 truncate">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-500 font-mono">@{currentUser.username}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Real Assigned User Quick-Access Button */}
        {mode === 'signin' && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Real User Account: allenkinetic004@gmail.com</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Real Email
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-tight">
              Assigned directly to your real verified profile, cryptographic trust ledger, and live Supabase Cloud synchronization.
            </p>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const res = await api.assignRealUser('allenkinetic004@gmail.com');
                  onSuccess(res.user);
                  onClose();
                } catch (err: any) {
                  setError(err.message || 'Failed to switch to real user.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Assign & Sign In as Real User (allenkinetic004@gmail.com)</span>
            </button>
          </div>
        )}

        {/* Quick Sandbox Persona Switcher */}
        {mode === 'signin' && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
              Quick Test Personas (Sandbox Switcher)
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSwitch(u.id)}
                  className={`w-full text-left p-2 rounded border transition-colors flex items-center justify-between ${
                    currentUser?.id === u.id
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold'
                      : 'bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-bold text-slate-900">{u.fullName}</span>
                    <span className="text-slate-500 font-mono text-[11px] ml-1.5">(@{u.username})</span>
                    {currentUser?.id === u.id && (
                      <span className="ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-indigo-700 font-mono capitalize shrink-0 ml-2">
                    {u.accountType}
                  </span>
                </button>
              ))}

              {currentUser && onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded bg-white hover:bg-red-50 border border-dashed border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-700 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
                    <span className="font-semibold text-xs">Log Out (Continue as Guest)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Public View</span>
                </button>
              )}
            </div>
          </div>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username or Registered Email
              </label>
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="allenokoro or email@domain.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-[11px] text-indigo-600 hover:underline mt-1 block"
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="text-center pt-2 text-[11px] text-slate-500">
              Need an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Create a Profile
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
            {/* Account type radio selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('personal')}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                    accountType === 'personal'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Personal Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('business')}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                    accountType === 'business'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Corporate Business</span>
                </button>
              </div>
            </div>

            {accountType === 'business' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registered Business Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Logistics Nigeria Ltd"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Chinelo Nnamdi"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="chinelo_n"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chinelo@work.ng"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Account Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password (min. 6 characters)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Used to sign in across sessions or sync to Supabase.</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Industry / Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. FinTech"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lagos or Abuja"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </button>

            <div className="text-center pt-2 text-[11px] text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            {resetSentMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
                <div className="font-bold">Recovery Token Dispatched</div>
                <p className="text-[11px]">{resetSentMessage}</p>
              </div>
            ) : (
              <>
                <p className="text-slate-600 text-xs">
                  Enter your registered email address. We will generate a cryptographic password recovery challenge link.
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  {loading ? 'Generating...' : 'Send Recovery Token'}
                </button>
              </>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setResetSentMessage(null);
                }}
                className="text-xs text-indigo-600 hover:underline"
              >
                Return to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
