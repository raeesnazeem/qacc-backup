import { Outlet, useLocation } from "react-router-dom"
import { useRole } from "../hooks/useRole"
import { useSystemSettings } from "../hooks/useSystemSettings"
import { MaintenancePage } from "../pages/MaintenancePage"

export const MaintenanceGuard = () => {
  const { role } = useRole()
  const { systemSettings, isLoading } = useSystemSettings()
  const location = useLocation()

  // Wait until settings are loaded to prevent flicker
  // If there's an error fetching settings, we can default to showing the app
  // or checking what the error is. We'll just pass through if isLoading is true.
  if (isLoading) {
    // Optionally return a full screen loader or null to prevent flickering
    return null
  }

  const isMaintenanceMode = systemSettings?.is_maintenance_mode ?? false
  const isSuperAdmin = role === "super_admin"

  // Allow access to auth/onboarding pages even in maintenance mode
  const isExcludedPath = [
    "/login",
    "/register",
    "/onboarding",
    "/sso-callback"
  ].some(path => location.pathname.startsWith(path))

  if (isMaintenanceMode && !isSuperAdmin && !isExcludedPath) {
    return <MaintenancePage />
  }

  return <Outlet />
}
