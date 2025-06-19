"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import debounce from "lodash.debounce";

interface Category {
  id: string;
  name: string;
  userId: string;
}

export default function CategoryList() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // loading untuk edit
  const limit = 10;

  // Fetch categories

  useEffect(() => {
      const role = localStorage.getItem("role");
      if (role !== "Admin") {
        setError("Akses ditolak. Anda tidak memiliki izin sebagai admin.");
        setTimeout(() => {
          router.replace("/login?error=Unauthorized");
        }, 1000);
      }
    }, [router]);


  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/categories", {
        params: { search, page, limit },
      });
      if (!res.data.data || !Array.isArray(res.data.data)) {
        throw new Error("Format data tidak valid");
      }
      setCategories(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setTotalData(res.data.totalData || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value);
        setPage(1);
      }, 400),
    []
  );

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!id || id.trim() === "") {
      alert("Tidak dapat menghapus - ID kategori tidak valid");
      return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;
    try {
      setDeletingId(id);
      await api.delete(`/categories/${id}`);
      if (categories.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchCategories();
      }
    } catch (err: any) {
      let errorMessage = "Gagal menghapus kategori";
      if (err.response?.status === 401) {
        errorMessage = "Sesi telah berakhir, silakan login kembali";
        localStorage.removeItem("token");
        router.push("/login");
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  // Tambah kategori handler
  const handleAddCategory = () => {
    setAdding(true);
    setTimeout(() => {
      router.push("/admin/categories/create");
      setAdding(false);
    }, 400);
  };

  // Edit kategori handler
  const handleEditCategory = (category: Category) => {
    setEditingId(category.id);
    localStorage.setItem("editCategory", JSON.stringify(category));
    setTimeout(() => {
      router.push(`/admin/categories/${category.id}/edit`);
      setEditingId(null);
    }, 400);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  const isAnyOverlayLoading = adding || editingId !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10">
      {/* Overlay loading saat tambah/edit kategori */}
      {isAnyOverlayLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-2">
        {/* Header & Tambah Kategori */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">
            Kelola Kategori
          </h1>
          <button
            onClick={handleAddCategory}
            disabled={adding || editingId !== null}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white px-4 py-1.5 rounded-md shadow transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          >
            {adding ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Loading...
              </>
            ) : (
              <>
                <span className="text-lg font-bold">+</span> Tambah Kategori
              </>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 flex justify-end">
          <input
            type="text"
            placeholder="Cari kategori..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="p-2 border border-blue-200 rounded-lg w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
            disabled={loading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100">
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-50">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : categories.length > 0 ? (
                  categories.map((category, index) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          disabled={editingId !== null || adding}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-xs shadow transition"
                        >
                          {editingId === category.id ? (
                            <span className="flex items-center gap-1">
                              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Loading...
                            </span>
                          ) : (
                            "Edit"
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-semibold text-xs shadow transition"
                          disabled={deletingId === category.id || editingId !== null || adding}
                        >
                          {deletingId === category.id ? (
                            <span className="flex items-center gap-1">
                              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Menghapus...
                            </span>
                          ) : (
                            "Hapus"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Tidak ada kategori ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-4 items-center">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading || isAnyOverlayLoading}
              className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm text-gray-600">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading || isAnyOverlayLoading}
              className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}