import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { api } from "../lib/api";
import { isAuthenticated } from "../lib/auth";

type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  price: string;
  currency: string;
  billing_cycle: string;
  duration_days: number;
  max_listings: number;
};

type MySubscriptionResponse = {
  has_subscription: boolean;
  listings_hidden?: boolean;
  hidden_listings_count?: number;
  subscription: {
    id: number;
    status: string;
    end_date: string | null;
    is_currently_active: boolean;
    plan: SubscriptionPlan;
  } | null;
};

export default function SubscriptionPlansPage() {
  const loggedIn = isAuthenticated();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => (await api.get("/subscriptions/plans/")).data,
  });

  const { data: mySubscription } = useQuery<MySubscriptionResponse>({
    queryKey: ["my-subscription"],
    queryFn: async () => (await api.get("/subscriptions/my-subscription/")).data,
    enabled: loggedIn,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: number) =>
      (await api.post("/subscriptions/subscribe/", { plan_id: planId })).data,
    onSuccess: (data) => {
      setActionError(null);
      setActionMessage(
        `Subscription request submitted. Pay ${data.amount} ${data.currency}`
      );
    },
    onError: (error: any) => {
      setActionMessage(null);
      setActionError(
        error?.response?.data?.detail || "Failed to subscribe."
      );
    },
  });

  const current = mySubscription?.subscription;

  const isExpired =
    current?.status === "expired" ||
    (current?.end_date
      ? new Date(current.end_date).getTime() < Date.now()
      : false);

  const isPending = current?.status === "pending";

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        <div className="py-10">
          <h1 className="mb-2 text-3xl font-bold">Subscription Plans</h1>
          <p className="mb-6 text-slate-600">
            Choose a plan to publish listings.
          </p>

          {/* 🔥 Hidden listings warning */}
          {loggedIn && mySubscription?.listings_hidden && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Your listings are hidden due to expired subscription.
              {mySubscription.hidden_listings_count
                ? ` (${mySubscription.hidden_listings_count} hidden)`
                : ""}
            </div>
          )}

          {/* 🔥 Current subscription */}
          {loggedIn && current && (
            <div className="mb-6 rounded-xl border p-4">
              <h2 className="text-xl font-bold">{current.plan.name}</h2>
              <p>Status: {current.status}</p>

              {current.end_date && (
                <p>
                  Ends: {new Date(current.end_date).toLocaleDateString()}
                </p>
              )}

              {/* 🔥 Renew button */}
              {isExpired && (
                <a
                  href="#plans"
                  className="mt-2 inline-block rounded bg-indigo-600 px-4 py-2 text-white"
                >
                  Renew Now
                </a>
              )}
            </div>
          )}

          {/* Messages */}
          {actionMessage && (
            <div className="mb-4 rounded bg-green-50 p-3 text-green-700">
              {actionMessage}
            </div>
          )}
          {actionError && (
            <div className="mb-4 rounded bg-red-50 p-3 text-red-700">
              {actionError}
            </div>
          )}

          {/* Plans */}
          <div id="plans" className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan: SubscriptionPlan) => {
              const isCurrent =
                current?.plan?.id === plan.id &&
                current?.is_currently_active;

              return (
                <Card key={plan.id}>
                  <div className="flex flex-col h-full">
                    <h2 className="text-lg font-bold">{plan.name}</h2>
                    <p className="text-sm text-slate-500">
                      {plan.description}
                    </p>

                    <div className="my-3 text-xl font-bold text-indigo-600">
                      {plan.currency} {plan.price}
                    </div>

                    <p className="text-sm">
                      Max listings: {plan.max_listings}
                    </p>

                    <div className="mt-auto">
                      {!loggedIn ? (
                        <Link to="/login">
                          <Button className="w-full">
                            Login to Subscribe
                          </Button>
                        </Link>
                      ) : isCurrent ? (
                        <Button disabled className="w-full bg-green-600">
                          Current Plan
                        </Button>
                      ) : isPending ? (
                        <Button disabled className="w-full bg-yellow-500">
                          Pending Approval
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-indigo-600"
                          onClick={() => {
                            setActionMessage(null);
                            setActionError(null);
                            subscribeMutation.mutate(plan.id);
                          }}
                        >
                          {subscribeMutation.isPending
                            ? "Processing..."
                            : isExpired
                            ? "Renew Plan"
                            : "Choose Plan"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}