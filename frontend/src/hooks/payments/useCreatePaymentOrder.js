import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createPaymentOrder } from "../../services/payments/payment.service";

export function useCreatePaymentOrder({ onSuccess, onError }) {
  const createPaymentMutation = useMutation({
    mutationFn: createPaymentOrder,
    onSuccess: (data) => {
      const { orderId, key, amount } = data;
      console.log('Razorpay key from backend:', key);

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key,
          order_id: orderId,
          amount,
          currency: "INR",
          name: "FleetHub",
          description: `Payment for Shipment`,
          handler: async () => {
            try {
              // Webhook will handle the actual verification
              if (onSuccess) {
                onSuccess();
              }
            } catch (error) {
              toast.error("Payment verification failed");
              if (onError) {
                onError(error);
              }
            }
          },
          modal: {
            ondismiss: () => {
              toast.error("Payment cancelled");
            }
          },
          prefill: {
            name: "FleetHub",
            email: "support@fleethub.com",
          },
          theme: {
            color: "#ea580c",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        toast.error("Failed to load Razorpay");
        if (onError) {
          onError(new Error("Failed to load Razorpay"));
        }
      };
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || "Failed to initiate payment";
      toast.error(msg);
      if (onError) {
        onError(error);
      }
    },
  });

  return {
    initiatePayment: createPaymentMutation.mutate,
    isProcessing: createPaymentMutation.isPending,
    error: createPaymentMutation.error,
  };
}
