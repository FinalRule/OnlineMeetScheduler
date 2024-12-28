import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";
import { Link } from "wouter";
import EditProfileModal from "./EditProfileModal";

export default function Navigation() {
  const { user, logout } = useUser();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <nav className="bg-white border-b py-4 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold">Online Class Management</h1>
            {user.role === "admin" && (
              <Link href="/admin">
                <a className="text-gray-600 hover:text-gray-900">Admin Dashboard</a>
              </Link>
            )}
            {user.role === "teacher" && (
              <Link href="/teacher">
                <a className="text-gray-600 hover:text-gray-900">Teacher Dashboard</a>
              </Link>
            )}
            {user.role === "student" && (
              <Link href="/student">
                <a className="text-gray-600 hover:text-gray-900">Student Dashboard</a>
              </Link>
            )}
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