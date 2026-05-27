import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/trips/CreateTrip';
import TripsList from './pages/trips/TripsList';
import TripDetail from './pages/trips/TripDetail';
import CreateService from './pages/services/CreateService';
import ServicesList from './pages/services/ServicesList';
import ServiceDetail from './pages/services/ServiceDetail';
import EditProfile from './pages/profile/EditProfile';
import PublicProfile from './pages/profile/PublicProfile';
import Explore from './pages/Explore';
import Messages from './pages/messages/Messages';
import ConversationView from './pages/messages/ConversationView';
import ProtectedRoute from './components/ProtectedRoute';
import MyListings from './pages/MyListings';
import NotFound from './pages/NotFound';
import { UIProvider } from './context/UIContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UIProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/trips/create" element={<ProtectedRoute><CreateTrip /></ProtectedRoute>} />
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route path="/trips" element={<ProtectedRoute><TripsList /></ProtectedRoute>} />
          <Route path="/services/create" element={<ProtectedRoute><CreateService /></ProtectedRoute>} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/services" element={<ProtectedRoute><ServicesList /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/users/:id" element={<PublicProfile />} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute><ConversationView /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </UIProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

