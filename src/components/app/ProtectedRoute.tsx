import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin check — role is in user_metadata or app_metadata set by Supabase
  if (requireAdmin) {
    const role = user.app_metadata?.role ?? user.user_metadata?.role;
    if (role !== 'admin') {
      return <Navigate to="/app/home" replace />;
    }
  }

  return <>{children}</>;
}
