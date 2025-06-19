"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { articleSchema } from "@/schemas/articleSchema";
import api from "@/lib/api";

// ==================== TYPES ====================
type Category = {
  id: string;
  name: string;
};

type ArticleFormData = {
  title: string;
  content: string;
  categoryId: string;
  imageUrl: string;
};

// ==================== COMPONENT ====================
export default function CreateArticle() {
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    mode: "onChange",
    defaultValues: { imageUrl: "" },
  });

  const formData = watch();

  useEffect(() => {
      const role = localStorage.getItem("role");
      if (role !== "Admin") {
        setError("Akses ditolak. Anda tidak memiliki izin sebagai admin.");
        setTimeout(() => {
          router.replace("/login?error=Unauthorized");
        });
      }
    }, [router]);

  // Fetch categories
  useEffect(() => {
    let ignore = false;
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await api.get("/categories");
        let cats: Category[] = [];
        if (Array.isArray(res.data)) cats = res.data;
        else if (Array.isArray(res.data.data)) cats = res.data.data;
        else if (Array.isArray(res.data.categories)) cats = res.data.categories;
        if (!ignore) setCategories(cats);
      } catch {
        if (!ignore) setCategories([]);
      } finally {
        if (!ignore) setLoadingCategories(false);
      }
    };
    fetchCategories();
    return () => { ignore = true; };
  }, []);

  // Upload image handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("token");
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      const imageUrl = res.data?.url || res.data?.imageUrl;
      if (!imageUrl) throw new Error("URL gambar tidak ditemukan di response");
      setValue("imageUrl", imageUrl);
      setImagePreview(imageUrl);
    } catch (error) {
      alert("Gagal upload: Pastikan Anda sudah login!");
    } finally {
      setLoading(false);
    }
  };

  // Submit handler
  const onSubmit = async (data: ArticleFormData) => {
    setLoading(true);
    try {
      const imageUrl =
        data.imageUrl && data.imageUrl.trim() !== ""
          ? data.imageUrl
          : "https://via.placeholder.com/300";
      await api.post("/articles", {
        title: data.title,
        content: data.content,
        categoryId: data.categoryId,
        imageUrl,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/articles");
      }, 1200);
    } catch {
      alert("Gagal menyimpan artikel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Loading Overlay saat simpan */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-8 text-center tracking-tight">
          Tambah Artikel
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Judul */}
          <FormField
            label="Judul Artikel"
            required
            error={errors.title?.message}
          >
            <input
              {...register("title")}
              type="text"
              className={`w-full border rounded-lg px-4 py-2 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${
                errors.title ? "border-red-500" : "border-blue-200"
              }`}
              placeholder="Masukkan judul"
              disabled={loading}
            />
          </FormField>

          {/* Konten */}
          <FormField
            label="Konten Artikel"
            required
            error={errors.content?.message}
          >
            <textarea
              {...register("content")}
              rows={5}
              className={`w-full border rounded-lg px-4 py-2 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${
                errors.content ? "border-red-500" : "border-blue-200"
              }`}
              placeholder="Tulis konten di sini..."
              disabled={loading}
            />
          </FormField>

          {/* Kategori */}
          <FormField
            label="Kategori"
            required
            error={errors.categoryId?.message}
          >
            <select
              {...register("categoryId")}
              className={`w-full border rounded-lg px-4 py-2 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition ${
                errors.categoryId ? "border-red-500" : "border-blue-200"
              }`}
              defaultValue=""
              disabled={loading || loadingCategories}
            >
              <option value="" disabled>
                {loadingCategories ? "Memuat kategori..." : "Pilih kategori"}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </FormField>

          {/* Gambar */}
          <FormField
            label="Gambar Artikel"
            required
            error={errors.imageUrl?.message}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border rounded-lg px-4 py-2 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              disabled={loading}
            />
            {imagePreview && (
              <div className="flex justify-center mt-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-xl shadow-md border border-blue-100 w-48 h-48 object-cover"
                />
              </div>
            )}
          </FormField>

          {/* Tombol */}
          <div className="flex gap-3 pt-4 justify-end">
            <button
              type="button"
              onClick={() => router.push("/admin/articles")}
              className="px-6 py-2 border border-blue-200 rounded-lg shadow-sm text-sm font-bold text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className={`px-6 py-2 rounded-lg shadow-sm text-sm font-bold text-white transition ${
                loading || !isValid
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Menyimpan...
                </span>
              ) : (
                "Simpan Artikel"
              )}
            </button>
          </div>
        </form>

        {/* Success Alert */}
        {success && (
          <div className="mt-6 flex items-center justify-center">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-sm flex items-center gap-2 animate-fade-in">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Artikel berhasil dibuat!
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

        {/* PREVIEW ARTIKEL */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-blue-700 mb-4">Preview Artikel</h2>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {formData.title || <span className="text-gray-400">Judul artikel...</span>}
            </h3>
            <p className="text-sm text-blue-600 mb-2">
              {categories.find((cat) => cat.id === formData.categoryId)?.name || (
                <span className="text-gray-400">Kategori belum dipilih</span>
              )}
            </p>
            {imagePreview && (
              <div className="mb-4 flex justify-center">
                <img
                  src={imagePreview}
                  alt="Preview Gambar"
                  className="rounded-lg shadow-md border border-blue-100 w-48 h-48 object-cover"
                />
              </div>
            )}
            <div
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{
                __html:
                  formData.content?.trim() !== ""
                    ? formData.content
                    : "<p class='text-gray-400'>Konten artikel akan muncul di sini...</p>",
              }}
            />
          </div>
        </div>
        {/* END PREVIEW */}
      </div>
    </div>
  );
}

// ==================== SUB COMPONENT ====================
type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-blue-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}