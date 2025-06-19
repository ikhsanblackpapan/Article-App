"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterForm } from "@/schemas/authSchema";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

// ==================== LOADING COMPONENT ====================
function BlueLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isAdminRegistration, setIsAdminRegistration] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      isAdmin: false,
      adminCode: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.isAdmin ? "Admin" : "User",
        ...(data.isAdmin && { adminCode: data.adminCode }),
      };

      const response = await api.post("/auth/register", payload);

      if (response.status === 201) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: data.username,
            email: data.email,
            role: data.isAdmin ? "Admin" : "User",
          })
        );
        reset();
        // Redirect ke login dengan notif sukses
        router.push(
          `/login?registered=true&email=${encodeURIComponent(data.email)}`
        );
      } else {
        throw new Error(response.data.message || "Registrasi gagal");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan saat registrasi";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setRedirecting(true);
    setTimeout(() => {
      router.push("/login");
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

      <div className="max-w-md w-full p-6 bg-white/90 rounded-xl shadow-2xl backdrop-blur-md border border-blue-100">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-blue-700 drop-shadow">
          Daftar Akun Baru
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              {...register("username")}
              placeholder="Masukkan username"
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.username ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={loading || redirecting}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              placeholder="Masukkan email"
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={loading || redirecting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
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
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={loading || redirecting}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Admin Registration Toggle */}
          <div className="flex items-center">
            <input
              id="isAdmin"
              type="checkbox"
              {...register("isAdmin")}
              onChange={(e) => setIsAdminRegistration(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading || redirecting}
            />
            <label
              htmlFor="isAdmin"
              className="ml-2 block text-sm text-gray-900"
            >
              Daftar sebagai Admin
            </label>
          </div>

          {/* Admin Code Field (Conditional) */}
          {isAdminRegistration && (
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Verifikasi Admin
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Masukkan kode verifikasi khusus untuk mendaftar sebagai
                      admin.
                    </p>
                    <input
                      type="text"
                      {...register("adminCode")}
                      placeholder="Kode verifikasi admin"
                      className={`mt-2 block w-full px-3 py-2 border ${
                        errors.adminCode ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500`}
                      disabled={loading || redirecting}
                    />
                    {errors.adminCode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.adminCode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || !isValid || redirecting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading || !isValid || redirecting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                "Daftar"
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Sudah punya akun?{" "}
            <a
              href="/login"
              onClick={handleLoginClick}
              className="font-medium text-blue-600 hover:text-indigo-600 cursor-pointer transition"
            >
              Masuk disini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}