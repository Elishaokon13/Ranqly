import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';

// Layout
import Layout from './components/layout/layout';

// Pages
import HomePage from './pages/HomePage';
import ContestsPage from './pages/ContestsPage';
import ContestDetailsPage from './pages/ContestDetailsPage';
import CreateContestPage from './pages/CreateContestPage';
import SubmitPage from './pages/SubmitPage';
import VotePage from './pages/VotePage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Global styles
import './index.css';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ranqly-ui-theme">
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/contests" element={<ContestsPage />} />
              <Route path="/contests/:id" element={<ContestDetailsPage />} />
              <Route path="/contests/create" element={<CreateContestPage />} />
              <Route path="/contests/:id/submit" element={<SubmitPage />} />
              <Route path="/contests/:id/vote" element={<VotePage />} />
              
              {/* User Routes */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:address" element={<ProfilePage />} />
              
              {/* Analytics Routes */}
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
          <Toaster />
        </div>
      </Router>
    </ThemeProvider>
  );
}

// 404 Page Component
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a 
          href="/" 
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};

export default App;