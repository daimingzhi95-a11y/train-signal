import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LinePage from './pages/LinePage';
import SegmentPage from './pages/SegmentPage';
import UploadPage from './pages/UploadPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/line/:lineId" element={<LinePage />} />
        <Route path="/segment/:segmentId" element={<SegmentPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
