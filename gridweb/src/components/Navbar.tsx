import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, LogOut, Ticket, Menu, X, Shield, Settings, Calendar, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminContext } from "@/hooks/useAdminContext";
import gridLogo from "@/assets/grid-logo.png";
import { NotificationBell } from '@/components/NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isAdmin } = useAdminContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center ">
            <motion.div whileHover={{ scale: 1.05 }}>
              <img src={gridLogo} alt="GRID" className="h-12 object-contain" />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="glass" className="gap-2">
                      <User className="w-4 h-4" />
                      <span className="max-w-[150px] truncate">{user.email?.split("@")[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/my-events" className="flex items-center gap-2 cursor-pointer">
                        <Calendar className="w-4 h-4" />
                        My Events
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-tickets" className="flex items-center gap-2 cursor-pointer">
                        <Ticket className="w-4 h-4" />
                        My Tickets
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/support/tickets" className="flex items-center gap-2 cursor-pointer">
                        <HelpCircle className="w-4 h-4" />
                        Support Tickets
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="gradient">Sign up / Log in</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {user && <NotificationBell />}
            <button className="p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pt-4 pb-2 border-t border-border mt-4"
          >
            {user ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground px-2">{user.email}</div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/my-events"
                  className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="w-4 h-4" />
                  My Events
                </Link>
                <Link
                  to="/my-tickets"
                  className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Ticket className="w-4 h-4" />
                  My Tickets
                </Link>
                <Link
                  to="/support/tickets"
                  className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HelpCircle className="w-4 h-4" />
                  Support Tickets
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-lg w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="gradient" className="w-full">
                  Sign up / Log in
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
