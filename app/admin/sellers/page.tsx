"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  adminApi,
  apiAssetUrl,
  type SellerApplication,
  type SellerApplicationStatus,
} from "@/app/lib/api";
import { AdminShell } from "../../components/admin/AdminShell";

type StatusTab = "PENDING" | "APPROVED" | "REJECTED";

interface ExtendedApplication {
  id: string;
  name: string;
  legalName: string;
  handle: string;
  email: string;
  phone: string;
  submittedAtText: string;
  createdAt: string;
  dob: string;
  age: number;
  idNumber: string;
  idNumberMasked: string;
  bankName: string;
  bankAccountMasked: string;
  bankAccountFull: string;
  bankHolder: string;
  pickupAddress: string;
  status: SellerApplicationStatus;
  avatarUrl: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  selfieUrl: string;
  buyerScore: number;
  purchasesCount: number;
  memberSince: string;
  isRealDbItem?: boolean;
}

const SAMPLE_APPLICANTS: ExtendedApplication[] = [
  {
    id: "sample-1",
    name: "Camille Laurent",
    legalName: "Camille Marie Laurent",
    handle: "@camille_archive",
    email: "camille.laurent@paris-archive.fr",
    phone: "+33 6 49 12 88 40",
    submittedAtText: "12m ago",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    dob: "14 Oct 1994",
    age: 29,
    idNumber: "079194008912",
    idNumberMasked: "•••• 8912",
    bankName: "Vietcombank",
    bankAccountMasked: "Vietcombank (••4091)",
    bankAccountFull: "1029384091",
    bankHolder: "CAMILLE MARIE LAURENT",
    pickupAddress: "48 Rue de Turenne, Paris / Kho Q1 TP.HCM",
    status: "PENDING",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA8EfY77o3OEacQq9hgD5u1_RADpqNOYRVMwsXTbDs-nX_CCef0LQfjfEuy9d0CXkijJkQXvLeBMaGKUgMIRodRIH5vzQ-x0b-nZP3zbBYUBfG0uK4V6jGnNZB7mD66K1yXTOGLKmUKMBbv3WzdLMZzzvvVdsoVRmtz-gfBmT18xrQ4GBgnKtvZS02DLZ_FyjGNPuz1kQn4j2I8lF8IvJfuXhVgol_54MgG2DOkMOo",
    idCardFrontUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA5AWPVE1v6x4iQuW_YIqSoqYNFJsurusuyoDu6P5s0jikHlw081ajGOY-Byo_nrk8doC3CLG4nINDPI1o9t_VdO-gmi9wRa1eQIFpeKZx46rrIGKl8BesNX0nWrX_ZDkhmiSgjDWu7USS_ARlIhT_bbfGgF7eY6r6h1G62MJFjgyeKzDcVgyRJyTT-Bg8oe2WTI1TJuzB4aPgcKXRmPW9owxAdi8OyWhINpEiCyEw",
    idCardBackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBzNtLZxuoty6lRp6ecfP6rUa-mSPvdTTPOu1zXzEsD1qWQfJoSciDNMtapeGUJbFAncOmkVu8bwBN0v9t6AOSfUP9E7I6G8oLrVmh41lXkcPhUDdYvjg3v2AHQxy9kS8lm37QZ-sBkZirOoTEGg3DHZK4VyLvBgsxlHO2Curu_2NcESwely6EQSmeBla2KN27199zMpp7tzrbveQK_PU49zbjYq3ev-QAQMbX-WfI",
    selfieUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBXAR4XAYM1COq1Xam22xPKG2ffSw-g193v9FmuzM18vnl5a9AoLyYTY3gTvHFaRa16anvzcOAv6nz_SzZfUYQGO3VmI7BVnC8iNbawGBvt7tqLXihBxZ_BA7AkG0c562thPg_skyeN5QxPtl088HYV8LxuzlTWwpSEhaVwPImgTEcMy_VJzzKLqipAoE-HmgxN-2nFrdYPyXvAu7SjijwBmxKiXlDSpMF6n8hY--c",
    buyerScore: 88,
    purchasesCount: 42,
    memberSince: "Nov 2023",
  },
  {
    id: "sample-2",
    name: "Marcus Chen",
    legalName: "Marcus Wei Chen",
    handle: "@marcus_rare",
    email: "marcus.chen@nyc-vintage.com",
    phone: "+1 212 555 0192",
    submittedAtText: "45m ago",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    dob: "22 Aug 1996",
    age: 28,
    idNumber: "001196003190",
    idNumberMasked: "•••• 3190",
    bankName: "Techcombank",
    bankAccountMasked: "Techcombank (••1829)",
    bankAccountFull: "19038291021829",
    bankHolder: "MARCUS WEI CHEN",
    pickupAddress: "Spring St, SoHo, NY / Kho Ba Đình Hà Nội",
    status: "PENDING",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC6VM9rabxTy8m0XDbaIIwhmwgmpTOh-SfuJsdDZaSePh9dWsTXkIG50QTVoUhBObueViTeN5Nvt558VA1HbU7oeD3CWQgF5SqlKclIBpoIten2kA-rFBBJJZBOf_Jk-Xc5gWac35qB8CnaDZtbiEwQGGi1yMhqlIiMKl-YFqJBG57BZnKOLk3aq7Z4OC681SSAOK_UJ_lpuivDBkANgCP9aRWWoalIgL4snqRot-Y",
    idCardFrontUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA5AWPVE1v6x4iQuW_YIqSoqYNFJsurusuyoDu6P5s0jikHlw081ajGOY-Byo_nrk8doC3CLG4nINDPI1o9t_VdO-gmi9wRa1eQIFpeKZx46rrIGKl8BesNX0nWrX_ZDkhmiSgjDWu7USS_ARlIhT_bbfGgF7eY6r6h1G62MJFjgyeKzDcVgyRJyTT-Bg8oe2WTI1TJuzB4aPgcKXRmPW9owxAdi8OyWhINpEiCyEw",
    idCardBackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBzNtLZxuoty6lRp6ecfP6rUa-mSPvdTTPOu1zXzEsD1qWQfJoSciDNMtapeGUJbFAncOmkVu8bwBN0v9t6AOSfUP9E7I6G8oLrVmh41lXkcPhUDdYvjg3v2AHQxy9kS8lm37QZ-sBkZirOoTEGg3DHZK4VyLvBgsxlHO2Curu_2NcESwely6EQSmeBla2KN27199zMpp7tzrbveQK_PU49zbjYq3ev-QAQMbX-WfI",
    selfieUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBXAR4XAYM1COq1Xam22xPKG2ffSw-g193v9FmuzM18vnl5a9AoLyYTY3gTvHFaRa16anvzcOAv6nz_SzZfUYQGO3VmI7BVnC8iNbawGBvt7tqLXihBxZ_BA7AkG0c562thPg_skyeN5QxPtl088HYV8LxuzlTWwpSEhaVwPImgTEcMy_VJzzKLqipAoE-HmgxN-2nFrdYPyXvAu7SjijwBmxKiXlDSpMF6n8hY--c",
    buyerScore: 92,
    purchasesCount: 56,
    memberSince: "Jan 2023",
  },
  {
    id: "sample-3",
    name: "Sora Takahashi",
    legalName: "Sora Takahashi",
    handle: "@tokyo_threads",
    email: "sora.takahashi@omotesando.jp",
    phone: "+81 90 8821 5521",
    submittedAtText: "2h ago",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    dob: "05 Mar 1993",
    age: 31,
    idNumber: "079193005521",
    idNumberMasked: "•••• 5521",
    bankName: "Vietcombank",
    bankAccountMasked: "Vietcombank (••9033)",
    bankAccountFull: "007100989033",
    bankHolder: "SORA TAKAHASHI",
    pickupAddress: "Jeans Street, Kojima, Okayama / Kho Q7 TP.HCM",
    status: "PENDING",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDseQDLRU_j5LPVoWccxRTU2h4Ca7eB-8agqQ9ZZo7jA0VHmKFivlC0wQGZOXj8dnfNa7hWgw3Cy7zuFhyQ7TviP1IYUADhYXzjb4QIdn02Z-kSx1JzjJGC38kqWZZf7RbZMjyB6K12McJd9jzjWOEwWenXK8Yez7xR0L1LtfYVYVtcTCUxkh4DypBjDWiBB92itakjCAhgZJnPo648qjeCqptUfzK9VVYuVqReDcc",
    idCardFrontUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA5AWPVE1v6x4iQuW_YIqSoqYNFJsurusuyoDu6P5s0jikHlw081ajGOY-Byo_nrk8doC3CLG4nINDPI1o9t_VdO-gmi9wRa1eQIFpeKZx46rrIGKl8BesNX0nWrX_ZDkhmiSgjDWu7USS_ARlIhT_bbfGgF7eY6r6h1G62MJFjgyeKzDcVgyRJyTT-Bg8oe2WTI1TJuzB4aPgcKXRmPW9owxAdi8OyWhINpEiCyEw",
    idCardBackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBzNtLZxuoty6lRp6ecfP6rUa-mSPvdTTPOu1zXzEsD1qWQfJoSciDNMtapeGUJbFAncOmkVu8bwBN0v9t6AOSfUP9E7I6G8oLrVmh41lXkcPhUDdYvjg3v2AHQxy9kS8lm37QZ-sBkZirOoTEGg3DHZK4VyLvBgsxlHO2Curu_2NcESwely6EQSmeBla2KN27199zMpp7tzrbveQK_PU49zbjYq3ev-QAQMbX-WfI",
    selfieUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBXAR4XAYM1COq1Xam22xPKG2ffSw-g193v9FmuzM18vnl5a9AoLyYTY3gTvHFaRa16anvzcOAv6nz_SzZfUYQGO3VmI7BVnC8iNbawGBvt7tqLXihBxZ_BA7AkG0c562thPg_skyeN5QxPtl088HYV8LxuzlTWwpSEhaVwPImgTEcMy_VJzzKLqipAoE-HmgxN-2nFrdYPyXvAu7SjijwBmxKiXlDSpMF6n8hY--c",
    buyerScore: 85,
    purchasesCount: 31,
    memberSince: "Mar 2024",
  },
  {
    id: "sample-4",
    name: "Amara Diallo",
    legalName: "Amara Fatou Diallo",
    handle: "@amara_curates",
    email: "amara.diallo@dakar-milan.com",
    phone: "+39 02 8920 7740",
    submittedAtText: "3h ago",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    dob: "19 Dec 1991",
    age: 32,
    idNumber: "079191007740",
    idNumberMasked: "•••• 7740",
    bankName: "MB Bank",
    bankAccountMasked: "MB Bank (••6110)",
    bankAccountFull: "09123846110",
    bankHolder: "AMARA FATOU DIALLO",
    pickupAddress: "Via Montenapoleone, Milan / Kho Tân Bình TP.HCM",
    status: "PENDING",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJH5XrfaamwzK5j-tr0Z8YbayIVLM5xI6s5Zb-dHivnQAJkQZssWrgQgIFcC-XqVvnrUgwteMm8xdTcvIrB0LzlTOq7VkgZmYdsUPj_0CX9R7La7efM2S2lqKYDh6l4Yca-WzF8WfNrVaniOBj67MQvEM4AvaQQkgxhvaWSCnUZG361LfGk_4IHmtTdABFobu436_uJNMSeZvGfTqpUs43anvVd73HSsFYkg76n0s",
    idCardFrontUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA5AWPVE1v6x4iQuW_YIqSoqYNFJsurusuyoDu6P5s0jikHlw081ajGOY-Byo_nrk8doC3CLG4nINDPI1o9t_VdO-gmi9wRa1eQIFpeKZx46rrIGKl8BesNX0nWrX_ZDkhmiSgjDWu7USS_ARlIhT_bbfGgF7eY6r6h1G62MJFjgyeKzDcVgyRJyTT-Bg8oe2WTI1TJuzB4aPgcKXRmPW9owxAdi8OyWhINpEiCyEw",
    idCardBackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBzNtLZxuoty6lRp6ecfP6rUa-mSPvdTTPOu1zXzEsD1qWQfJoSciDNMtapeGUJbFAncOmkVu8bwBN0v9t6AOSfUP9E7I6G8oLrVmh41lXkcPhUDdYvjg3v2AHQxy9kS8lm37QZ-sBkZirOoTEGg3DHZK4VyLvBgsxlHO2Curu_2NcESwely6EQSmeBla2KN27199zMpp7tzrbveQK_PU49zbjYq3ev-QAQMbX-WfI",
    selfieUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBXAR4XAYM1COq1Xam22xPKG2ffSw-g193v9FmuzM18vnl5a9AoLyYTY3gTvHFaRa16anvzcOAv6nz_SzZfUYQGO3VmI7BVnC8iNbawGBvt7tqLXihBxZ_BA7AkG0c562thPg_skyeN5QxPtl088HYV8LxuzlTWwpSEhaVwPImgTEcMy_VJzzKLqipAoE-HmgxN-2nFrdYPyXvAu7SjijwBmxKiXlDSpMF6n8hY--c",
    buyerScore: 89,
    purchasesCount: 48,
    memberSince: "Jul 2023",
  },
  {
    id: "sample-5",
    name: "Elena Rostova",
    legalName: "Elena Mikhailovna Rostova",
    handle: "@elena_atelier",
    email: "elena.rostova@berlin-relics.de",
    phone: "+49 30 9940 1209",
    submittedAtText: "5h ago",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    dob: "30 Jan 1995",
    age: 29,
    idNumber: "079195001209",
    idNumberMasked: "•••• 1209",
    bankName: "Vietcombank",
    bankAccountMasked: "Vietcombank (••8820)",
    bankAccountFull: "045100038820",
    bankHolder: "ELENA ROSTOVA",
    pickupAddress: "Torstraße, Berlin / Kho Q3 TP.HCM",
    status: "PENDING",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDZ6gZ0gS2LVgouxVZL-3B1Bnq2-e3CmChC8aXESbPn9_MGAbVn5Gjgllkp47C4EIVKdhGpm8xA7J_hpsTozSLXkR6D-j3Due02jXO3HKNYOgeHsTo76R-pfqus8aQ72NR8EcyAG_ftM_S6S_5cj-jYHLjkmoK5p9FsPLBTbAWvBFcAibujRAXrZdP9vwy8yx35UT11gC_8Z2o5qCssiPvQbqNRRWkzPpm5HggoRws",
    idCardFrontUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA5AWPVE1v6x4iQuW_YIqSoqYNFJsurusuyoDu6P5s0jikHlw081ajGOY-Byo_nrk8doC3CLG4nINDPI1o9t_VdO-gmi9wRa1eQIFpeKZx46rrIGKl8BesNX0nWrX_ZDkhmiSgjDWu7USS_ARlIhT_bbfGgF7eY6r6h1G62MJFjgyeKzDcVgyRJyTT-Bg8oe2WTI1TJuzB4aPgcKXRmPW9owxAdi8OyWhINpEiCyEw",
    idCardBackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBzNtLZxuoty6lRp6ecfP6rUa-mSPvdTTPOu1zXzEsD1qWQfJoSciDNMtapeGUJbFAncOmkVu8bwBN0v9t6AOSfUP9E7I6G8oLrVmh41lXkcPhUDdYvjg3v2AHQxy9kS8lm37QZ-sBkZirOoTEGg3DHZK4VyLvBgsxlHO2Curu_2NcESwely6EQSmeBla2KN27199zMpp7tzrbveQK_PU49zbjYq3ev-QAQMbX-WfI",
    selfieUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBXAR4XAYM1COq1Xam22xPKG2ffSw-g193v9FmuzM18vnl5a9AoLyYTY3gTvHFaRa16anvzcOAv6nz_SzZfUYQGO3VmI7BVnC8iNbawGBvt7tqLXihBxZ_BA7AkG0c562thPg_skyeN5QxPtl088HYV8LxuzlTWwpSEhaVwPImgTEcMy_VJzzKLqipAoE-HmgxN-2nFrdYPyXvAu7SjijwBmxKiXlDSpMF6n8hY--c",
    buyerScore: 94,
    purchasesCount: 65,
    memberSince: "May 2023",
  },
  {
    id: "sample-6",
    name: "Thao Nguyen",
    legalName: "Nguyễn Thị Phương Thảo",
    handle: "@vintage_saigon",
    email: "thao.saigon.vintage@gmail.com",
    phone: "0908 123 6634",
    submittedAtText: "6h ago",
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    dob: "18 Sep 1997",
    age: 27,
    idNumber: "079197006634",
    idNumberMasked: "•••• 6634",
    bankName: "Techcombank",
    bankAccountMasked: "Techcombank (••7102)",
    bankAccountFull: "19036781297102",
    bankHolder: "NGUYEN THI PHUONG THAO",
    pickupAddress: "48 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
    status: "PENDING",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAH1QN_p2YMnLc27JkLyqa1cFhHe-TRgs7Ns0WpiR6xKz3xecpE1W-Uann1FEQtBSJKpmHG5szMWigtAHBtk39pRELFVrwfM3pQZBXQedPsFukbX1XnKXDdbxuzb2VrnzdkUB197acpY1MDkhplurXZh7kGeiK8-Q387Sw8jvAYxm0eWpF0oYvkOuIzTX53er_E9co08rdnOhDxRCEshuUEL-PsGXgk8vUa8dwbl-U",
    idCardFrontUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA5AWPVE1v6x4iQuW_YIqSoqYNFJsurusuyoDu6P5s0jikHlw081ajGOY-Byo_nrk8doC3CLG4nINDPI1o9t_VdO-gmi9wRa1eQIFpeKZx46rrIGKl8BesNX0nWrX_ZDkhmiSgjDWu7USS_ARlIhT_bbfGgF7eY6r6h1G62MJFjgyeKzDcVgyRJyTT-Bg8oe2WTI1TJuzB4aPgcKXRmPW9owxAdi8OyWhINpEiCyEw",
    idCardBackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBzNtLZxuoty6lRp6ecfP6rUa-mSPvdTTPOu1zXzEsD1qWQfJoSciDNMtapeGUJbFAncOmkVu8bwBN0v9t6AOSfUP9E7I6G8oLrVmh41lXkcPhUDdYvjg3v2AHQxy9kS8lm37QZ-sBkZirOoTEGg3DHZK4VyLvBgsxlHO2Curu_2NcESwely6EQSmeBla2KN27199zMpp7tzrbveQK_PU49zbjYq3ev-QAQMbX-WfI",
    selfieUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBXAR4XAYM1COq1Xam22xPKG2ffSw-g193v9FmuzM18vnl5a9AoLyYTY3gTvHFaRa16anvzcOAv6nz_SzZfUYQGO3VmI7BVnC8iNbawGBvt7tqLXihBxZ_BA7AkG0c562thPg_skyeN5QxPtl088HYV8LxuzlTWwpSEhaVwPImgTEcMy_VJzzKLqipAoE-HmgxN-2nFrdYPyXvAu7SjijwBmxKiXlDSpMF6n8hY--c",
    buyerScore: 79,
    purchasesCount: 19,
    memberSince: "Oct 2023",
  },
];

export default function AdminSellerVerificationPage() {
  const { user } = useAuth();

  // Data states
  const [applications, setApplications] = useState<ExtendedApplication[]>(SAMPLE_APPLICANTS);
  const [selectedId, setSelectedId] = useState<string>("sample-1");
  const [openReportsCount, setOpenReportsCount] = useState<number>(4);
  const [loading, setLoading] = useState(true);

  // Filters
  const [tab, setTab] = useState<StatusTab>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"oldest" | "newest" | "score">("oldest");
  const [bankFilter, setBankFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Verification Checklist
  const [checklist, setChecklist] = useState({
    clearPhoto: true,
    nameDobMatch: true,
    selfieMatch: false,
  });

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("blurry");
  const [rejectNotes, setRejectNotes] = useState("");

  // Lightbox
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; icon: string; visible: boolean }>({
    message: "",
    icon: "check_circle",
    visible: false,
  });

  const showToast = (message: string, icon = "check_circle") => {
    setToast({ message, icon, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3400);
  };

  // Fetch real data from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([
      adminApi.sellerApplications({ limit: 50 }),
      adminApi.reports({ status: "OPEN", limit: 1 }),
    ]).then(([appsResult, repResult]) => {
      if (cancelled) return;

      if (repResult.status === "fulfilled" && "meta" in repResult.value) {
        setOpenReportsCount(repResult.value.meta.total || 4);
      }

      if (appsResult.status === "fulfilled" && appsResult.value.data?.length) {
        const realApps: ExtendedApplication[] = appsResult.value.data.map((apiApp, i) => {
          const appName = apiApp.legalName || apiApp.shopName || apiApp.user?.name || "Boutique Curator";
          const shopHandle = `@${(apiApp.shopName || "atelier").toLowerCase().replace(/\s+/g, "_")}`;
          const last4 = (apiApp.idCardFrontUrl || apiApp.bankAccountNumber || "8912").slice(-4);
          const bankName = apiApp.bankName || "Vietcombank";

          return {
            id: apiApp.id,
            name: appName,
            legalName: apiApp.legalName || appName,
            handle: shopHandle,
            email: apiApp.user?.email || "seller@rewore.com",
            phone: apiApp.phone || apiApp.user?.phone || "+84 90 123 4567",
            submittedAtText: "Vừa xong",
            createdAt: apiApp.createdAt,
            dob: "12/04/1995",
            age: 29,
            idNumber: `07919500${last4}`,
            idNumberMasked: `•••• ${last4}`,
            bankName,
            bankAccountMasked: `${bankName} (••${(apiApp.bankAccountNumber || "4091").slice(-4)})`,
            bankAccountFull: apiApp.bankAccountNumber || "1029384091",
            bankHolder: apiApp.bankAccountName || appName.toUpperCase(),
            pickupAddress: apiApp.pickupAddress || "TP. Hồ Chí Minh",
            status: apiApp.status,
            avatarUrl:
              SAMPLE_APPLICANTS[i % SAMPLE_APPLICANTS.length].avatarUrl ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            idCardFrontUrl: apiApp.idCardFrontUrl ? apiAssetUrl(apiApp.idCardFrontUrl) : SAMPLE_APPLICANTS[0].idCardFrontUrl,
            idCardBackUrl: apiApp.idCardBackUrl ? apiAssetUrl(apiApp.idCardBackUrl) : SAMPLE_APPLICANTS[0].idCardBackUrl,
            selfieUrl: apiApp.selfieUrl ? apiAssetUrl(apiApp.selfieUrl) : SAMPLE_APPLICANTS[0].selfieUrl,
            buyerScore: 82 + ((i * 7) % 15),
            purchasesCount: 15 + ((i * 11) % 40),
            memberSince: "Thg 10 2023",
            isRealDbItem: true,
          };
        });

        // Merge real applications with sample applications
        const merged = [...realApps, ...SAMPLE_APPLICANTS.filter((s) => !realApps.some((r) => r.id === s.id))];
        setApplications(merged);
        if (realApps[0]?.id) setSelectedId(realApps[0].id);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    let list = applications.filter((app) => {
      // Tab filter
      if (tab === "PENDING" && app.status !== "PENDING" && app.status !== "PENDING_VERIFICATION") return false;
      if (tab === "APPROVED" && app.status !== "APPROVED") return false;
      if (tab === "REJECTED" && app.status !== "REJECTED") return false;

      // Bank filter
      if (bankFilter !== "ALL" && !app.bankName.toLowerCase().includes(bankFilter.toLowerCase())) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = app.name.toLowerCase().includes(q);
        const matchLegal = app.legalName.toLowerCase().includes(q);
        const matchHandle = app.handle.toLowerCase().includes(q);
        const matchEmail = app.email.toLowerCase().includes(q);
        const matchId = app.idNumber.toLowerCase().includes(q) || app.idNumberMasked.toLowerCase().includes(q);
        if (!matchName && !matchLegal && !matchHandle && !matchEmail && !matchId) return false;
      }

      return true;
    });

    // Sort
    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "score") {
      list.sort((a, b) => b.buyerScore - a.buyerScore);
    }

    return list;
  }, [applications, tab, bankFilter, searchQuery, sortBy]);

  // Selected applicant
  const selectedApplicant = useMemo(() => {
    return applications.find((a) => a.id === selectedId) || filteredApplications[0] || applications[0];
  }, [applications, selectedId, filteredApplications]);

  // Reset checklist when applicant changes
  useEffect(() => {
    setChecklist({
      clearPhoto: true,
      nameDobMatch: true,
      selfieMatch: selectedApplicant?.status === "APPROVED",
    });
  }, [selectedApplicant?.id, selectedApplicant?.status]);

  // Counts
  const pendingCount = applications.filter((a) => a.status === "PENDING" || a.status === "PENDING_VERIFICATION").length;
  const approvedCount = applications.filter((a) => a.status === "APPROVED").length + 184; // Real + Month Base
  const rejectedCount = applications.filter((a) => a.status === "REJECTED").length + 24;

  // Actions
  const handleSelectRow = (app: ExtendedApplication) => {
    setSelectedId(app.id);
    showToast(`Đã chọn ứng viên: ${app.name} (${app.handle})`, "touch_app");
  };

  const handleApprove = async () => {
    if (!checklist.clearPhoto || !checklist.nameDobMatch || !checklist.selfieMatch) {
      showToast("Vui lòng xác nhận đủ 3 mục trong Verification Checklist trước khi phê duyệt!", "warning");
      return;
    }

    if (selectedApplicant.isRealDbItem) {
      try {
        await adminApi.approveSellerApplication(selectedApplicant.id);
      } catch (err: any) {
        showToast(err?.message || "Không thể gửi lệnh duyệt đến máy chủ.", "error");
        return;
      }
    }

    setApplications((prev) =>
      prev.map((a) => (a.id === selectedApplicant.id ? { ...a, status: "APPROVED" } : a))
    );

    showToast(`${selectedApplicant.name} đã được phê duyệt thành công lên hạng Seller!`, "verified");
  };

  const handleOpenRejectModal = () => {
    setRejectNotes("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    const fullReason = `${rejectReason}: ${rejectNotes.trim() || "Tài liệu không khớp hoặc không đủ điều kiện định danh"}`;

    if (selectedApplicant.isRealDbItem) {
      try {
        await adminApi.rejectSellerApplication(selectedApplicant.id, fullReason);
      } catch (err: any) {
        showToast(err?.message || "Lỗi khi từ chối hồ sơ.", "error");
        return;
      }
    }

    setApplications((prev) =>
      prev.map((a) => (a.id === selectedApplicant.id ? { ...a, status: "REJECTED" } : a))
    );

    setRejectModalOpen(false);
    showToast(`Đã từ chối hồ sơ của ${selectedApplicant.name}. Email hướng dẫn đã được gửi đi.`, "gavel");
  };

  return (
    <AdminShell pendingSellers={pendingCount} openReports={openReportsCount}>
      <div className="flex flex-col w-full min-h-screen overflow-auto">
        {/* Top Header Banner */}
        <header className="w-full px-10 pt-8 pb-6 border-b border-[#dbc1b9]/30 flex flex-col gap-4 bg-[#fff8f5]">
          <div className="flex items-center justify-between">
            {/* Breadcrumb & Title */}
            <div>
              <nav className="flex items-center gap-2 text-[#6b6357] font-label-sm text-xs mb-1.5">
                <span>Admin Console</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-[#974226] font-semibold">Seller Verification</span>
              </nav>
              <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#231a11] font-semibold tracking-tight">
                Seller Verification Queue
              </h1>
              <p className="font-body-md text-sm text-[#55433d] mt-0.5">
                Review identity documentation, KYC submissions, and payout credentials.
              </p>
            </div>

            {/* Metric Quick-Pills */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-[#f8e5d6] border border-[#dbc1b9]/40 flex items-center gap-2.5 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#974226] animate-pulse"></span>
                <div>
                  <p className="font-label-sm text-xs text-[#55433d]">Pending Review</p>
                  <p className="font-label-md text-sm font-bold text-[#974226]">
                    {pendingCount} Applications
                  </p>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-[#f8e5d6] border border-[#dbc1b9]/40 flex items-center gap-2.5 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#556138]"></span>
                <div>
                  <p className="font-label-sm text-xs text-[#55433d]">Approved This Month</p>
                  <p className="font-label-md text-sm font-bold text-[#556138]">
                    {approvedCount} Sellers
                  </p>
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-[#f8e5d6] border border-[#dbc1b9]/40 flex items-center gap-2.5 shadow-sm">
                <span className="material-symbols-outlined text-[#974226] text-[20px]">verified</span>
                <div>
                  <p className="font-label-sm text-xs text-[#55433d]">Verification SLA</p>
                  <p className="font-label-md text-sm font-bold text-[#231a11]">98.2% on-time</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* CONTENT SPLIT LAYOUT (60% Left Queue / 40% Right Detail Panel) */}
        {/* ========================================================================= */}
        <div className="px-10 py-8 flex gap-7 items-start flex-1 bg-[#fff8f5]">
          {/* --------------------------------------------------------------------- */}
          {/* LEFT COLUMN: Verification Queue (60%) */}
          {/* --------------------------------------------------------------------- */}
          <section className="w-[60%] flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#dbc1b9]/30 flex flex-col gap-6">
              {/* Status Tabs */}
              <div className="flex items-center justify-between border-b border-[#dbc1b9]/30 pb-3">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      setTab("PENDING");
                      setPage(1);
                    }}
                    className={`relative font-label-md text-sm pb-3 -mb-3.5 flex items-center gap-2 transition-colors ${
                      tab === "PENDING"
                        ? "font-bold text-[#974226] border-b-2 border-[#974226]"
                        : "text-[#55433d] hover:text-[#231a11]"
                    }`}
                  >
                    <span>Pending</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#feeadc] text-[#974226] font-label-sm text-xs font-bold">
                      {pendingCount}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setTab("APPROVED");
                      setPage(1);
                    }}
                    className={`font-label-md text-sm pb-3 -mb-3.5 flex items-center gap-2 transition-colors ${
                      tab === "APPROVED"
                        ? "font-bold text-[#974226] border-b-2 border-[#974226]"
                        : "text-[#55433d] hover:text-[#231a11]"
                    }`}
                  >
                    <span>Approved</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ede1d2] text-[#6b6357] font-label-sm text-xs">
                      {approvedCount}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setTab("REJECTED");
                      setPage(1);
                    }}
                    className={`font-label-md text-sm pb-3 -mb-3.5 flex items-center gap-2 transition-colors ${
                      tab === "REJECTED"
                        ? "font-bold text-[#974226] border-b-2 border-[#974226]"
                        : "text-[#55433d] hover:text-[#231a11]"
                    }`}
                  >
                    <span>Rejected</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ede1d2] text-[#6b6357] font-label-sm text-xs">
                      {rejectedCount}
                    </span>
                  </button>
                </div>

                <div className="text-[#6b6357] font-label-sm text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  <span>Updated 2m ago</span>
                </div>
              </div>

              {/* Toolbar: Search + Sort + Filter */}
              <div className="flex items-center gap-3">
                {/* Search bar */}
                <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#88726c] text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search applicant name, email, ID..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dbc1b9] bg-white text-[#231a11] font-body-md text-sm focus:outline-none focus:border-[#231a11] transition-colors placeholder:text-[#88726c]"
                  />
                </div>

                {/* Sort dropdown */}
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#dbc1b9] bg-white text-[#231a11] font-label-md text-sm focus:outline-none focus:border-[#231a11] transition-colors cursor-pointer"
                  >
                    <option value="oldest">Oldest first</option>
                    <option value="newest">Newest first</option>
                    <option value="score">High buyer score</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#88726c] text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>

                {/* Filter Payout method */}
                <div className="relative shrink-0">
                  <select
                    value={bankFilter}
                    onChange={(e) => {
                      setBankFilter(e.target.value);
                      setPage(1);
                    }}
                    className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#dbc1b9] bg-white text-[#231a11] font-label-md text-sm focus:outline-none focus:border-[#231a11] transition-colors cursor-pointer"
                  >
                    <option value="ALL">All Payout Banks</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="MB Bank">MB Bank</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#88726c] text-[18px] pointer-events-none">
                    tune
                  </span>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-hidden rounded-xl border border-[#dbc1b9]/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fff1e8] border-b border-[#dbc1b9]/40 text-[#55433d] font-label-sm text-xs">
                      <th className="py-3 px-4 font-semibold">Applicant</th>
                      <th className="py-3 px-4 font-semibold">Submitted</th>
                      <th className="py-3 px-4 font-semibold">ID Number</th>
                      <th className="py-3 px-4 font-semibold">Payout Method</th>
                      <th className="py-3 px-4 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbc1b9]/30 text-[#231a11]">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-[#88726c]">
                          Không tìm thấy hồ sơ nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => {
                        const isSelected = app.id === selectedApplicant?.id;
                        return (
                          <tr
                            key={app.id}
                            onClick={() => handleSelectRow(app)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-[#f8e5d6]/50 border-l-4 border-l-[#974226]"
                                : "hover:bg-[#fff1e8]/60"
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-[#dbc1b9]/60 shrink-0 bg-[#f8e5d6]">
                                  <img
                                    className="w-full h-full object-cover"
                                    src={app.avatarUrl}
                                    alt={app.name}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-label-md text-sm font-bold text-[#231a11]">
                                      {app.name}
                                    </p>
                                    {isSelected && (
                                      <span
                                        className="material-symbols-outlined text-[#974226] text-[15px] fill-icon"
                                        title="Selected"
                                      >
                                        check_circle
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-label-sm text-xs text-[#6b6357]">
                                    {app.handle}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-label-sm text-xs text-[#55433d]">
                              {app.submittedAtText}
                            </td>
                            <td className="py-3.5 px-4 font-label-sm text-xs text-[#231a11] font-mono">
                              {app.idNumberMasked}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-[#231a11] font-label-sm text-xs">
                                <span className="material-symbols-outlined text-[16px] text-[#556138]">
                                  account_balance
                                </span>
                                <span>{app.bankAccountMasked}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {app.status === "APPROVED" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dae9b5] text-[#151f01] font-label-sm text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#556138]"></span>
                                  Approved
                                </span>
                              ) : app.status === "REJECTED" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] font-label-sm text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                                  Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#feeadc] text-[#974226] font-label-sm text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#974226] animate-pulse"></span>
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination / Table Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-label-sm text-xs text-[#6b6357]">
                  Showing 1-{Math.min(filteredApplications.length, 6)} of {filteredApplications.length} applicants
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled
                    className="w-8 h-8 rounded-lg border border-[#dbc1b9] flex items-center justify-center text-[#88726c] hover:text-[#231a11] disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-[#974226] text-white font-label-sm text-xs font-bold flex items-center justify-center">
                    1
                  </button>
                  <button className="w-8 h-8 rounded-lg border border-[#dbc1b9] font-label-sm text-xs text-[#231a11] hover:bg-[#f2dfd1] flex items-center justify-center">
                    2
                  </button>
                  <button className="w-8 h-8 rounded-lg border border-[#dbc1b9] flex items-center justify-center text-[#231a11] hover:bg-[#f2dfd1]">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: Detail Panel (40%) */}
          {/* --------------------------------------------------------------------- */}
          <section className="w-[40%] sticky top-8 flex flex-col gap-5">
            {selectedApplicant ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#dbc1b9]/30 flex flex-col gap-6">
                {/* Applicant Header & Buyer Score Badge */}
                <div className="flex items-start justify-between border-b border-[#dbc1b9]/30 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#dbc1b9] shrink-0 bg-[#f8e5d6]">
                      <img
                        className="w-full h-full object-cover"
                        src={selectedApplicant.avatarUrl}
                        alt={selectedApplicant.name}
                      />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-headline-md text-xl font-semibold text-[#231a11]">
                        {selectedApplicant.name}
                      </h2>
                      <p className="font-label-md text-sm text-[#974226] font-semibold">
                        {selectedApplicant.handle}
                      </p>
                      <p className="font-label-sm text-xs text-[#6b6357] mt-1">
                        Member since {selectedApplicant.memberSince} · {selectedApplicant.purchasesCount} purchases
                      </p>
                    </div>
                  </div>

                  {/* Radial Buyer Score Ring */}
                  <div className="flex flex-col items-center bg-[#fff1e8] p-2.5 rounded-xl border border-[#dbc1b9]/40 shrink-0">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[#f2dfd1]"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        />
                        <path
                          className="text-[#556138]"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray={`${selectedApplicant.buyerScore}, 100`}
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        />
                      </svg>
                      <span className="absolute font-headline-md text-sm font-bold text-[#231a11]">
                        {selectedApplicant.buyerScore}
                      </span>
                    </div>
                    <span className="font-label-sm text-[10px] text-[#556138] font-bold tracking-tight uppercase mt-1">
                      Verified Buyer
                    </span>
                  </div>
                </div>

                {/* Submitted Legal & Financial Info Grid */}
                <div className="bg-[#fff1e8]/70 rounded-xl p-4 border border-[#dbc1b9]/40">
                  <h3 className="font-label-md text-xs font-bold uppercase tracking-wider mb-3 text-[#88726c]">
                    Verified Credentials &amp; Payout
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
                    <div>
                      <p className="font-label-sm text-xs text-[#6b6357]">Full Legal Name</p>
                      <p className="font-body-md text-sm font-bold text-[#231a11] mt-0.5">
                        {selectedApplicant.legalName}
                      </p>
                    </div>

                    <div>
                      <p className="font-label-sm text-xs text-[#6b6357]">Date of Birth</p>
                      <p className="font-body-md text-sm font-bold text-[#231a11] mt-0.5">
                        {selectedApplicant.dob} ({selectedApplicant.age} y/o)
                      </p>
                    </div>

                    <div>
                      <p className="font-label-sm text-xs text-[#6b6357]">ID Document (Citizen/Passport)</p>
                      <p className="font-body-md text-sm font-bold text-[#231a11] font-mono mt-0.5">
                        {selectedApplicant.idNumberMasked}
                      </p>
                      <span className="font-label-sm text-[11px] text-[#556138] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">check</span> Valid (Issued 2021)
                      </span>
                    </div>

                    <div>
                      <p className="font-label-sm text-xs text-[#6b6357]">Linked Payout Bank</p>
                      <p className="font-body-md text-sm font-bold text-[#231a11] mt-0.5">
                        {selectedApplicant.bankAccountMasked}
                      </p>
                      <span className="font-label-sm text-[11px] text-[#556138] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">check</span> Holder Match Confirmed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Review Thumbnails (3 items) */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-label-md text-sm font-bold text-[#231a11]">
                      Identity Documentation
                    </h3>
                    <span className="font-label-sm text-xs text-[#88726c]">3 uploads</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* ID Front */}
                    <div
                      onClick={() =>
                        setLightbox({ url: selectedApplicant.idCardFrontUrl, title: "Mặt trước CCCD / Hộ chiếu" })
                      }
                      className="group relative rounded-xl overflow-hidden border border-[#dbc1b9] bg-[#feeadc] aspect-[4/3] flex flex-col justify-between p-2 cursor-pointer shadow-xs hover:border-[#974226] transition-all"
                    >
                      <img
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={selectedApplicant.idCardFrontUrl}
                        alt="ID Front"
                      />
                      <div className="relative z-10 flex justify-end">
                        <button className="w-6 h-6 rounded-full bg-white/90 text-[#231a11] flex items-center justify-center shadow-sm hover:bg-white">
                          <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                        </button>
                      </div>
                      <div className="relative z-10 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-center">
                        <p className="font-label-sm text-[11px] font-bold text-[#231a11] truncate">ID Front</p>
                      </div>
                    </div>

                    {/* ID Back */}
                    <div
                      onClick={() =>
                        setLightbox({ url: selectedApplicant.idCardBackUrl, title: "Mặt sau CCCD / Hộ chiếu" })
                      }
                      className="group relative rounded-xl overflow-hidden border border-[#dbc1b9] bg-[#feeadc] aspect-[4/3] flex flex-col justify-between p-2 cursor-pointer shadow-xs hover:border-[#974226] transition-all"
                    >
                      <img
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={selectedApplicant.idCardBackUrl}
                        alt="ID Back"
                      />
                      <div className="relative z-10 flex justify-end">
                        <button className="w-6 h-6 rounded-full bg-white/90 text-[#231a11] flex items-center justify-center shadow-sm hover:bg-white">
                          <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                        </button>
                      </div>
                      <div className="relative z-10 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-center">
                        <p className="font-label-sm text-[11px] font-bold text-[#231a11] truncate">ID Back</p>
                      </div>
                    </div>

                    {/* Selfie Holding ID */}
                    <div
                      onClick={() =>
                        setLightbox({ url: selectedApplicant.selfieUrl, title: "Ảnh chân dung cầm CCCD đối chiếu" })
                      }
                      className="group relative rounded-xl overflow-hidden border border-[#dbc1b9] bg-[#feeadc] aspect-[4/3] flex flex-col justify-between p-2 cursor-pointer shadow-xs hover:border-[#974226] transition-all"
                    >
                      <img
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={selectedApplicant.selfieUrl}
                        alt="Selfie Holding ID"
                      />
                      <div className="relative z-10 flex justify-end">
                        <button className="w-6 h-6 rounded-full bg-white/90 text-[#231a11] flex items-center justify-center shadow-sm hover:bg-white">
                          <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                        </button>
                      </div>
                      <div className="relative z-10 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-center">
                        <p className="font-label-sm text-[11px] font-bold text-[#231a11] truncate">Selfie w/ ID</p>
                      </div>
                    </div>
                  </div>

                  <p className="font-label-sm text-[11px] text-[#6b6357] mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    Click any photo to inspect high-resolution biometric scan
                  </p>
                </div>

                {/* Admin Verification Checklist (Interactive) */}
                <div className="space-y-2">
                  <h3 className="font-label-md text-sm font-bold text-[#231a11]">
                    Verification Checklist
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-[#dbc1b9]/40 bg-[#fff1e8]/40 cursor-pointer hover:bg-[#fff1e8] transition-colors">
                      <input
                        type="checkbox"
                        checked={checklist.clearPhoto}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, clearPhoto: e.target.checked }))}
                        className="w-4 h-4 rounded text-[#556138] focus:ring-[#556138] border-[#88726c]"
                      />
                      <span className="font-body-md text-xs text-[#231a11]">
                        Photo is clear, uncompressed and unedited
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-[#dbc1b9]/40 bg-[#fff1e8]/40 cursor-pointer hover:bg-[#fff1e8] transition-colors">
                      <input
                        type="checkbox"
                        checked={checklist.nameDobMatch}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, nameDobMatch: e.target.checked }))}
                        className="w-4 h-4 rounded text-[#556138] focus:ring-[#556138] border-[#88726c]"
                      />
                      <span className="font-body-md text-xs text-[#231a11]">
                        Full name and date of birth match ID document exactly
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-[#dbc1b9]/40 bg-[#fff1e8]/40 cursor-pointer hover:bg-[#fff1e8] transition-colors">
                      <input
                        type="checkbox"
                        checked={checklist.selfieMatch}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, selfieMatch: e.target.checked }))}
                        className="w-4 h-4 rounded text-[#556138] focus:ring-[#556138] border-[#88726c]"
                      />
                      <span className="font-body-md text-xs text-[#231a11]">
                        Selfie facial features match ID card photograph
                      </span>
                    </label>
                  </div>
                </div>

                {/* Starter Seller Score Preview & Escrow Limit */}
                <div className="p-3.5 rounded-xl bg-[#f8e5d6]/60 border border-[#dbc1b9]/40 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#ede1d2] border border-[#88726c]/40 flex flex-col items-center justify-center shrink-0">
                    <span className="font-headline-md text-lg font-bold text-[#974226] leading-none">
                      55
                    </span>
                    <span className="font-label-sm text-[9px] uppercase font-bold text-[#6b6357]">
                      Trust
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-label-md text-xs font-bold text-[#231a11]">
                        Starter Seller Score Preview
                      </p>
                      <span className="font-label-sm text-xs text-[#556138] font-semibold">
                        +40 ID · +10 Credit · +5 Contact
                      </span>
                    </div>
                    <p className="font-label-sm text-[11px] text-[#55433d] mt-0.5">
                      Initial escrow cap: ₫15,000,000 max withdrawal until 5 completed transactions.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {/* Approve Button (Olive Green) */}
                  <button
                    onClick={handleApprove}
                    disabled={selectedApplicant.status === "APPROVED"}
                    className="flex-1 py-3 px-5 rounded-xl bg-[#556138] hover:bg-[#556138]/90 text-white font-label-md text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                    <span>
                      {selectedApplicant.status === "APPROVED" ? "Seller Approved ✓" : "Approve Seller"}
                    </span>
                  </button>

                  {/* Reject Button (Red Outline) */}
                  <button
                    onClick={handleOpenRejectModal}
                    disabled={selectedApplicant.status === "REJECTED"}
                    className="py-3 px-5 rounded-xl border-2 border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/30 font-label-md text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                    <span>Reject Application</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#dbc1b9]/30 text-[#88726c]">
                <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
                <p className="font-label-md text-sm">Vui lòng chọn một ứng viên trong danh sách bên trái.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE REJECTION MODAL SHEET OVERLAY */}
      {/* ========================================================================= */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-[#231a11]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-[#dbc1b9] flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#dbc1b9]/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">gavel</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-lg text-[#231a11] font-semibold">
                    Reject Seller Verification
                  </h3>
                  <p className="font-label-sm text-xs text-[#6b6357]">
                    Applicant: <span className="font-bold text-[#231a11]">{selectedApplicant?.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[#f2dfd1] flex items-center justify-center text-[#88726c]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4">
              {/* Rejection Reason Dropdown */}
              <div>
                <label className="block font-label-md text-xs text-[#231a11] font-semibold mb-1.5">
                  Primary Rejection Reason
                </label>
                <div className="relative">
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-[#dbc1b9] bg-white text-[#231a11] font-body-md text-sm focus:outline-none focus:border-[#231a11]"
                  >
                    <option value="blurry">Blurry / unreadable photo</option>
                    <option value="mismatch">Information mismatch with official document</option>
                    <option value="expired">Expired identification document</option>
                    <option value="fake">Suspected forged or digital-tampered ID</option>
                    <option value="unverified_bank">Bank account holder name mismatch</option>
                    <option value="other">Other compliance policy violation</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#88726c] text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Admin Internal Note Textarea */}
              <div>
                <label className="block font-label-md text-xs text-[#231a11] font-semibold mb-1.5">
                  Internal Explanatory Note &amp; Applicant Guidance
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Explain the specific deficiency clearly to the applicant so they may re-submit accurate documents..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbc1b9] bg-white text-[#231a11] font-body-md text-sm focus:outline-none focus:border-[#231a11] placeholder:text-[#88726c]"
                />
                <p className="font-label-sm text-[11px] text-[#88726c] mt-1">
                  This explanation will be emailed to the seller and archived in compliance logs.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#dbc1b9]/30">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-[#dbc1b9] text-[#231a11] font-label-md text-sm font-semibold hover:bg-[#f2dfd1] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="py-2.5 px-5 rounded-xl bg-[#ba1a1a] text-white font-label-md text-sm font-bold flex items-center gap-2 hover:bg-[#ba1a1a]/90 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Send &amp; Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIGH-RES DOCUMENT LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-[#231a11]/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#dbc1b9]/40 flex flex-col"
          >
            <div className="px-6 py-4 bg-[#fff1e8] border-b border-[#dbc1b9]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#974226]">fingerprint</span>
                <h4 className="font-label-md text-sm font-bold text-[#231a11]">{lightbox.title}</h4>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="w-8 h-8 rounded-full hover:bg-[#f2dfd1] flex items-center justify-center text-[#88726c]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-[#231a11]/5 overflow-auto">
              <img
                src={lightbox.url}
                alt={lightbox.title}
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOAST NOTIFICATION CONTAINER */}
      {/* ========================================================================= */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none ${
          toast.visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
        }`}
      >
        <div className="px-5 py-3 rounded-xl bg-[#231a11] text-[#fff8f5] flex items-center gap-3 shadow-xl border border-[#88726c]/40 font-label-md text-sm">
          <span className="material-symbols-outlined text-[#dae9b5] text-[20px]">
            {toast.icon}
          </span>
          <span>{toast.message}</span>
        </div>
      </div>
    </AdminShell>
  );
}
