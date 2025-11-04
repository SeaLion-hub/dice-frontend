// hooks/useScrollTop.ts
import { useState, useEffect } from "react";

export function useScrollTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => {
      setShow(window.scrollY > 300);
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return { show, scrollToTop };
}
