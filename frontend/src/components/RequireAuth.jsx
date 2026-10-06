import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useEffect } from "react";

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  useEffect(() => { if (!user) toast("Login required.", "error"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
