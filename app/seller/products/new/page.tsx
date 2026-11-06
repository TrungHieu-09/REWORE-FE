"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { PillButton } from "../../../components/admin/PillButton";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import { useAuth } from "../../../context/AuthContext";
import { ApiError, productsApi, type ProductCondition } from "../../../lib/api";

type ProductForm = {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: ProductCondition | "";
  brand: string;
  size: string;
  color: string;
  tags: string;
};

type FieldErrors = Partial<Record<keyof ProductForm | "productImages", string>>;
type ProductImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: "NEW", label: "Mới" },
  { value: "LIKE_NEW", label: "Như mới" },
  { value: "GOOD", label: "Tốt" },
  { value: "FAIR", label: "Khá" },
  { value: "POOR", label: "Cũ" },
];

const CATEGORIES = [
  "Áo",
  "Quần",
  "Váy",
  "Áo khoác",
  "Giày",
  "Túi",
  "Phụ kiện",
  "Vintage",
];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const emptyForm: ProductForm = {
  title: "",
  description: "",
  price: "",
  category: "",
  condition: "",
  brand: "",
  size: "",
  color: "",
  tags: "",
};

const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");
const formatVndInput = (value: string) => {
  const digits = digitsOnly(value);
  return digits ? new Intl.NumberFormat("vi-VN").format(Number(digits)) : "";
};
const parsePrice = (value: string) => Number(digitsOnly(value));
const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

function ProductImagePreview({
  image,
  onRemove,
}: {
  image: ProductImage;
  onRemove: () => void;
}) {
  return (
    <div className="seller-product-image-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.previewUrl} alt={image.file.name} />
      <button type="button" className="seller-product-image-remove" onClick={onRemove} aria-label="Xóa ảnh">
        <span className="material-symbols-outlined">close</span>
      </button>
      <span>{image.file.name}</span>
    </div>
  );
}

export default function NewSellerProductPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [images, setImages] = useState<ProductImage[]>([]);
  const imagesRef = useRef<ProductImage[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sellerStatus = user?.sellerStatus ?? (user?.role === "SELLER" ? "APPROVED" : "NONE");
  const isSeller = user?.role === "SELLER" && sellerStatus === "APPROVED";

  useEffect(() => {
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [router, user?.role]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  const updateForm = (field: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateImage = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Ảnh phải là JPG, PNG hoặc WEBP.";
    if (file.size > MAX_IMAGE_SIZE_BYTES) return "Mỗi ảnh tối đa 5MB.";
    return "";
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const firstError = selectedFiles.map(validateImage).find(Boolean);

    if (firstError) {
      setErrors((current) => ({ ...current, productImages: firstError }));
      event.target.value = "";
      return;
    }

    const nextImages = selectedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((current) => [...current, ...nextImages]);
    setErrors((current) => ({ ...current, productImages: undefined }));
    event.target.value = "";
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (form.title.trim().length < 3) nextErrors.title = "Tên sản phẩm tối thiểu 3 ký tự.";
    if (form.description.trim().length < 10) nextErrors.description = "Mô tả tối thiểu 10 ký tự.";
    if (parsePrice(form.price) <= 0) nextErrors.price = "Giá phải là số dương.";
    if (!form.category.trim()) nextErrors.category = "Chọn hoặc nhập danh mục.";
    if (!form.condition) nextErrors.condition = "Chọn tình trạng sản phẩm.";
    if (images.length === 0) nextErrors.productImages = "Nên tải ít nhất 1 ảnh sản phẩm.";

    const imageError = images.map((image) => validateImage(image.file)).find(Boolean);
    if (imageError) nextErrors.productImages = imageError;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const applyApiFieldErrors = (apiErrors?: Record<string, string[]>) => {
    if (!apiErrors) return;

    const mappedErrors: FieldErrors = {};
    (Object.entries(apiErrors) as [keyof FieldErrors, string[]][]).forEach(([field, messages]) => {
      mappedErrors[field] = messages?.[0];
    });
    setErrors((current) => ({ ...current, ...mappedErrors }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    setToast("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      await productsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        price: parsePrice(form.price),
        category: form.category.trim(),
        condition: form.condition as ProductCondition,
        quantity: 1,
        images: images.map((image) => image.file),
        brand: form.brand.trim() || undefined,
        size: form.size.trim() || undefined,
        color: form.color.trim() || undefined,
        tags: parseTags(form.tags),
      });

      setToast("Đã đăng sản phẩm thành công.");
      window.setTimeout(() => router.push("/seller/listings"), 700);
    } catch (err) {
      if (err instanceof ApiError) {
        applyApiFieldErrors(err.errors);
        setSubmitError(err.message);
      } else {
        setSubmitError("Không thể đăng sản phẩm. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="seller-create-root">
        {toast && <div className="admin-toast">{toast}</div>}
        <main className="seller-create-layout">
          {!isLoading && !isSeller ? (
            <section className="seller-create-locked">
              <span className="material-symbols-outlined">lock</span>
              <h1>Seller tools are locked</h1>
              <p>Bạn cần được duyệt seller trước khi đăng bán sản phẩm.</p>
              <Link href="/profile/become-seller/status">Xem trạng thái seller</Link>
            </section>
          ) : (
            <form className="seller-create-form" onSubmit={handleSubmit}>
              <header className="seller-create-head">
                <div>
                  <div className="seller-create-kicker">
                    <span className="material-symbols-outlined">storefront</span>
                    Seller Listing
                  </div>
                  <h1>Đăng sản phẩm</h1>
                  <p>Đăng bán ngay một món đồ second-hand, ảnh sản phẩm sẽ được gửi bằng multipart/form-data.</p>
                </div>
                <StatusBadge label="ĐĂNG BÁN NGAY" tone="green" />
              </header>

              <section className="seller-create-panel">
                <div className="seller-create-section-head">
                  <span className="material-symbols-outlined">inventory_2</span>
                  <div>
                    <h2>Thông tin sản phẩm</h2>
                    <p>Nhập đúng thông tin buyer cần xem trước khi quyết định mua.</p>
                  </div>
                </div>

                <div className="seller-create-grid">
                  <label className="seller-field seller-field-wide">
                    <span>Tên sản phẩm</span>
                    <input
                      value={form.title}
                      onChange={(event) => updateForm("title", event.target.value)}
                      placeholder="Ví dụ: Áo blazer linen vintage"
                    />
                    {errors.title && <small>{errors.title}</small>}
                  </label>

                  <label className="seller-field seller-field-wide">
                    <span>Mô tả</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => updateForm("description", event.target.value)}
                      placeholder="Mô tả chất liệu, form dáng, tình trạng và lưu ý nhỏ nếu có"
                    />
                    {errors.description && <small>{errors.description}</small>}
                  </label>

                  <label className="seller-field">
                    <span>Giá bán</span>
                    <input
                      value={form.price}
                      inputMode="numeric"
                      onChange={(event) => updateForm("price", formatVndInput(event.target.value))}
                      placeholder="250.000"
                    />
                    {form.price && <em>{formatVndInput(form.price)} ₫</em>}
                    {errors.price && <small>{errors.price}</small>}
                  </label>

                  <label className="seller-field">
                    <span>Danh mục</span>
                    <input
                      list="seller-category-options"
                      value={form.category}
                      onChange={(event) => updateForm("category", event.target.value)}
                      placeholder="Chọn hoặc nhập danh mục"
                    />
                    <datalist id="seller-category-options">
                      {CATEGORIES.map((category) => (
                        <option value={category} key={category} />
                      ))}
                    </datalist>
                    {errors.category && <small>{errors.category}</small>}
                  </label>

                  <label className="seller-field">
                    <span>Tình trạng</span>
                    <select
                      value={form.condition}
                      onChange={(event) => updateForm("condition", event.target.value)}
                    >
                      <option value="">Chọn tình trạng</option>
                      {CONDITIONS.map((condition) => (
                        <option value={condition.value} key={condition.value}>
                          {condition.label}
                        </option>
                      ))}
                    </select>
                    {errors.condition && <small>{errors.condition}</small>}
                  </label>

                  <label className="seller-field">
                    <span>Thương hiệu</span>
                    <input value={form.brand} onChange={(event) => updateForm("brand", event.target.value)} placeholder="Optional" />
                  </label>

                  <label className="seller-field">
                    <span>Size</span>
                    <input value={form.size} onChange={(event) => updateForm("size", event.target.value)} placeholder="S / M / L / 38..." />
                  </label>

                  <label className="seller-field">
                    <span>Màu sắc</span>
                    <input value={form.color} onChange={(event) => updateForm("color", event.target.value)} placeholder="Kem, nâu, đen..." />
                  </label>

                  <label className="seller-field seller-field-wide">
                    <span>Tags</span>
                    <input
                      value={form.tags}
                      onChange={(event) => updateForm("tags", event.target.value)}
                      placeholder="vintage, linen, minimal"
                    />
                  </label>
                </div>
              </section>

              <section className="seller-create-panel">
                <div className="seller-create-section-head">
                  <span className="material-symbols-outlined">photo_library</span>
                  <div>
                    <h2>Ảnh sản phẩm</h2>
                    <p>JPG, PNG hoặc WEBP. Tối đa 5MB mỗi ảnh.</p>
                  </div>
                </div>

                <label className="seller-upload-box">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageChange} />
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                  <strong>Chọn ảnh sản phẩm</strong>
                  <small>Cho phép chọn nhiều ảnh và xoá ảnh trước khi đăng.</small>
                </label>
                {errors.productImages && <p className="seller-form-error">{errors.productImages}</p>}

                {images.length > 0 && (
                  <div className="seller-product-image-grid">
                    {images.map((image) => (
                      <ProductImagePreview
                        key={image.id}
                        image={image}
                        onRemove={() => {
                          URL.revokeObjectURL(image.previewUrl);
                          setImages((current) => current.filter((item) => item.id !== image.id));
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>

              {submitError && (
                <div className="admin-warning-banner">
                  <span className="material-symbols-outlined">error</span>
                  <span>{submitError}</span>
                </div>
              )}

              <footer className="seller-create-actions">
                <Link href="/seller/dashboard">Huỷ</Link>
                <PillButton type="submit" tone="accent" className="seller-submit-button" disabled={submitting || isLoading}>
                  {submitting && <span className="seller-create-spinner" />}
                  {submitting ? "Đang đăng..." : "Đăng bán ngay"}
                </PillButton>
              </footer>
            </form>
          )}
        </main>
      </div>
  );
}
