"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { sellerApi, type SellerShopProfile, type SellerStats } from "../../lib/api";

type SellerShopContextValue = {
  profile: SellerShopProfile | null;
  stats: SellerStats | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (profile: SellerShopProfile) => void;
};

const SellerShopContext = createContext<SellerShopContextValue>({
  profile: null,
  stats: null,
  loading: true,
  refresh: async () => {},
  setProfile: () => {},
});

export function SellerShopProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<SellerShopProfile | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [profileResult, statsResult] = await Promise.allSettled([sellerApi.shopProfile(), sellerApi.stats()]);
    if (profileResult.status === "fulfilled") setProfile(profileResult.value.data);
    if (statsResult.status === "fulfilled") setStats(statsResult.value.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ profile, stats, loading, refresh, setProfile }), [profile, stats, loading, refresh]);

  return <SellerShopContext.Provider value={value}>{children}</SellerShopContext.Provider>;
}

export const useSellerShop = () => useContext(SellerShopContext);

export const shopInitials = (name?: string | null) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
