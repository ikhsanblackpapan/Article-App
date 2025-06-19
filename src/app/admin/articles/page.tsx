"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import debounce from "lodash.debounce";
import api from "@/lib/api";

// ==================== LOADING COMPONENT ====================
function BlueLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
  );
}

interface Category {
  id: string;
  name: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  category: Category;
  createdAt: string;
}

interface ApiResponse {
  data: Article[];
  total?: number;
  last_page?: number;
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const limit = 10;

  // Role-based protection
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "Admin") {
      setError("Akses ditolak. Anda tidak memiliki izin sebagai admin.");
      setTimeout(() => {
        router.replace("/login?error=Unauthorized");
      }, 1000);
    }
  }, [router]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get<{ data: Category[] }>(
        "https://test-fe.mysellerpintar.com/api/categories"
      );
      setCategories(res.data.data);
    } catch (err) {
      setError("Gagal memuat kategori.");
      console.error("Gagal memuat kategori:", err);
    }
  }, []);

  // Fetch articles with filters
  const fetchArticles = useCallback(async () => {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get<ApiResponse>(
        "https://test-fe.mysellerpintar.com/api/articles",
        {
          params: {
            page,
            limit,
            category: selectedCategory || undefined,
            search: searchQuery || undefined,
          },
          signal: controllerRef.current.signal,
        }
      );

      if (!controllerRef.current.signal.aborted) {
        setArticles(res.data.data);
        setTotalPages(
          res.data.last_page || Math.ceil((res.data.total || 0) / limit)
        );
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError("Gagal memuat artikel.");
        console.error("Gagal memuat artikel:", err);
      }
    } finally {
      if (!controllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [page, selectedCategory, searchQuery]);

  // Debounced search
  const debouncedSearchHandler = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
        setPage(1);
      }, 400),
    []
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchArticles();
    return () => controllerRef.current?.abort();
  }, [fetchArticles]);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus artikel ini?")) return;
    try {
      await api.delete(`/articles/${id}`);
      fetchArticles();
    } catch (err) {
      setError("Gagal menghapus artikel. Silakan login kembali.");
      console.error("Gagal menghapus:", err);
    }
  };

  // Cleanup debounce
  useEffect(() => {
    return () => {
      debouncedSearchHandler.cancel();
    };
  }, [debouncedSearchHandler]);

  // Handle navigation loading
  const handleNavigate = (href: string) => {
    setNavigating(true);
    setTimeout(() => {
      router.push(href);
    }, 400);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      {(loading || navigating) && <BlueLoading />}

      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-blue-700 drop-shadow tracking-tight">
            Kelola Artikel
          </h1>
          <button
            onClick={() => handleNavigate("/admin/articles/create")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-1.5 rounded-md shadow-sm font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={navigating}
          >
            <span className="text-lg">+</span> Tambah Artikel
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center font-semibold">
            {error}
          </div>
        )}

        {/* Filter and Search Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="border p-2 rounded-md w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
            disabled={loading}
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Cari artikel..."
            onChange={(e) => debouncedSearchHandler(e.target.value)}
            className="border p-2 rounded-md flex-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
            disabled={loading}
          />
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-blue-100/60 animate-pulse rounded-2xl shadow"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-500">Tidak ada artikel ditemukan</p>
            <button
              onClick={() => {
                setSelectedCategory("");
                setSearchQuery("");
                setPage(1);
              }}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Reset pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <div
                key={article.id}
                className="rounded-2xl shadow-xl bg-white/90 border border-blue-100 transition-all flex flex-col overflow-hidden group"
                style={{ backdropFilter: "blur(2px)" }}
              >
                <img
                  src={article.imageUrl || "/images/no-image.jpg"}
                  alt={article.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-5 flex flex-col h-full">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-blue-900 group-hover:text-blue-700 transition">
                    {article.title}
                  </h3>
                  <p className="text-xs text-blue-600 mb-1">
                    {article.category?.name || "Tanpa Kategori"}
                  </p>
                  <span className="text-xs text-gray-400 mb-4">
                    {new Date(article.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() =>
                        handleNavigate(`/admin/articles/${article.id}`)
                      }
                      className="flex-1 text-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded font-semibold transition border border-blue-500 shadow-sm"
                      disabled={navigating}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="flex-1 text-center bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded font-semibold transition border border-red-200 shadow-sm"
                      disabled={navigating}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2 items-center select-none">
            {/* Tombol Sebelumnya */}
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium border transition
                ${
                  page === 1 || loading
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white/70 text-blue-700 border-gray-200 hover:bg-blue-50 hover:text-blue-800"
                }`}
            >
              <span className="text-base">&#8592;</span>
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            {/* Nomor Halaman */}
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  disabled={page === pageNum || loading}
                  className={`mx-1 px-3 py-1.5 rounded-md font-semibold border transition
                    ${
                      page === pageNum
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-white/70 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-800"
                    }`}
                  style={{ minWidth: 36 }}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Tombol Selanjutnya */}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium border transition
                ${
                  page >= totalPages || loading
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white/70 text-blue-700 border-gray-200 hover:bg-blue-50 hover:text-blue-800"
                }`}
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <span className="text-base">&#8594;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}