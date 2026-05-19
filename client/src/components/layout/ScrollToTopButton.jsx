import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTopButton() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY > 420);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, [location.pathname]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isVisible) {
    return null;
  }

  return (
    <button className="scroll-top-button" type="button" onClick={scrollToTop} aria-label="Inapoi sus">
      <ArrowUp size={22} aria-hidden="true" />
    </button>
  );
}
