import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { Icons } from "@/components/icons";

export const metadata = {
  title: "Create Account | NxrthStack Shop",
  description: "Create an account to purchase and download software",
};

function RegisterFormFallback() {
  return (
    <div className="flex items-center justify-center">
      <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFormFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
