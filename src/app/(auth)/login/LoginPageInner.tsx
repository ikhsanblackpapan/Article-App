"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/schemas/authSchema";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

// ==================== LOADING COMPONENT ====================
function BlueLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
  );
}

// ==================== TOAST COMPONENT ====================
type ToastProps = {
  type: "success" | "error";
  message: string;
  onClose: () => void;
};
function Toast({ type, message, onClose }: ToastProps) {
  return (
    <div
      className={`fixed top-6 right-6 z-[100] min-w-[260px] max-w-xs px-4 py-3 rounded-lg shadow-lg flex items-start gap-3
        ${type === "success"
          ? "bg-white border border-green-300 text-green-800"
          : "bg-red-50 border border-red-300 text-red-800"
        }
        animate-slide-in
      `}
      style={{ animation: "slide-in 0.4s cubic-bezier(.4,2,.6,1) both" }}
    >
      {type === "success" ? (
        <span className="bg-green-100 rounded-full p-2 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-500 animate-pop" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 13l3 3 7-7" />
          </svg>
        </span>
      ) : null}
      <div className="flex-1">{message}</div>
      <button
        onClick={onClose}
        className="ml-2 text-lg font-bold opacity-60 hover:opacity-100"
        aria-label="Tutup"
      >
        ×
      </button>
      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(60px);}
          to { opacity: 1; transform: translateX(0);}
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

type LoginForm = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Show toast if registered
  useEffect(() => {
    if (registered === "true") {
      setToast({
        type: "success",
        message: `Akun berhasil didaftarkan! Silakan login dengan email ${email || ""}`,
      });
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [registered, email]);

  // Show toast on error
  useEffect(() => {
    if (error) {
      setToast({ type: "error", message: error });
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', data);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', data.username);

      setToast({
        type: "success",
        message:
          res.data.role === "Admin"
            ? "Login Admin berhasil! Selamat datang kembali 👋"
            : "Login User berhasil! Selamat datang kembali 👋",
      });
      setShowToast(true);

      setTimeout(() => {
        const redirectPath = res.data.role === "Admin" ? "/admin/articles?success=login" : "/articles?success=login";
        router.push(redirectPath);
      }, 1200);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Username atau password salah"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setRedirecting(true);
    setTimeout(() => {
      router.push("/register");
    }, 400);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Creative Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-500 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-gradient-to-tr from-indigo-400 via-blue-300 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-blue-200 rounded-full blur-2xl opacity-20 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/80 to-indigo-50/80" />
      </div>

      {(loading || redirecting) && <BlueLoading />}

      {/* TOAST NOTIFICATION */}
      {showToast && toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="max-w-md w-full p-6 bg-white/90 rounded-xl shadow-2xl backdrop-blur-md border border-blue-100">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-blue-700 drop-shadow">Login</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register("username")}
              placeholder="Masukkan username"
              className={`mt-1 block w-full px-3 py-2 border ${errors.username ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={loading || redirecting}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              placeholder="Masukkan password"
              className={`mt-1 block w-full px-3 py-2 border ${errors.password ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={loading || redirecting}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || redirecting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:bg-blue-400 shadow-lg transition"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{" "}
            <a
              href="/register"
              onClick={handleRegisterClick}
              className="font-medium text-blue-600 hover:text-indigo-600 cursor-pointer transition"
            >
              Daftar disini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}