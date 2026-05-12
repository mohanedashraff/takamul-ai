import type { Metadata } from "next";
import { ProductPhotoshootStudio } from "@/components/product-photoshoot/ProductPhotoshootStudio";

export const metadata: Metadata = {
  title:       "Product Photoshoot Studio — Yilow.ai",
  description: "صورة منتج واحدة، 10 مزاج مختلف — Catalog، Lifestyle، Hero Banner، Carousel، Conceptual",
};

export default function ProductPhotoshootPage() {
  return <ProductPhotoshootStudio />;
}
