/**
 * @fileoverview Root app: routing and org-gated layout.
 * - Unauthenticated: landing page
 * - Authenticated: check organization; no org → onboarding, else dashboard
 * - Path-based routes for candidate flows (invite handler, welcome, interview)
 */

import { useAuthContext } from '@asgardeo/auth-react';
import { useOrganization } from '@/hooks/useOrganization';
import LandingPage from '@/pages/landing/Landing';
import Dashboard from '@/pages/dashboard/Dashboard';
import CandidateWelcome from '@/pages/candidate/Welcome';
import CandidateInterview from '@/pages/candidate/Interview';
import InviteHandler from '@/pages/candidate/InviteHandler';
import OrganizationSetup from '@/pages/onboarding/OrganizationSetup';

function App() {
  const { state } = useAuthContext();
  const isAuthenticated = state?.isAuthenticated === true;
  const userId = isAuthenticated ? state?.sub : undefined;
  const { organization, isLoading: checkingOrg, refresh } = useOrganization({ userId });
  const hasOrg = organization !== null;

  const path = window.location.pathname;

  if (path.startsWith('/invite/')) return <InviteHandler />;
  if (path === '/candidate/welcome') return <CandidateWelcome />;
  if (path === '/candidate/interview') return <CandidateInterview />;

  if (isAuthenticated) {
    if (checkingOrg) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-orange-50 opacity-30" aria-hidden />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FF7300] to-[#E56700] rounded-2xl shadow-lg flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-4xl tracking-tighter">Eh</span>
            </div>
            <h1 className="mt-8 text-2xl font-bold text-gray-900 tracking-tight">
              Equi<span className="text-[#FF7300]">Hire</span>
            </h1>
            <p className="mt-2 text-gray-500 text-sm animate-pulse">Loading your workspace...</p>
          </div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" aria-hidden />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" aria-hidden />
        </div>
      );
    }

    if (!hasOrg) {
      return <OrganizationSetup onComplete={() => refresh()} />;
    }
    return <Dashboard />;
  }

  return <LandingPage />;
}

export default App;
