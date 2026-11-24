"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import ProfileHeader from "./_components/ProfileHeader";
import ProfileTabNav, { ProfileTab } from "./_components/ProfileSidebar";
import ProfileRightSidebar from "./_components/ProfileRightSidebar";
import TabOverview from "./_components/TabOverview";
import TabMyBids from "./_components/TabMyBids";
import TabOrders from "./_components/TabOrders";
import TabHeldItems from "./_components/TabHeldItems";
import TabSettings from "./_components/TabSettings";
import TabMyReports from "./_components/TabMyReports";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>(() =>
    typeof window !== "undefined" && window.location.hash === "#settings"
      ? "settings"
      : typeof window !== "undefined" && window.location.hash === "#orders"
      ? "orders"
      : typeof window !== "undefined" && window.location.hash === "#holds"
      ? "holds"
      : typeof window !== "undefined" && window.location.hash === "#reports"
      ? "reports"
      : "overview"
  );

  const { user } = useAuth();

  // Bấm "Edit Profile" khi đang ở trang này thì chuyển sang tab tương ứng với #hash.
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "settings" || hash === "orders" || hash === "holds" || hash === "reports") setActiveTab(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#fff8f5] pt-24 pb-16">
      <main className="max-w-[1280px] mx-auto px-5 md:px-12 py-10 md:py-14">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <ProfileHeader />
            <ProfileTabNav activeTab={activeTab} onTabChange={setActiveTab} />
            <div id="settings">
              {activeTab === "overview" && <TabOverview />}
              {activeTab === "bids" && <TabMyBids />}
              {activeTab === "holds" && <TabHeldItems />}
              {activeTab === "orders" && <TabOrders />}
              {activeTab === "reports" && <TabMyReports />}
              {activeTab === "settings" && <TabSettings key={user?.id ?? "guest"} />}
            </div>
          </div>

          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <ProfileRightSidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
