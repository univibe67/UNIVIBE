import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, CheckCircle, Clock, Eye, LoaderCircle, Search, ShieldAlert, Users } from "lucide-react";
import { adminApi } from "../../services/adminApi";
import type { AdminEvent, AdminFeedback, AdminUser, EventStatistics } from "../../services/adminApi";
import { getErrorMessage } from "../../services/errorMessage";
import { formatUserRole, normalizeRole, roleValue } from "../../utils/userRole";
import { formatCategoryName } from "../../utils/categoryLabel";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-[#e3e9e5] bg-white p-5 shadow-[0_5px_16px_#17212b0b] ${className}`}>{children}</section>
);

function Heading({ title, description }: { title: string; description: string }) {
  return <header className="mb-7"><p className="mb-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#ef3653]" translate="no">UniVibe Admin</p><h1 className="text-3xl font-extrabold tracking-tight text-[#17212b]">{title}</h1><p className="mt-2 text-sm text-[#819098]">{description}</p></header>;
}

function Notice({ text }: { text: string }) {
  return <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fff0f2] p-3 text-sm text-[#b42318]"><AlertCircle size={17} />{text}</div>;
}

function Loading({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-[#1559ac]"><LoaderCircle className="animate-spin" />{label}</div>;
}

function Overview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<EventStatistics>({ totalCreatedEvents: 0, activeEvents: 0, pendingEvents: 0 });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([adminApi.getStatistics(), adminApi.getUsers()]).then(([statistics, userList]) => { setStats(statistics); setUsers(userList); }).catch((e) => setError(getErrorMessage(e))); }, []);
  const cards = [[t("Admin_TotalUsers"), users.length, Users], [t("Admin_TotalEvents"), stats.totalCreatedEvents, Clock], [t("Admin_ActiveEvents"), stats.activeEvents, CheckCircle], [t("Admin_PendingEvents"), stats.pendingEvents, ShieldAlert]] as const;
  return <><Heading title={t("Admin_OverviewTitle")} description={t("Admin_OverviewDescription")} />{error && <Notice text={error} />}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, Icon]) => <Card key={label} className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eaf2ff] text-[#1559ac]"><Icon size={22} /></div><div><p className="text-xs font-bold text-[#819098]">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div></Card>)}</div><Card className="mt-6"><h2 className="text-lg font-extrabold">{t("Admin_OverviewSummaryTitle")}</h2><p className="mt-2 text-sm leading-6 text-[#718089]">{t("Admin_OverviewSummary")}</p></Card></>;
}

function Events() {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const load = () => { setLoading(true); Promise.all([adminApi.getEvents(), adminApi.getPendingEvents()]).then(([all, pending]) => { setEvents([...pending, ...all.filter((event) => !pending.some((item) => item.id === event.id))]); }).catch((e) => setMessage(getErrorMessage(e))).finally(() => setLoading(false)); };
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => events.filter((event) => `${event.title} ${event.organizerName ?? ""}`.toLowerCase().includes(search.toLowerCase())), [events, search]);
  const statusLabel = (status: string | number) => {
    const value = String(status).toLowerCase();
    if (value === "1" || value === "pending") return [t("Admin_Status_Pending"), "bg-[#fff4e8] text-[#c66a16]"];
    if (value === "2" || value === "approved") return [t("Admin_Status_Approved"), "bg-[#ecfdf3] text-[#16804b]"];
    if (value === "3" || value === "rejected") return [t("Admin_Status_Rejected"), "bg-[#fff0f2] text-[#d73f55]"];
    return [t("Admin_Unknown"), "bg-[#f0f3f1] text-[#718089]"];
  };
  const update = async (action: () => Promise<unknown>) => { try { await action(); load(); } catch (e) { setMessage(getErrorMessage(e)); } };
  return <><Heading title={t("Admin_EventsTitle")} description={t("Admin_EventsDescription")} />{message && <Notice text={message} />}<Card><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-extrabold">{t("Admin_Events")}</h2><div className="relative sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa5a9]" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Admin_SearchEvents")} className="w-full rounded-xl border border-[#e3e9e5] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#1559ac]" /></div></div>{loading ? <Loading label={t("Admin_Loading")} /> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-[#e8eeea] text-xs text-[#819098]"><th className="pb-3">{t("Admin_Event")}</th><th className="pb-3">{t("Admin_Organizer")}</th><th className="pb-3">{t("Admin_Date")}</th><th className="pb-3">{t("Admin_Status")}</th><th className="pb-3 text-right">{t("Admin_Actions")}</th></tr></thead><tbody>{filtered.map((event) => { const [label, badge] = statusLabel(event.status); const pending = label === t("Admin_Status_Pending"); return <tr key={event.id} className="border-b border-[#f0f3f1]"><td className="py-4 font-bold">{event.title}  <small className="mt-1 block font-normal text-[#819098]">{event.categoryName ? formatCategoryName(event.categoryName, t) : t("Admin_CategoryMissing")}</small></td><td className="py-4 text-[#718089]">{event.organizerName ?? t("Admin_Unknown")}</td><td className="py-4 text-[#718089]">{new Date(event.eventDate).toLocaleDateString(i18n.language.startsWith("en") ? "en-US" : "tr-TR")}</td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge}`}>{label}</span></td><td className="py-4 text-right">{pending ? <div className="flex justify-end gap-2"><button onClick={() => update(() => adminApi.approveEvent(event.id))} className="rounded-lg bg-[#ecfdf3] p-2 text-[#16804b]" title={t("Admin_Approve")}><Check size={17} /></button><button onClick={() => { const reason = window.prompt(t("Admin_RejectReasonPrompt")); if (reason?.trim()) void update(() => adminApi.rejectEvent(event.id, reason)); }} className="rounded-lg bg-[#fff0f2] px-3 py-2 text-xs font-bold text-[#d73f55]">{t("Admin_Reject")}</button></div> : <button onClick={() => adminApi.getEvent(event.id).catch((e) => setMessage(getErrorMessage(e)))} className="rounded-lg bg-[#f0f3f1] p-2 text-[#718089]" title={t("Admin_ViewDetails")}><Eye size={17} /></button>}</td></tr>; })}</tbody></table>{filtered.length === 0 && <p className="py-10 text-center text-sm text-[#819098]">{t("Admin_NoEventsFound")}</p>}</div>}</Card></>;
}

function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const load = () => adminApi.getUsers().then(setUsers).catch((e) => setMessage(getErrorMessage(e)));
  useEffect(() => { void load(); }, []);
  const currentId = (() => { try { const token = localStorage.getItem("accessToken"); return token ? JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub?.toLowerCase() : ""; } catch { return ""; } })();
  const filtered = users.filter((user) => `${user.firstName ?? ""} ${user.lastName ?? ""} ${user.email ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const action = async (work: () => Promise<unknown>) => { try { await work(); load(); } catch (e) { setMessage(getErrorMessage(e)); } };
  const updateRole = (user: AdminUser, value: string) => { const newRole = roleValue(value); if (newRole === null) { setMessage(t("Admin_InvalidRole")); return; } void action(() => adminApi.changeUserRole(user.id, newRole)); };
  return <><Heading title={t("Admin_UsersTitle")} description={t("Admin_UsersDescription")} />{message && <Notice text={message} />}<Card><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-extrabold">{t("Admin_Users")}</h2><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Admin_SearchUsers")} className="rounded-xl border border-[#e3e9e5] px-3 py-2.5 text-sm outline-none focus:border-[#1559ac] sm:w-72" /></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-[#e8eeea] text-xs text-[#819098]"><th className="pb-3">{t("Admin_User")}</th><th className="pb-3">{t("Admin_Email")}</th><th className="pb-3">{t("Admin_Role")}</th><th className="pb-3">{t("Admin_Status")}</th><th className="pb-3 text-right">{t("Admin_Actions")}</th></tr></thead><tbody>{filtered.map((user) => { const normalizedRole = normalizeRole(user.role); const self = user.id.toLowerCase() === currentId; return <tr key={user.id} className="border-b border-[#f0f3f1]"><td className="py-4 font-bold" translate="no"><span className="block">{user.firstName} {user.lastName}</span>{user.title && <span className="text-xs font-normal text-[#819098]">{user.title}</span>}</td><td className="py-4 text-[#718089]" translate="no">{user.email}</td><td className="py-4"><span className="rounded-full bg-[#eaf2ff] px-2.5 py-1 text-xs font-bold text-[#1559ac]">{formatUserRole(user.role, t)}</span></td><td className="py-4"><span className={user.isActive ? "text-[#16804b]" : "text-[#d73f55]"}>{user.isActive ? t("Admin_Active") : t("Admin_Suspended")}</span></td><td className="py-4 text-right">{self ? <span className="text-xs text-[#9aa5a9]">{t("Admin_NoAction")}</span> : <div className="flex justify-end gap-2"><select value={normalizedRole ?? ""} onChange={(event) => updateRole(user, event.target.value)} className="rounded-lg border border-[#e3e9e5] bg-white px-2 py-2 text-xs font-bold text-[#1559ac] outline-none focus:border-[#1559ac]"><option value="Student">{t("Role_Student")}</option><option value="Teacher">{t("Role_Teacher")}</option><option value="Admin">{t("Role_Admin")}</option></select><button onClick={() => void action(() => user.isActive ? adminApi.suspendUser(user.id) : adminApi.activateUser(user.id))} className={`rounded-lg px-3 py-2 text-xs font-bold ${user.isActive ? "bg-[#fff0f2] text-[#d73f55]" : "bg-[#ecfdf3] text-[#16804b]"}`}>{user.isActive ? t("Admin_Suspend") : t("Admin_Activate")}</button></div>}</td></tr>; })}</tbody></table>{filtered.length === 0 && <p className="py-10 text-center text-sm text-[#819098]">{t("Admin_NoUsersFound")}</p>}</div></Card></>;
}

function Feedback() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<AdminFeedback[]>([]);
  const [message, setMessage] = useState("");
  const load = () => adminApi.getFeedbacks().then(setItems).catch((e) => setMessage(getErrorMessage(e)));
  useEffect(() => { void load(); }, []);
  const resolve = async (id: string) => { try { await adminApi.resolveFeedback(id); load(); } catch (e) { setMessage(getErrorMessage(e)); } };
  return <><Heading title={t("Admin_FeedbackTitle")} description={t("Admin_FeedbackDescription")} />{message && <Notice text={message} />}<div className="grid gap-4 lg:grid-cols-2">{items.map((item) => <Card key={item.id}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-[#ef3653]" translate="no">{item.userFullName ?? t("Admin_Unknown")}</p><h2 className="mt-1 text-lg font-extrabold">{item.subject ?? t("Admin_FeedbackDefaultSubject")}</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isResolved ? "bg-[#ecfdf3] text-[#16804b]" : "bg-[#fff4e8] text-[#c66a16]"}`}>{item.isResolved ? t("Admin_FeedbackResolved") : t("Admin_FeedbackOpen")}</span></div><p className="mt-4 text-sm leading-6 text-[#718089]">{item.message}</p><div className="mt-5 flex items-center justify-between border-t border-[#f0f3f1] pt-4 text-xs text-[#9aa5a9]"><span>{new Date(item.createdAt).toLocaleDateString(i18n.language.startsWith("en") ? "en-US" : "tr-TR")}</span>{!item.isResolved && <button onClick={() => void resolve(item.id)} className="flex items-center gap-2 rounded-lg bg-[#1559ac] px-3 py-2 font-bold text-white"><CheckCircle size={15} /> {t("Admin_FeedbackResolve")}</button>}</div></Card>)}</div>{!items.length && <Card><p className="text-center text-sm text-[#819098]">{t("Admin_NoFeedback")}</p></Card>}</>;
}

export default function AdminDashboard() {
  const path = useLocation().pathname;
  if (path.endsWith("/events")) return <Events />;
  if (path.endsWith("/users")) return <UsersPage />;
  if (path.endsWith("/feedback")) return <Feedback />;
  return <Overview />;
}
