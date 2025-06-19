"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { categorySchema } from "@/schemas/categorySchema";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useState, useEffect } from "react";

export default function CreateCategory() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  useEffect(() => {
        const role = localStorage.getItem("role");
        if (role !== "Admin") {
          setError("Akses ditolak. Anda tidak memiliki izin sebagai admin.");
          setTimeout(() => {
            router.replace("/login?error=Unauthorized");
          });
        }
      }, [router]);


  // Cek token sebelum render
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/admin/categories/create");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = async (data: z.infer<typeof categorySchema>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Session expired, please login again");

      const response = await api.post("/categories", data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status >= 200 && response.status < 300) {
        setSuccess(true);
        reset();
        setTimeout(() => {
          router.push("/admin/categories?success=Kategori berhasil dibuat");
        }, 1200);
        return;
      } else {
        throw new Error("Failed to create category");
      }
    } catch (err: any) {
      let errorMessage = "Failed to create category";
      if (err.response) {
        if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 401) {
          errorMessage = "Sesi telah berakhir, silakan login kembali";
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-2">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
            Tambah Kategori Baru
          </h1>
          <button
            onClick={() => router.push("/admin/categories")}
            className="text-blue-500 hover:text-blue-700 font-semibold text-sm transition"
            disabled={isSubmitting}
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
              Kategori berhasil dibuat!
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
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-blue-700 mb-1"
            >
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              {...register("name")}
              placeholder="Contoh: Teknologi"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition ${
                errors.name
                  ? "border-red-500 focus:ring-red-200"
                  : "border-blue-200 focus:ring-blue-200 focus:border-blue-500"
              }`}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
                isSubmitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 focus:ring-blue-500"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Menyimpan...
                </span>
              ) : (
                "Simpan Kategori"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}