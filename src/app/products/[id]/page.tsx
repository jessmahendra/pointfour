import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ProductPageClient } from "@/app/products/[id]/ProductPageClient";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      brand:brands!products_brand_id_fkey (
        slug,
        name,
        logo_url,
        description,
        url
      )
    `
    )
    .eq("id", id)
    .single();

  if (!product) {
    return {
      title: "Product Not Found | PointFour",
    };
  }

  return {
    title: `${product.name} | ${product.brand.name} | PointFour`,
    description:
      product.description ||
      `Discover ${product.name} from ${product.brand.name}`,
    openGraph: {
      title: `${product.name} | ${product.brand.name}`,
      description:
        product.description ||
        `Discover ${product.name} from ${product.brand.name}`,
      type: "website",
      images: product.image_url ? [product.image_url] : [],
    },
    alternates: {
      canonical: product.url,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      brand:brands!products_brand_id_fkey (
        slug,
        name,
        logo_url,
        description,
        url
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  const llmName = `${product.name} from ${product.brand.name} (${product.brand.url})`;

  console.log(llmName);
  return <ProductPageClient product={product} />;
}
