import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#ede1d2] border-t border-[#dbc1b9]/40 mt-auto">
      <div className="w-full px-6 md:px-12 max-w-[1280px] mx-auto py-16 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-4 max-w-sm">
          <Link
            href="/"
            className="font-headline-lg text-2xl md:text-3xl tracking-tight uppercase font-bold text-[#6b6357] hover:text-[#974226] transition-colors flex items-center gap-1"
          >
            <span>REWORE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#974226] mb-1"></span>
          </Link>
          <p className="font-body-md text-sm md:text-base text-[#6b6357]/80 leading-relaxed">
            © 2024 REWORE Marketplace Inc. Curated vintage &amp; circular luxury.
          </p>
          <p className="font-label-sm text-xs text-[#6b6357]/60">
            Authenticated escrow verification and archival drops.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-8">
          <Link
            href="/shop"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Editorial Journal
          </Link>
          <Link
            href="/#trust"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Authentication Guarantee
          </Link>
          <Link
            href="/shop"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Curated Drops
          </Link>
          <Link
            href="/profile/become-seller"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Sell with Us
          </Link>
          <Link
            href="/#how-it-works"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Circular Impact
          </Link>
          <Link
            href="/#trust"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/#trust"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}

