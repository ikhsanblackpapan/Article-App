"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { articleSchema } from "@/schemas/articleSchema";
import api from "@/lib/api";

type Category = {
  id: string;
  name: string;
};

type ArticleFormData = {
  title: string;
  content: string;
  categoryId: string;
  imageUrl?: string;
};

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    mode: "onChange",
  });

  useEffect(() => {
      const role = localStorage.getItem("role");
      if (role !== "Admin") {
        setError("Akses ditolak. Anda tidak memiliki izin sebagai admin.");
        setTimeout(() => {
          router.replace("/login?error=Unauthorized");
        }, 1000);
      }
    }, [router]);

    
  // Fetch categories & article data
  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        // Fetch categories
        const catRes = await api.get("/categories");
        let cats: Category[] = [];
        if (Array.isArray(catRes.data)) cats = catRes.data;
        else if (Array.isArray(catRes.data.data)) cats = catRes.data.data;
        else if (Array.isArray(catRes.data.categories)) cats = catRes.data.categories;
        if (!ignore) setCategories(cats);

        // Fetch article
        const artRes = await api.get(`/articles/${id}`);
        const article = artRes.data.data || artRes.data;
        setValue("title", article.title);
        setValue("content", article.content);
        setValue("categoryId", article.categoryId);
        if (article.imageUrl) {
          setValue("imageUrl", article.imageUrl);
          setImagePreview(article.imageUrl);
          setCurrentImageUrl(article.imageUrl);
        }
      } catch (error) {
        alert("Gagal memuat data artikel.");
        router.push("/admin/articles");
      } finally {
        if (!ignore) {
          setInitialLoading(false);
          setLoadingCategories(false);
        }
      }
    };
    fetchData();
    return () => { ignore = true; };
  }, [id, setValue, router]);

  // Handler upload file ke backend
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 5MB");
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Hanya menerima file JPEG, PNG, atau WebP");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token tidak ditemukan, silakan login ulang");
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      });
      const imageUrl = res.data?.url || res.data?.imageUrl || res.data?.data?.url;
      if (!imageUrl) throw new Error("URL gambar tidak ditemukan di response");
      setValue("imageUrl", imageUrl, { shouldValidate: true });
      setImagePreview(imageUrl);
    } catch (error: any) {
      let errorMessage = "Gagal upload gambar";
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ArticleFormData) => {
    setLoading(true);
    try {
      const finalImageUrl = data.imageUrl || currentImageUrl;
      await api.put(`/articles/${id}`, {
        title: data.title,
        content: data.content,
        categoryId: data.categoryId,
        imageUrl: finalImageUrl,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/articles");
      }, 1200);
    } catch {
      alert("Gagal mengupdate artikel. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setValue("imageUrl", "", { shouldValidate: true });
    setImagePreview("");
    setCurrentImageUrl("");
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-blue-600 font-semibold text-lg">Memuat data artikel...</div>
      </div>
    );
  }

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
          Edit Artikel
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Judul */}
          <FormField label="Judul Artikel" required error={errors.title?.message}>
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
          <FormField label="Konten Artikel" required error={errors.content?.message}>
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
          <FormField label="Kategori" required error={errors.categoryId?.message}>
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
          <FormField label="Gambar Artikel" error={errors.imageUrl?.message}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border rounded-lg px-4 py-2 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              disabled={loading}
            />
            {imagePreview && (
              <div className="mt-3 relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-xl shadow-md border border-blue-100 w-48 h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  title="Hapus gambar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
                "Update Artikel"
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
              Artikel berhasil diupdate!
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
              {watch("title") || <span className="text-gray-400">Judul artikel...</span>}
            </h3>
            <p className="text-sm text-blue-600 mb-2">
              {categories.find((cat) => cat.id === watch("categoryId"))?.name || (
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
                  watch("content")?.trim() !== ""
                    ? watch("content")
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