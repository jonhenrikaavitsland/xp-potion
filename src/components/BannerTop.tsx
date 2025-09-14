import React, { useEffect, useState } from "react";

type Props = {
  /** Unique id for this banner (used as the sessionStorage key) */
  id: string;
  /** Announcement text */
  text: string;
  /** Where the banner links to when clicked */
  href: string;
  /** Link target (default: _self) */
  target?: "_self" | "_blank" | "_parent" | "_top";
  /** Tailwind classes for background/text (dark theme by default) */
  bgClass?: string;
  /** Height/padding classes (kept in sync with the spacer) */
  heightClass?: string;
  /** Place the banner at the very top but scroll away with the page (absolute) or pin it (fixed) */
  position?: "absolute" | "fixed";
  /** Render a spacer to avoid overlapping header content (default: true) */
  pushDown?: boolean;
  /** Extra classes on the outer wrapper */
  className?: string;
};

const TopBanner: React.FC<Props> = ({
  id,
  text,
  href,
  target = "_self",
  bgClass = "bg-accent-magenta-purple text-white",
  heightClass = "py-2",
  position = "absolute",
  pushDown = true,
  className = "",
}) => {
  const storageKey = `top-banner:${id}:closed`;
  const [closed, setClosed] = useState<boolean>(true); // default hidden until we read storage (prevents flash)

  useEffect(() => {
    try {
      const wasClosed = sessionStorage.getItem(storageKey) === "1";
      setClosed(wasClosed);
    } catch {
      setClosed(false);
    }
  }, [storageKey]);

  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setClosed(true);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {}
  };

  // Compose classes
  const positionClass = position === "fixed" ? "fixed" : "absolute";
  const barClasses = [
    positionClass,
    "inset-x-0 top-0 z-60",
    bgClass,
    heightClass,
    "transition-transform duration-200 will-change-transform",
    closed ? "-translate-y-full pointer-events-none" : "translate-y-0",
  ].join(" ");

  return (
    <>
      <div className={[className].filter(Boolean).join(" ")}>
        <div
          role="region"
          aria-label="Site announcement"
          className={barClasses}
        >
          <div className="lg:container mx-auto px-5 py-2">
            <div className="flex items-center gap-3">
              {/* Clickable area */}
              <a
                href={href}
                target={target}
                rel={target === "_blank" ? "noopener noreferrer" : undefined}
                className="flex-1 inline-flex items-center justify-center gap-3 no-underline w-max hover:text-accent-neon-pink"
              >
                <span className="text-sm md:text-base font-medium">{text}</span>
              </a>

              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close announcement"
                className="shrink-0 inline-flex items-center justify-center rounded-md/2 px-2 py-1 text-sm/none hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer hover:text-accent-neon-pink"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Spacer to prevent overlap with header/content */}
        {pushDown && (
          <div
            aria-hidden="true"
            className={[heightClass, closed ? "hidden" : "block"].join(" ")}
          />
        )}
      </div>

      {/* Respect reduced motion */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .${id}-no-motion { transition: none !important; }
        }
      `}</style>
    </>
  );
};

export default TopBanner;
