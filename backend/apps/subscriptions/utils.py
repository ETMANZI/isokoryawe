from django.utils import timezone
from .models import UserSubscription


def get_active_subscription(user):
    """
    Returns the latest approved and currently valid subscription for a user.

    Also automatically marks expired subscriptions as "expired".
    """

    if not user or not user.is_authenticated:
        return None

    now = timezone.now()

    # 🔥 Step 1: mark expired subscriptions
    UserSubscription.objects.filter(
        user=user,
        status="approved",
        is_active=True,
        end_date__isnull=False,
        end_date__lte=now,
    ).update(status="expired")

    # 🔥 Step 2: return active subscription
    return (
        UserSubscription.objects.filter(
            user=user,
            status="approved",
            is_active=True,
            start_date__isnull=False,
            end_date__isnull=False,
            end_date__gt=now,
        )
        .select_related("plan")
        .order_by("-approved_at", "-created_at")
        .first()
    )