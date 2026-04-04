from django.utils import timezone
from .models import UserSubscription


def get_active_subscription(user):
    """
    Returns the latest approved and currently valid subscription for a user.
    """

    if not user or not user.is_authenticated:
        return None

    return (
        UserSubscription.objects.filter(
            user=user,
            status="approved",          # ✅ updated (was "active")
            is_active=True,             # ✅ ensure not disabled
            start_date__isnull=False,   # ✅ must have started
            end_date__isnull=False,     # ✅ must have end date
            end_date__gt=timezone.now() # ✅ not expired
        )
        .select_related("plan")
        .order_by("-approved_at", "-created_at")
        .first()
    )