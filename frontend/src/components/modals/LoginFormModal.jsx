
import Modal from "./Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

export default function LoginFormModal({
  isOpen,
  onClose,
  role,
  onSubmit,
  submitting,
  onSwitchRole,
  form,
  onChange,
  errors,
  showPassword = false,
  onTogglePasswordVisibility,
}) {

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-3xl font-bold text-orange-500 mb-2">
        Login as {role === "carrier" ? "Carrier" : "Shipper"}
      </h2>

      <p className="text-gray-400 text-sm mb-5">
        Enter your credentials to continue
      </p>

      <form
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <Input
          name="emailOrGst"
          type="text"
          placeholder="Enter your email or GST number"
          value={form.emailOrGst}
          onChange={onChange}
          autoComplete="username"
          error={errors?.emailOrGst}
          required
        />
        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
            error={errors?.password}
            required
          />
          <button
            type="button"
            onClick={onTogglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
          </button>
        </div>
        <Button
          type="submit"
          loading={submitting}
          disabled={submitting}
          className="w-full py-3 text-base font-semibold mt-1"
        >
          {submitting ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="my-4 border-t border-white/10" />

      <p className="text-sm text-center text-gray-400">
        {role === "carrier" ? "Not a carrier?" : "Not a shipper?"}{" "}
        <button
          onClick={onSwitchRole}
          className="text-orange-500 hover:underline font-medium"
        >
          Login as {role === "carrier" ? "shipper" : "carrier"}
        </button>
      </p>
    </Modal>
  );
}
