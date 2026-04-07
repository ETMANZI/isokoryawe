from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import AdminAnalyticsOverviewView, ListingViewSet,CategoryViewSet, FavoriteViewSet,AdTickerView, PartnerDetailView, PartnerListView, PersonalizedRecommendationsView, PopularCategoriesView, PromoBannerViewSet, PublicBusinessAdListView, PublicListingDetailView, RecordListingViewView, SellerDashboardStatsView, SimilarListingsView, TrendingListingsView,search_location

router = DefaultRouter()
router.register("listings", ListingViewSet, basename="listing")
router.register("categories", CategoryViewSet, basename="category")
router.register("favorites", FavoriteViewSet, basename="favorite")
# router.register("categories", CategoryViewSet, basename="category")
router.register("promo-banners", PromoBannerViewSet, basename="promo-banners")


urlpatterns = router.urls + [
    path("ads/ticker/", AdTickerView.as_view(), name="ads-ticker"),
    path("search-location/", search_location, name="search_location"),
    path("partners/", PartnerListView.as_view(), name="partner-list"),
    path("partners/<int:pk>/", PartnerDetailView.as_view(), name="partner-detail"),
    
    path("analytics/seller-stats/", SellerDashboardStatsView.as_view(), name="seller-stats"),
    path("analytics/popular-categories/", PopularCategoriesView.as_view(), name="popular-categories"),
    path("analytics/admin-overview/", AdminAnalyticsOverviewView.as_view(), name="admin-overview"),
    
    path("public/business-ads/", PublicBusinessAdListView.as_view(), name="public-business-ads"),
    path("public/listings/<uuid:id>/", PublicListingDetailView.as_view(), name="public-listing-detail"),
    
    # path("track-visit/", TrackPageVisitView.as_view(), name="track-visit"),
    # path("analytics/track-visit/", TrackPageVisitView.as_view(), name="track-visit"),
path('recommendations/personalized/', PersonalizedRecommendationsView.as_view(), name='personalized-recommendations'),
path('recommendations/similar/<int:listing_id>/', SimilarListingsView.as_view(), name='similar-listings'),
path('recommendations/trending/', TrendingListingsView.as_view(), name='trending-listings'),
path('recommendations/record-view/<int:listing_id>/', RecordListingViewView.as_view(), name='record-listing-view'),

]