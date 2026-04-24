import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, User, Mail, FileText, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import * as userApi from '../api/user.api';
import Avatar from '../components/ui/Avatar';
import ThemeToggle from '../components/ui/ThemeToggle';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    statusMessage: user?.statusMessage || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await userApi.updateProfile(form);
      updateUser(data.data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Could not update profile.'); }
    finally { setSaving(false); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await userApi.uploadAvatar(fd);
      updateUser({ avatar: data.data.avatar });
      toast.success('Avatar updated!');
    } catch { toast.error('Could not upload avatar.'); }
    finally { setUploading(false); }
  };

  const statusColors = { online: 'bg-emerald-500', away: 'bg-amber-400', busy: 'bg-red-500', offline: 'bg-slate-400' };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-icon"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex-1">Profile Settings</h1>
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar user={user} size="2xl" showStatus />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center text-white shadow-lg transition-all"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={uploadAvatar} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user?.displayName}</h2>
            <p className="text-slate-400 text-sm">@{user?.username}</p>
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Personal Information</h3>

          <div className="space-y-3">
            {[
              { name: 'displayName', label: 'Display Name', icon: <User size={15} />, placeholder: 'Your display name' },
              { name: 'bio', label: 'Bio', icon: <FileText size={15} />, placeholder: 'Tell people about yourself…', multiline: true },
              { name: 'statusMessage', label: 'Status Message', icon: <MessageCircle size={15} />, placeholder: 'What are you up to?' },
            ].map(({ name, label, icon, placeholder, multiline }) => (
              <div key={name} className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">{icon}{label}</label>
                {multiline ? (
                  <textarea name={name} value={form[name]} onChange={handle} rows={3}
                    placeholder={placeholder} className="input resize-none" />
                ) : (
                  <input name={name} value={form[name]} onChange={handle} type="text"
                    placeholder={placeholder} className="input" />
                )}
              </div>
            ))}
          </div>

          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save size={16} />Save Changes</>
            )}
          </button>
        </motion.div>

        {/* Read-only info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Account</h3>
          <div className="flex items-center gap-3 py-2">
            <Mail size={15} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <User size={15} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Username</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">@{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <div className={`w-3 h-3 rounded-full ${statusColors[user?.status] || 'bg-slate-400'}`} />
            <div>
              <p className="text-xs text-slate-400">Status</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">{user?.status}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
