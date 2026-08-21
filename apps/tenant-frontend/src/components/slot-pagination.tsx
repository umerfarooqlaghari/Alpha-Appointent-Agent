"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";

export function SlotPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetPage, setTargetPage] = useState<number | null>(null);
  const goTo = (nextPage: number) => startTransition(() => { setTargetPage(nextPage); router.push(`?page=${nextPage}`, { scroll: false }); });
  return <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3 text-sm"><span className="text-stone-500">Page {page} of {totalPages}</span><div className="flex items-center gap-2"><button type="button" disabled={isPending || page <= 1} onClick={() => goTo(page - 1)} className="inline-flex size-9 items-center justify-center rounded-md border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:border-stone-100 disabled:text-stone-300"><span className="sr-only">Previous page</span>{isPending && targetPage === page - 1 ? <LoaderCircle className="animate-spin" size={16} /> : <ChevronLeft size={16} />}</button><button type="button" disabled={isPending || page >= totalPages} onClick={() => goTo(page + 1)} className="inline-flex size-9 items-center justify-center rounded-md border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:border-stone-100 disabled:text-stone-300"><span className="sr-only">Next page</span>{isPending && targetPage === page + 1 ? <LoaderCircle className="animate-spin" size={16} /> : <ChevronRight size={16} />}</button></div></div>;
}