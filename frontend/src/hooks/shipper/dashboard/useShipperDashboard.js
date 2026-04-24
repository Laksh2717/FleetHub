import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getDashboard,
  getShipmentCostTrendChart,
  getShipmentStatusChart,
} from "../../../services/shipper/dashboard.service";

export function useShipperDashboard() {
  const [shipmentRange, setShipmentRange] = useState(14);
  const [costYear, setCostYear] = useState(new Date().getFullYear());

  const {
    data: dashboardData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["shipperDashboard"],
    queryFn: async () => {
      const res = await getDashboard();
      const nextYear = res?.data?.graphs?.shipmentCostTrend?.selectedYear;
      if (typeof nextYear === "number") {
        setCostYear(nextYear);
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
    queryKey: ["shipperStatusChart", shipmentRange],
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
    data: costTrendData,
    isLoading: costLoading,
  } = useQuery({
    queryKey: ["shipperCostTrend", costYear],
    queryFn: async () => {
      const res = await getShipmentCostTrendChart(costYear);
      return res?.data?.shipmentCostTrend;
    },
    enabled: !!dashboardData,
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to fetch cost trend";
      toast.error(msg);
    },
  });

  const handleRangeChange = (event) => {
    const nextRange = Number(event.target.value) || 14;
    setShipmentRange(nextRange);
  };

  const handleYearChange = (event) => {
    const nextYear = Number(event.target.value) || new Date().getFullYear();
    setCostYear(nextYear);
  };

  const { graphs = {}, kpis, attentionRequired } = dashboardData || {};
  const shipmentCostTrend = costTrendData || graphs.shipmentCostTrend || {};
  const shipmentStatusDistribution = statusChartData || graphs.shipmentStatusDistribution || {};
  const availableYears = shipmentCostTrend.availableYears || [costYear];

  return {
    // Data
    dashboardData,
    kpis,
    attentionRequired,
    shipmentCostTrend,
    shipmentStatusDistribution,
    availableYears,
    
    // State
    shipmentRange,
    costYear,
    
    // Loading states
    loading,
    statusLoading,
    costLoading,
    
    // Error
    error,
    
    // Actions
    handleRangeChange,
    handleYearChange,
    refetch,
  };
}
