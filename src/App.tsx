import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NewInspection from "./pages/NewInspection";
import InspectionDetail from "./pages/InspectionDetail";
import UserManagement from "./pages/UserManagement";
import Reports from "./pages/Reports";
import MachineCatalog from "./pages/MachineCatalog";
import CatalogManagement from "./pages/CatalogManagement";
import GovernmentDeliveryDashboard from "./pages/GovernmentDeliveryDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/nova-inspecao" element={<NewInspection />} />
          <Route path="/inspecao/:id" element={<InspectionDetail />} />
          <Route path="/admin/usuarios" element={<UserManagement />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/catalogo" element={<MachineCatalog />} />
          <Route path="/admin/catalogo" element={<CatalogManagement />} />
          <Route path="/entregas-governo" element={<GovernmentDeliveryDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
