import { BrowserRouter, Routes, Route } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/layout/Layout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import UploadPage from '@/pages/UploadPage';
import DashboardPage from '@/pages/DashboardPage';
import ObjectDetailsPage from '@/pages/ObjectDetailsPage';
import ProfilePage from '@/pages/ProfilePage';
import SatelliteAnalysisPage from '@/pages/SatelliteAnalysisPage';
import PricingPage from '@/pages/PricingPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          {/* Public pages - no layout */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

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
    </BrowserRouter>
  );
}

export default App;
