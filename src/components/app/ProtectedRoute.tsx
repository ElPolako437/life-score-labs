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

  // Admin check — ONLY trust app_metadata.role (server-set, not user-editable).
  // user_metadata is user-writable and must NEVER be used for authorization.
  // Server-side admin operations additionally verify role in user_profiles.
  if (requireAdmin) {
    const role = user.app_metadata?.role;
    if (role !== 'admin') {
      return <Navigate to="/app/home" replace />;
    }
  }

  return <>{children}</>;
}
