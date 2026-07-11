import { useState } from "react";
import { resolveImages } from "../../utils/images";

export default function ImageCarousel({ images: rawImages }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const images = resolveImages(rawImages);

  if (images.length === 0) {
    return (
      <div className="carousel">
        <svg className="stick-figure" viewBox="0 0 48 64" fill="none">
          <circle cx="24" cy="10" r="7" stroke="currentColor" strokeWidth="3" />
          <line x1="24" y1="17" x2="24" y2="40" stroke="currentColor" strokeWidth="3" />
          <g className="stick-figure__arm">
            <line x1="24" y1="22" x2="10" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="24" y1="22" x2="38" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g className="stick-figure__leg">
            <line x1="24" y1="40" x2="14" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="24" y1="40" x2="34" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="carousel">
        <img src={images[0]} alt="" />
      </div>
    );
  }

  return (
    <div className="carousel">
      <img src={images[index]} alt="" />
      <button
        type="button"
        className="carousel__arrow carousel__arrow--prev"
        onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
        aria-label="Image précédente"
      >
        ‹
      </button>
      <button
        type="button"
        className="carousel__arrow carousel__arrow--next"
        onClick={() => setIndex((i) => (i + 1) % images.length)}
        aria-label="Image suivante"
      >
        ›
      </button>
      <div className="carousel__dots">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`carousel__dot${i === index ? " carousel__dot--active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
