import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  Phone,
  BadgeHelp,
  Megaphone,
  Handshake,
  Building2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import Card from "../ui/Card";
import { isAuthenticated } from "../../lib/auth";
import { api } from "../../lib/api";

type Partner = {
  id: number;
  name: string;
  logo?: string | null;
  website?: string | null;
  description?: string;
  is_active?: boolean;
};

export default function RightSidebar() {
  const { t } = useTranslation();
  const loggedIn = isAuthenticated();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);

  const phoneNumber = "+250 788 263 338";
  const whatsappUrl = `https://wa.me/250788263338`;
  const telUrl = `tel:+250788263338`;

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await api.get("/partners/");
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setPartners(data);
      } catch (error) {
        console.error("Failed to load partners", error);
        setPartners([]);
      } finally {
        setLoadingPartners(false);
      }
    };

    fetchPartners();
  }, []);

  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      {/* Quick Actions Card */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">{t("sidebar.quick_actions")}</h3>

        <div className="mt-4 space-y-3">
          {loggedIn ? (
            <>
              <Link
                to="/publish"
                className="flex items-center gap-2 rounded-2xl bg-slate-400 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                <PlusCircle size={16} />
                {t("sidebar.post_listing")}
              </Link>

              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LayoutDashboard size={16} />
                {t("sidebar.dashboard")}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-2xl bg-slate-400 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                <PlusCircle size={16} />
                {t("sidebar.create_account")}
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LayoutDashboard size={16} />
                {t("sidebar.sign_in")}
              </Link>
            </>
          )}
        </div>
      </Card>

      {/* Promote Your Listing Card */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <Megaphone size={18} />
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {t("sidebar.promote_listing")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t("sidebar.promote_text")}
            </p>
          </div>
        </div>
      </Card>

      {/* Our Partners Card */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Handshake size={18} />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">{t("sidebar.our_partners")}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t("sidebar.partners_text")}
            </p>

            <div className="mt-4 space-y-3">
              {loadingPartners ? (
                <p className="text-sm text-slate-500">{t("sidebar.loading_partners")}</p>
              ) : partners.length === 0 ? (
                <p className="text-sm text-slate-500">{t("sidebar.no_partners")}</p>
              ) : (
                partners.map((partner) => {
                  const isClickable = Boolean(partner.website && partner.website.trim());

                  const card = (
                    <div
                      className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition ${
                        isClickable
                          ? "cursor-pointer hover:border-slate-300 hover:bg-white hover:shadow-sm"
                          : ""
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                        {partner.logo ? (
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Building2 size={18} className="text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {partner.name}
                        </p>
                        {partner.description && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {partner.description}
                          </p>
                        )}
                      </div>

                      {isClickable && (
                        <ExternalLink size={15} className="shrink-0 text-slate-400" />
                      )}
                    </div>
                  );

                  return isClickable ? (
                    <a
                      key={partner.id}
                      href={partner.website!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {card}
                    </a>
                  ) : (
                    <div key={partner.id}>{card}</div>
                  );
                })
              )}
            </div>

            <Link
              to="/partners"
              className="mt-4 inline-flex items-center text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
            >
              {t("sidebar.view_all_partners")}
            </Link>
          </div>
        </div>
      </Card>

      {/* Safety Tips Card */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">{t("sidebar.safety_tips")}</h3>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-green-600" />
            <p>{t("sidebar.safety_tip_1")}</p>
          </div>

          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-green-600" />
            <p>{t("sidebar.safety_tip_2")}</p>
          </div>

          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-green-600" />
            <p>{t("sidebar.safety_tip_3")}</p>
          </div>
        </div>
      </Card>

      {/* Need Help Card - Two buttons on single line with default colors */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">{t("sidebar.need_help")}</h3>

        <div className="mt-4 space-y-3">
          {/* Two buttons in a single row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Call Button */}
            <a
              href={telUrl}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Phone size={16} className="text-slate-500" />
              <span>{t("sidebar.call_now")}</span>
            </a>

            {/* WhatsApp Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <MessageCircle size={16} className="text-slate-500" />
              <span>{t("sidebar.whatsapp")}</span>
            </a>
          </div>

          {/* Support Text */}
          <div className="flex items-start gap-2 pt-1">
            <BadgeHelp size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-xs text-slate-500">{t("sidebar.support_text")}</p>
          </div>
        </div>
      </Card>
    </aside>
  );
}