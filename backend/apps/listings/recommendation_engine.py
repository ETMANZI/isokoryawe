from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from .models import Listing, ListingView, UserPreference, RecommendationCache
import random

# class RecommendationEngine:
    
#     @staticmethod
#     def get_personalized_recommendations(user, limit=10):
#         """Get personalized recommendations for a user"""
        
#         # Check cache first (valid for 6 hours)
#         cache_valid_until = timezone.now() - timedelta(hours=6)
#         cached = RecommendationCache.objects.filter(
#             user=user,
#             created_at__gt=cache_valid_until
#         ).first()
        
#         if cached:
#             listing_ids = cached.recommendations[:limit]
#             return Listing.objects.filter(id__in=listing_ids, visibility_status='active')
        
#         recommendations = []
        
#         viewed_listings = ListingView.objects.filter(
#             user=user
#         ).select_related('listing').order_by('-viewed_at')[:20]
        
#         viewed_categories = set()
#         viewed_types = set()
#         viewed_districts = set()
#         viewed_prices = []
        
#         for view in viewed_listings:
#             if view.listing.category:
#                 viewed_categories.add(view.listing.category_id)
#             viewed_types.add(view.listing.listing_type)
#             if view.listing.district:
#                 viewed_districts.add(view.listing.district)
#             if view.listing.price:
#                 viewed_prices.append(float(view.listing.price))
        
#         try:
#             prefs = user.preferences
#             preferred_categories = prefs.preferred_categories
#             preferred_types = prefs.preferred_listing_types
#             price_min = prefs.price_min
#             price_max = prefs.price_max
#             preferred_districts = prefs.preferred_districts
#         except UserPreference.DoesNotExist:
#             preferred_categories = []
#             preferred_types = []
#             price_min = None
#             price_max = None
#             preferred_districts = []
        
#         avg_price = sum(viewed_prices) / len(viewed_prices) if viewed_prices else None
        
#         base_query = Q(visibility_status='active')
        
#         categories_to_use = list(viewed_categories) + preferred_categories
#         if categories_to_use:
#             base_query &= Q(category__in=categories_to_use)
        
#         types_to_use = list(viewed_types) + preferred_types
#         if types_to_use:
#             base_query &= Q(listing_type__in=types_to_use)
        
#         districts_to_use = list(viewed_districts) + preferred_districts
#         if districts_to_use:
#             base_query &= Q(district__in=districts_to_use)
        
#         if price_min and price_max:
#             base_query &= Q(price__gte=price_min, price__lte=price_max)
#         elif avg_price:
#             price_range = avg_price * 0.3  # 30% range
#             base_query &= Q(
#                 price__gte=avg_price - price_range,
#                 price__lte=avg_price + price_range
#             )
        
#         viewed_ids = [v.listing_id for v in viewed_listings]
#         if viewed_ids:
#             base_query &= ~Q(id__in=viewed_ids)
        
#         recommendations = list(Listing.objects.filter(base_query)[:limit])
        
#         if len(recommendations) < limit:
#             popular = Listing.objects.filter(
#                 visibility_status='active'
#             ).annotate(
#                 view_count=Count('views')
#             ).order_by('-view_count')[:limit - len(recommendations)]
            
#             for item in popular:
#                 if item not in recommendations:
#                     recommendations.append(item)
        
#         RecommendationCache.objects.update_or_create(
#             user=user,
#             defaults={
#                 'recommendations': [r.id for r in recommendations],
#                 'expires_at': timezone.now() + timedelta(hours=6)
#             }
#         )
        
#         return recommendations[:limit]
    
#     @staticmethod
#     def get_similar_listings(listing, limit=6):
#         """Get listings similar to a given listing"""
#         if not listing:
#             return []
        
#         query = Q(visibility_status='active') & ~Q(id=listing.id)
        
#         # Same category (40% weight)
#         if listing.category:
#             query &= Q(category=listing.category)
        
#         # Same listing type (30% weight)
#         query &= Q(listing_type=listing.listing_type)
        
#         # Similar price range (±20%) (20% weight)
#         if listing.price:
#             price_range = float(listing.price) * 0.2
#             query &= Q(
#                 price__gte=float(listing.price) - price_range,
#                 price__lte=float(listing.price) + price_range
#             )
        
#         # Same district (10% weight)
#         if listing.district:
#             query &= Q(district=listing.district)
        
#         similar = Listing.objects.filter(query)[:limit]
        
#         # If not enough, add popular listings in same category
#         if len(similar) < limit:
#             popular = Listing.objects.filter(
#                 visibility_status='active',
#                 listing_type=listing.listing_type
#             ).exclude(id=listing.id).annotate(
#                 view_count=Count('views')
#             ).order_by('-view_count')[:limit - len(similar)]
            
#             for item in popular:
#                 if item not in similar:
#                     similar = list(similar) + [item]
        
#         return similar[:limit]
    
#     @staticmethod
#     def get_trending_listings(limit=10):
#         """Get trending listings based on recent views"""
#         last_7_days = timezone.now() - timedelta(days=7)
        
#         trending = Listing.objects.filter(
#             visibility_status='active',
#             views__viewed_at__gte=last_7_days
#         ).annotate(
#             recent_views=Count('views')
#         ).order_by('-recent_views')[:limit]
        
#         return trending
    
#     @staticmethod
#     def get_popular_in_category(category_id, limit=8):
#         """Get popular listings in a specific category"""
#         popular = Listing.objects.filter(
#             visibility_status='active',
#             category_id=category_id
#         ).annotate(
#             view_count=Count('views')
#         ).order_by('-view_count')[:limit]
        
#         return popular
    
#     @staticmethod
#     def record_listing_view(user, listing, request):
#         """Record when a user views a listing"""
#         session_id = request.session.session_key
#         if not session_id and not user.is_authenticated:
#             from django.contrib.sessions.backends.db import SessionStore
#             session_id = SessionStore().session_key
        
#         ListingView.objects.create(
#             user=user if user.is_authenticated else None,
#             listing=listing,
#             session_id=session_id
#         )
        
#         # Update user preferences based on views
#         if user.is_authenticated:
#             RecommendationEngine.update_preferences_from_view(user, listing)
    
#     @staticmethod
#     def update_preferences_from_view(user, listing):
#         """Update user preferences based on viewed listings"""
#         try:
#             prefs = user.preferences
#         except UserPreference.DoesNotExist:
#             prefs = UserPreference(user=user)
        
#         # Add viewed category to preferences
#         if listing.category and listing.category.id not in prefs.preferred_categories:
#             categories = prefs.preferred_categories[:5]  # Keep last 5
#             categories.insert(0, listing.category.id)
#             prefs.preferred_categories = categories
        
#         # Add listing type to preferences
#         if listing.listing_type not in prefs.preferred_listing_types:
#             types = prefs.preferred_listing_types[:3]
#             types.insert(0, listing.listing_type)
#             prefs.preferred_listing_types = types
        
#         # Update price range
#         if listing.price:
#             current_min = prefs.price_min or float(listing.price)
#             current_max = prefs.price_max or float(listing.price)
#             prefs.price_min = min(current_min, float(listing.price))
#             prefs.price_max = max(current_max, float(listing.price))
        
#         # Add district
#         if listing.district and listing.district not in prefs.preferred_districts:
#             districts = prefs.preferred_districts[:3]
#             districts.insert(0, listing.district)
#             prefs.preferred_districts = districts
        
#         prefs.save()



class RecommendationEngine:
    @staticmethod
    def get_personalized_recommendations(user, limit=10):
        return []
    
    @staticmethod
    def get_similar_listings(listing, limit=6):
        return []
    
    @staticmethod
    def get_trending_listings(limit=10):
        return []
    
    @staticmethod
    def record_listing_view(user, listing, request):
        pass