// Import necessary components and functions from react-router-dom.

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  useRouteError,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { Login } from "./pages/Login";
import { LoginProvider } from "./pages/LoginProvider";
import { SignUpClient } from "./pages/SignUpClient";
import { SignUpProvider } from "./pages/SignUpProvider";
import { ProviderDashboard } from "./pages/dashboardProvider/ProviderDashboard"
import { DashboardHome } from "./pages/dashboardProvider/DashboardHome"
import { PrivateProviderRoute } from "./pages/dashboardProvider/PrivateProviderRoute"
import { JobsPage } from "./pages/jobs"
import { CustomersPage } from "./pages/customer/CustomersPage"
import CustomerDetails from "./pages/customer/CustomerDetails";
import ServicesP from "./pages/servicespage/ServicesP";

// Componente temporal para debug — ponlo arriba del router
const ErrorDebug = () => {
  const error = useRouteError(); // importa useRouteError de react-router-dom
  return (
    <div style={{ padding: "2rem", background: "red", color: "white" }}>
      <h1>ERROR CAPTURADO:</h1>
      <pre>{error?.message}</pre>
      <pre>{error?.stack}</pre>
    </div>
  );
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
        <Route index element={<Home />} />
        <Route path="single/:theId" element={<Single />} />
        <Route path="demo" element={<Demo />} />
        <Route path="login" element={<Login />} />
        <Route path="loginprovider" element={<LoginProvider />} />
        <Route path="signupclient" element={<SignUpClient />} />
      </Route>

      <Route
        path="/providerdashboard"
        element={<PrivateProviderRoute><ProviderDashboard /></PrivateProviderRoute>}
        errorElement={<ErrorDebug />}  // ← ahora sí lo encuentra
      >


        <Route index element={<DashboardHome />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customer/:id" element={<CustomerDetails />} />
        <Route path="services" element={<ServicesP />} />

      </Route>

      <Route path="/signupprovider" element={<SignUpProvider />} />
    </>
  )
);

