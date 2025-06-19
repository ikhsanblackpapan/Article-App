// src/app/articles/[id]/error.tsx
"use client" // <-- Tambahkan ini di baris pertama

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Terjadi Kesalahan</h2>
      <p className="mb-6">{error.message}</p>
      <Button
        onClick={() => reset()}
        variant="outline"
      >
        Coba Lagi
      </Button>
    </div>
  )
}