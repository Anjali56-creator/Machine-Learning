import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="app-main">
        <Header onMenuClick={() => setNavOpen((o) => !o)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
