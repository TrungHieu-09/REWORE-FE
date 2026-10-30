"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useScrollAnimate } from "@/app/hooks/useAnimations";
import Navbar from "@/app/components/Navbar";
import ScrollTop from "@/app/components/ScrollTop";
import Hero from "@/app/components/landing/Hero";
import Ticker from "@/app/components/landing/Ticker";
import HowItWorks from "@/app/components/landing/HowItWorks";
import FeaturedDrops from "@/app/components/landing/FeaturedDrops";
import TrustScore from "@/app/components/landing/TrustScore";
import WishlistIntro from "@/app/components/landing/WishlistIntro";
import Testimonials from "@/app/components/landing/Testimonials";
import CtaBanner from "@/app/components/landing/CtaBanner";
import Footer from "@/app/components/landing/Footer";

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/shop");
    }
  }, [isLoggedIn, isLoading, router]);

  useScrollAnimate();

  if (!isLoading && isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#974226] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Hero />
      <Ticker />
      <HowItWorks />
      <FeaturedDrops />
      <TrustScore />
      <WishlistIntro />
      <Testimonials />
      <CtaBanner />
      <Footer />
      <ScrollTop />
    </>
  );
}
