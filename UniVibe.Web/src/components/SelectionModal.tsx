import { useMemo, useState } from "react";
import { Check, SearchX } from "lucide-react";
import type { ItemModel, ModalType } from "../types/auth.types";
import { SearchInput } from "./ui/Field";
import Modal from "./ui/Modal";

interface SelectionModalProps {
  isOpen: boolean;
  modalType: ModalType;
  data: ItemModel[];
  selectedId?: ItemModel["id"];
  onClose: () => void;
  onSelect: (item: ItemModel) => void;
  t: (key: string) => string;
}

const TITLE_KEYS: Record<string, string> = {
  uni: "RegComplete_SelectUni",
  fac: "RegComplete_SelectFac",
  dep: "RegComplete_SelectDep",
  grade: "RegComplete_SelectGrade",
};

function SelectionList({
  data,
  selectedId,
  onSelect,
  t,
}: Pick<SelectionModalProps, "data" | "selectedId" | "onSelect" | "t">) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("tr-TR");
    return term ? data.filter((item) => item.name.toLocaleLowerCase("tr-TR").includes(term)) : data;
  }, [data, query]);

  return (
    <>
      {data.length > 6 && (
        <SearchInput
          className="mb-3"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("UI_Search")}
          aria-label={t("UI_Search")}
        />
      )}
      <ul className="-mx-2 space-y-0.5">
        {filtered.map((item) => {
          const selected = item.id === selectedId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                aria-pressed={selected}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  selected ? "bg-brand-50 text-brand-800" : "text-ink-700 hover:bg-ink-100"
                }`}
              >
                {item.name}
                {selected && <Check size={16} className="shrink-0" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 && (
        <p className="flex flex-col items-center gap-2 py-8 text-center text-sm text-ink-500">
          <SearchX size={22} className="text-ink-400" aria-hidden="true" />
          {data.length === 0 ? t("RegComplete_SelectParentFirst") : t("UI_NoResults")}
        </p>
      )}
    </>
  );
}

export function SelectionModal({ isOpen, modalType, data, selectedId, onClose, onSelect, t }: SelectionModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} title={t(TITLE_KEYS[modalType ?? "grade"])}>
      <SelectionList key={modalType} data={data} selectedId={selectedId} onSelect={onSelect} t={t} />
    </Modal>
  );
}
