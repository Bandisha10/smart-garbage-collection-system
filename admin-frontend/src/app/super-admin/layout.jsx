import SuperAdminProtectedRoute from '../../components/super-admin/SuperAdminProtectedRoute';

export const metadata = {
  title: 'EcoSyz - Super Admin Portal',
  description: 'Master control dashboard for EcoSyz Smart Garbage Collection Management System',
};

export default function SuperAdminAppLayout({ children }) {
  return (
    <SuperAdminProtectedRoute>
      {children}
    </SuperAdminProtectedRoute>
  );
}
