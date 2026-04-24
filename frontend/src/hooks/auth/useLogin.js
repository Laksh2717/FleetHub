import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { loginUser } from "../../services/auth/auth.service";
import { fetchAndStoreUser } from "../../utils/authUtils";
import { validateLoginForm } from "../../utils/validations/loginForm";

const initialFormState = {
  emailOrGst: "",
  password: "",
};

export default function useLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleParam = params.get("role");
  const role = roleParam === "carrier" ? "carrier" : "shipper";
  const switchRole = role === "shipper" ? "carrier" : "shipper";

  const [step, setStep] = useState(roleParam ? "loginForm" : "roleSelection");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  // Validate role parameter
  useEffect(() => {
    if (roleParam && roleParam !== "shipper" && roleParam !== "carrier") {
      navigate("/404");
    }
  }, [roleParam, navigate]);

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async () => {
      try {
        // Fetch and store user data after successful login
        await fetchAndStoreUser();
        
        toast.success("Login successful");
        
        // Navigate to appropriate dashboard
        const dashboardPath = role === "shipper" 
          ? "/shipper/dashboard" 
          : "/carrier/dashboard";
        navigate(dashboardPath);
      } catch (error) {
        console.error("Error fetching user after login:", error);
        toast.error("Login successful but failed to load user data. Please refresh.");
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || "Login failed";
      toast.error(msg);
    },
  });

  const submitting = loginMutation.isPending;

  const handleRoleSelect = (selectedRole) => {
    navigate(`/login?role=${selectedRole}`);
    setStep("loginForm");
    setForm(initialFormState);
    setErrors({});
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSwitchRole = () => {
    navigate(`/login?role=${switchRole}`);
    setForm(initialFormState);
    setErrors({});
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newErrors = validateLoginForm(form);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    loginMutation.mutate({
      emailOrGSTNumber: form.emailOrGst,
      password: form.password,
      role: role.toUpperCase(),
    });
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !submitting) {
      navigate("/");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return {
    role,
    switchRole,
    step,
    showPassword,
    form,
    errors,
    submitting,
    handleRoleSelect,
    handleChange,
    handleSwitchRole,
    handleSubmit,
    handleBackdropClick,
    togglePasswordVisibility,
  };
}