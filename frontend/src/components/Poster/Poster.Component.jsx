import React from "react";
import { Link } from "react-router-dom";

const Poster = (props) => {
  // isImported=true but no active/future shows => gray out
  const unavailable = props.isImported === true && props.hasActiveShows === false;

  const card = (
    <div className="flex flex-col items-start gap-2 px-1 md:px-3">
      <div className="relative h-40 md:h-80 w-full overflow-hidden rounded-md">
        <img
          src={`https://image.tmdb.org/t/p/original${props.poster_path}`}
          alt={props.original_title || props.title}
          className={`w-full h-full object-cover rounded-md transition-all duration-300 ${
            unavailable ? "brightness-[0.3] saturate-0" : "hover:scale-105"
          }`}
        />
        {unavailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 px-2 pointer-events-none">
            <span className="text-[11px] font-semibold text-white bg-black/70 border border-white/20 px-2 py-1 rounded-full text-center leading-tight">
              Not Available in City
            </span>
          </div>
        )}
      </div>
      <h3
        className={`text-sm font-bold leading-tight ${
          props.isDark ? "text-white" : "text-black"
        } ${unavailable ? "opacity-40" : ""}`}
      >
        {props.original_title || props.title}
      </h3>
    </div>
  );

  if (unavailable) {
    // Render non-clickable wrapper for unavailable movies
    return <div className="cursor-not-allowed select-none">{card}</div>;
  }

  return (
    <Link to={`/movie/${props.id}`}>
      {card}
    </Link>
  );
};

export default Poster;

