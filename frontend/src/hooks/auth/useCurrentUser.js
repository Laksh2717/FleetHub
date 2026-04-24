import { useQuery } from "@tanstack/react-query";
import { fetchAndStoreUser, getStoredUser } from "../../utils/authUtils";

const queryKey = ["currentUser"];

export function useCurrentUser() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    error,
  } = useQuery({
    queryKey,
    queryFn: fetchAndStoreUser,
    initialData: getStoredUser(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to avoid frequent /me calls
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if we have cached data
  });

  const user = data || null;
  const role = user?.role ? String(user.role).toLowerCase() : null;

  return {
    user,
    role,
    isLoading,
    isError,
    refetch,
    error,
  };
}