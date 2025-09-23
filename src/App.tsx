import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Crisis from "./pages/Crisis";
import { Moderation } from "./pages/Moderation";
import VerifiedHostPayment from "./pages/VerifiedHostPayment";
import CreateCommunity from "./pages/CreateCommunity";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "./contexts/AuthContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/crisis/:id" element={<Crisis />} />
            <Route path="/moderation" element={<Moderation />} />
            <Route path="/become-host" element={<VerifiedHostPayment />} />
            <Route path="/create-community" element={<CreateCommunity />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
