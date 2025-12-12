import { Link } from "@tanstack/react-router";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/standups", label: "Standups" },
    { to: "/settings", label: "Settings" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-white/10 border-b bg-black/50 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-6 py-4">
        <Link className="font-bold font-mono text-xl tracking-tighter" to="/">
          DAILY BOT
        </Link>
        <nav className="flex gap-6 font-medium text-sm">
          {links.map(({ to, label }) => (
            <Link
              className="transition-colors hover:text-primary [&.active]:font-bold [&.active]:text-primary"
              key={to}
              to={to}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
