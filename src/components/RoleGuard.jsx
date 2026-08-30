import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RoleGuard({ children, allowedRoles, redirectTo = '/unauthorized' }) {
  const { user, isLoading } = useAuth()

  // If auth is still loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If no roles are specified, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return children
  }

  // Check if user has the required role
  const hasRequiredRole = allowedRoles.some(
    role => role.toUpperCase() === user.role?.toUpperCase()
  )

  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default RoleGuard