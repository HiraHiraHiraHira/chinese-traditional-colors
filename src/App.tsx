import { Navigate, Route, Routes } from 'react-router-dom';
import { GalleryProvider } from './context/GalleryContext';
import { Layout } from './components/Layout';
import { GalleryPage } from './pages/GalleryPage';
import { MatrixPage } from './pages/MatrixPage';
import { ColorDetailPage } from './pages/ColorDetailPage';
import { DyeLabPage } from './pages/DyeLabPage';

export default function App() {
  return (
    <GalleryProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<GalleryPage />} />
          <Route path="/matrix" element={<MatrixPage />} />
          <Route path="/lab" element={<DyeLabPage />} />
          <Route path="/color/:slug" element={<ColorDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </GalleryProvider>
  );
}
