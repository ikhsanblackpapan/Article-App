import api from '@/lib/api';

// Definisikan tipe data untuk artikel (sesuaikan dengan respons API)
interface Article {
  id: string;
  title: string;
  content: string;
  category_id: string;
  category_name: string; // Asumsi API mengembalikan nama kategori juga
  published_at: string;
  thumbnail_url?: string;
  short_description?: string; // Untuk other articles
}

export const getArticleById = async (id: string): Promise<Article> => {
  try {
    const response = await api.get(`/articles/${id}`);
    return response.data; // Sesuaikan dengan struktur respons API Anda
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    throw error;
  }
};

export const getRelatedArticles = async (categoryId: string, currentArticleId: string): Promise<Article[]> => {
  try {
    // Asumsi API memiliki endpoint untuk filter artikel berdasarkan kategori
    // Mungkin perlu memodifikasi endpoint atau memfilter di frontend jika API tidak menyediakan
    const response = await api.get(`/articles`, {
      params: {
        category_id: categoryId,
        _limit: 4, // Ambil lebih dari 3 untuk filter currentArticleId
        // Tambahkan parameter lain seperti urutan, dll. jika didukung API
      },
    });

    const allRelatedArticles: Article[] = response.data; // Sesuaikan dengan struktur respons API

    // Filter artikel yang sedang dilihat dan ambil maksimal 3
    const filteredArticles = allRelatedArticles.filter(
      (article) => article.id !== currentArticleId
    ).slice(0, 3);

    return filteredArticles;
  } catch (error) {
    console.error('Error fetching related articles:', error);
    throw error;
  }
};