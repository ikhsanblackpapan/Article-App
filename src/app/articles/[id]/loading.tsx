// src/app/articles/[id]/loading.tsx
// import LoadingSpinner from '@/components/LoadingSpinner'; // Buat komponen spinner Anda

const ArticleDetailLoading = () => {
  return (
    <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
      {/* <LoadingSpinner /> */}
      <p className="ml-4 text-lg text-gray-600">Memuat artikel...</p>
    </div>
  );
};

export default ArticleDetailLoading;