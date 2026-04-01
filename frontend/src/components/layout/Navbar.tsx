import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { isAuthenticated, logoutUser } from "../../lib/auth";
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
};

export default function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  const {
    data: currentUser,
    isLoading: isLoadingCurrentUser,
    isError,
  } = useQuery<CurrentUser | null>({
    queryKey: ["navbar-current-user"],
    queryFn: async () => {
      const response = await api.get("/accounts/me/");
      return response.data;
    },
    enabled: loggedIn,
    staleTime: 0,
    retry: false,
  });

  const { data: ads } = useQuery<AdItem[]>({
    queryKey: ["ads-ticker"],
    queryFn: async () => {
      const response = await api.get("/ads/ticker/");
      return response.data;
    },
  });

  const handleLogout = async () => {
    logoutUser();
    window.location.href = "/listings";
    setLoggedIn(false);

    queryClient.setQueryData(["navbar-current-user"], null);
    queryClient.removeQueries({ queryKey: ["navbar-current-user"] });
    queryClient.removeQueries({ queryKey: ["current_user"] });
    queryClient.removeQueries({ queryKey: ["me"] });

    navigate("/listings");
  };

  const canModerate =
    loggedIn && (!!currentUser?.is_staff || !!currentUser?.is_superuser);

  const displayName =
    [currentUser?.first_name, currentUser?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || currentUser?.username || t("nav.account");

  const changeLanguage = (lng: 'en' | 'rw') => {
    i18n.changeLanguage(lng);
    localStorage.setItem('preferred_language', lng);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <Link to="/" className="text-xl font-bold">
          Market Hub
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm md:text-base">
          <Link to="/listings" className="rounded-xl px-3 py-2 hover:bg-slate-100">
            {t("nav.listings")}
          </Link>

          {!loggedIn ? (
            <>
              <Link to="/register" className="rounded-xl px-3 py-2 hover:bg-slate-100">
                {t("nav.register")}
              </Link>

              <Link to="/login" className="rounded-xl bg-slate-500 px-4 py-2 text-white">
                {t("nav.login")}
              </Link>
            </>
          ) : (
            <>
              <span className="rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700">
                {t("nav.hi")}, {isLoadingCurrentUser ? "..." : displayName}
              </span>

              <Link to="/publish" className="rounded-xl px-3 py-2 hover:bg-slate-100">
                {t("nav.publish")}
              </Link>

              <Link to="/dashboard" className="rounded-xl px-3 py-2 hover:bg-slate-100">
                {t("nav.dashboard")}
              </Link>

              <Link to="/profile" className="rounded-xl px-3 py-2 hover:bg-slate-100">
                {t("nav.profile")}
              </Link>

              {!isLoadingCurrentUser && !isError && canModerate && (
                <Link
                  to="/admin/moderation"
                  className="rounded-xl px-3 py-2 hover:bg-slate-100"
                >
                  {t("nav.moderation")}
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-slate-900 px-4 py-2 text-white"
              >
                {t("nav.logout")}
              </button>
            </>
          )}

          {/* Language Switcher - BRIGHT RED TEST BUTTONS */}
          <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg ml-2">
            <button 
              onClick={() => changeLanguage('en')}
              className="font-bold hover:underline"
            >
              ENGLISH
            </button>
            <span>|</span>
            <button 
              onClick={() => changeLanguage('rw')}
              className="font-bold hover:underline"
            >
              KINYARWANDA
            </button>
          </div>
        </div>
      </div>

      <AdMarquee ads={ads || []} />
    </header>
  );
}