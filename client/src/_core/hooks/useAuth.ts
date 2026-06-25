import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    loading: isLoading,
  };
}
