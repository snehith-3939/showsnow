import { Dialog, Transition, Menu } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/Auth.context";

// mode: 'user-login' | 'admin-login' | 'register'
const TABS = [
  { id: 'user-login',  label: '👤 User Login' },
  { id: 'admin-login', label: '⚙️ Admin Login' },
  { id: 'register',    label: '✨ Register' },
];

const CustomModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('user-login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, login, register, logout } = useAuth();

  const closeModal = () => {
    setIsOpen(false);
    setError('');
    setForm({ email: '', password: '', name: '' });
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setForm({ email: '', password: '', name: '' });
  };

  const openModal = () => { if (!user) setIsOpen(true); };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register({ email: form.email, password: form.password, name: form.name });
        closeModal();
        navigate('/');
        return;
      }

      // Both login modes call the same API endpoint
      const result = await login({ email: form.email, password: form.password });
      const role = result?.data?.user?.role;

      if (mode === 'admin-login') {
        if (role !== 'ADMIN') {
          // Log back out and show an error — wrong account type
          logout();
          setError('Access denied. This account does not have admin privileges.');
          return;
        }
        closeModal();
        navigate('/admin');
      } else {
        // user-login: admins who login from here still go to /admin
        closeModal();
        navigate(role === 'ADMIN' ? '/admin' : '/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAdminMode = mode === 'admin-login';

  return (
    <>
      {/* Trigger button — or user dropdown if already logged in */}
      {user ? (
        <Menu as="div" className="relative inline-block text-left z-50">
          <Menu.Button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm rounded font-medium transition cursor-pointer">
            Hi, {user.name?.split(' ')[0] || user.email}
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-3">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="truncate text-sm font-bold text-gray-900">{user.name || user.email}</p>
                <p className="truncate text-xs text-gray-400">{user.email}</p>
                {user.role === 'ADMIN' && (
                  <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded-full font-semibold">
                    Admin
                  </span>
                )}
              </div>
              <div className="px-1 py-1">
                {user.role === 'ADMIN' && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/admin')}
                        className={`${active ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium`}
                      >
                        ⚙️ Admin Panel
                      </button>
                    )}
                  </Menu.Item>
                )}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/bookings')}
                      className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                    >
                      My Bookings
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className={`${active ? 'bg-red-50 text-red-700' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      ) : (
        <button
          id="sign-in-btn"
          onClick={openModal}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm rounded font-medium transition"
        >
          Sign In
        </button>
      )}

      {/* Auth Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={closeModal}>
          <div className="min-h-screen flex items-center justify-center px-4">
            <Transition.Child as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
              leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            </Transition.Child>

            <Transition.Child as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${
                isAdminMode ? 'bg-gray-950' : 'bg-white'
              }`}>

                {/* ── Tab Strip ── */}
                <div className={`flex border-b ${isAdminMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      onClick={() => switchMode(tab.id)}
                      className={`flex-1 py-3.5 text-xs font-bold tracking-wide transition-all duration-200 ${
                        mode === tab.id
                          ? tab.id === 'admin-login'
                            ? 'bg-yellow-500 text-gray-900 border-b-2 border-yellow-400'
                            : 'bg-red-600 text-white border-b-2 border-red-400'
                          : isAdminMode
                            ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Close button */}
                  <button
                    onClick={closeModal}
                    className={`absolute top-3 right-4 text-xl transition ${
                      isAdminMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    ✕
                  </button>

                  {/* ── Header ── */}
                  <div className="flex flex-col items-center mb-5">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      isAdminMode ? 'bg-yellow-500' : 'bg-red-600'
                    }`}>
                      <span className="text-xl">
                        {isAdminMode ? '⚙️' : mode === 'register' ? '✨' : '🎬'}
                      </span>
                    </div>
                    <h2 className={`text-2xl font-extrabold ${isAdminMode ? 'text-white' : 'text-gray-900'}`}>
                      {mode === 'user-login'  && 'Welcome Back'}
                      {mode === 'admin-login' && 'Admin Access'}
                      {mode === 'register'    && 'Create Account'}
                    </h2>
                    <p className={`text-xs mt-1 text-center ${isAdminMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {mode === 'user-login'  && 'Sign in to book tickets and manage your orders.'}
                      {mode === 'admin-login' && 'Restricted to platform administrators only.'}
                      {mode === 'register'    && 'Join ShowsNow and start booking today.'}
                    </p>
                  </div>

                  {/* ── Admin warning banner ── */}
                  {isAdminMode && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                      <span className="text-yellow-400 text-sm mt-0.5 flex-shrink-0">⚠️</span>
                      <p className="text-yellow-300 text-xs leading-relaxed">
                        This login is for <strong>administrators only</strong>. Regular users should use the <strong>User Login</strong> tab.
                      </p>
                    </div>
                  )}

                  {/* ── Form ── */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          id="input-name"
                          name="name" type="text" required
                          value={form.name} onChange={handleChange}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                    )}

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isAdminMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email Address
                      </label>
                      <input
                        id="input-email"
                        name="email" type="email" required
                        value={form.email} onChange={handleChange}
                        placeholder={isAdminMode ? 'admin@showsnow.com' : 'you@example.com'}
                        className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none text-sm transition ${
                          isAdminMode
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-yellow-500'
                            : 'border-gray-300 focus:ring-2 focus:ring-red-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isAdminMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Password
                      </label>
                      <input
                        id="input-password"
                        name="password" type="password" required
                        value={form.password} onChange={handleChange}
                        placeholder="Min 6 characters"
                        className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none text-sm transition ${
                          isAdminMode
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-yellow-500'
                            : 'border-gray-300 focus:ring-2 focus:ring-red-500'
                        }`}
                      />
                    </div>

                    {error && (
                      <div className={`border text-sm px-3 py-2.5 rounded-xl flex items-start gap-2 ${
                        isAdminMode
                          ? 'bg-red-900/30 border-red-700/50 text-red-300'
                          : 'bg-red-50 border-red-200 text-red-600'
                      }`}>
                        <span className="mt-0.5 flex-shrink-0">⚠️</span>
                        {error}
                      </div>
                    )}

                    <button
                      id="submit-auth-btn"
                      type="submit"
                      disabled={loading}
                      className={`w-full py-2.5 rounded-full font-bold text-sm transition disabled:opacity-50 mt-1 ${
                        isAdminMode
                          ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {loading
                        ? 'Please wait...'
                        : mode === 'user-login'
                          ? 'Sign In'
                          : mode === 'admin-login'
                            ? 'Access Admin Panel →'
                            : 'Create Account'}
                    </button>
                  </form>

                  <p className={`text-center text-xs mt-5 ${isAdminMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    By continuing, you agree to ShowsNow's Terms &amp; Privacy Policy.
                  </p>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default CustomModal;
