import { MailCheck } from "lucide-react";

export default function EmailSentNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center" role="status">
      <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true">
        <MailCheck size={21} />
      </span>
      <p className="text-[15px] font-semibold text-emerald-900">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-emerald-800">{text}</p>
    </div>
  );
}
