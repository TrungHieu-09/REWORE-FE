"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminImage } from "../../components/admin/AdminImage";
import { AdminShell } from "../../components/admin/AdminShell";
import { EmptyState, LoadingSkeleton } from "../../components/admin/AdminStates";
import { DataTable, type DataColumn } from "../../components/admin/DataTable";
import { DetailDrawer } from "../../components/admin/DetailDrawer";
import { PillButton } from "../../components/admin/PillButton";
import { roleTone, sellerStatusTone, StatusBadge, userStatusTone } from "../../components/admin/StatusBadge";
import { useAdminBadges } from "../../components/admin/useAdminBadges";
import AddUserPanel from "../../components/admin/AddUserPanel";
import { adminApi, type Order, type Role, type SellerApplication, type User } from "../../lib/api";
import { formatShortDate, formatVnd, initials, normalizedStatusLabel } from "../_utils";

type RoleTab = "ALL" | Role;
type UserStatusTab = "active" | "banned";
type SellerProfileWithImages = SellerApplication | NonNullable<User["sellerProfile"]>;
type SellerProfileImageField =
  | "idCardFrontImage"
  | "idCardBackImage"
  | "idCardFrontUrl"
  | "idCardBackUrl"
  | "selfieUrl"
  | "id_card_front_url"
  | "id_card_back_url"
  | "selfie_url";

const ROLE_TABS: { key: RoleTab; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "BUYER", label: "Buyer" },
  { key: "SELLER", label: "Seller" },
  { key: "ADMIN", label: "Admin" },
];

const STATUS_TABS: { key: UserStatusTab; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "banned", label: "Banned" },
];

const sellerProfileImageField = (profile: SellerProfileWithImages | null | undefined, field: SellerProfileImageField) => {
  const value = profile ? (profile as Partial<Record<SellerProfileImageField, string | null>>)[field] : "";
  return value ?? "";
};

const sellerProfileIdFront = (profile?: SellerProfileWithImages | null) =>
  sellerProfileImageField(profile, "id_card_front_url") ||
  sellerProfileImageField(profile, "idCardFrontUrl") ||
  sellerProfileImageField(profile, "idCardFrontImage");

const sellerProfileIdBack = (profile?: SellerProfileWithImages | null) =>
  sellerProfileImageField(profile, "id_card_back_url") ||
  sellerProfileImageField(profile, "idCardBackUrl") ||
  sellerProfileImageField(profile, "idCardBackImage");

const sellerProfileSelfie = (profile?: SellerProfileWithImages | null) =>
  sellerProfileImageField(profile, "selfie_url") || sellerProfileImageField(profile, "selfieUrl");

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<SellerApplication[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [roleTab, setRoleTab] = useState<RoleTab>("ALL");
  const [statusTab, setStatusTab] = useState<UserStatusTab>("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [drawerMessage, setDrawerMessage] = useState("");
  const [toast, setToast] = useState("");
  const [apiMessage, setApiMessage] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { pendingSellers, openReports } = useAdminBadges();

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setApiMessage("");

      Promise.allSettled([
        adminApi.users({ limit: 80, search: search.trim() || undefined, status: statusTab }),
        adminApi.orders({ limit: 100 }),
        adminApi.sellerApplications({ limit: 100 }),
      ]).then(([userResult, orderResult, sellerResult]) => {
        if (cancelled) return;

        if (userResult.status === "fulfilled") {
          setUsers(userResult.value.data);
        } else {
          setUsers([]);
          setApiMessage("Users API chưa sẵn sàng hoặc chưa có quyền admin.");
        }

        if (orderResult.status === "fulfilled") {
          setOrders(orderResult.value.data);
        }

        if (sellerResult.status === "fulfilled") {
          setSellerProfiles(sellerResult.value.data);
        }

        setLoading(false);
      });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, statusTab]);

  const filteredUsers = useMemo(
    () => (roleTab === "ALL" ? users : users.filter((user) => user.role === roleTab)),
    [roleTab, users]
  );

  const selectedOrders = useMemo(
    () =>
      selected
        ? orders.filter((order) => order.buyerId === selected.id || order.sellerId === selected.id).slice(0, 5)
        : [],
    [orders, selected]
  );

  const selectedSellerApplication = useMemo(
    () => sellerProfiles.find((profile) => profile.userId === selected?.id || profile.user?.id === selected?.id) ?? null,
    [selected, sellerProfiles]
  );

  const selectedSellerProfile = selectedSellerApplication ?? selected?.sellerProfile ?? null;

  const updateUser = (next: User) => {
    setUsers((items) => items.map((item) => (item.id === next.id ? { ...item, ...next } : item)));
    setSelected((current) => (current?.id === next.id ? { ...current, ...next } : current));
  };

  const changeRole = async (role: "BUYER" | "SELLER") => {
    if (!selected) return;
    const label = role === "SELLER" ? "cấp role Seller cho" : "thu hồi role Seller của";
    if (!window.confirm(`Bạn chắc chắn muốn ${label} ${selected.email}?`)) return;

    setBusyId(selected.id);
    setDrawerMessage("");
    try {
      const res = await adminApi.changeUserRole(selected.id, { role });
      updateUser({ ...selected, ...res.data });
      setToast(role === "SELLER" ? "Đã cấp role Seller." : "Đã thu hồi role Seller.");
    } catch (err) {
      setDrawerMessage(err instanceof Error ? err.message : "Không thể đổi role.");
    } finally {
      setBusyId("");
    }
  };

  const banUser = async () => {
    if (!selected) return;
    if (!banReason.trim()) {
      setDrawerMessage("Nhập lý do khóa tài khoản trước khi gửi.");
      return;
    }

    setBusyId(selected.id);
    setDrawerMessage("");
    try {
      const res = await adminApi.banUser(selected.id, banReason.trim());
      updateUser({ ...selected, ...res.data, isBanned: true, bannedReason: banReason.trim() });
      setBanOpen(false);
      setBanReason("");
      setToast("Đã khóa tài khoản người dùng.");
    } catch (err) {
      setDrawerMessage(err instanceof Error ? err.message : "Không thể khóa tài khoản.");
    } finally {
      setBusyId("");
    }
  };

  const unbanUser = async () => {
    if (!selected) return;

    setBusyId(selected.id);
    setDrawerMessage("");
    try {
      const res = await adminApi.unbanUser(selected.id);
      updateUser({ ...selected, ...res.data, isBanned: false, bannedReason: null, bannedAt: null });
      setToast("Đã mở khóa tài khoản người dùng.");
    } catch (err) {
      setDrawerMessage(err instanceof Error ? err.message : "Không thể mở khóa tài khoản.");
    } finally {
      setBusyId("");
    }
  };

  const columns = useMemo<DataColumn<User>[]>(
    () => [
      {
        key: "user",
        header: "Người dùng",
        render: (user) => (
          <div className="admin-user-cell">
            <span className="admin-list-avatar">{initials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <p className="admin-table-muted">{user.phone ?? "No phone"}</p>
            </div>
          </div>
        ),
      },
      { key: "email", header: "Email", render: (user) => user.email },
      { key: "role", header: "Role", render: (user) => <StatusBadge label={user.role} tone={roleTone(user.role)} /> },
      {
        key: "status",
        header: "Trạng thái",
        render: (user) => (
          <StatusBadge label={user.isBanned ? "BANNED" : "ACTIVE"} tone={userStatusTone(user.isBanned)} />
        ),
      },
      { key: "created", header: "Ngày tạo", render: (user) => formatShortDate(user.createdAt) },
    ],
    []
  );

  return (
    <AdminShell pendingSellers={pendingSellers} openReports={openReports}>
      {toast && <div className="admin-toast">{toast}</div>}

      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý người dùng</h1>
          <p className="admin-page-sub">Tìm kiếm, kiểm tra role và xử lý tài khoản vi phạm.</p>
          {apiMessage && <p className="sp-foryou-sub" style={{ color: "#ba1a1a" }}>{apiMessage}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="sp-count-badge">{filteredUsers.length} user</span>
          <PillButton tone="green" onClick={() => setAddOpen((value) => !value)}>
            <span className="material-symbols-outlined text-[16px]">{addOpen ? "close" : "person_add"}</span>
            {addOpen ? "Đóng" : "Thêm người dùng"}
          </PillButton>
        </div>
      </header>

      {addOpen && (
        <AddUserPanel
          onCancel={() => setAddOpen(false)}
          onCreated={(user, message) => {
            setUsers((items) => [user, ...items.filter((item) => item.id !== user.id)]);
            setAddOpen(false);
            setToast(message);
          }}
        />
      )}

      <section className="admin-panel admin-filter-bar">
        <label className="admin-search-wrap">
          <span className="material-symbols-outlined">search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo email hoặc tên"
          />
        </label>

        <div className="admin-filter-groups">
          <div className="sp-quick-tabs admin-tabs-row">
            {ROLE_TABS.map((item) => (
              <button
                key={item.key}
                className={`sp-quick-tab${roleTab === item.key ? " active" : ""}`}
                onClick={() => setRoleTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="sp-quick-tabs admin-tabs-row">
            {STATUS_TABS.map((item) => (
              <button
                key={item.key}
                className={`sp-quick-tab${statusTab === item.key ? " active" : ""}`}
                onClick={() => setStatusTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <DataTable
          rows={filteredUsers}
          columns={columns}
          onRowClick={(user) => {
            setSelected(user);
            setBanOpen(false);
            setBanReason("");
            setDrawerMessage("");
          }}
          empty={<EmptyState icon="group" title="Không có người dùng" desc="Không có user nào khớp bộ lọc hiện tại." />}
        />
      )}

      <DetailDrawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle="User detail">
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="admin-detail-grid">
              <div className="admin-detail-box">
                <span className="admin-detail-label">Email</span>
                <span className="admin-detail-value">{selected.email}</span>
              </div>
              <div className="admin-detail-box">
                <span className="admin-detail-label">Phone</span>
                <span className="admin-detail-value">{selected.phone ?? "Not provided"}</span>
              </div>
              <div className="admin-detail-box">
                <span className="admin-detail-label">Role</span>
                <StatusBadge label={selected.role} tone={roleTone(selected.role)} />
              </div>
              <div className="admin-detail-box">
                <span className="admin-detail-label">Status</span>
                <StatusBadge label={selected.isBanned ? "BANNED" : "ACTIVE"} tone={userStatusTone(selected.isBanned)} />
              </div>
              <div className="admin-detail-box">
                <span className="admin-detail-label">Created</span>
                <span className="admin-detail-value">{formatShortDate(selected.createdAt)}</span>
              </div>
              <div className="admin-detail-box">
                <span className="admin-detail-label">Email verified</span>
                <StatusBadge label={selected.isVerified ? "VERIFIED" : "UNVERIFIED"} tone={selected.isVerified ? "green" : "orange"} />
              </div>
            </div>

            {selected.isBanned && selected.bannedReason && (
              <div className="admin-warning-banner">
                <span className="material-symbols-outlined">block</span>
                <span>{selected.bannedReason}</span>
              </div>
            )}

            <div className="admin-detail-box">
              <span className="admin-detail-label">Seller profile</span>
              {selectedSellerProfile ? (
                <div className="admin-mini-list">
                  <span className="admin-detail-value">{selectedSellerProfile.shopName}</span>
                  <StatusBadge
                    label={normalizedStatusLabel(selectedSellerProfile.status)}
                    tone={sellerStatusTone(selectedSellerProfile.status)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="admin-detail-label">CCCD mặt trước</span>
                      <div className="admin-id-image">
                        <AdminImage src={sellerProfileIdFront(selectedSellerProfile)} alt="CCCD mặt trước" />
                      </div>
                    </div>
                    <div>
                      <span className="admin-detail-label">CCCD mặt sau</span>
                      <div className="admin-id-image">
                        <AdminImage src={sellerProfileIdBack(selectedSellerProfile)} alt="CCCD mặt sau" />
                      </div>
                    </div>
                    <div>
                      <span className="admin-detail-label">Selfie xác minh</span>
                      <div className="admin-id-image">
                        <AdminImage src={sellerProfileSelfie(selectedSellerProfile)} alt="Selfie xác minh" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="admin-detail-value">No seller profile</span>
              )}
            </div>

            <div className="admin-detail-box">
              <span className="admin-detail-label">Đơn hàng gần đây</span>
              {selectedOrders.length === 0 ? (
                <span className="admin-detail-value">Chưa có đơn hàng gần đây</span>
              ) : (
                <div className="admin-mini-list">
                  {selectedOrders.map((order) => (
                    <div className="admin-mini-row" key={order.id}>
                      <div>
                        <strong>{order.product?.title ?? order.id}</strong>
                        <p className="admin-table-muted">{formatShortDate(order.createdAt)}</p>
                      </div>
                      <span className="sp-price text-[18px]">{formatVnd(order.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {drawerMessage && <p className="sp-foryou-sub" style={{ color: "#ba1a1a" }}>{drawerMessage}</p>}

            {selected.role === "BUYER" && (
              <PillButton tone="green" disabled={busyId === selected.id} onClick={() => changeRole("SELLER")}>
                <span className="material-symbols-outlined text-[16px]">storefront</span>
                Cấp role Seller
              </PillButton>
            )}
            {selected.role === "SELLER" && (
              <PillButton tone="red" disabled={busyId === selected.id} onClick={() => changeRole("BUYER")}>
                <span className="material-symbols-outlined text-[16px]">person_off</span>
                Thu hồi role Seller
              </PillButton>
            )}

            {selected.isBanned ? (
              <PillButton tone="green" disabled={busyId === selected.id} onClick={unbanUser}>
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                Mở khoá
              </PillButton>
            ) : (
              <div>
                <PillButton tone="red" disabled={busyId === selected.id} onClick={() => setBanOpen((value) => !value)}>
                  <span className="material-symbols-outlined text-[16px]">block</span>
                  Khoá tài khoản
                </PillButton>

                {banOpen && (
                  <div className="admin-reject-box">
                    <label className="admin-detail-label" htmlFor="ban-reason">Lý do khóa</label>
                    <textarea
                      id="ban-reason"
                      className="admin-textarea"
                      value={banReason}
                      onChange={(event) => setBanReason(event.target.value)}
                      placeholder="Ví dụ: spam, gian lận thanh toán, lừa đảo..."
                    />
                    <div className="mt-3">
                      <PillButton tone="red" disabled={busyId === selected.id} onClick={banUser}>
                        Xác nhận khóa
                      </PillButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </AdminShell>
  );
}
