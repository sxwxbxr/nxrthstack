import { db } from "@/lib/db";
import { purchases, products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createBulkNotifications } from "./service";

export async function notifyProductUpdate(
  productId: string,
  version: string,
  changelog?: string
): Promise<{ success: boolean; notifiedCount: number }> {
  try {
    // Get product info
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return { success: false, notifiedCount: 0 };
    }

    // Get all users who purchased this product
    const purchasedUsers = await db
      .selectDistinct({ userId: purchases.userId })
      .from(purchases)
      .where(
        and(
          eq(purchases.productId, productId),
          eq(purchases.status, "completed")
        )
      );

    const userIds = purchasedUsers
      .map((p) => p.userId)
      .filter((id): id is string => id !== null);

    if (userIds.length === 0) {
      return { success: true, notifiedCount: 0 };
    }

    const result = await createBulkNotifications(userIds, {
      type: "product_update_available",
      title: `${product.name} v${version} Available`,
      message:
        changelog || `A new version of ${product.name} is available for download.`,
      actionUrl: `/dashboard/downloads`,
      actionLabel: "Download Now",
      metadata: {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        version,
        changelog,
      },
    });

    return { success: result.success, notifiedCount: result.count };
  } catch (error) {
    console.error("Failed to notify product update:", error);
    return { success: false, notifiedCount: 0 };
  }
}

export async function notifyProductNews(
  productId: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<{ success: boolean; notifiedCount: number }> {
  try {
    // Get product info
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return { success: false, notifiedCount: 0 };
    }

    // Get all users who purchased this product
    const purchasedUsers = await db
      .selectDistinct({ userId: purchases.userId })
      .from(purchases)
      .where(
        and(
          eq(purchases.productId, productId),
          eq(purchases.status, "completed")
        )
      );

    const userIds = purchasedUsers
      .map((p) => p.userId)
      .filter((id): id is string => id !== null);

    if (userIds.length === 0) {
      return { success: true, notifiedCount: 0 };
    }

    const result = await createBulkNotifications(userIds, {
      type: "product_news",
      title,
      message,
      actionUrl: actionUrl || `/shop/${product.slug}`,
      actionLabel: "Learn More",
      metadata: {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
      },
    });

    return { success: result.success, notifiedCount: result.count };
  } catch (error) {
    console.error("Failed to notify product news:", error);
    return { success: false, notifiedCount: 0 };
  }
}
