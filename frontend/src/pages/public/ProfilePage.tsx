import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { Alert, Empty, Spin, Tag } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Card, PageHeader } from "../../components/common";
import { ROUTES } from "../../constants/routes.ts";
import { useAppSelector } from "../../hooks/redux.ts";
import { formatDate, hasPermission } from "../../utils";

export function ProfilePage(): ReactElement {
  const { user, isLoading, error } = useAppSelector((state) => state.auth);

  const hasDashboardAccess = hasPermission(user, "dashboard.access");

  const getInitials = (): string => {
    const first = user?.firstName?.[0] || "";
    const last = user?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "User Profile";

  // Loading State
  if (isLoading && !user) {
    return (
      <div className="mx-auto flex min-h-90 max-w-4xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <Spin size="large" />
      </div>
    );
  }

  // Error State
  if (error && !user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Alert
          type="error"
          message="Unable to load profile"
          description={error}
          showIcon
        />
      </div>
    );
  }

  // Fallback Empty State
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="rounded-xl border border-dim-grey-200 bg-white p-8 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-sm text-dim-grey-500">
                No user profile details available.
              </span>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <PageHeader
        title="My Profile"
        description="View your personal details, role assignments, and account status."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link to={ROUTES.MY_REGISTRATIONS}>
              <Button type="default" className="text-xs!">
                My Registrations
              </Button>
            </Link>
            {hasDashboardAccess && (
              <Link to={ROUTES.DASHBOARD}>
                <Button type="primary" className="text-xs!">
                  Management Dashboard
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Profile Overview Card */}
      <Card
        className="rounded-2xl border border-dim-grey-200 bg-white shadow-xs"
        bodyClassName="!p-6 sm:!p-8"
      >
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          {/* Avatar Initials Badge */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-peach-fuzz-100 text-2xl font-extrabold text-peach-fuzz-700 shadow-inner">
            {getInitials()}
          </div>

          {/* User Headline & Status Tags */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
              <h2 className="text-2xl font-bold text-dim-grey-900">
                {fullName}
              </h2>
              <Tag
                color={user.isActive ? "success" : "error"}
                icon={
                  user.isActive ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )
                }
                className="font-medium mr-0"
              >
                {user.isActive ? "Active" : "Inactive"}
              </Tag>
              {user.role?.name && (
                <Tag
                  color={hasDashboardAccess ? "purple" : "blue"}
                  icon={<SafetyCertificateOutlined />}
                  className="font-medium uppercase mr-0"
                >
                  {user.role.name}
                </Tag>
              )}
            </div>

            <p className="flex items-center justify-center gap-2 text-sm text-dim-grey-600 sm:justify-start">
              <MailOutlined className="text-peach-fuzz-500" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Detailed Profile Sections */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card
          className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
          bodyClassName="!p-6 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-dim-grey-100 pb-3">
            <UserOutlined className="text-base text-peach-fuzz-500" />
            <h3 className="font-bold text-dim-grey-900 text-base">
              Personal Information
            </h3>
          </div>

          <div className="space-y-3.5 text-sm">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-dim-grey-400">
                First Name
              </span>
              <span className="mt-0.5 font-medium text-dim-grey-800">
                {user.firstName || "—"}
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-dim-grey-400">
                Last Name
              </span>
              <span className="mt-0.5 font-medium text-dim-grey-800">
                {user.lastName || "—"}
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-dim-grey-400">
                Email Address
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 font-medium text-dim-grey-800">
                <MailOutlined className="text-xs text-dim-grey-400" />
                {user.email}
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-dim-grey-400">
                Phone Number
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 font-medium text-dim-grey-800">
                <PhoneOutlined className="text-xs text-dim-grey-400" />
                {user.phoneNumber ? (
                  user.phoneNumber
                ) : (
                  <span className="italic text-dim-grey-400">Not provided</span>
                )}
              </span>
            </div>
          </div>
        </Card>

        {/* Account & Role Information */}
        <Card
          className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
          bodyClassName="!p-6 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-dim-grey-100 pb-3">
            <SafetyCertificateOutlined className="text-base text-peach-fuzz-500" />
            <h3 className="font-bold text-dim-grey-900 text-base">
              Account & Role
            </h3>
          </div>

          <div className="space-y-3.5 text-sm">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-dim-grey-400">
                Assigned Role
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Tag
                  color={hasDashboardAccess ? "purple" : "blue"}
                  className="font-semibold uppercase"
                >
                  {user.role?.name || "Attendee"}
                </Tag>
              </div>
              {user.role?.description && (
                <p className="mt-1 text-xs text-dim-grey-500">
                  {user.role.description}
                </p>
              )}
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-dim-grey-400">
                Account Status
              </span>
              <div className="mt-1">
                <Tag
                  color={user.isActive ? "success" : "error"}
                  className="font-medium"
                >
                  {user.isActive ? "Active Account" : "Inactive Account"}
                </Tag>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-dim-grey-400">
                Member Since
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 font-medium text-dim-grey-800">
                <CalendarOutlined className="text-xs text-dim-grey-400" />
                {formatDate(user.createdAt)}
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-dim-grey-400">
                User Identifier
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-dim-grey-600">
                <IdcardOutlined className="text-xs text-dim-grey-400" />
                {user.id}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ProfilePage;
