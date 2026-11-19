import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import IconTile from "./IconTile";
import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  tone?: "danger" | "brand";
  icon?: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  tone = "danger",
  icon,
  confirmLabel,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      dismissible={!loading}
      icon={<IconTile tone={tone}>{icon ?? <AlertTriangle size={19} />}</IconTile>}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("Auth_Cancel")}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t("UI_Confirm")}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-600">{message}</p>
    </Modal>
  );
}
