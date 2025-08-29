import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StandupDashboard from './components/StandupDashboard';

function App() {
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