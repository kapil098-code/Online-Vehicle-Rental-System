import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Vehicles from './pages/Vehicles.jsx';
import VehicleDetail from './pages/VehicleDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import AdminVehicles from './pages/admin/AdminVehicles.jsx';
import AdminBookings from './pages/admin/AdminBookings.jsx';
import AdminVerifications from './pages/admin/AdminVerifications.jsx';

export default function App() {
    return (
        <>
            <Navbar />
            <main className="container">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/vehicles" element={<Vehicles />} />
                    <Route path="/vehicles/:id" element={<VehicleDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminHome /></ProtectedRoute>} />
                    <Route path="/admin/vehicles" element={<ProtectedRoute adminOnly><AdminVehicles /></ProtectedRoute>} />
                    <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><AdminBookings /></ProtectedRoute>} />
                    <Route path="/admin/verifications" element={<ProtectedRoute adminOnly><AdminVerifications /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <footer className="footer">© 2026 RentRide · Online Vehicle Rental System · MCA Project</footer>
        </>
    );
}
