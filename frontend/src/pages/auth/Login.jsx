import useLogin from "../../hooks/auth/useLogin";
import bgImage from "../../assets/hero-bg.png";
import LoginRoleSelectModal from "../../components/modals/LoginRoleSelectModal";
import LoginFormModal from "../../components/modals/LoginFormModal";

export default function Login() {
  const {
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
  } = useLogin();

  return (
    <section className="relative min-h-screen w-full">
      {/* Background */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/70" />

      {/* Modal Overlay */}
      <LoginRoleSelectModal
        isOpen={step === "roleSelection"}
        onClose={handleBackdropClick}
        onSelect={handleRoleSelect}
        submitting={submitting}
      />
      <LoginFormModal
        isOpen={step === "loginForm"}
        onClose={handleBackdropClick}
        role={role}
        switchRole={switchRole}
        submitting={submitting}
        form={form}
        errors={errors}
        showPassword={showPassword}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onSwitchRole={handleSwitchRole}
        onTogglePasswordVisibility={togglePasswordVisibility}
      />
    </section>
  );
}
