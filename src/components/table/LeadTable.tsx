import * as React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Lead, LeadStatus } from "@/types/lead";

export type Sort = { field: keyof Lead; order: "asc" | "desc" } | null;

type Props = {
  rows: Lead[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  sort: Sort;
  onSortChange: (next: Sort) => void;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
  onRowClick?: (row: Lead) => void;
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
const STATUS_BADGE: Record<LeadStatus, BadgeVariant> = {
  Active: "default",
  Pending: "outline",
  Inactive: "secondary",
};

function SortableTh({
  label,
  active,
  order,
  onClick,
  className = "",
}: {
  label: string;
  active?: boolean;
  order?: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <TableHead
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`select-none px-3 py-2 sm:px-4 sm:py-3 text-left hover:underline ${className}`}
      aria-sort={
        active ? (order === "asc" ? "ascending" : "descending") : "none"
      }
    >
      {label}
      {active ? (order === "asc" ? " ↑" : " ↓") : ""}
    </TableHead>
  );
}

function PaginationBar({
  total,
  page,
  pageSize,
  onPageChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs sm:text-sm text-muted-foreground">
        {total > 0 ? (
          <>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </>
        ) : (
          <>No results</>
        )}
      </div>
      <div className="flex gap-2 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange((p) => Math.min(pages, p + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function LeadsTable({
  rows,
  loading,
  total,
  page,
  pageSize,
  sort,
  onSortChange,
  onPageChange,
  onRowClick,
}: Props) {
  const toggleScoreSort = () => {
    const next: Sort =
      sort && sort.field === "score"
        ? { field: "score", order: sort.order === "asc" ? "desc" : "asc" }
        : { field: "score", order: "asc" };
    onSortChange(next);
  };

  function makeRowHandler(row: Lead) {
    return (e: React.MouseEvent<HTMLTableRowElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, input, select, textarea, [role='button']"))
        return;
      onRowClick?.(row);
    };
  }

  return (
    <div className="rounded-md border bg-white overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Name
            </TableHead>
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Email
            </TableHead>
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Company
            </TableHead>
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Source
            </TableHead>
            <SortableTh
              label="Score"
              className="w-20"
              active={sort?.field === "score"}
              order={sort?.order}
              onClick={toggleScoreSort}
            />
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Status
            </TableHead>
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Created
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                Loading…
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No results
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const clickable = Boolean(onRowClick);
              return (
                <TableRow
                  key={row.id}
                  className={`text-xs sm:text-sm ${clickable ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                  {...(clickable
                    ? {
                        onClick: makeRowHandler(row),
                        tabIndex: 0,
                        onKeyDown: (
                          e: React.KeyboardEvent<HTMLTableRowElement>,
                        ) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick?.(row);
                          }
                        },
                      }
                    : {})}
                >
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                    <span className="block max-w-[180px] truncate sm:max-w-none">
                      {row.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    <span className="block max-w-[220px] truncate">
                      {row.email}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                    <span className="block max-w-[180px] truncate sm:max-w-none">
                      {row.company}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    {row.source}
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    {row.score}
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    <Badge variant={STATUS_BADGE[row.status]}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    {row.createdAt
                      ? new Intl.DateTimeFormat("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(row.createdAt))
                      : ""}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <PaginationBar
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
