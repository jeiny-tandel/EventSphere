import type { ReactElement } from "react";
import { Link, NavLink } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";
import type { DashboardNavItem } from "../../constants/navigation.ts";
import { ROUTES } from "../../constants/routes.ts";

export interface DashboardSidebarProps {
  items: DashboardNavItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({
  items,
  isOpen,
  onClose,
}: DashboardSidebarProps): ReactElement {
  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-dim-grey-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
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
            onClick={onClose}
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
          {items.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end
              onClick={onClose}
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
    </>
  );
}

export default DashboardSidebar;
