"use client";

import { Suspense } from "react";
import ArticleListPageInner from "./ArticleListPageInner";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ArticleListPageInner />
    </Suspense>
  );
}