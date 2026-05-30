import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">SafeReturn</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">My Plans</Link>
            <Link to="/new-plan" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">New Plan</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user && <span className="text-sm text-muted-foreground">{user.full_name || user.email}</span>}
            <Button variant="ghost" size="icon" onClick={() => { base44.auth.logout(); }}>
              <LogOut className="w-4 h-4" />
            </Button>
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