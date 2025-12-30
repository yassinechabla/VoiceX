import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={token ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="tables" element={<Tables />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

