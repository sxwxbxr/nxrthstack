export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      {children}
    </div>
  );
}
