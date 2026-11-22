import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useId } from "react";

import { usePagination } from "@/registry/default/hooks/use-pagination";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/registry/default/ui/pagination";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay?: number;
};

export default function Component({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
}: PaginationProps) {
  const id = useId();

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    paginationItemsToDisplay,
    totalPages,
  });

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Pagination */}
      <div>
        <Pagination>
          <PaginationContent>
            {/* Previous page button */}
            <PaginationItem>
              <PaginationLink
                aria-disabled={currentPage === 1 ? true : undefined}
                aria-label="Go to previous page"
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                href={
                  currentPage === 1 ? undefined : `#/page/${currentPage - 1}`
                }
                role={currentPage === 1 ? "link" : undefined}
              >
                <ChevronLeftIcon aria-hidden="true" size={16} />
              </PaginationLink>
            </PaginationItem>

            {/* Left ellipsis (...) */}
            {showLeftEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Page number links */}
            {pages.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href={`#/page/${page}`}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* Right ellipsis (...) */}
            {showRightEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Next page button */}
            <PaginationItem>
              <PaginationLink
                aria-disabled={currentPage === totalPages ? true : undefined}
                aria-label="Go to next page"
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                href={
                  currentPage === totalPages
                    ? undefined
                    : `#/page/${currentPage + 1}`
                }
                role={currentPage === totalPages ? "link" : undefined}
              >
                <ChevronRightIcon aria-hidden="true" size={16} />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Go to page input */}
      <div className="flex items-center gap-3">
        <Label className="whitespace-nowrap" htmlFor={id}>
          Go to page
        </Label>
        <Input
          className="w-14"
          defaultValue={String(currentPage)}
          id={id}
          type="text"
        />
      </div>
    </div>
  );
}
