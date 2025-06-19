// import Link from 'next/link';
// import Image from 'next/image';

// interface ArticleCardProps {
//   id: string;
//   title: string;
//   shortDescription?: string;
//   thumbnailUrl?: string;
//   categoryName?: string;
// }

// const ArticleCard: React.FC<ArticleCardProps> = ({
//   id,
//   title,
//   shortDescription,
//   thumbnailUrl,
//   categoryName,
// }) => {
//   return (
//     <Link href={`/articles/${id}`} className="block rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
//       {thumbnailUrl && (
//         <div className="relative w-full h-40">
//           <Image
//             src={thumbnailUrl}
//             alt={title}
//             layout="fill"
//             objectFit="cover"
//             className="w-full h-full"
//           />
//         </div>
//       )}
//       <div className="p-4">
//         {categoryName && (
//           <p className="text-sm text-blue-600 mb-1">{categoryName}</p>
//         )}
//         <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
//           {title}
//         </h3>
//         {shortDescription && (
//           <p className="text-gray-600 text-sm line-clamp-3">
//             {shortDescription}
//           </p>
//         )}
//       </div>
//     </Link>
//   );
// };

// export default ArticleCard;