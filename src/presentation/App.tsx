import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StandupDashboard from '@/presentation/components/StandupDashboard/StandupDashboard';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ToastContainer } from '@/components/Toast';
import { useToast, ToastProvider } from '@/presentation/hooks/useToast';
import { ApiKeyStatusChecker } from '@/components/ApiKeyStatusChecker';

/**
 * Inner app component that uses the toast system
 */
function AppContent() {
  // Initialize color scheme detection
  useColorScheme();
  
  // Initialize toast system
  const { toasts, removeToast } = useToast();
  
  // Note: API key validation is now handled manually when needed
  // to prevent infinite loops and CORS issues during development

  return (
    <Router>
      <Routes>
        <Route path="/" element={<StandupDashboard />} />
        <Route path="/weekly-reports" element={<StandupDashboard initialTab="weekly" />} />
        <Route path="/weekly-reports/:reportId" element={<StandupDashboard initialTab="weekly" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* API Key Status Checker */}
      <ApiKeyStatusChecker />
    </Router>
  );
}

/**
 * Main App component with providers
 */
function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
