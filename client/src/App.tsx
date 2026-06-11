import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import GroupDashboard from "./pages/GroupDashboard";
import Calendar from "./pages/Calendar";
import MedicalLog from "./pages/MedicalLog";
import Tasks from "./pages/Tasks";
import Documents from "./pages/Documents";
import Timeline from "./pages/Timeline";
import Team from "./pages/Team";
import Notifications from "./pages/Notifications";
import AcceptInvite from "./pages/AcceptInvite";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/group/:id" component={GroupDashboard} />
      <Route path="/group/:id/calendar" component={Calendar} />
      <Route path="/group/:id/log" component={MedicalLog} />
      <Route path="/group/:id/tasks" component={Tasks} />
      <Route path="/group/:id/documents" component={Documents} />
      <Route path="/group/:id/timeline" component={Timeline} />
      <Route path="/group/:id/team" component={Team} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/invite/:token" component={AcceptInvite} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
