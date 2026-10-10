import { Navigate, Outlet, useLocation } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accessApi } from "@/api/access";
import { ApiError } from "@/api/client";
import { authApi } from "@/api/auth";
import { healthApi } from "@/api/health";
import { queryKeys } from "@/lib/queryKeys";
import { BootstrapPendingPage } from "@/components/BootstrapPendingPage";
import { PaperclipLoading } from "@/components/AnimatedPaperclipIcon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

function retryAppRead(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 1;
}

function NoBoardAccessPage() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <Card className="block p-6">
        <h1 className="text-xl font-semibold">No organization access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This account is signed in, but it does not have an active organization membership or instance-admin access on
          this Paperclip instance.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use an organization invite or sign in with an account that already belongs to this org.
        </p>
      </Card>
    </div>
  );
}

export function CloudAccessGate({ allowMembershipRequest = false }: { allowMembershipRequest?: boolean } = {}) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const healthQuery = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => healthApi.get(),
    retry: retryAppRead,
    refetchInterval: (query) => {
      const data = query.state.data as
        | { deploymentMode?: "local_trusted" | "authenticated"; bootstrapStatus?: "ready" | "bootstrap_pending" }
        | undefined;
      return data?.deploymentMode === "authenticated" && data.bootstrapStatus === "bootstrap_pending"
        ? 2000
        : false;
    },
    refetchIntervalInBackground: true,
  });

  const isAuthenticatedMode = healthQuery.data?.deploymentMode === "authenticated";
  const isBootstrapPending = isAuthenticatedMode && healthQuery.data?.bootstrapStatus === "bootstrap_pending";
  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    enabled: isAuthenticatedMode,
    retry: retryAppRead,
  });

  const boardAccessQuery = useQuery({
    queryKey: queryKeys.access.currentBoardAccess,
    queryFn: () => accessApi.getCurrentBoardAccess(),
    enabled: isAuthenticatedMode && !isBootstrapPending && !!sessionQuery.data,
    retry: retryAppRead,
  });
  const claimMutation = useMutation({
    mutationFn: () => accessApi.claimBootstrapAdmin(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      await queryClient.invalidateQueries({ queryKey: queryKeys.health });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.stats });
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.currentBoardAccess });
    },
  });

  if (
    healthQuery.isLoading ||
    (isAuthenticatedMode && sessionQuery.isLoading) ||
    (isAuthenticatedMode && !isBootstrapPending && !!sessionQuery.data && boardAccessQuery.isLoading)
  ) {
    return <PaperclipLoading />;
  }

  const loadError = healthQuery.error || (isAuthenticatedMode && sessionQuery.error) || boardAccessQuery.error;
  if (loadError) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4 py-10 text-sm" role="alert">
        <p className="text-destructive">{loadError instanceof Error ? loadError.message : "Failed to load app state"}</p>
        <Button variant="outline" disabled={healthQuery.isFetching || sessionQuery.isFetching || boardAccessQuery.isFetching}
          onClick={() => {
            if (healthQuery.error) void healthQuery.refetch();
            else if (sessionQuery.error) void sessionQuery.refetch();
            else void boardAccessQuery.refetch();
          }}>
          <RefreshCw className="mr-2 h-4 w-4" />Try again
        </Button>
      </div>
    );
  }

  if (isBootstrapPending) {
    const health = healthQuery.data;
    if (!health) {
      return <PaperclipLoading />;
    }
    const claimError = claimMutation.error instanceof ApiError
      ? { status: claimMutation.error.status, message: claimMutation.error.message }
      : claimMutation.error instanceof Error
        ? { message: claimMutation.error.message }
        : null;
    return (
      <BootstrapPendingPage
        claimAvailable={health.deploymentExposure === "private"}
        hasActiveInvite={health.bootstrapInviteActive}
        session={sessionQuery.data}
        claimState={claimMutation.isSuccess ? "success" : claimMutation.isPending ? "claiming" : "idle"}
        claimError={claimError}
        onClaim={() => claimMutation.mutate()}
      />
    );
  }

  if (isAuthenticatedMode && !sessionQuery.data) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }

  // Private invitation pages may let signed-in nonmembers request access.
  // Their token APIs still enforce membership before granting any authority.
  if (
    !allowMembershipRequest &&
    isAuthenticatedMode &&
    sessionQuery.data &&
    !boardAccessQuery.data?.isInstanceAdmin &&
    (boardAccessQuery.data?.companyIds.length ?? 0) === 0
  ) {
    return <NoBoardAccessPage />;
  }

  return <Outlet />;
}
