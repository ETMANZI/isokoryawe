import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { isAuthenticated, logoutUser, getAccessToken } from "../../lib/auth";
import { api } from "../../lib/api";
import AdMarquee from "./AdMarquee";

type CurrentUser = {
  id: string | number;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
};

type AdItem = {
  id: string | number;
  title: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncAuth = () => setLoggedIn(isAuthenticated());

    syncAuth();
    window.addEventListener("storage", syncAuth);

    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const { data: currentUser, isLoading: isLoadingCurrentUser } = useQuery<CurrentUser | null>({
    queryKey: ["navbar-current-user"],
    queryFn: async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          setLoggedIn(false);
          return null;
        }

        const response = await api.get("/accounts/me/");
        return response.data;
      } catch (err: any) {
        if (err?.response?.status === 401) {
          logoutUser();
          setLoggedIn(false);
        }
        return null;
      }
    },
    enabled: loggedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: ads = [] } = useQuery<AdItem[]>({
    queryKey: ["ads-ticker"],
    queryFn: async () => {
      try {
        const response = await api.get("/ads/ticker/");
        return response.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = async () => {
    logoutUser();
    setLoggedIn(false);

    queryClient.setQueryData(["navbar-current-user"], null);
    queryClient.removeQueries({ queryKey: ["navbar-current-user"] });
    queryClient.removeQueries({ queryKey: ["current_user"] });
    queryClient.removeQueries({ queryKey: ["me"] });

    navigate("/listings", { replace: true });
  };

  const canModerate = !!loggedIn && !!(currentUser?.is_staff || currentUser?.is_superuser);

  const displayName = () => {
    if (isLoadingCurrentUser) return "...";

    if (currentUser?.first_name || currentUser?.last_name) {
      return [currentUser.first_name, currentUser.last_name].filter(Boolean).join(" ").trim();
    }

    if (currentUser?.username) return currentUser.username;

    return t("nav.account");
  };

  const changeLanguage = (lng: "en" | "rw") => {
    i18n.changeLanguage(lng);
    localStorage.setItem("preferred_language", lng);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
        <div className="hidden md:flex md:items-center md:justify-between md:py-4">
          <Link to="/" className="text-2xl font-bold text-slate-800 transition-colors hover:text-slate-600">
            Market Hub
          </Link>

          <div className="flex items-center gap-1 text-sm">
            <NavLink to="/listings">{t("nav.listings")}</NavLink>

            {!loggedIn ? (
              <>
                <NavLink to="/register">{t("nav.register")}</NavLink>
                <Link
                  to="/login"
                  className="rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                >
                  {t("nav.login")}
                </Link>
              </>
            ) : (
              <>
                <span className="px-3 py-2 text-slate-600">
                  {t("nav.hi")}, <span className="font-semibold text-slate-800">{displayName()}</span>
                </span>

                <NavLink to="/publish">{t("nav.publish")}</NavLink>
                <NavLink to="/dashboard">{t("nav.dashboard")}</NavLink>
                <NavLink to="/profile">{t("nav.profile")}</NavLink>

                {canModerate && <NavLink to="/admin/moderation">{t("nav.moderation")}</NavLink>}

                <button
                  onClick={handleLogout}
                  className="ml-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  {t("nav.logout")}
                </button>
              </>
            )}

            <LanguageSwitcher changeLanguage={changeLanguage} currentLang={i18n.language} />
          </div>
        </div>

        <div className="flex items-center justify-between py-3 md:hidden">
          <Link to="/" className="text-xl font-bold text-slate-800">
            Market Hub
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher changeLanguage={changeLanguage} mobile currentLang={i18n.language} />

            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <MobileNavLink to="/listings" onClick={() => setIsMobileMenuOpen(false)}>
                {t("nav.listings")}
              </MobileNavLink>

              {!loggedIn ? (
                <>
                  <MobileNavLink to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    {t("nav.register")}
                  </MobileNavLink>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="mx-3 rounded-lg bg-slate-300 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-slate-600"
                  >
                    {t("nav.login")}
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 text-slate-600">
                    {t("nav.hi")}, <span className="font-semibold text-slate-800">{displayName()}</span>
                  </div>

                  <MobileNavLink to="/publish" onClick={() => setIsMobileMenuOpen(false)}>
                    {t("nav.publish")}
                  </MobileNavLink>
                  <MobileNavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    {t("nav.dashboard")}
                  </MobileNavLink>
                  <MobileNavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    {t("nav.profile")}
                  </MobileNavLink>

                  {canModerate && (
                    <MobileNavLink to="/admin/moderation" onClick={() => setIsMobileMenuOpen(false)}>
                      {t("nav.moderation")}
                    </MobileNavLink>
                  )}

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="mx-3 mt-2 rounded-lg bg-red-600 px-4 py-2 text-left text-sm font-medium text-white"
                  >
                    {t("nav.logout")}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <AdMarquee ads={ads} speed="normal" />
    </header>
  );
}

function NavLink({
  to,
  children,
  variant = "default",
}: {
  to: string;
  children: ReactNode;
  variant?: "default" | "primary";
}) {
  if (variant === "primary") {
    return (
      <Link
        to={to}
        className="rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  to,
  children,
  onClick,
}: {
  to: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}

function LanguageSwitcher({
  changeLanguage,
  mobile = false,
  currentLang,
}: {
  changeLanguage: (lng: "en" | "rw") => void;
  mobile?: boolean;
  currentLang: string;
}) {
  if (mobile) {
    return (
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        <button
          onClick={() => changeLanguage("en")}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            currentLang === "en" ? "bg-slate-300 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-label="Switch to English"
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage("rw")}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            currentLang === "rw" ? "bg-slate-300 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-label="Switch to Kinyarwanda"
        >
          RW
        </button>
      </div>
    );
  }

  return (
    <div className="ml-4 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
      <button
        onClick={() => changeLanguage("en")}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          currentLang === "en" ? "bg-slate-300 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
        aria-label="Switch to English"
      >
        English
      </button>
      <button
        onClick={() => changeLanguage("rw")}
        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
          currentLang === "rw" ? "bg-slate-300 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
        aria-label="Switch to Kinyarwanda"
      >
        Kinyarwanda
      </button>
    </div>
  );
}