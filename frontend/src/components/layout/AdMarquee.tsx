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

  const validAds = adsArray.filter(
    (ad) =>
      ad &&
      ad.id !== undefined &&
      ad.id !== null &&
      (ad.title || ad.description || ad.contact_phone || ad.contact_email)
  );

  if (validAds.length === 0) return null;

  const speedMap = {
    slow: 120,
    normal: 80,
    fast: 45,
  };

  const duration = speedMap[speed];

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

  const scrollingAds = [...validAds, ...validAds];

  return (
    <div className="w-full overflow-hidden border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 py-2">
      <div className="marquee-wrapper">
        <div
          className="marquee-track"
          style={{ animationDuration: `${duration}s` }}
        >
          {scrollingAds.map((ad, index) => (
            <div key={`${ad.id}-${index}`} className="marquee-item">
              <AdCard ad={ad} index={index} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .marquee-wrapper {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .marquee-track {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          white-space: nowrap;
          width: max-content;
          padding: 0 16px;
          will-change: transform;
          animation-name: admarquee-scroll-left;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .marquee-item {
          flex: 0 0 auto;
        }

        @keyframes admarquee-scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50%));
          }
        }

        .marquee-wrapper:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

function AdCard({ ad, index }: { ad: AdItem; index: number }) {
  const cardStyle = softCardStyles[index % softCardStyles.length];
  const iconStyle = softIconStyles[index % softIconStyles.length];

  return (
    <Link
      to={`/listings/${ad.id}`}
      className={`flex w-[320px] sm:w-[380px] md:w-[430px] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition duration-200 hover:-translate-y-[1px] hover:bg-white hover:shadow-md ${cardStyle}`}
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