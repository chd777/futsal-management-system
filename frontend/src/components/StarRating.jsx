import React from "react";

export default function StarRating({ value = 0, onChange, readOnly = false, size = 22 }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="stars">
      {stars.map((s) => (
        <span
          key={s}
          className={`star ${s <= Math.round(value) ? "filled" : ""} ${readOnly ? "star-display" : ""}`}
          style={{ fontSize: size }}
          onClick={() => !readOnly && onChange && onChange(s)}
        >
          ★
        </span>
      ))}
    </div>
  );
}