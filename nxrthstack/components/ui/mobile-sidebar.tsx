"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "@/components/icons";

interface MobileSidebarCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<MobileSidebarCtx>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
});

export function useMobileSidebar() {
  return useContext(Ctx);
}

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return <Ctx value={{ open, setOpen, toggle }}>{children}</Ctx>;
}

/** Backdrop overlay — rendered inside the sidebar component on mobile */
export function SidebarBackdrop() {
  const { open, setOpen } = useMobileSidebar();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </AnimatePresence>
  );
}

/** Hamburger toggle button for the mobile header */
export function MobileMenuButton() {
  const { open, toggle } = useMobileSidebar();

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
      aria-label={open ? "Close menu" : "Open menu"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Icons.X className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Icons.Menu className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
