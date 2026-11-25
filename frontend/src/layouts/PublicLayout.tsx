import type { ReactElement } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Dropdown, type MenuProps } from "antd";
import {
  AppstoreOutlined,
  CalendarOutlined,
  DownOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ROUTES } from "../constants/routes.ts";
import { PUBLIC_NAV_ITEMS } from "../constants/navigation.ts";
import { useAppDispatch, useAppSelector } from "../hooks/redux.ts";
import { logoutUser } from "../store/slices/authSlice.ts";
import { hasPermission } from "../utils/permission.utils.ts";

export function PublicLayout(): ReactElement {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const hasDashboardAccess = hasPermission(user, 'dashboard.access');

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate(ROUTES.EVENTS);
  };

  const getInitials = (): string => {
    const first = user?.firstName?.[0] || "";
    const last = user?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "user-info",
      disabled: true,
      className: "cursor-default! opacity-100!",
      label: (
        <div className="py-1">
          <p className="font-semibold text-dim-grey-900 text-sm">
            {user ? `${user.firstName} ${user.lastName || ""}`.trim() : "User"}
          </p>
          <p className="text-xs text-dim-grey-500">
            {user?.role?.name || user?.email || "Member"}
          </p>
        </div>
      ),
    },
    {
      type: "divider",
    },
    ...(hasDashboardAccess
      ? [
          {
            key: "dashboard",
            icon: <AppstoreOutlined />,
            label: (
              <Link to={ROUTES.DASHBOARD} className="block w-full">
                Dashboard
              </Link>
            ),
          },
        ]
      : []),
    {
      key: "my-registrations",
      icon: <CalendarOutlined />,
      label: (
        <Link to={ROUTES.MY_REGISTRATIONS} className="block w-full">
          My Registrations
        </Link>
      ),
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: (
        <Link to={ROUTES.PROFILE} className="block w-full">
          My Profile
        </Link>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Log out",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-dim-grey-50 text-dim-grey-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-dim-grey-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Brand Logo / Name */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-peach-fuzz-500 uppercase">
              EventSphere
            </span>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden items-center gap-6 md:flex">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium text-dim-grey-600 transition-colors hover:text-peach-fuzz-500"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Links */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Attendee / Member Shortcut: My Registrations */}
              <Link
                to={ROUTES.MY_REGISTRATIONS}
                className="hidden md:inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-dim-grey-700 transition-colors hover:text-peach-fuzz-500"
              >
                My Registrations
              </Link>

              {/* User Dropdown */}
              <Dropdown
                menu={{ items: menuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg p-1.5 text-dim-grey-700 transition-colors hover:bg-dim-grey-100 cursor-pointer focus:outline-hidden"
                  aria-label="User menu"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-peach-fuzz-100 font-bold text-peach-fuzz-700 text-xs">
                    {getInitials()}
                  </div>
                  <span className="hidden text-sm font-medium sm:inline-block max-w-30 truncate">
                    {user?.firstName || "Account"}
                  </span>
                  <DownOutlined className="text-[10px] text-dim-grey-400" />
                </button>
              </Dropdown>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to={ROUTES.LOGIN}
                className="rounded-lg px-4 py-2 text-sm font-medium text-dim-grey-700 transition-colors hover:text-peach-fuzz-500"
              >
                Log in
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="rounded-lg bg-peach-fuzz-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-peach-fuzz-600"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex items-center justify-center gap-6 border-t border-dim-grey-100 py-2.5 md:hidden">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-xs font-medium text-dim-grey-600 transition-colors hover:text-peach-fuzz-500"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-dim-grey-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <span className="text-lg font-bold tracking-tight text-peach-fuzz-500 uppercase">
                EventSphere
              </span>
              <p className="mt-1 max-w-sm text-sm text-dim-grey-600">
                A modern event and workshop management platform to discover,
                host, and celebrate experiences.
              </p>
            </div>

            {/* Footer Navigation Links */}
            <div className="flex items-center gap-6 text-sm text-dim-grey-600">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="transition-colors hover:text-peach-fuzz-500"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-dim-grey-100 pt-6 text-center text-xs text-dim-grey-500">
            &copy; {new Date().getFullYear()} EventSphere. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
