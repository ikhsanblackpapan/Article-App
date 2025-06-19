"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios, { AxiosError } from "axios";
import debounce from "lodash.debounce";
import { useRouter, useSearchParams } from "next/navigation";

// ==================== TYPE DEFINITIONS ====================
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

interface ArticlesApiResponse {
  data: Article[];
  total?: number;
  last_page?: number;
}

interface User {
  username: string;
  role: string;
}

// ==================== NOTIFIKASI SUKSES LOGIN ====================
function LoginSuccessToast({ show, onClose }: { show: boolean; onClose: () => void }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;
  return (
    <div className="fixed top-6 right-6 z-[9999] animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl border border-green-200 px-6 py-4 flex items-center gap-3 min-w-[260px]">
        <span className="bg-green-100 rounded-full p-2 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-500 animate-pop" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 13l3 3 7-7" />
          </svg>
        </span>
        <div>
          <div className="font-bold text-green-700 text-base mb-0.5">Login Berhasil!</div>
          <div className="text-green-600 text-sm">Selamat datang kembali 👋</div>
        </div>
      </div>
      <style jsx>{`
        .animate-fade-in-up {
          animation: fade-in-up 0.35s cubic-bezier(.4,2,.6,1) both;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-pop {
          animation: pop 0.3s cubic-bezier(.4,2,.6,1);
        }
        @keyframes pop {
          0% { transform: scale(0.7);}
          80% { transform: scale(1.15);}
          100% { transform: scale(1);}
        }
      `}</style>
    </div>
  );
}

// ==================== LOADING COMPONENT ====================
function BlueLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function ArticleListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [authChecked, setAuthChecked] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const limit = 9;

  // ==================== AUTHENTICATION HANDLERS ====================
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    setUser({ username: username || '', role: role || 'User' });

    if (!token) {
      router.push('/login?redirect=/articles');
    } else {
      setUser({ username: username || '', role: role || 'User' });
      setAuthChecked(true);
    }
  }, [router]);

  // Tampilkan notif login sukses jika ada query success
  useEffect(() => {
    if (searchParams.get("success") === "login") {
      setShowLoginSuccess(true);
      // Hapus query success dari url setelah tampil
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const handleLogout = () => {
    setNavigating(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      router.push('/login');
      setNavigating(false);
    }, 600);
  };

  // ==================== API FUNCTIONS ====================
  const fetchArticles = useCallback(async () => {
    if (!authChecked) return;

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get<ArticlesApiResponse>(
        "https://test-fe.mysellerpintar.com/api/articles",
        {
          params: {
            category: selectedCategory || undefined,
            search: searchQuery || undefined,
            page,
            limit,
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
        const message =
          err instanceof AxiosError
            ? err.response?.data?.message || err.message
            : "Gagal memuat artikel";
        setError(message);
      }
    } finally {
      if (!controllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedCategory, searchQuery, page, limit, authChecked]);

  const fetchCategories = useCallback(async () => {
    if (!authChecked) return;

    try {
      const res = await axios.get<{ data: Category[] }>(
        "https://test-fe.mysellerpintar.com/api/categories",
        {
          signal: controllerRef.current?.signal,
        }
      );
      setCategories(res.data.data.filter((cat) => cat.id && cat.name));
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Gagal memuat kategori:", err);
      }
    }
  }, [authChecked]);

  // ==================== EVENT HANDLERS ====================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (authChecked) {
      fetchCategories();
    }
    return () => {
      controllerRef.current?.abort();
    };
  }, [authChecked, fetchCategories]);

  useEffect(() => {
    if (authChecked) {
      fetchArticles();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [authChecked, fetchArticles]);

  // ==================== DEBOUNCE HANDLER ====================
  const debouncedSearchHandler = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
        setPage(1);
      }, 400),
    []
  );

  // ==================== RENDER ====================
  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <BlueLoading />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto">
      {/* Notifikasi sukses login */}
      <LoginSuccessToast show={showLoginSuccess} onClose={() => setShowLoginSuccess(false)} />

      {/* Creative Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-500 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-gradient-to-tr from-indigo-400 via-blue-300 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-blue-200 rounded-full blur-2xl opacity-20 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/80 to-indigo-50/80" />
      </div>

      {navigating && <BlueLoading />}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-blue-700 drop-shadow">Daftar Artikel</h1>
          {user && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-full border border-blue-100 bg-white/80 shadow-sm hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold ring-2 ring-blue-200 shadow">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline font-semibold text-blue-700">{user.username}</span>
                <svg className={`w-4 h-4 ml-1 transition-transform ${showDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 rounded-xl shadow-2xl border border-blue-100 z-50 animate-fade-in">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-blue-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold ring-2 ring-blue-200 shadow">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-blue-800">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-b-xl transition"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                      </svg>
                      Logout
                    </span>
                  </button>
                  <style jsx>{`
                    .animate-fade-in {
                      animation: fade-in 0.18s cubic-bezier(.4,2,.6,1) both;
                    }
                    @keyframes fade-in {
                      from { opacity: 0; transform: translateY(-8px);}
                      to { opacity: 1; transform: translateY(0);}
                    }
                  `}</style>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="border p-2 rounded-md w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
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
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shadow">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={fetchArticles}
                className="ml-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-blue-100/60 animate-pulse rounded-2xl shadow"
              />
            ))}
          </div>
        ) : (
          /* Article List */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onNavigateStart={() => setNavigating(true)}
                onNavigateEnd={() => setNavigating(false)}
                router={router}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && (
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2 items-center select-none">
            {/* Tombol Sebelumnya */}
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium border transition
                ${page === 1 || loading
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
                    ${page === pageNum
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
                ${page >= totalPages || loading
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

// ==================== SUB COMPONENT ====================
type ArticleCardProps = {
  article: Article;
  onNavigateStart: () => void;
  onNavigateEnd: () => void;
  router: ReturnType<typeof useRouter>;
};

const ArticleCard = ({
  article,
  onNavigateStart,
  onNavigateEnd,
  router,
}: ArticleCardProps) => {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigateStart();
    setTimeout(() => {
      router.push(`/articles/${article.id}`);
      onNavigateEnd();
    }, 400);
  };

  return (
    <a
      href={`/articles/${article.id}`}
      onClick={handleClick}
      className="rounded-2xl shadow-xl bg-white/80 hover:bg-blue-50/80 border border-blue-100 transition-all block h-full cursor-pointer overflow-hidden group"
      style={{ backdropFilter: "blur(2px)" }}
    >
      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/no-image.jpg';
          }}
        />
      )}
      <div className="p-5 flex flex-col h-[calc(100%-192px)]">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-blue-900 group-hover:text-blue-700 transition">
          {article.title}
        </h3>
        <p className="text-xs text-blue-600 mb-1">
          {article.category?.name || "Tanpa Kategori"}
        </p>
        <span className="text-xs text-gray-400">
          {new Date(article.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </span>
      </div>
    </a>
  );
};