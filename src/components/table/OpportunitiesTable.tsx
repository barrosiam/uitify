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
import type { Opportunity } from "@/types/opportunity";

export type OppSort = {
  field: keyof Opportunity;
  order: "asc" | "desc";
} | null;

type Props = {
  rows: Opportunity[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  sort: OppSort;
  onSortChange: (next: OppSort) => void;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
  onRowClick?: (row: Opportunity) => void;
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

export default function OpportunitiesTable({
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
  const toggleAmountSort = () => {
    const next: OppSort =
      sort && sort.field === "amount"
        ? { field: "amount", order: sort.order === "asc" ? "desc" : "asc" }
        : { field: "amount", order: "asc" };
    onSortChange(next);
  };

  const money = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n || 0);

  return (
    <div className="rounded-md border bg-white overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Name
            </TableHead>
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Account Name
            </TableHead>
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Contact
            </TableHead>
            <SortableTh
              label="Amount"
              className="w-28"
              active={sort?.field === "amount"}
              order={sort?.order}
              onClick={toggleAmountSort}
            />
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Stage
            </TableHead>
            <TableHead className="px-3 py-2 sm:px-4 sm:py-3 text-left">
              Close date
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                Loading…
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
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
                        onClick: (e: React.MouseEvent<HTMLTableRowElement>) => {
                          const t = e.target as HTMLElement;
                          if (
                            t.closest(
                              "a,button,input,select,textarea,[role='button']",
                            )
                          )
                            return;
                          onRowClick?.(row);
                        },
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
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    <span className="block max-w-[240px] truncate">
                      {row.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    <span className="block max-w-[200px] truncate">
                      {row.account}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    <span className="block max-w-[220px] truncate">
                      {row.contactEmail}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    {money(row.amount)}
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    {row.stage}
                  </TableCell>
                  <TableCell className="px-3 py-2 sm:px-4 sm:py-3">
                    {row.closeDate
                      ? new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                        }).format(new Date(row.closeDate))
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
