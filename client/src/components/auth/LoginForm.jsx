import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginForm({ onSwitch }) {
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back! 👋');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-100">Welcome back</h2>
        <p className="text-slate-400 text-sm mt-1">Sign in to continue to ChatSphere</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-300">Email</label>
        <input name="email" type="email" value={form.email} onChange={handle} required
          className="input bg-surface-800 border-slate-700 text-slate-100 placeholder-slate-500"
          placeholder="you@example.com" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-300">Password</label>
        <div className="relative">
          <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle} required
            className="input bg-surface-800 border-slate-700 text-slate-100 placeholder-slate-500 pr-11"
            placeholder="Enter your password" />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <><LogIn size={18} /> Sign In</>
        )}
      </button>

      <p className="text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-primary-400 hover:text-primary-300 font-semibold">
          Create one
        </button>
      </p>
    </form>
  );
}
