import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import PropTypes from "prop-types";

const AdminRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // If allowedRoles is provided, check if user has one of them.
  // Otherwise default to standard admin types.
  const hasAccess = user && (allowedRoles 
    ? allowedRoles.includes(user.role)
    : ["admin", "event_manager", "super_admin"].includes(user.role)
  );

  if (!hasAccess) {
    // If they aren't logged in at all or don't have any admin role, send to login
    if (!user || !["admin", "event_manager", "super_admin"].includes(user.role)) {
      const path = window.location.pathname;
      if (path.startsWith("/super-admin")) return <Navigate to="/super-admin/login" replace />;
      if (path.startsWith("/event-manager")) return <Navigate to="/event-manager/login" replace />;
      return <Navigate to="/admin/login" replace />;
    }
    // If they are an admin but just lack the specific allowedRole for this page, send them Home (or their dashboard)
    return <Navigate to="/" replace />;
  }

  return children;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default AdminRoute;
