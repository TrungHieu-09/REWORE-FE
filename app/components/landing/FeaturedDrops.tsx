"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiAssetUrl, productsApi, type Product } from "@/app/lib/api";

/* ─── Wishlist Button ─── */
function WishlistBtn({ id }: { id: string }) {
  const [liked, setLiked] = useState(false);
  return (
    <button
      id={id}
      className="product-wishlist"
      aria-label="Thêm vào yêu thích"
      onClick={() => setLiked((v) => !v)}
      style={{ color: liked ? "var(--primary)" : undefined }}
    >
      <span className="material-symbols-outlined" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>
        favorite
      </span>
    </button>
  );
}

/* ─── Product Card ─── */
interface ProductProps {
  id: string;
  product: Product;
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function conditionLabel(condition: Product["condition"]) {
  return condition.replace(/_/g, " ");
}

function ProductCard({ id, product }: ProductProps) {
  const image = apiAssetUrl(product.images?.[0]);
  return (
    <article className="product-card animate-in" id={id}>
      <div className="product-img-wrap">
        <Link href={`/products/${product.id}`} className="product-image-link" aria-label={`Xem ${product.title}`}>
          {image ? (
            <Image src={image} alt={product.title} fill className="product-img" style={{ objectFit: "cover" }} sizes="(max-width:768px) 100vw, 25vw" />
          ) : (
            <div className="admin-image-placeholder h-full">
              <span className="material-symbols-outlined">image_not_supported</span>
              <span>Không có ảnh</span>
            </div>
          )}
        </Link>
        <div className="product-overlay">
          <Link className="btn-quick-view" id={`quick-${id}`} href={`/products/${product.id}`}>
            Xem nhanh
          </Link>
        </div>
        <WishlistBtn id={`wish-${id}`} />
      </div>
      <div className="product-info">
        <div className="product-tags">
          <span className="tag tag-olive">{product.category}</span>
          <span className="tag tag-mustard">{conditionLabel(product.condition)}</span>
        </div>
        <h3 className="product-name">
          <Link href={`/products/${product.id}`}>{product.title}</Link>
        </h3>
        <p className="product-meta">
          {[product.brand, product.size ? `Size ${product.size}` : null].filter(Boolean).join(" · ")}
        </p>
        <div className="product-footer">
          <div>
            <span className="product-price">{formatVnd(product.price)}</span>
          </div>
          <div className="seller-trust">
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--primary)", fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span>{product.seller?.reputation ?? 0}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Featured Drops Section ─── */
export default function FeaturedDrops() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .list({ limit: 4, sortBy: "newest" })
      .then((res) => {
        if (!cancelled) setProducts(res.data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section section-alt" id="drops">
      <div className="container">
        <div className="section-header-row">
          <div>
            <p className="section-eyebrow">Mới đăng</p>
            <h2 className="section-title" style={{ textAlign: "left", marginBottom: 0 }}>Đồ nổi bật</h2>
          </div>
          <Link href="/shop" className="btn-outline-sm">
            Xem tất cả <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle" }}>arrow_forward</span>
          </Link>
        </div>
        {loading ? (
          <div className="admin-skeleton-list"><div className="admin-skeleton-card" /></div>
        ) : products.length === 0 ? (
          <div className="admin-empty">
            <span className="material-symbols-outlined admin-empty-icon">inventory_2</span>
            <h3>Chưa có sản phẩm</h3>
            <p>Đồ nổi bật sẽ hiện ở đây khi có sản phẩm.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} id={`product-${product.id}`} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
