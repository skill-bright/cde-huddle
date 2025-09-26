import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StandupDashboard from './components/StandupDashboard';
import { useColorScheme } from './hooks/useColorScheme';

function App() {
  // Initialize color scheme detection
  useColorScheme();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<StandupDashboard />} />
        <Route path="/weekly-reports" element={<StandupDashboard initialTab="weekly" />} />
        <Route path="/weekly-reports/:reportId" element={<StandupDashboard initialTab="weekly" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;