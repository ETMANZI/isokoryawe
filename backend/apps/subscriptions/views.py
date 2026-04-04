from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SubscriptionPlan, UserSubscription, SubscriptionPayment
from .serializers import (
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
)


class SubscriptionPlanListView(generics.ListAPIView):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return SubscriptionPlan.objects.filter(is_active=True).order_by("price", "name")


class MySubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subscription = (
            UserSubscription.objects.filter(user=request.user)
            .select_related("plan")
            .order_by("-created_at")
            .first()
        )

        if not subscription:
            return Response({
                "has_subscription": False,
                "subscription": None,
            })

        return Response({
            "has_subscription": True,
            "subscription": UserSubscriptionSerializer(subscription).data,
        })


class SubscribeToPlanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get("plan_id")

        if not plan_id:
            return Response(
                {"detail": "plan_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"detail": "Subscription plan not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        subscription = UserSubscription.objects.create(
            user=request.user,
            plan=plan,
            status="pending",
        )

        payment = SubscriptionPayment.objects.create(
            subscription=subscription,
            user=request.user,
            amount=plan.price,
            currency=plan.currency,
            status="pending",
        )

        return Response(
            {
                "message": "Subscription created successfully.",
                "subscription_id": subscription.id,
                "payment_id": payment.id,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "status": subscription.status,
            },
            status=status.HTTP_201_CREATED,
        )