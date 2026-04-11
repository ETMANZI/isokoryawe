from decimal import Decimal
from datetime import timedelta
import logging
from django.db.models import Q, Count
from django.utils import timezone
from .models import Listing, UserPreference, RecommendationCache
from django.db.models import Q, F, Count, Avg, DecimalField, Case, When, Value
from django.db.models.functions import Coalesce, ExtractDay, Now

logger = logging.getLogger(__name__)
class RecommendationEngine:

    @staticmethod
    def get_personalized_recommendations(user, limit=10):
        try:
            cache_valid_until = timezone.now() - timedelta(hours=6)
            cached = RecommendationCache.objects.filter(user=user, created_at__gt=cache_valid_until).first()
            if cached:
                listing_ids = cached.recommendations[:limit]
                return list(Listing.objects.filter(id__in=listing_ids, visibility_status=Listing.VisibilityStatus.ACTIVE))

            # Gather user views - Using views_count instead of ListingView
            viewed_listings = Listing.objects.filter(
                owner=user,
                visibility_status=Listing.VisibilityStatus.ACTIVE
            ).order_by('-views_count')[:20]
            
            viewed_categories, viewed_types, viewed_districts, viewed_prices = set(), set(), set(), []

            for listing in viewed_listings:
                if listing:
                    if listing.category:
                        viewed_categories.add(listing.category_id)
                    viewed_types.add(listing.listing_type)
                    if listing.district:
                        viewed_districts.add(listing.district)
                    if listing.price:
                        viewed_prices.append(float(listing.price))

            try:
                prefs = user.preferences
                preferred_categories = prefs.preferred_categories or []
                preferred_types = prefs.preferred_listing_types or []
            except UserPreference.DoesNotExist:
                preferred_categories, preferred_types = [], []

            avg_price = float(sum(viewed_prices)/len(viewed_prices)) if viewed_prices else None

            query = Q(visibility_status=Listing.VisibilityStatus.ACTIVE)

            categories_to_use = list(viewed_categories) + preferred_categories
            if categories_to_use:
                query &= Q(category__in=categories_to_use)

            types_to_use = list(viewed_types) + preferred_types
            if types_to_use:
                query &= Q(listing_type__in=types_to_use)

            if avg_price:
                price_range = avg_price * 0.3
                query &= Q(price__gte=Decimal(avg_price - price_range), price__lte=Decimal(avg_price + price_range))

            viewed_ids = [v.id for v in viewed_listings]
            if viewed_ids:
                query &= ~Q(id__in=viewed_ids)

            recommendations = list(Listing.objects.filter(query)[:limit])

            # Fill with popular listings - FIXED: use views_count
            if len(recommendations) < limit:
                popular = Listing.objects.filter(
                    visibility_status=Listing.VisibilityStatus.ACTIVE
                ).order_by('-views_count')[:limit - len(recommendations)]  # ← FIXED

                recommendations.extend([p for p in popular if p not in recommendations])

            # Cache results
            RecommendationCache.objects.update_or_create(
                user=user,
                defaults={
                    'recommendations': [r.id for r in recommendations],
                    'expires_at': timezone.now() + timedelta(hours=6)
                }
            )

            return recommendations[:limit]

        except Exception as e:
            logger.error(f"Error in get_personalized_recommendations: {e}")
            return []

    @staticmethod
    def get_similar_listings(listing, limit=6):
        try:
            if not listing:
                return []

            query = Q(visibility_status=Listing.VisibilityStatus.ACTIVE) & ~Q(id=listing.id)

            if listing.category:
                query &= Q(category=listing.category)
            query &= Q(listing_type=listing.listing_type)

            if listing.price:
                price_range = float(listing.price) * 0.2
                query &= Q(price__gte=Decimal(float(listing.price) - price_range),
                        price__lte=Decimal(float(listing.price) + price_range))

            if listing.district:
                query &= Q(district=listing.district)

            similar = list(Listing.objects.filter(query)[:limit])

            if len(similar) < limit:
                # FIXED: Use views_count directly
                popular = Listing.objects.filter(
                    visibility_status=Listing.VisibilityStatus.ACTIVE,
                    listing_type=listing.listing_type
                ).exclude(id=listing.id).order_by('-views_count')[:limit - len(similar)]

                similar.extend([p for p in popular if p not in similar])

            return similar[:limit]

        except Exception as e:
            logger.error(f"Error in get_similar_listings: {e}")
            return []

    @staticmethod
    def record_listing_view(user, listing, request):
        try:
            # Just increment the views_count field
            listing.views_count += 1
            listing.save(update_fields=['views_count'])

            if user and user.is_authenticated:
                RecommendationEngine.update_preferences_from_view(user, listing)

        except Exception as e:
            logger.error(f"Error in record_listing_view: {e}")

    @staticmethod
    def update_preferences_from_view(user, listing):
        try:
            prefs, _ = UserPreference.objects.get_or_create(user=user)
            
            # Ensure fields are lists before modifying
            if not isinstance(prefs.preferred_categories, list):
                prefs.preferred_categories = []
            if not isinstance(prefs.preferred_listing_types, list):
                prefs.preferred_listing_types = []
            
            # Categories
            if listing.category and listing.category.id not in prefs.preferred_categories:
                categories = prefs.preferred_categories[:4]
                categories.insert(0, listing.category.id)
                prefs.preferred_categories = categories
            
            # Listing types
            if listing.listing_type and listing.listing_type not in prefs.preferred_listing_types:
                types = prefs.preferred_listing_types[:2]
                types.insert(0, listing.listing_type)
                prefs.preferred_listing_types = types
            
            prefs.save()
            
        except Exception as e:
            logger.error(f"Error in update_preferences_from_view: {e}")

    # @staticmethod
    # def get_trending_listings(limit=10):
    #     """Get trending listings based on view count"""
    #     try:
    #         # FIXED: Use views_count directly
    #         trending = Listing.objects.filter(
    #             visibility_status=Listing.VisibilityStatus.ACTIVE,
    #             views_count__gt=0
    #         ).order_by('-views_count')[:limit]
            
    #         return trending
            
    #     except Exception as e:
    #         logger.error(f"Error in get_trending_listings: {e}")
    #         return []
    
    @staticmethod
    def get_trending_listings(limit=10, days=7):
        """
        Powerful trending algorithm with 4 key factors:
        - Views velocity (40%)
        - Engagement rate (30%)  
        - Recency (20%)
        - Price attractiveness (10%)
        """
        try:
            now = timezone.now()
            time_threshold = now - timedelta(days=days)
            
            trending = Listing.objects.filter(
                visibility_status=Listing.VisibilityStatus.ACTIVE,
                created_at__gte=time_threshold
            ).annotate(
                # Factor 1: Views per day (40%)
                days_old = ExtractDay(now - F('created_at')) + 1,
                views_per_day = F('views_count') / F('days_old'),
                normalized_views = Case(
                    When(views_per_day__gt=0, 
                        then=F('views_per_day') * 100 / (F('views_per_day') + 100)),
                    default=Value(0),
                    output_field=DecimalField(max_digits=10, decimal_places=2)
                ),
                
                # Factor 2: Engagement rate (30%)
                engagement_rate = Case(
                    When(views_count__gt=0,
                        then=(F('call_clicks') + F('whatsapp_clicks')) * 100.0 / F('views_count')),
                    default=Value(0),
                    output_field=DecimalField(max_digits=10, decimal_places=2)
                ),
                
                # Factor 3: Recency boost (20%)
                hours_old = ExtractDay(now - F('created_at')) * 24,
                recency_score = Case(
                    When(hours_old__lt=24, then=Value(100)),
                    When(hours_old__lt=72, then=Value(70)),
                    When(hours_old__lt=168, then=Value(40)),
                    default=Value(20),
                    output_field=DecimalField(max_digits=10, decimal_places=2)
                ),
                
                # Factor 4: Price attractiveness (10%)
                avg_price_in_category = Coalesce(
                    Avg('price', filter=Q(category=F('category'))),
                    Value(1)
                ),
                price_score = Case(
                    When(price__lt=F('avg_price_in_category') * 0.7, then=Value(100)),
                    When(price__lt=F('avg_price_in_category'), then=Value(70)),
                    When(price__gt=F('avg_price_in_category') * 1.5, then=Value(20)),
                    default=Value(50),
                    output_field=DecimalField(max_digits=10, decimal_places=2)
                ),
            ).annotate(
                trending_score=(
                    F('normalized_views') * Decimal('0.40') +
                    F('engagement_rate') * Decimal('0.30') +
                    F('recency_score') * Decimal('0.20') +
                    F('price_score') * Decimal('0.10')
                )
            ).filter(trending_score__gt=0).order_by('-trending_score')[:limit]
            
            return trending
            
        except Exception as e:
            logger.error(f"Error in trending: {e}")
            return []