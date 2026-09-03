"use client";

import { useEffect } from "react";

export function ModalScrollLock() {
  useEffect(() => {
    const updateLock = () => {
      const modal = document.querySelector(".fixed.inset-0.z-50, .fixed.inset-0, [role='dialog']");
      const main = document.querySelector("#tenant-main-content") as HTMLElement | null;
      if (modal) {
        document.body.style.overflow = "hidden";
        if (main) main.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
        if (main) main.style.overflow = "";
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
      const main = document.querySelector("#tenant-main-content") as HTMLElement | null;
      if (main) main.style.overflow = "";
    };
  }, []);

  return null;
}
