import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, BookOpen, Users, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import EditProfileModal from "./EditProfileModal";

export default function Navigation() {
  const { user, logout } = useUser();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [location] = useLocation();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
  };

  const getNavLinks = () => {
    const links = [];

    if (user.role === "admin") {
      links.push(
        { href: "/admin", label: "Dashboard", icon: Users },
        { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
        { href: "/admin/schedule", label: "Schedule", icon: Calendar }
      );
    } else if (user.role === "teacher") {
      links.push(
        { href: "/teacher", label: "Dashboard", icon: Users },
        { href: "/teacher/classes", label: "My Classes", icon: BookOpen }
      );
    } else if (user.role === "student") {
      links.push(
        { href: "/student", label: "Dashboard", icon: Users },
        { href: "/student/classes", label: "My Classes", icon: BookOpen }
      );
    }

    return links;
  };

  return (
    <>
      <nav className="bg-white border-b py-4 px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold">Online Class Management</h1>
            <div className="flex items-center gap-4">
              {getNavLinks().map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <a className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                      location === link.href
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}>
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditProfileOpen(true)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span>{user.name}</span>
                <span className="text-sm text-gray-500 capitalize">({user.role})</span>
                <Settings className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
      />
    </>
  );
}