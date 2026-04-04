from django.urls import path
from .views import SubscriptionPlanListView, MySubscriptionView, SubscribeToPlanView

urlpatterns = [
    path("plans/", SubscriptionPlanListView.as_view(), name="subscription-plans"),
    path("my-subscription/", MySubscriptionView.as_view(), name="my-subscription"),
    path("subscribe/", SubscribeToPlanView.as_view(), name="subscribe-to-plan"),
]