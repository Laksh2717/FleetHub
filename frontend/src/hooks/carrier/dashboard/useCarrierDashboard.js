import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getDashboard,
  getEarningsTrendChart,
  getShipmentStatusChart,
} from "../../../services/carrier/dashboard.service";

export function useCarrierDashboard() {
  const [shipmentRange, setShipmentRange] = useState(14);
  const [earningsYear, setEarningsYear] = useState(new Date().getFullYear());

  const {
    data: dashboardData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["carrierDashboard"],
    queryFn: async () => {
      const res = await getDashboard();
      const nextYear = res?.data?.graphs?.earningsTrend?.selectedYear;
      if (typeof nextYear === "number") {
        setEarningsYear(nextYear);
      }
      return res?.data;
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch dashboard data";
      toast.error(msg);
    },
  });

  const {
    data: statusChartData,
    isLoading: statusLoading,
  } = useQuery({
    queryKey: ["carrierStatusChart", shipmentRange],
    queryFn: async () => {
      const res = await getShipmentStatusChart(shipmentRange);
      return res?.data?.shipmentStatusDistribution;
    },
    enabled: !!dashboardData,
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch chart data";
      toast.error(msg);
    },
  });

  const {
    data: earningsTrendData,
    isLoading: earningsLoading,
  } = useQuery({
    queryKey: ["carrierEarningsTrend", earningsYear],
    queryFn: async () => {
      const res = await getEarningsTrendChart(earningsYear);
      return res?.data?.earningsTrend;
    },
    enabled: !!dashboardData,
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch earnings trend";
      toast.error(msg);
    },
  });

  const handleRangeChange = (event) => {
    const nextRange = Number(event.target.value) || 14;
    setShipmentRange(nextRange);
  };

  const handleYearChange = (event) => {
    const nextYear = Number(event.target.value) || new Date().getFullYear();
    setEarningsYear(nextYear);
  };

  const { kpis = {}, graphs = {}, attentionRequired = [] } = dashboardData || {};
  const earningsTrend = earningsTrendData || graphs.earningsTrend || {};
  const shipmentStatusDistribution = statusChartData || graphs.shipmentStatusDistribution || {};
  const availableYears = earningsTrend.availableYears || [earningsYear];

  return {
    // Data
    dashboardData,
    kpis,
    attentionRequired,
    earningsTrend,
    shipmentStatusDistribution,
    availableYears,

    // State
    shipmentRange,
    earningsYear,

    // Loading states
    loading,
    statusLoading,
    earningsLoading,

    // Error
    error,

    // Actions
    handleRangeChange,
    handleYearChange,
    refetch,
  };
}
