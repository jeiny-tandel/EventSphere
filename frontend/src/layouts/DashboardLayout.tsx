import { useState, type ReactElement, type ReactNode } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  AppstoreOutlined,
  CloseOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Button } from "../components/common";
import { ROUTES } from "../constants/routes.ts";
import { useAppDispatch, useAppSelector } from "../hooks/redux.ts";
import { logoutUser } from "../store/slices/authSlice.ts";

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: ReactNode;
}

const DASHBOARD_NAV_ITEMS: NavItem[] = [
  {
    key: "overview",
    label: "Overview",
    path: ROUTES.DASHBOARD,
    icon: <AppstoreOutlined className="text-base" />,
  },
];

export function DashboardLayout(): ReactElement {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate(ROUTES.LOGIN);
  };

  const getInitials = (): string => {
    const first = user?.firstName?.[0] || "";
    const last = user?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const currentNav = DASHBOARD_NAV_ITEMS.find(
    (item) => item.path === location.pathname,
  );
  const sectionTitle = currentNav ? currentNav.label : "Dashboard";

  return (
    <div className="flex min-h-screen bg-dim-grey-50 text-dim-grey-900">
      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-dim-grey-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-dim-grey-200 px-6">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-peach-fuzz-500 uppercase">
              EventSphere
            </span>
            <span className="rounded-md bg-peach-fuzz-50 px-1.5 py-0.5 text-[10px] font-bold text-peach-fuzz-700 uppercase">
              App
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-dim-grey-500 hover:bg-dim-grey-100 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <div className="px-3 pb-2 text-[11px] font-bold text-dim-grey-400 uppercase tracking-wider">
            Menu
          </div>
          {DASHBOARD_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-peach-fuzz-500 text-white shadow-xs"
                    : "text-dim-grey-600 hover:bg-dim-grey-100 hover:text-dim-grey-900"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer with Public Site Link */}
        <div className="border-t border-dim-grey-200 p-4">
          <Link
            to={ROUTES.HOME}
            className="flex items-center justify-center gap-2 rounded-lg border border-dim-grey-200 px-3 py-2 text-xs font-medium text-dim-grey-600 transition-colors hover:bg-dim-grey-50 hover:text-dim-grey-900"
          >
            <span>&larr; Public Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-dim-grey-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-dim-grey-600 hover:bg-dim-grey-100 md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <MenuOutlined className="text-lg" />
            </button>
            <h1 className="text-lg font-bold text-dim-grey-900">
              {sectionTitle}
            </h1>
          </div>

          {/* Right User Bar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-peach-fuzz-100 font-bold text-peach-fuzz-700 text-xs">
                {getInitials()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-dim-grey-900">
                  {user
                    ? `${user.firstName} ${user.lastName || ""}`.trim()
                    : "User"}
                </p>
                <p className="text-[11px] text-dim-grey-500">
                  {user?.role?.name || user?.email || "Member"}
                </p>
              </div>
            </div>

            <Button
              type="default"
              className="flex! items-center gap-1.5 text-xs! text-dim-grey-600! hover:text-peach-fuzz-600!"
              onClick={handleLogout}
            >
              <LogoutOutlined />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
