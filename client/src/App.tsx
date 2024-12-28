import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Navigation from "./components/Navigation";
import { useUser } from "./hooks/use-user";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Switch>
        {user.role === "admin" && (
          <>
            <Route path="/" component={AdminDashboard} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/teacher" component={TeacherDashboard} />
            <Route path="/student" component={StudentDashboard} />
          </>
        )}
        {user.role === "teacher" && (
          <>
            <Route path="/" component={TeacherDashboard} />
            <Route path="/teacher" component={TeacherDashboard} />
          </>
        )}
        {user.role === "student" && (
          <>
            <Route path="/" component={StudentDashboard} />
            <Route path="/student" component={StudentDashboard} />
          </>
        )}
      </Switch>
    </div>
  );
}

export default App;