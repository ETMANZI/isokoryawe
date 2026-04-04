from django.utils import timezone
from .models import UserSubscription


def get_active_subscription(user):
    if not user or not user.is_authenticated:
        return None

    return (
        UserSubscription.objects.filter(
            user=user,
            status="active",
            end_date__gt=timezone.now(),
        )
        .select_related("plan")
        .order_by("-end_date")
        .first()
    )