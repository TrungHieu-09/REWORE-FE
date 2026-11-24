import type { PaymentInfo } from "@/app/lib/api";

export function bankQrUrl(info: PaymentInfo, amount: number, memo: string) {
  if (!info.bankCode) return "";
  const params = new URLSearchParams({ amount: String(amount), addInfo: memo, accountName: info.accountName });
  return `https://img.vietqr.io/image/${encodeURIComponent(info.bankCode)}-${encodeURIComponent(info.accountNumber)}-compact2.png?${params}`;
}

// Mã QR kèm số tài khoản và tên chủ tài khoản. Không có bankCode thì chỉ hiện số tài khoản.
export default function BankQr({ info, amount, memo }: { info: PaymentInfo; amount: number; memo: string }) {
  const qr = bankQrUrl(info, amount, memo);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="Mã QR chuyển khoản" className="w-52 h-auto rounded-xl bg-white" />
      )}
      <p className="text-sm">{info.bankName} · <strong className="font-mono">{info.accountNumber}</strong></p>
      <p className="text-sm font-semibold">{info.accountName}</p>
      <p className="text-xs text-[#55443d]">Nội dung: <strong className="font-mono">{memo}</strong></p>
    </div>
  );
}
