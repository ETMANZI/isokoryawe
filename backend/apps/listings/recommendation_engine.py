from decimal import Decimal
from datetime import timedelta
import logging
from django.db.models import Q, Count
from django.utils import timezone
from .models import Listing, ListingView, UserPreference, RecommendationCache

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

            # Gather user views
            viewed_listings = ListingView.objects.filter(user=user).select_related('listing').order_by('-viewed_at')[:20]
            viewed_categories, viewed_types, viewed_districts, viewed_prices = set(), set(), set(), []

            for view in viewed_listings:
                l = view.listing
                if l:
                    if l.category:
                        viewed_categories.add(l.category_id)
                    viewed_types.add(l.listing_type)
                    if l.district:
                        viewed_districts.add(l.district)
                    if l.price:
                        viewed_prices.append(float(l.price))

            # User preferences
            try:
                prefs = user.preferences
                preferred_categories = prefs.preferred_categories or []
                preferred_types = prefs.preferred_listing_types or []
                preferred_districts = prefs.preferred_districts or []
                price_min = prefs.price_min
                price_max = prefs.price_max
            except UserPreference.DoesNotExist:
                preferred_categories, preferred_types, preferred_districts = [], [], []
                price_min = price_max = None

            avg_price = float(sum(viewed_prices)/len(viewed_prices)) if viewed_prices else None

            query = Q(visibility_status=Listing.VisibilityStatus.ACTIVE)

            categories_to_use = list(viewed_categories) + preferred_categories
            if categories_to_use:
                query &= Q(category__in=categories_to_use)

            types_to_use = list(viewed_types) + preferred_types
            if types_to_use:
                query &= Q(listing_type__in=types_to_use)

            districts_to_use = list(viewed_districts) + preferred_districts
            if districts_to_use:
                query &= Q(district__in=districts_to_use)

            if price_min is not None and price_max is not None:
                query &= Q(price__gte=Decimal(price_min), price__lte=Decimal(price_max))
            elif avg_price:
                price_range = avg_price * 0.3
                query &= Q(price__gte=Decimal(avg_price - price_range), price__lte=Decimal(avg_price + price_range))

            viewed_ids = [v.listing_id for v in viewed_listings if v.listing_id]
            if viewed_ids:
                query &= ~Q(id__in=viewed_ids)

            recommendations = list(Listing.objects.filter(query)[:limit])

            # Fill with popular listings
            if len(recommendations) < limit:
                popular = Listing.objects.filter(
                    visibility_status=Listing.VisibilityStatus.ACTIVE
                ).annotate(view_count=Count('views')).order_by('-view_count')[:limit - len(recommendations)]

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
                # FIXED: Changed 'views' to 'views_count'
                popular = Listing.objects.filter(
                    visibility_status=Listing.VisibilityStatus.ACTIVE,
                    listing_type=listing.listing_type
                ).exclude(id=listing.id).annotate(
                    view_count=Count('views_count')  # ← THIS IS THE FIX
                ).order_by('-view_count')[:limit - len(similar)]

                similar.extend([p for p in popular if p not in similar])

            return similar[:limit]

        except Exception as e:
            logger.error(f"Error in get_similar_listings: {e}")
            return []

    @staticmethod
    def record_listing_view(user, listing, request):
        try:
            session_id = request.session.session_key
            if not session_id and (not user or not user.is_authenticated):
                from django.contrib.sessions.backends.db import SessionStore
                session_id = SessionStore().session_key

            ListingView.objects.create(
                user=user if user and user.is_authenticated else None,
                listing=listing,
                session_id=session_id
            )

            if user and user.is_authenticated:
                RecommendationEngine.update_preferences_from_view(user, listing)

        except Exception as e:
            logger.error(f"Error in record_listing_view: {e}")

    @staticmethod
    def update_preferences_from_view(user, listing):
        try:
            prefs, _ = UserPreference.objects.get_or_create(user=user)

            # Categories
            if listing.category and listing.category.id not in prefs.preferred_categories:
                categories = prefs.preferred_categories[:5]
                categories.insert(0, listing.category.id)
                prefs.preferred_categories = categories

            # Listing types
            if listing.listing_type and listing.listing_type not in prefs.preferred_listing_types:
                types = prefs.preferred_listing_types[:3]
                types.insert(0, listing.listing_type)
                prefs.preferred_listing_types = types

            # Price
            if listing.price:
                price = float(listing.price)
                prefs.price_min = min(prefs.price_min or price, price)
                prefs.price_max = max(prefs.price_max or price, price)

            # Districts
            if listing.district and listing.district not in prefs.preferred_districts:
                districts = prefs.preferred_districts[:3]
                districts.insert(0, listing.district)
                prefs.preferred_districts = districts

            prefs.save()

        except Exception as e:
            logger.error(f"Error in update_preferences_from_view: {e}")
            
    # Add this method to your RecommendationEngine class

    @staticmethod
    def get_trending_listings(limit=10):
        """Get trending listings based on view count in the last 7 days"""
        try:
            last_week = timezone.now() - timedelta(days=7)
            
            trending = Listing.objects.filter(
                visibility_status=Listing.VisibilityStatus.ACTIVE,
                views__viewed_at__gte=last_week
            ).annotate(
                view_count=Count('views')
            ).filter(
                view_count__gt=0
            ).order_by('-view_count')[:limit]
            
            # If not enough trending listings, fill with popular ones
            if len(trending) < limit:
                popular = Listing.objects.filter(
                    visibility_status=Listing.VisibilityStatus.ACTIVE
                ).annotate(
                    view_count=Count('views')
                ).order_by('-view_count')[:limit - len(trending)]
                
                trending = list(trending) + [p for p in popular if p not in trending]
            
            return trending[:limit]
            
        except Exception as e:
            logger.error(f"Error in get_trending_listings: {e}")
            return []