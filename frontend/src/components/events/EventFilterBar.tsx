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
import { EVENT_STATUS_OPTIONS } from "../../schemas/event.schema.ts";
import type { EventCategory, EventStatus } from "../../types/event.types.ts";
import type {
  EventFilterState,
  EventSortField,
} from "../../utils";

const { RangePicker } = DatePicker;

const SORT_OPTIONS: { label: string; value: EventSortField }[] = [
  { label: "Created Date", value: "createdAt" },
  { label: "Start Date", value: "startDate" },
  { label: "Event Title", value: "title" },
  { label: "Ticket Price", value: "price" },
];

export interface EventFilterBarProps {
  filters: EventFilterState;
  categories: EventCategory[];
  onFilterChange: <K extends keyof EventFilterState>(
    key: K,
    value: EventFilterState[K],
  ) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  showStatusFilter?: boolean;
  loadingCategories?: boolean;
}

export function EventFilterBar({
  filters,
  categories,
  onFilterChange,
  onReset,
  hasActiveFilters,
  showStatusFilter = false,
  loadingCategories = false,
}: EventFilterBarProps): ReactElement {
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
        {/* Search by Title */}
        <div
          className={
            showStatusFilter ? "sm:col-span-2 lg:col-span-3" : "sm:col-span-2 lg:col-span-4"
          }
        >
          <Input
            allowClear
            prefix={<SearchOutlined className="text-dim-grey-400" />}
            placeholder="Search by event title..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-2">
          <Select<string>
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All Categories"
            loading={loadingCategories}
            value={filters.categoryId}
            onChange={(value) => onFilterChange("categoryId", value)}
            options={categories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
            className="w-full"
          />
        </div>

        {/* Optional Status Filter */}
        {showStatusFilter && (
          <div className="lg:col-span-2">
            <Select<EventStatus>
              allowClear
              placeholder="All Statuses"
              value={filters.status}
              onChange={(value) => onFilterChange("status", value)}
              options={EVENT_STATUS_OPTIONS}
              className="w-full"
            />
          </div>
        )}

        {/* Date Range Filter */}
        <div className={showStatusFilter ? "lg:col-span-2" : "lg:col-span-3"}>
          <RangePicker
            allowClear
            value={dateRangeValue}
            format="MMM D, YYYY"
            placeholder={["Start date", "End date"]}
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

        {/* Sort Field + Direction + Clear */}
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
          <Select<EventSortField>
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
          {hasActiveFilters && (
            <Button
              type="text"
              className="flex! items-center gap-1 text-xs! text-dim-grey-600! hover:text-peach-fuzz-600! px-2! shrink-0"
              onClick={onReset}
            >
              <ClearOutlined />
              <span className="hidden xl:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default EventFilterBar;
