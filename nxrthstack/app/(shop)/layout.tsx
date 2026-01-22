import { ShopHeader } from "@/components/shop/shop-header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background">
      <ShopHeader />
      <main>{children}</main>
    </div>
  );
}
