import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { registerUser } from "../../services/auth/auth.service";
import { validateRegisterForm } from "../../utils/validations/registerForm";

const initialFormState = {
	companyName: "",
	ownerName: "",
	email: "",
	phone: "",
	gst: "",
	street: "",
	city: "",
	state: "",
	pincode: "",
	password: "",
	confirmPassword: "",
};

export default function useRegister() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const roleParam = params.get("role");
	const role = roleParam === "carrier" ? "carrier" : "shipper";
	const switchRole = role === "shipper" ? "carrier" : "shipper";

	useEffect(() => {
		if (roleParam && roleParam !== "shipper" && roleParam !== "carrier") {
			navigate("/404");
		}
	}, [roleParam, navigate]);

	const [form, setForm] = useState(initialFormState);
	const [errors, setErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const registerMutation = useMutation({
		mutationFn: registerUser,
		onSuccess: () => {
			toast.success("Registered successfully. Please login.");
			navigate(`/login?role=${role}`);
		},
		onError: (error) => {
			const msg = error?.response?.data?.message || error.message || "Request failed";
			toast.error(msg);
		},
	});

	const submitting = registerMutation.isPending;

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (event) => {
		event.preventDefault();

		const newErrors = validateRegisterForm(form);

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setErrors({});

		const payload = {
			ownerName: form.ownerName,
			companyName: form.companyName,
			email: form.email,
			phone: form.phone,
			password: form.password,
			street: form.street,
			city: form.city,
			state: form.state,
			pincode: form.pincode,
			gstNumber: form.gst,
			role: role.toUpperCase(),
		};

		registerMutation.mutate(payload);
	};

	const handleSwitchRole = () => {
		if (submitting) return;
		navigate(`/register?role=${switchRole}`);
	};

	const handleGoToLogin = () => {
		if (!submitting) {
			navigate(`/login?role=${role}`);
		}
	};

	const handleGoHome = () => {
		if (!submitting) {
			navigate("/");
		}
	};

	const togglePasswordVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	const toggleConfirmPasswordVisibility = () => {
		setShowConfirmPassword((prev) => !prev);
	};

	return {
		role,
		switchRole,
		form,
		errors,
		showPassword,
		showConfirmPassword,
		submitting,
		handleChange,
		handleSubmit,
		handleSwitchRole,
		handleGoToLogin,
		handleGoHome,
		togglePasswordVisibility,
		toggleConfirmPasswordVisibility,
	};
}
