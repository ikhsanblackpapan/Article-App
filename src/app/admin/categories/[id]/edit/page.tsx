"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function EditCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
        const role = localStorage.getItem("role");
        if (role !== "Admin") {
          setError("Akses ditolak. Anda tidak memiliki izin sebagai admin.");
          setTimeout(() => {
            router.replace("/login?error=Unauthorized");
          });
        }
      }, [router]);


  useEffect(() => {
    const savedCategory = localStorage.getItem("editCategory");
    if (!savedCategory) {
      alert("Data kategori tidak ditemukan");
      router.push("/admin/categories");
      return;
    }
    const category = JSON.parse(savedCategory);
    setValue("name", category.name);
  }, [router, setValue]);

  const onSubmit = async (data: CategoryForm) => {
    const storedCategory = localStorage.getItem("editCategory");
    if (!storedCategory) return;
    const { id } = JSON.parse(storedCategory);

    setLoading(true);
    setError(null);
    try {
      await api.put(`/categories/${id}`, data);
      localStorage.removeItem("editCategory");
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/categories?success=Kategori berhasil diupdate");
      }, 1200);
    } catch (err: any) {
      setError("Gagal menyimpan perubahan");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-2">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
            Edit Kategori
          </h1>
          <button
            onClick={() => router.push("/admin/categories")}
            className="text-blue-500 hover:text-blue-700 font-semibold text-sm transition"
            disabled={loading}
          >
            ← Kembali
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center justify-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-sm flex items-center gap-2 animate-fade-in">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Kategori berhasil diupdate!
            </div>
            <style jsx>{`
              .animate-fade-in {
                animation: fade-in 0.2s cubic-bezier(.4,2,.6,1) both;
              }
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(-8px);}
                to { opacity: 1; transform: translateY(0);}
              }
            `}</style>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-blue-700 mb-1">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition ${
                errors.name
                  ? "border-red-500 focus:ring-red-200"
                  : "border-blue-200 focus:ring-blue-200 focus:border-blue-500"
              }`}
              disabled={loading}
              aria-invalid={errors.name ? "true" : "false"}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/categories")}
              className="px-4 py-2 border border-blue-200 rounded-lg text-blue-700 bg-white hover:bg-blue-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 focus:ring-blue-500"
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Menyimpan...
                </span>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}