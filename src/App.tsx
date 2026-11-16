import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import { Privacy, Terms } from './pages/Legal';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
