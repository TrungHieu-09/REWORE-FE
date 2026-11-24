"use client";

import { FormEvent, useRef, useState } from "react";
import UserAvatar from "@/app/components/UserAvatar";
import { useAuth } from "@/app/context/AuthContext";
import { ApiError, usersApi } from "@/app/lib/api";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const BIO_MAX = 300;

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-[#dbc1b9] bg-[#fff8f5] text-[#231a11] text-sm focus:outline-none focus:border-[#974226] focus:ring-1 focus:ring-[#974226] transition-colors";

type Notice = { type: "success" | "error"; text: string } | null;

export default function TabSettings() {
  const { user, refreshMe } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [saveNotice, setSaveNotice] = useState<Notice>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");

  const errorText = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      const first = err.errors ? Object.values(err.errors)[0]?.[0] : undefined;
      return first ?? err.message;
    }
    return fallback;
  };

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice({ type: "error", text: "Chỉ nhận ảnh JPG, PNG hoặc WEBP." });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setNotice({ type: "error", text: "Ảnh tối đa 5MB." });
      return;
    }
    setAvatarBusy(true);
    setNotice(null);
    try {
      await usersApi.uploadAvatar(file);
      await refreshMe();
      setNotice({ type: "success", text: "Đã cập nhật ảnh đại diện." });
    } catch (err) {
      setNotice({ type: "error", text: errorText(err, "Không thể tải ảnh lên.") });
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    setNotice(null);
    try {
      await usersApi.removeAvatar();
      await refreshMe();
      setNotice({ type: "success", text: "Đã xoá ảnh đại diện." });
    } catch (err) {
      setNotice({ type: "error", text: errorText(err, "Không thể xoá ảnh.") });
    } finally {
      setAvatarBusy(false);
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setSaveNotice(null);
    try {
      await usersApi.update(user.id, {
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      await refreshMe();
      setSaveNotice({ type: "success", text: "Đã lưu. Thông tin hiện ở phần đầu trang và mục Account Details bên phải." });
    } catch (err) {
      setSaveNotice({ type: "error", text: errorText(err, "Không thể lưu thông tin.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 opacity-0 animate-fade-in-up">
      <div>
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#231a11] mb-1">Chỉnh sửa hồ sơ</h3>
        <p className="text-sm text-[#55443d]">Cập nhật ảnh đại diện và thông tin cá nhân của bạn.</p>
      </div>

      {notice && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            notice.type === "success" ? "bg-[#dae9b5]/60 text-[#3f4b25]" : "bg-[#ffdad6] text-[#93000a]"
          }`}
          role="status"
        >
          {notice.text}
        </p>
      )}

      <section className="bg-white rounded-[20px] shadow-[0_4px_24px_-4px_rgba(43,33,24,0.06)] border border-[#f2dfd1] p-6 sm:p-8">
        <h4 className="text-lg font-semibold text-[#231a11] border-b border-[#f2dfd1] pb-2 mb-6">Ảnh đại diện</h4>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <UserAvatar name={user?.name} avatar={user?.avatar} size={96} className="border border-[#dbc1b9]/40" />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => pickAvatar(event.target.files?.[0])}
              />
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => fileRef.current?.click()}
                className="h-10 px-5 rounded-full border border-[#974226] text-[#974226] hover:bg-[#974226] hover:text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                {avatarBusy ? "Đang xử lý..." : user?.avatar ? "Đổi ảnh" : "Tải ảnh lên"}
              </button>
              {user?.avatar && (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={removeAvatar}
                  className="text-sm text-[#55443d] hover:text-[#ba1a1a] px-2 py-1 disabled:opacity-60"
                >
                  Xoá ảnh
                </button>
              )}
            </div>
            <p className="text-xs text-[#88726c]">JPG, PNG hoặc WEBP, tối đa 5MB. Chưa có ảnh thì hiện chữ cái đầu của tên.</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[20px] shadow-[0_4px_24px_-4px_rgba(43,33,24,0.06)] border border-[#f2dfd1] p-6 sm:p-8">
        <form className="space-y-5 max-w-xl" onSubmit={save}>
          <h4 className="text-lg font-semibold text-[#231a11] border-b border-[#f2dfd1] pb-2">Thông tin cá nhân</h4>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[#55443d]">Tên hiển thị</label>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[#55443d]">Email</label>
            <input
              type="email"
              value={user?.email ?? ""}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-[#dbc1b9] bg-[#f2dfd1] text-[#55443d] text-sm focus:outline-none"
            />
            <p className="text-xs text-[#88726c]">Email dùng để đăng nhập nên không đổi ở đây.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#55443d]">Số điện thoại</label>
              <input className={inputClass} type="tel" inputMode="tel" maxLength={20} value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#55443d]">Địa chỉ</label>
              <input className={inputClass} maxLength={300} value={address} onChange={(event) => setAddress(event.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold text-[#55443d]">Giới thiệu</label>
              <span className="text-xs text-[#88726c]">{bio.length}/{BIO_MAX}</span>
            </div>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              maxLength={BIO_MAX}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Vài dòng về bạn"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || !user?.id}
              className="py-2.5 px-8 bg-[#b65a3c] text-white rounded-xl text-sm font-semibold shadow-md shadow-[#b65a3c]/30 hover:bg-[#974226] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            {saveNotice && (
              <p className={`mt-3 text-sm ${saveNotice.type === "success" ? "text-[#3f4b25]" : "text-[#93000a]"}`} role="status">
                {saveNotice.text}
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
