import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, ChevronDown } from "lucide-react";
import { useState as useDropdown } from "react";
import { useState, useEffect } from "react";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useDropdown(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between relative">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/6a1b2bf2fc37b8175a269ec2/9871eacf4_safe_return.svg"
              alt="SafeReturn"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">My Plans</Link>
            <Link to="/new-plan" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">New Plan</Link>
            <Link to="/founders" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Founders</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3 relative">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="max-w-32 truncate">{user.full_name || user.email}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg z-50 py-2">
                    <div className="px-4 py-2 border-b border-border mb-1">
                      <p className="text-xs font-medium text-foreground truncate">{user.full_name || "My Account"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors">
                      My Plans
                    </Link>
                    <div className="border-t border-border mt-1 pt-1">
                      <button onClick={() => base44.auth.logout()} className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted w-full transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-medium">Home</Link>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm font-medium">My Plans</Link>
            <Link to="/new-plan" onClick={() => setMenuOpen(false)} className="block text-sm font-medium">New Plan</Link>
            <Link to="/founders" onClick={() => setMenuOpen(false)} className="block text-sm font-medium">Founders</Link>
            <button onClick={() => { base44.auth.logout(); }} className="text-sm text-destructive">Sign Out</button>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}