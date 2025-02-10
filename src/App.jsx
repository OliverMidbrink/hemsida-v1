import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import useAuthStore from './stores/authStore';
import Search from './components/Search';

function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route 
          path="dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route path="/search" element={<Search />} />
      </Route>
    </Routes>
  );
}

export default App; 