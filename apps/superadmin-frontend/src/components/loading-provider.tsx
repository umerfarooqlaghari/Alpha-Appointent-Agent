"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";

interface LoadingContextType {
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Hide loader when path changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  // Intercept local link clicks
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.href && anchor.target !== "_blank") {
        try {
          const url = new URL(anchor.href);
          // If internal and changing path, show loader
          if (
            url.origin === window.location.origin &&
            url.pathname !== window.location.pathname
          ) {
            setIsLoading(true);
          }
        } catch {
          // Ignore invalid URLs
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  const withLoading = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader, withLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md text-white animate-in fade-in duration-200">
          <div className="relative flex items-center justify-center size-20">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
            <LoaderCircle className="text-teal-500" size={32} />
          </div>
          <p className="mt-5 text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 animate-pulse">
            Processing...
          </p>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
