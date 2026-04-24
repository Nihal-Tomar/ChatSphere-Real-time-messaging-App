import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupForm({ onSwitch }) {
  const { register } = useAuthStore();
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to ChatSphere 🎉');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'username', label: 'Username', type: 'text', placeholder: 'johndoe' },
    { name: 'displayName', label: 'Display Name', type: 'text', placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-100">Create your account</h2>
        <p className="text-slate-400 text-sm mt-1">Join thousands on ChatSphere today</p>
      </div>

      {fields.map(({ name, label, type, placeholder }) => (
        <div key={name} className="space-y-1">
          <label className="text-sm font-medium text-slate-300">{label}</label>
          <input name={name} type={type} value={form[name]} onChange={handle} required
            className="input bg-surface-800 border-slate-700 text-slate-100 placeholder-slate-500"
            placeholder={placeholder} />
        </div>
      ))}

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-300">Password</label>
        <div className="relative">
          <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle} required
            className="input bg-surface-800 border-slate-700 text-slate-100 placeholder-slate-500 pr-11"
            placeholder="Min. 6 characters" />
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
          <><UserPlus size={18} /> Create Account</>
        )}
      </button>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-primary-400 hover:text-primary-300 font-semibold">
          Sign in
        </button>
      </p>
    </form>
  );
}
