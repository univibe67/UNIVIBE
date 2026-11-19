import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "./Button";

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageCount, total, pageSize, onChange }: PaginationProps) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav aria-label={t("UI_Pagination")} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <p className="text-[13px] text-ink-500 tabular-nums">{t("UI_PaginationInfo", { start, end, total })}</p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="iconSm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={t("Admin_Previous")}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="min-w-12 text-center text-[13px] font-semibold text-ink-700 tabular-nums">
          {page} / {pageCount}
        </span>
        <Button
          variant="secondary"
          size="iconSm"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          aria-label={t("Admin_Next")}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </nav>
  );
}
