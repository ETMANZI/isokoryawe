from django.contrib import admin
from .models import SubscriptionPlan, UserSubscription, SubscriptionPayment


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "price",
        "currency",
        "billing_cycle",
        "duration_days",
        "max_listings",
        "is_active",
    )
    list_filter = ("billing_cycle", "is_active", "can_post_business_ads", "can_feature_listings")
    search_fields = ("name", "code")
    prepopulated_fields = {"code": ("name",)}


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "plan",
        "status",
        "start_date",
        "end_date",
        "auto_renew",
        "created_at",
    )
    list_filter = ("status", "auto_renew", "plan")
    search_fields = ("user__username", "user__email", "plan__name")


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "subscription",
        "amount",
        "currency",
        "payment_method",
        "transaction_id",
        "status",
        "paid_at",
    )
    list_filter = ("status", "currency", "payment_method")
    search_fields = ("user__username", "user__email", "transaction_id", "external_reference")