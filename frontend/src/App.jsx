import { Routes, Route } from "react-router-dom";
import React from "react";
import Landing from "./pages/Landing";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";
import RequireValidRole from "./routes/RequireValidRole";
import { appRoutes } from "./routes/routeConfig";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
        {appRoutes.map(({ path, element, role }) => (
          <Route
            key={path}
            path={path}
            element={
              <RequireValidRole requiredRole={role}>
                {React.createElement(element)}
              </RequireValidRole>
            }
          />
        ))}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
