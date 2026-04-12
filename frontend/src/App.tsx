import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
import Actions from "@/pages/Actions";
import Reports from "@/pages/Reports";
import Scans from "@/pages/Scans";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"var(--muted)",fontFamily:"var(--font-mono)",fontSize:13 }}>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  useEffect(() => { checkAuth(); }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="actions" element={<Actions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="scans" element={<Scans />} />
      </Route>
      <Route path="/assess/:clientId/:frameworkId" element={<PrivateRoute><Assessment /></PrivateRoute>} />
      <Route path="/results/:assessmentId" element={<PrivateRoute><Results /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
