"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, LoadingSkeleton } from "../../components/admin/AdminStates";
import { PillButton } from "../../components/admin/PillButton";
import { productStatusTone, StatusBadge } from "../../components/admin/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { ApiError, apiAssetUrl, productsApi, type Product, type ProductStatus } from "../../lib/api";
import { formatShortDate, formatVnd, normalizedStatusLabel } from "../../admin/_utils";

type ListingTab = "ALL" | ProductStatus;

const TABS: { key: ListingTab; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "ACTIVE", label: "Đang bán" },
  { key: "SOLD", label: "Đã bán" },
  { key: "HIDDEN", label: "Đã ẩn" },
];

const productImage = (product: Product) => apiAssetUrl(product.images?.[0]);
const quantityOf = (product: Product) => product.quantity ?? 1;

function SellerProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const src = productImage(product);

  if (!src || failed) {
    return (
      <div className="seller-listing-image-fallback">
        <span className="material-symbols-outlined">image_not_supported</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={product.title} onError={() => setFailed(true)} />
  );
}

export default function SellerListingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<ListingTab>("ALL");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [busyId, setBusyId] = useState("");
  const [toast, setToast] = useState("");
  const [message, setMessage] = useState("");

  const sellerStatus = user?.sellerStatus ?? (user?.role === "SELLER" ? "APPROVED" : "NONE");
  const isSeller = user?.role === "SELLER" && sellerStatus === "APPROVED";

  useEffect(() => {
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [router, user?.role]);

  useEffect(() => {
    if (isLoading || !user?.id || !isSeller) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setMessage("");

      productsApi
        .list({ sellerId: user.id, limit: 50, sortBy: "newest" })
        .then((res) => {
          if (!cancelled) setProducts(res.data);
        })
        .catch((err) => {
          if (!cancelled) {
            setProducts([]);
            setMessage(err instanceof ApiError ? err.message : "Không tải được danh sách sản phẩm.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isLoading, isSeller, user?.id]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchTab = tab === "ALL" || product.status === tab;
      const matchSearch = !term || `${product.title} ${product.category} ${product.brand ?? ""}`.toLowerCase().includes(term);
      return matchTab && matchSearch;
    });
  }, [products, search, tab]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((product) => product.status === "ACTIVE").length,
      sold: products.filter((product) => product.status === "SOLD").length,
      quantity: products.reduce((sum, product) => sum + quantityOf(product), 0),
    }),
    [products]
  );

  const deleteProduct = async () => {
    if (!deleteTarget) return;

    setBusyId(deleteTarget.id);
    setMessage("");
    try {
      await productsApi.delete(deleteTarget.id);
      setProducts((items) => items.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast("Đã xoá sản phẩm.");
      window.setTimeout(() => setToast(""), 2400);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể xoá sản phẩm.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <div className="seller-create-root">
        {toast && <div className="admin-toast">{toast}</div>}
        <main className="seller-create-layout">
          {!isLoading && !isSeller ? (
            <section className="seller-create-locked">
              <span className="material-symbols-outlined">lock</span>
              <h1>Seller tools are locked</h1>
              <p>Bạn cần được duyệt seller trước khi quản lý sản phẩm.</p>
              <Link href="/profile/become-seller/status">Xem trạng thái seller</Link>
            </section>
          ) : (
            <div className="seller-listings-page">
              <header className="seller-create-head">
                <div>
                  <div className="seller-create-kicker">
                    <span className="material-symbols-outlined">inventory_2</span>
                    My Listings
                  </div>
                  <h1>Quản lý sản phẩm</h1>
                  <p>Theo dõi số lượng listing, trạng thái bán và xoá sản phẩm không còn muốn bán.</p>
                  {message && <p className="seller-listing-error">{message}</p>}
                </div>
                <Link href="/seller/products/new" className="seller-add-listing">
                  <span className="material-symbols-outlined">add</span>
                  Thêm sản phẩm
                </Link>
              </header>

              <section className="seller-listing-stats">
                <article>
                  <span>Tổng sản phẩm</span>
                  <strong>{stats.total}</strong>
                </article>
                <article>
                  <span>Đang bán</span>
                  <strong>{stats.active}</strong>
                </article>
                <article>
                  <span>Đã bán</span>
                  <strong>{stats.sold}</strong>
                </article>
                <article>
                  <span>Số lượng</span>
                  <strong>{stats.quantity}</strong>
                </article>
              </section>

              <section className="seller-listing-toolbar">
                <label className="admin-search-wrap">
                  <span className="material-symbols-outlined">search</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm theo tên, danh mục, thương hiệu"
                  />
                </label>
                <div className="sp-quick-tabs admin-tabs-row">
                  {TABS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`sp-quick-tab${tab === item.key ? " active" : ""}`}
                      onClick={() => setTab(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>

              {isLoading || loading ? (
                <LoadingSkeleton rows={4} />
              ) : filteredProducts.length === 0 ? (
                <EmptyState icon="inventory_2" title="Chưa có sản phẩm" desc="Bấm Thêm sản phẩm để đăng listing đầu tiên của shop." />
              ) : (
                <section className="seller-listing-list">
                  {filteredProducts.map((product) => (
                    <article className="seller-listing-card" key={product.id}>
                      <div className="seller-listing-image">
                        <SellerProductImage product={product} />
                      </div>
                      <div className="seller-listing-body">
                        <div className="seller-listing-main">
                          <div>
                            <h2>{product.title}</h2>
                            <p>
                              {[product.brand, product.size ? `Size ${product.size}` : null, product.category]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <span className="sp-price">{formatVnd(product.price)}</span>
                        </div>

                        <div className="seller-listing-meta">
                          <StatusBadge label={normalizedStatusLabel(product.status)} tone={productStatusTone(product.status)} />
                          <span>
                            <span className="material-symbols-outlined">inventory</span>
                            SL: {quantityOf(product)}
                          </span>
                          <span>
                            <span className="material-symbols-outlined">visibility</span>
                            {product.viewCount} views
                          </span>
                          <span>
                            <span className="material-symbols-outlined">calendar_month</span>
                            {formatShortDate(product.createdAt)}
                          </span>
                        </div>

                        <div className="seller-listing-actions">
                          <Link href={`/seller/products/${product.id}/edit`} className="admin-pill admin-pill-accent">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Sửa sản phẩm
                          </Link>
                          <PillButton tone="red" disabled={busyId === product.id} onClick={() => setDeleteTarget(product)}>
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Xóa sản phẩm
                          </PillButton>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {deleteTarget && (
        <div className="admin-drawer-backdrop admin-modal-backdrop" role="dialog" aria-modal="true">
          <section className="admin-action-modal">
            <div className="admin-drawer-head">
              <div>
                <p className="sp-rep-sub">Delete listing</p>
                <h2 className="admin-drawer-title">{deleteTarget.title}</h2>
              </div>
              <button className="admin-icon-btn" onClick={() => setDeleteTarget(null)} aria-label="Close modal">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="admin-drawer-body">
              <div className="admin-warning-banner">
                <span className="material-symbols-outlined">warning</span>
                <span>Sản phẩm sẽ bị xoá khỏi shop của bạn. Thao tác này không thể hoàn tác.</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <PillButton tone="red" disabled={busyId === deleteTarget.id} onClick={deleteProduct}>
                  {busyId === deleteTarget.id ? "Đang xoá..." : "Xác nhận xoá"}
                </PillButton>
                <PillButton tone="muted" disabled={busyId === deleteTarget.id} onClick={() => setDeleteTarget(null)}>
                  Hủy
                </PillButton>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
