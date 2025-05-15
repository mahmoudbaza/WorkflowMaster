import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from "@/pages/dashboard";
import MyRequests from "@/pages/my-requests";
import Approvals from "@/pages/approvals";
import Announcements from "@/pages/announcements";
import Documents from "@/pages/documents";
import Admin from "@/pages/admin";
import Config from "@/pages/config";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/my-requests" component={MyRequests} />
      <Route path="/approvals" component={Approvals} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/documents" component={Documents} />
      <Route path="/admin" component={Admin} />
      <Route path="/config" component={Config} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MainLayout>
          <Router />
        </MainLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
