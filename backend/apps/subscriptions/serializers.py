from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription, SubscriptionPayment


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "code",
            "description",
            "price",
            "currency",
            "billing_cycle",
            "duration_days",
            "max_listings",
            "can_post_business_ads",
            "can_feature_listings",
            "can_access_advanced_analytics",
            "priority_support",
            "is_active",
        ]


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    is_currently_active = serializers.ReadOnlyField()

    class Meta:
        model = UserSubscription
        fields = [
            "id",
            "user",
            "plan",
            "status",
            "start_date",
            "end_date",
            "auto_renew",
            "created_at",
            "updated_at",
            "is_currently_active",
        ]
        read_only_fields = [
            "id",
            "user",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
            "is_currently_active",
        ]


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = [
            "id",
            "subscription",
            "user",
            "amount",
            "currency",
            "payment_method",
            "transaction_id",
            "external_reference",
            "status",
            "paid_at",
            "raw_response",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "paid_at",
            "created_at",
            "updated_at",
        ]