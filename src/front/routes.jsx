// router.jsx — FINAL FIX
// /portfolio/:slug is completely isolated — no Layout, no Navbar, no Footer

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
import { Login } from "./pages/auth/Login";
import { LoginProvider } from "./pages/auth/LoginProvider";
import { SignUpClient } from "./pages/auth/SignUpClient";
import { SignUpProvider } from "./pages/auth/SignUpProvider";
import { ProviderDashboard } from "./pages/dashboardProvider/ProviderDashboard";
import { DashboardHome } from "./pages/dashboardProvider/DashboardHome";
import { PrivateProviderRoute } from "./pages/dashboardProvider/PrivateProviderRoute";
import { JobDetails, JobsPage } from "./pages/jobs";
import { CustomersPage } from "./pages/customer/CustomersPage";
import CustomerDetails from "./pages/customer/CustomerDetails";
import ServicesP from "./pages/servicespage/ServicesP";
import ServicesDetails from "./pages/servicespage/ServicesDetails";
import EstimatesPage from "./pages/estimateRequest/Estimatespage";
import Estimatedetailpage from "./pages/estimateRequest/Estimatedetailpage";
import NewEstimateForm from "./pages/estimateRequest/Newestimateform";
import EditEstimatePage from "./pages/estimateRequest/EditEstimatePage";
import PublicPortfolioPage from "./pages/portfolioPage/PublicPortfolioPage";
import PortfolioDashboard from "./pages/portfolioPage/PortfolioDashboard";
import PortfolioEditor from "./pages/portfolioPage/PortfolioEditor";
import Settings from "./components/Settings/Settings";
import PaymentMethods from "./pages/payment/PaymentMethods";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import InvoiceDetailPage from "./pages/invoices/InvoiceDetailPage";
import CreateInvoicePage from "./pages/invoices/CreateInvoicePage";
import EditInvoicePage from "./pages/invoices/EditInvoicePage";

const ErrorDebug = () => {
  const error = useRouteError();
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
      {/* ── PUBLIC PORTFOLIO — completely standalone, NO Layout wrapper ── */}
      <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />

      {/* ── PUBLIC LAYOUT ROUTES ── */}
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
        <Route index element={<Home />} />
        <Route path="single/:theId" element={<Single />} />
        <Route path="demo" element={<Demo />} />
        <Route path="login" element={<Login />} />
        <Route path="loginprovider" element={<LoginProvider />} />
        <Route path="signupclient" element={<SignUpClient />} />
      </Route>

      {/* ── PROTECTED DASHBOARD ROUTES ── */}
      <Route
        path="/providerdashboard"
        element={<PrivateProviderRoute><ProviderDashboard /></PrivateProviderRoute>}
        errorElement={<ErrorDebug />}
      >
        <Route index element={<DashboardHome />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobdetails/:id" element={<JobDetails />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customer/:id" element={<CustomerDetails />} />
        <Route path="services" element={<ServicesP />} />
        <Route path="servicesDetails/:id" element={<ServicesDetails />} />
        <Route path="estimates" element={<EstimatesPage />} />
        <Route path="estimates/:id" element={<Estimatedetailpage />} />
        <Route path="estimate/new" element={<NewEstimateForm />} />
        <Route path="estimates/:id/edit" element={<EditEstimatePage />} />
        <Route path="portfolio" element={<PortfolioDashboard />} />
        <Route path="portfolio/settings" element={<PortfolioEditor />} />
        <Route path="settings" element={<Settings />} />
        <Route path="payment-methods" element={<PaymentMethods />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="invoices/new" element={<CreateInvoicePage />} />
        <Route path="invoices/:id/edit" element={<EditInvoicePage />} />
      </Route>

      <Route path="/signupprovider" element={<SignUpProvider />} />
    </>
  )
);