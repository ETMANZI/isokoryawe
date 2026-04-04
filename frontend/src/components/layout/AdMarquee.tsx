import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeAlert, Phone, Mail, Megaphone, ArrowRight } from "lucide-react";

type AdItem = {
  id: string | number;
  title?: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
};

type Props = {
  ads?: unknown;
  speed?: "slow" | "normal" | "fast";
};

const softCardStyles = [
  "bg-slate-50 border-slate-200",
  "bg-blue-50/70 border-blue-100",
  "bg-indigo-50/70 border-indigo-100",
  "bg-emerald-50/70 border-emerald-100",
];

const softIconStyles = [
  "bg-white text-slate-600",
  "bg-blue-100/70 text-blue-700",
  "bg-indigo-100/70 text-indigo-700",
  "bg-emerald-100/70 text-emerald-700",
];

export default function AdMarquee({ ads, speed = "normal" }: Props) {
  const adsArray: AdItem[] = Array.isArray(ads) ? ads : [];

  const validAds = useMemo(
    () =>
      adsArray.filter(
        (ad) =>
          ad &&
          ad.id !== undefined &&
          ad.id !== null &&
          (ad.title || ad.description || ad.contact_phone || ad.contact_email)
      ),
    [adsArray]
  );

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstSetRef = useRef<HTMLDivElement | null>(null);

  const [paused, setPaused] = useState(false);

  const pxPerSecondMap = {
    slow: 18,
    normal: 30,
    fast: 50,
  };

  const pxPerSecond = pxPerSecondMap[speed];

  useEffect(() => {
    if (validAds.length <= 1) return;

    const track = trackRef.current;
    const firstSet = firstSetRef.current;
    const wrapper = wrapperRef.current;

    if (!track || !firstSet || !wrapper) return;

    let frameId = 0;
    let lastTime = 0;
    let offset = 0;

    const getLoopWidth = () => firstSet.scrollWidth;

    const animate = (time: number) => {
      if (!lastTime) lastTime = time;
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (!paused) {
        offset += pxPerSecond * delta;

        const loopWidth = getLoopWidth();
        if (loopWidth > 0 && offset >= loopWidth) {
          offset = 0;
        }

        track.style.transform = `translateX(-${offset}px)`;
      }

      frameId = window.requestAnimationFrame(animate);
    };

    track.style.transform = "translateX(0)";
    frameId = window.requestAnimationFrame(animate);

    const handleResize = () => {
      const loopWidth = getLoopWidth();
      if (loopWidth > 0 && offset >= loopWidth) {
        offset = offset % loopWidth;
        track.style.transform = `translateX(-${offset}px)`;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [paused, pxPerSecond, validAds.length]);

  if (validAds.length === 0) return null;

  if (validAds.length === 1) {
    const ad = validAds[0];
    return (
      <div className="w-full overflow-hidden border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 py-2">
        <div className="flex justify-center px-4">
          <AdCard ad={ad} index={0} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 py-2">
      <div
        ref={wrapperRef}
        className="w-full overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex w-max items-center gap-4 px-4"
          style={{ willChange: "transform" }}
        >
          <div ref={firstSetRef} className="flex items-center gap-4">
            {validAds.map((ad, index) => (
              <div key={`first-${ad.id}-${index}`} className="shrink-0">
                <AdCard ad={ad} index={index} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4" aria-hidden="true">
            {validAds.map((ad, index) => (
              <div key={`second-${ad.id}-${index}`} className="shrink-0">
                <AdCard ad={ad} index={index + validAds.length} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdCard({ ad, index }: { ad: AdItem; index: number }) {
  const cardStyle = softCardStyles[index % softCardStyles.length];
  const iconStyle = softIconStyles[index % softIconStyles.length];

  return (
    <Link
      to={`/listings/${ad.id}`}
      className={`flex w-[320px] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition duration-200 hover:-translate-y-[1px] hover:bg-white hover:shadow-md sm:w-[380px] md:w-[430px] ${cardStyle}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
      >
        <Megaphone size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 ring-1 ring-indigo-100">
            <BadgeAlert size={12} />
            Sponsored
          </span>
        </div>

        {ad.title && (
          <div className="truncate text-sm font-semibold text-slate-800">
            {ad.title}
          </div>
        )}

        {ad.description && (
          <div className="truncate text-xs text-slate-500">
            {ad.description}
          </div>
        )}

        <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
          {ad.contact_phone ? (
            <>
              <Phone size={12} className="shrink-0" />
              <span className="truncate">{ad.contact_phone}</span>
            </>
          ) : ad.contact_email ? (
            <>
              <Mail size={12} className="shrink-0" />
              <span className="truncate">{ad.contact_email}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="hidden shrink-0 items-center text-slate-300 sm:flex">
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}