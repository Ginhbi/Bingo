import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthPage } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Room } from "./pages/Room";

// Utility component to wrap the app based on device preference
function DeviceWrapper({ children }: { children: React.ReactNode }) {
  const isMobileLayout = localStorage.getItem('bingoDeviceLayout') === 'mobile';
  
  if (isMobileLayout) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center md:py-8 overflow-hidden">
        <div className="w-full max-w-[430px] h-screen md:h-[850px] bg-white md:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col border border-slate-200">
          {children}
        </div>
      </div>
    );
  }

  // Desktop layout (full width, fluid)
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Carregando o Jogo...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

function MainRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/room/:roomId" element={<ProtectedRoute><Room /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <DeviceWrapper>
      <AuthProvider>
        <Router>
          <MainRoutes />
        </Router>
      </AuthProvider>
    </DeviceWrapper>
  );
}
