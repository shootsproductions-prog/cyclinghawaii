// Printful API v1 client. Pulls Vini's "sync products" (his designs
// applied to Printful's catalog items) and exposes them in a shape the
// /store page can consume.
//
// Required env: PRINTFUL_API_TOKEN

import { cache } from "react";

const PRINTFUL_BASE = "https://api.printful.com";

export interface PrintfulSyncProductSummary {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface PrintfulSyncVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  retail_price: string;
  currency: string;
  sku?: string;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  files: Array<{
    id?: number;
    type: string;
    hash?: string;
    url?: string;
    filename?: string;
    mime_type?: string;
    size?: number;
    width?: number;
    height?: number;
    thumbnail_url?: string;
    preview_url?: string;
    visible?: boolean;
  }>;
  availability_status?: string;
}

interface SyncProductsListResponse {
  code: number;
  result: PrintfulSyncProductSummary[];
}

interface SyncProductDetailResponse {
  code: number;
  result: {
    sync_product: PrintfulSyncProductSummary;
    sync_variants: PrintfulSyncVariant[];
  };
}

async function pf<T>(path: string): Promise<T | null> {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) {
    console.warn("PRINTFUL_API_TOKEN missing — store will show empty.");
    return null;
  }
  try {
    const res = await fetch(`${PRINTFUL_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600, tags: ["printful"] },
    });
    if (!res.ok) {
      console.error(
        `Printful ${path} failed: ${res.status}`,
        await res.text()
      );
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Printful ${path} threw:`, err);
    return null;
  }
}

export const fetchSyncProducts = cache(
  async (): Promise<PrintfulSyncProductSummary[]> => {
    const data = await pf<SyncProductsListResponse>("/store/products");
    if (!data?.result) return [];
    return data.result.filter((p) => !p.is_ignored);
  }
);

export const fetchSyncProduct = cache(
  async (
    id: number
  ): Promise<{
    product: PrintfulSyncProductSummary;
    variants: PrintfulSyncVariant[];
  } | null> => {
    const data = await pf<SyncProductDetailResponse>(`/store/products/${id}`);
    if (!data?.result) return null;
    return {
      product: data.result.sync_product,
      variants: data.result.sync_variants,
    };
  }
);
