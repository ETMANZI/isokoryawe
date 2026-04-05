from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from apps.listings.models import Listing

from .models import SubscriptionPlan, UserSubscription, SubscriptionPayment
from .serializers import (
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
    AdminUserSubscriptionSerializer,
    SubscriptionPaymentSerializer,
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
            UserSubscription.objects.filter(user=request.user, is_active=True)
            .select_related("plan", "approved_by")
            .order_by("-requested_at")
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

        now = timezone.now()

        existing_pending = UserSubscription.objects.filter(
            user=request.user,
            is_active=True,
            status="pending",
        ).exists()

        if existing_pending:
            return Response(
                {"detail": "You already have a pending subscription request awaiting approval."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_approved = UserSubscription.objects.filter(
            user=request.user,
            is_active=True,
            status="approved",
            end_date__isnull=False,
            end_date__gt=now,
        ).exists()

        if existing_approved:
            return Response(
                {"detail": "You already have an active approved subscription."},
                status=status.HTTP_400_BAD_REQUEST,
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
                "message": "Subscription request submitted successfully.",
                "subscription_id": subscription.id,
                "payment_id": payment.id,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "status": subscription.status,
                "can_renew_again_after_expiry": True,
            },
            status=status.HTTP_201_CREATED,
        )


class MySubscriptionPaymentsView(generics.ListAPIView):
    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SubscriptionPayment.objects.filter(user=self.request.user).order_by("-created_at")


class AdminSubscriptionRequestListView(generics.ListAPIView):
    serializer_class = AdminUserSubscriptionSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return (
            UserSubscription.objects.select_related("user", "plan", "approved_by")
            .prefetch_related("payments")
            .order_by("-requested_at")
        )


class AdminSubscriptionPaymentListView(generics.ListAPIView):
    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return (
            SubscriptionPayment.objects.select_related("user", "subscription", "subscription__plan")
            .order_by("-created_at")
        )


class AdminApproveSubscriptionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            subscription = UserSubscription.objects.select_related("plan", "user").get(pk=pk)
        except UserSubscription.DoesNotExist:
            return Response(
                {"detail": "Subscription request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        subscription.approve(request.user)

        Listing.objects.filter(owner=subscription.user).update(
            visibility_status=Listing.VisibilityStatus.ACTIVE
        )

        return Response(
            {
                "message": "Subscription approved successfully. Listings are now visible."
            }
        )


class AdminRejectSubscriptionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            subscription = UserSubscription.objects.select_related("plan", "user").get(pk=pk)
        except UserSubscription.DoesNotExist:
            return Response(
                {"detail": "Subscription request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        reason = (request.data.get("reason") or "").strip()

        subscription.reject(reason)

        Listing.objects.filter(owner=subscription.user).update(
            visibility_status=Listing.VisibilityStatus.INACTIVE
        )

        return Response(
            {
                "message": "Subscription rejected. All listings have been hidden.",
                "reason": reason or "Rejected by admin",
            }
        )