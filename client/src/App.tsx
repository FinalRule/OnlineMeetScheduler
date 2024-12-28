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
      <main className="py-8">
        <Switch>
          {user.role === "admin" && (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/subjects" component={AdminDashboard} />
              <Route path="/admin/schedule" component={AdminDashboard} />
              <Route path="/" component={AdminDashboard} />
            </>
          )}
          {user.role === "teacher" && (
            <>
              <Route path="/teacher" component={TeacherDashboard} />
              <Route path="/teacher/classes" component={TeacherDashboard} />
              <Route path="/" component={TeacherDashboard} />
            </>
          )}
          {user.role === "student" && (
            <>
              <Route path="/student" component={StudentDashboard} />
              <Route path="/student/classes" component={StudentDashboard} />
              <Route path="/" component={StudentDashboard} />
            </>
          )}
        </Switch>
      </main>
    </div>
  );
}

export default App;