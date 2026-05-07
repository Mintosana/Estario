import { useEffect, useState } from "react";

export function ListingImage({ alt, className, fallback = "Fara imagine", src }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <span className={className}>{fallback}</span>;
  }

  return <img className={className} src={src} alt={alt} onError={() => setHasError(true)} />;
}
