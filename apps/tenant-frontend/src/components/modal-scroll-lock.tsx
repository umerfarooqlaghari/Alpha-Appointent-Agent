"use client";

import { useEffect } from "react";

export function ModalScrollLock() {
  useEffect(() => {
    const updateLock = () => {
      const modal = document.querySelector(".fixed.inset-0.z-50, .fixed.inset-0, [role='dialog']");
      if (modal) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    };

    updateLock();

    const observer = new MutationObserver(() => {
      updateLock();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return null;
}
