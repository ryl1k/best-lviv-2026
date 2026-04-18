import { BrowserRouter, Routes, Route } from 'react-router';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/layout/Layout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import UploadPage from '@/pages/UploadPage';
import DashboardPage from '@/pages/DashboardPage';
import ObjectDetailsPage from '@/pages/ObjectDetailsPage';
import ProfilePage from '@/pages/ProfilePage';
import SatelliteAnalysisPage from '@/pages/SatelliteAnalysisPage';
import PricingPage from '@/pages/PricingPage';
import DocsPage from '@/pages/DocsPage';
import SupportPage from '@/pages/SupportPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          {/* Public pages - no layout */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* App pages - with layout */}
<Route
            path="/upload"
            element={
              <Layout>
                <UploadPage />
              </Layout>
            }
          />
          <Route
            path="/tasks/:id"
            element={
              <Layout>
                <DashboardPage />
              </Layout>
            }
          />
          <Route
            path="/tasks/:id/discrepancies/:discId"
            element={
              <Layout>
                <ObjectDetailsPage />
              </Layout>
            }
          />
          <Route
            path="/satellite"
            element={
              <Layout>
                <SatelliteAnalysisPage />
              </Layout>
            }
          />
          <Route
            path="/pricing"
            element={
              <Layout>
                <PricingPage />
              </Layout>
            }
          />
          <Route
            path="/docs"
            element={
              <Layout>
                <DocsPage />
              </Layout>
            }
          />
          <Route
            path="/support"
            element={
              <Layout>
                <SupportPage />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <ProfilePage />
              </Layout>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </TooltipProvider>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;
