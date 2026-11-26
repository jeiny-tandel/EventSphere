import type { ReactElement } from "react";
import { DatePicker, Input, Select } from "antd";
import {
  ClearOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Button, Card } from "../common";
import type { RegistrationStatus } from "../../types/registration.types.ts";
import type {
  RegistrationFilterState,
  RegistrationSortField,
} from "../../utils";

const { RangePicker } = DatePicker;

const STATUS_OPTIONS: { label: string; value: RegistrationStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const SORT_OPTIONS: { label: string; value: RegistrationSortField }[] = [
  { label: "Booking Date", value: "createdAt" },
  { label: "Event Title", value: "eventTitle" },
  { label: "Quantity", value: "quantity" },
  { label: "Total Price", value: "totalPrice" },
  { label: "Event Date", value: "eventStartDate" },
];

export interface RegistrationFilterBarProps {
  filters: RegistrationFilterState;
  onFilterChange: <K extends keyof RegistrationFilterState>(
    key: K,
    value: RegistrationFilterState[K],
  ) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  searchPlaceholder?: string;
}

export function RegistrationFilterBar({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
  searchPlaceholder = "Search by event title...",
}: RegistrationFilterBarProps): ReactElement {
  const dateRangeValue: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null =
    filters.dateRange[0] || filters.dateRange[1]
      ? [
          filters.dateRange[0] ? dayjs(filters.dateRange[0]) : null,
          filters.dateRange[1] ? dayjs(filters.dateRange[1]) : null,
        ]
      : null;

  return (
    <Card
      className="rounded-xl border border-dim-grey-200 bg-white shadow-xs"
      bodyClassName="!p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-center">
        {/* Search by Event Title */}
        <div className="sm:col-span-2 lg:col-span-3">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-dim-grey-400" />}
            placeholder={searchPlaceholder}
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-2">
          <Select<RegistrationStatus>
            allowClear
            placeholder="All Statuses"
            value={filters.status}
            onChange={(value) => onFilterChange("status", value)}
            options={STATUS_OPTIONS}
            className="w-full"
          />
        </div>

        {/* Booking Date Range Filter */}
        <div className="lg:col-span-3">
          <RangePicker
            allowClear
            value={dateRangeValue}
            format="MMM D, YYYY"
            placeholder={["Booked from", "Booked to"]}
            onChange={(dates) => {
              if (!dates) {
                onFilterChange("dateRange", [null, null]);
              } else {
                onFilterChange("dateRange", [
                  dates[0] ? dates[0].toISOString() : null,
                  dates[1] ? dates[1].toISOString() : null,
                ]);
              }
            }}
            className="w-full"
          />
        </div>

        {/* Sort Field + Direction + Clear Filters */}
        <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
          <Select<RegistrationSortField>
            value={filters.sortBy}
            onChange={(value) => onFilterChange("sortBy", value)}
            options={SORT_OPTIONS}
            className="flex-1 min-w-0"
          />
          <Button
            type="default"
            className="flex! items-center justify-center px-2.5! shrink-0"
            onClick={() =>
              onFilterChange(
                "sortOrder",
                filters.sortOrder === "asc" ? "desc" : "asc",
              )
            }
          >
            {filters.sortOrder === "asc" ? (
              <SortAscendingOutlined />
            ) : (
              <SortDescendingOutlined />
            )}
          </Button>
          <Button
            type="default"
            disabled={!hasActiveFilters}
            className="flex! items-center gap-1 text-xs! shrink-0"
            onClick={onReset}
          >
            <ClearOutlined />
            <span>Clear Filters</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default RegistrationFilterBar;
