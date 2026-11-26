import { useState, type ReactElement } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { Button } from "../components/common";
import { DashboardSidebar } from "../components/layout";
import { DASHBOARD_NAV_ITEMS } from "../constants/navigation.ts";
import { ROUTES } from "../constants/routes.ts";
import { useAppDispatch, useAppSelector } from "../hooks/redux.ts";
import { logoutUser } from "../store/slices/authSlice.ts";
import { hasPermission } from "../utils";

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

  const visibleNavItems = DASHBOARD_NAV_ITEMS.filter(
    (item) =>
      !item.requiredPermission || hasPermission(user, item.requiredPermission),
  );

  const currentNav = visibleNavItems.find(
    (item) => item.path === location.pathname,
  );

  const sectionTitle = currentNav ? currentNav.label : "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-dim-grey-50 text-dim-grey-900">
      {/* Sidebar Navigation */}
      <DashboardSidebar
        items={visibleNavItems}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Body */}
      <div className="flex flex-1 flex-col h-full min-w-0 min-h-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-dim-grey-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
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
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
