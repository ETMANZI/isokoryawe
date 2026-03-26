from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import JsonResponse

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

def health_check(request):
    return JsonResponse({"ok": True})


urlpatterns = [
    path("admin/", admin.site.urls),

    # API docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    # Auth
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # API routes
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/", include("apps.listings.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/moderation/", include("apps.moderation.urls")),

    # 👉 React app (MUST BE LAST)
    re_path(r"^(?!api/|admin/|static/|media/).*$", TemplateView.as_view(template_name="index.html")),
]

# Media files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)