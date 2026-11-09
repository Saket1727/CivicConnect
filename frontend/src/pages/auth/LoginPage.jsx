import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { HeartPulse, Mail, Lock, LogIn, ShieldAlert, ArrowRight, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    searchParams.get('expired') ? 'Your session has expired. Please log in again.' : null
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const user = await login(email, password);
      redirectAfterLogin(user.role);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const redirectAfterLogin = (role) => {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      navigate(redirectParam);
      return;
    }
    switch (role) {
      case 'SUPER_ADMIN':
        navigate('/super-admin');
        break;
      case 'HOSPITAL_ADMIN':
        navigate('/hospital-admin');
        break;
      case 'DOCTOR':
        navigate('/doctor-portal');
        break;
      case 'AMBULANCE_PROVIDER':
        navigate('/ambulance-portal');
        break;
      case 'BLOOD_BANK_ADMIN':
        navigate('/blood-bank-portal');
        break;
      default:
        navigate('/dashboard');
        break;
    }
  };

  // Quick 1-Click Demo Login credentials for examination demonstration
  const handleDemoLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await login(demoEmail, demoPass);
      redirectAfterLogin(user.role);
    } catch (err) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Super Administrator', email: 'admin@civicconnect.gov.in', pass: 'Admin@123456', role: 'SuperAdmin' },
    { label: 'AIIMS Hospital Admin', email: 'admin@aiims.edu', pass: 'Password@123', role: 'Hospital' },
    { label: 'Apollo Hospital Admin', email: 'admin@apollohospitals.com', pass: 'Password@123', role: 'Hospital' },
    { label: 'Doctor (AIIMS Cardiology)', email: 'dr.sharma@aiims.edu', pass: 'Password@123', role: 'Doctor' },
    { label: 'Citizen (Patient)', email: 'rahul.citizen@gmail.com', pass: 'Password@123', role: 'Citizen' },
    { label: 'Ambulance Provider (102)', email: 'ramesh.ambulance@delhiems.org', pass: 'Password@123', role: 'Ambulance' },
    { label: 'Blood Bank Admin', email: 'bloodbank@redcrossdelhi.org', pass: 'Password@123', role: 'BloodBank' },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-health-700 to-health-500 flex items-center justify-center text-white mx-auto shadow-md">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign In to CivicConnect
        </h2>
        <p className="text-xs text-slate-500">
          Role-Based Access for Citizens, Doctors, Hospital Admins, and Super Administrators
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-soft border border-slate-200 space-y-6">
          
          {errorMessage && (
            <div className="p-3.5 bg-red-50 text-red-800 rounded-xl text-xs font-medium border border-red-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@civicconnect.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-health-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-health-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-health-700 hover:bg-health-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Quick Demo Login Roster for Major Project Evaluators */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Evaluator 1-Click Demo Profiles
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => handleDemoLogin(d.email, d.pass)}
                  className="text-left p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-health-50 hover:border-health-300 text-slate-700 transition"
                >
                  <span className="font-bold text-[11px] text-slate-800 block truncate">{d.label}</span>
                  <span className="text-[9px] text-health-600 font-semibold">{d.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-health-700 hover:underline">
              Citizen Registration
            </Link>
            {' • '}
            <Link to="/hospital-register" className="font-bold text-slate-700 hover:underline">
              Register Hospital
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
