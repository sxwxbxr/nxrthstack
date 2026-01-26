"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  children,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input p-4 bg-card border border-border justify-between flex flex-col space-y-4 overflow-hidden",
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          {header}
          <div className="transition duration-200">
            {icon}
            <div className="font-sans font-bold text-foreground mb-2 mt-2">
              {title}
            </div>
            <div className="font-sans font-normal text-muted-foreground text-sm">
              {description}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
