import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import useRegister from "../../hooks/auth/useRegister";
import bgImage from "../../assets/hero-bg.png";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function Register() {
  const {
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
  } = useRegister();

  return (
    <section className="relative min-h-screen w-full">
      {/* Background */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-6 pb-16">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div
            onClick={handleGoHome}
            aria-disabled={submitting}
            className={`text-2xl font-extrabold ${submitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`} 
          >
            <span className="text-white">Fleet</span>
            <span className="text-orange-500">Hub</span>
          </div>

          <p className="mt-2 text-gray-400">
            Already have an account?{" "}
            <span
              onClick={handleGoToLogin}
              role="button"
              aria-disabled={submitting}
              className={`text-orange-500 ${submitting ? "opacity-50" : "hover:underline cursor-pointer"}`}
            >
              Login
            </span>
          </p>
        </div>

        {/* Heading */}
        <div className="mt-6">
          <h1 className="text-4xl font-bold text-white">
            Register as {role === "shipper" ? "Shipper" : "Carrier"}
          </h1>
            <p className="mt-2 text-gray-400">
            Not a {role}?{" "}
            <span
              onClick={handleSwitchRole}
              role="button"
              aria-disabled={submitting}
              className={`text-orange-500 ${submitting ? "opacity-50" : "hover:underline cursor-pointer"}`}
            >
              Register as {switchRole}
            </span>
          </p>
        </div>

        {/* Cards */}
        <form
          onSubmit={handleSubmit}
          className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {/* Card 1 – Company Details */}
          <div className="card">
            <h3 className="card-title">Company Details</h3>

            <div className="space-y-3">
              <Input
                name="companyName"
                label={null}
                placeholder="Company Name"
                value={form.companyName}
                onChange={handleChange}
                disabled={submitting}
                error={errors.companyName}
                className="mb-4"
              />

              <Input
                name="ownerName"
                label={null}
                placeholder="Owner Name"
                value={form.ownerName}
                onChange={handleChange}
                disabled={submitting}
                error={errors.ownerName}
                className="mb-4"
              />

              <Input
                name="email"
                label={null}
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                disabled={submitting}
                error={errors.email}
                className="mb-4"
              />

              <Input
                name="phone"
                label={null}
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
                disabled={submitting}
                error={errors.phone}
                className="mb-4"
              />

              <Input
                name="gst"
                label={null}
                placeholder="GST Number"
                value={form.gst}
                onChange={handleChange}
                disabled={submitting}
                error={errors.gst}
                className="mb-4"
              />
            </div>
          </div>

          {/* Card 2 – Address */}
          <div className="card">
            <h3 className="card-title">Address</h3>

            <div className="space-y-3">
              <Input
                name="street"
                label={null}
                placeholder="Street / Area"
                value={form.street}
                onChange={handleChange}
                disabled={submitting}
                error={errors.street}
                className="mb-4"
              />

              <Input
                name="city"
                label={null}
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                disabled={submitting}
                error={errors.city}
                className="mb-4"
              />

              <Input
                name="state"
                label={null}
                placeholder="State"
                value={form.state}
                onChange={handleChange}
                disabled={submitting}
                error={errors.state}
                className="mb-4"
              />

              <Input
                name="pincode"
                label={null}
                placeholder="Pincode"
                value={form.pincode}
                onChange={handleChange}
                disabled={submitting}
                error={errors.pincode}
                className="mb-4"
              />
            </div>
          </div>

          {/* Card 3 – Security */}
          <div className="card">
            <h3 className="card-title">Security</h3>

            <div className="space-y-3">
              <div className="mb-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    label={null}
                    placeholder="Create Password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={submitting}
                    error={errors.password}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    label={null}
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    disabled={submitting}
                    error={errors.confirmPassword}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={submitting}
                disabled={submitting}
                className="mt-2 w-full"
              >
                Register as {role === "shipper" ? "Shipper" : "Carrier"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
