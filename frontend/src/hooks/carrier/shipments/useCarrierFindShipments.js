import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { findShipments } from "../../../services/carrier/shipments.service";

export const useCarrierFindShipments = (page = 1, limit = 12, filters = {}) => {
  const { data = {}, isLoading, error, refetch } = useQuery({
    queryKey: ["findShipments", page, limit, filters],
    queryFn: async () => {
      const res = await findShipments(page, limit, filters);
      return res?.data || {};
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || "Failed to fetch shipments";
      toast.error(msg);
    },
  });

  return {
    shipments: data.shipments || [],
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
    hasNextPage: data.hasNextPage,
    hasPrevPage: data.hasPrevPage,
    isLoading,
    error,
    refetch,
  };
};
