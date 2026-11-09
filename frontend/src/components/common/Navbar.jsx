import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  HeartPulse, 
  Hospital, 
  Pill, 
  Droplet, 
  Ambulance, 
  FileText, 
  AlertCircle, 
  User, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'SUPER_ADMIN': return '/super-admin';
      case 'HOSPITAL_ADMIN': return '/hospital-admin';
      case 'DOCTOR': return '/doctor-portal';
      case 'AMBULANCE_PROVIDER': return '/ambulance-portal';
      case 'BLOOD_BANK_ADMIN': return '/blood-bank-portal';
      default: return '/dashboard';
    }
  };

  const navLinks = [
    { name: 'Discover Hospitals', path: '/hospitals', icon: Hospital },
    { name: 'Medicines', path: '/medicines', icon: Pill },
    { name: 'Blood Banks', path: '/blood-banks', icon: Droplet },
    { name: 'Ambulance', path: '/ambulance', icon: Ambulance },
    { name: 'Govt Schemes', path: '/schemes', icon: FileText },
    { name: 'Civic Issues', path: '/complaints', icon: AlertCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-health-700 to-health-500 flex items-center justify-center text-white shadow-md shadow-health-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">CivicConnect</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-health-100 text-health-800">India</span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-medium">Civic Health & Emergency Discovery</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive(link.path)
                      ? 'bg-health-50 text-health-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-75" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Emergency Button */}
            <Link
              to="/emergency-register"
              className="inline-flex items-center gap-1.5 bg-emergency-600 hover:bg-emergency-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition transform hover:-translate-y-0.5"
            >
              <HeartPulse className="w-4 h-4 animate-pulse" />
              <span>Emergency OPD</span>
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-3 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  <span>{user.name.split(' ')[0]}</span>
                  <div className="w-7 h-7 rounded-full bg-health-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user.name[0]}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>

                    <Link
                      to={getDashboardRoute()}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-health-50 hover:text-health-700 font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-health-600" />
                      <span>My Portal Dashboard</span>
                    </Link>

                    {user.role === 'CITIZEN' && (
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Medical Profile & History</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-left border-t border-slate-100 font-medium mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-health-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-health-700 hover:bg-health-800 text-white px-3.5 py-2 rounded-lg shadow-sm transition"
                >
                  Citizen Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/emergency-register"
              className="bg-emergency-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-md"
            >
              108 SOS
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(link.path) ? 'bg-health-50 text-health-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 text-health-600" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardRoute()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-health-50 text-health-800"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Go to My Dashboard ({user.role})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold bg-health-700 text-white rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
