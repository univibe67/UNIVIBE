import { useCallback, useEffect, useMemo, useState } from "react";
import { UserSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import DataPanel from "../../components/admin/DataPanel";
import TableSkeleton from "../../components/admin/TableSkeleton";
import { tableCellClass, tableHeadClass } from "../../components/admin/tableStyles";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import { SearchInput, Select } from "../../components/ui/Field";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import Segmented from "../../components/ui/Segmented";
import { adminApi } from "../../services/adminApi";
import type { AdminUser } from "../../services/adminApi";
import { adminStore } from "../../services/adminStore";
import { getErrorMessage } from "../../services/errorMessage";
import { toast } from "../../services/toast";
import { tokenService } from "../../services/tokenService";
import { normalizeRole, roleValue } from "../../utils/userRole";

type UserFilter = "all" | "active" | "suspended";

const PAGE_SIZE = 10;

const fullNameOf = (user: AdminUser) => `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [page, setPage] = useState(1);
  const [pendingToggle, setPendingToggle] = useState<AdminUser | null>(null);
  const [toggling, setToggling] = useState(false);
  const currentId = (tokenService.getUserId() ?? "").toLowerCase();

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
      adminStore.setUsers(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount = users.filter((user) => user.isActive).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("tr-TR");
    return users.filter((user) => {
      const matchesFilter = filter === "all" || user.isActive === (filter === "active");
      const haystack = `${fullNameOf(user)} ${user.email ?? ""}`.toLocaleLowerCase("tr-TR");
      return matchesFilter && (!term || haystack.includes(term));
    });
  }, [users, filter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateRole = async (user: AdminUser, value: string) => {
    const newRole = roleValue(value);
    if (newRole === null) {
      toast.error(t("Admin_InvalidRole"));
      return;
    }
    try {
      await adminApi.changeUserRole(user.id, newRole);
      adminStore.updateUserRole(user.id, newRole);
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, role: newRole } : item)));
      toast.success(t("UI_RoleUpdated"));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    const user = pendingToggle;
    setToggling(true);
    try {
      if (user.isActive) {
        await adminApi.suspendUser(user.id);
      } else {
        await adminApi.activateUser(user.id);
      }
      adminStore.updateUserStatus(user.id, !user.isActive);
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, isActive: !item.isActive } : item)),
      );
      toast.success(user.isActive ? t("UI_UserSuspended") : t("UI_UserActivated"));
      setPendingToggle(null);
    } catch (error) {
      toast.error(getErrorMessage(error) || t(user.isActive ? "Admin_Error_Suspend" : "Admin_Error_Activate"));
    } finally {
      setToggling(false);
    }
  };

  const statusBadge = (user: AdminUser) => (
    <Badge tone={user.isActive ? "success" : "danger"}>{user.isActive ? t("Admin_Active") : t("Admin_Suspended")}</Badge>
  );

  const userIdentity = (user: AdminUser) => (
    <div className="flex min-w-0 items-center gap-3" translate="no">
      <Avatar name={fullNameOf(user)} className="size-9 text-xs" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-900">{fullNameOf(user) || user.email}</p>
        <p className="truncate text-[13px] text-ink-500">{user.title || user.email}</p>
      </div>
    </div>
  );

  const userActions = (user: AdminUser) =>
    user.id.toLowerCase() === currentId ? (
      <Badge tone="brand">{t("Admin_YourAccount")}</Badge>
    ) : (
      <div className="flex items-center justify-end gap-2">
        <Select
          value={normalizeRole(user.role) ?? ""}
          onChange={(event) => void updateRole(user, event.target.value)}
          aria-label={`${t("Admin_Role")}: ${fullNameOf(user)}`}
          wrapperClassName="inline-block w-34"
          className="h-9 text-[13px] font-medium"
        >
          <option value="Student">{t("Role_Student")}</option>
          <option value="Teacher">{t("Role_Teacher")}</option>
          <option value="Admin">{t("Role_Admin")}</option>
        </Select>
        <Button
          size="sm"
          variant={user.isActive ? "dangerSoft" : "successSoft"}
          className="w-26"
          onClick={() => setPendingToggle(user)}
        >
          {user.isActive ? t("Admin_Suspend") : t("Admin_Activate")}
        </Button>
      </div>
    );

  const toggleName = pendingToggle ? fullNameOf(pendingToggle) || pendingToggle.email || "" : "";

  return (
    <>
      <PageHeader title={t("Admin_UsersTitle")} description={t("Admin_UsersDescription")} />

      <DataPanel
        toolbar={
          <>
            <Segmented
              ariaLabel={t("Admin_Status")}
              value={filter}
              onChange={(value) => {
                setFilter(value);
                setPage(1);
              }}
              options={[
                { value: "all", label: t("Admin_All"), count: users.length },
                { value: "active", label: t("Admin_Active"), count: activeCount },
                { value: "suspended", label: t("Admin_Suspended"), count: users.length - activeCount },
              ]}
            />
            <SearchInput
              className="xl:w-72"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("Admin_SearchUsers")}
              aria-label={t("Admin_SearchUsers")}
            />
          </>
        }
      >
        {loading ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState className="m-4 border-none" icon={<UserSearch size={22} />} title={t("Admin_NoUsersFound")} />
        ) : (
          <>
            <ul className="divide-y divide-ink-100 border-b border-ink-100 xl:hidden">
              {visible.map((user) => (
                <li key={user.id} className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    {userIdentity(user)}
                    {statusBadge(user)}
                  </div>
                  <div className="flex justify-end">{userActions(user)}</div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={tableHeadClass}>{t("Admin_User")}</th>
                    <th scope="col" className={tableHeadClass}>{t("Admin_Email")}</th>
                    <th scope="col" className={tableHeadClass}>{t("Admin_Status")}</th>
                    <th scope="col" className={`${tableHeadClass} text-right`}>{t("Admin_Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-ink-50/70">
                      <td className={`${tableCellClass} max-w-60`}>{userIdentity(user)}</td>
                      <td className={`${tableCellClass} text-ink-600`} translate="no">{user.email}</td>
                      <td className={tableCellClass}>{statusBadge(user)}</td>
                      <td className={`${tableCellClass} text-right`}>{userActions(user)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </>
        )}
      </DataPanel>

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        tone={pendingToggle?.isActive ? "danger" : "brand"}
        loading={toggling}
        title={pendingToggle?.isActive ? t("Admin_SuspendUser_Title") : t("Admin_ActivateUser_Title")}
        message={
          pendingToggle?.isActive
            ? t("Admin_SuspendUser_Confirm", { name: toggleName })
            : t("Admin_ActivateUser_Confirm", { name: toggleName })
        }
        confirmLabel={pendingToggle?.isActive ? t("Admin_Suspend") : t("Admin_Activate")}
        onClose={() => setPendingToggle(null)}
        onConfirm={() => void confirmToggle()}
      />
    </>
  );
}
