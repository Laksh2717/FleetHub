import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isUserAuthenticated, getStoredRole } from "../../utils/authUtils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const [_, setRerender] = useState(0);
  useEffect(() => {
    const handleStorage = () => setRerender((c) => c + 1);
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const computedIsLoggedIn = isUserAuthenticated();

  const handleDashboardClick = () => {
    const role = getStoredRole();
    if (role === "carrier") {
      navigate("/carrier/dashboard");
    } else if (role === "shipper") {
      navigate("/shipper/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 z-30 w-full transition-colors duration-300 ${
        scrolled ? "bg-zinc-950/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <button
          onClick={() => handleNavClick("hero")}
          className="text-2xl md:text-3xl font-extrabold tracking-wide cursor-pointer bg-transparent border-none p-0"
        >
          <span className="text-white">Fleet</span>
          <span className="text-orange-500">Hub</span>
        </button>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNavClick("platform-features")}
            className="text-gray-300 font-medium hover:text-orange-500 transition bg-transparent border-none p-0 cursor-pointer"
          >
            Platform Features
          </button>
          <button
            onClick={() => handleNavClick("for-shippers")}
            className="text-gray-300 font-medium hover:text-orange-500 transition bg-transparent border-none p-0 cursor-pointer"
          >
            For Shippers
          </button>
          <button
            onClick={() => handleNavClick("for-carriers")}
            className="text-gray-300 font-medium hover:text-orange-500 transition bg-transparent border-none p-0 cursor-pointer"
          >
            For Carriers
          </button>
        </div>

        {/* Login or Dashboard */}
        {computedIsLoggedIn ? (
          <button
            className="text-base font-medium text-white cursor-pointer hover:text-orange-500 transition"
            onClick={handleDashboardClick}
          >
            Go to dashboard
          </button>
        ) : (
          <button
            className="text-base font-medium text-white cursor-pointer hover:text-orange-500 transition"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
