"use client"

import { useEffect, useState, useCallback } from "react"
import axios, { AxiosError } from "axios"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

// ==================== TYPE DEFINITIONS ====================
interface Category {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface Article {
  id: string
  title: string
  content: string
  imageUrl: string
  createdAt: string
  updatedAt: string
  category: Category
  user: {
    id: string
    username: string
  }
}

// ==================== COMPONENT ====================
export default function ArticleDetailPage() {
  const { id } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch main article and related articles
  const fetchArticle = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get<Article>(
        `https://test-fe.mysellerpintar.com/api/articles/${id}`
      )
      setArticle(res.data)

      if (res.data?.category?.id) {
        fetchRelatedArticles(res.data.category.id)
      }
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  // Fetch related articles
  const fetchRelatedArticles = async (categoryId: string) => {
    try {
      const res = await axios.get<{ data: Article[] }>(
        `https://test-fe.mysellerpintar.com/api/articles`,
        {
          params: {
            category: categoryId,
            limit: 3,
            exclude: id
          }
        }
      )
      setRelatedArticles(res.data.data)
    } catch {
      // Related articles are optional, so ignore error
    }
  }

  // Handle error
  const handleError = (err: unknown) => {
    if (err instanceof AxiosError) {
      setError(err.response?.data?.message || "Gagal memuat artikel")
    } else {
      setError("Terjadi kesalahan tidak terduga")
    }
  }

  useEffect(() => {
    if (id) fetchArticle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ==================== RENDER STATES ====================
  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error} onRetry={fetchArticle} />
  if (!article) return <NotFoundState />

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-16">
      {/* HERO IMAGE */}
      {article.imageUrl && (
        <HeroImage src={article.imageUrl} alt={article.title} />
      )}

      {/* MAIN CARD */}
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 pt-16 relative z-10 -mt-20">
          <ArticleMeta article={article} />
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-gray-900 leading-tight">
            {article.title}
          </h1>
          <div
            className="prose max-w-none prose-blue prose-lg text-gray-800"
            dangerouslySetInnerHTML={{ __html: article.content || "" }}
          />
          <div className="mt-10">
            <Link
              href="/articles"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              ← Kembali ke Daftar Artikel
            </Link>
          </div>
        </div>
      </div>

      {/* RELATED ARTICLES */}
      {relatedArticles.length > 0 && (
        <RelatedArticlesList articles={relatedArticles} />
      )}
    </div>
  )
}

// ==================== SUB COMPONENTS ====================

function HeroImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full h-72 md:h-96 mb-[-80px]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className="object-cover brightness-90"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  )
}

function ArticleMeta({ article }: { article: Article }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
        {article.category?.name || "Tanpa Kategori"}
      </span>
      <span className="text-gray-400 text-xs">
        Dipublikasikan: {new Date(article.createdAt).toLocaleDateString("id-ID", {
          day: "numeric", month: "long", year: "numeric"
        })}
      </span>
      <span className="text-gray-400 text-xs">•</span>
      <span className="text-gray-500 text-xs">
        Penulis: {article.user?.username || "N/A"}
      </span>
    </div>
  )
}

function RelatedArticlesList({ articles }: { articles: Article[] }) {
  return (
    <section className="container mx-auto px-4 mt-16">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Artikel Terkait</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {articles.map((item) => (
          <Link
            key={item.id}
            href={`/articles/${item.id}`}
            className="group bg-white border border-blue-100 rounded-xl shadow hover:shadow-lg transition block overflow-hidden"
          >
            {item.imageUrl && (
              <div className="relative w-full h-40">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-blue-700 transition">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 mb-1">
                {item.category?.name || "N/A"}
              </p>
              <span className="text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleDateString("id-ID")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {message}
      </div>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Coba Lagi
      </button>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold text-gray-800">Artikel tidak ditemukan</h1>
      <Link
        href="/articles"
        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Kembali ke Daftar Artikel
      </Link>
    </div>
  )
}