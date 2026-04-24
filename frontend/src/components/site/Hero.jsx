import heroBg from "../../assets/hero-bg.png";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen w-full">
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Background Image */}
      <img
        src={heroBg}
        alt="FleetHub logistics background"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-black/65" />

      {/* Bottom Fade Out Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-20">
        <div className="max-w-[680px]">
          {/* Heading */}
          <h1
            className="text-5xl font-bold tracking-tight leading-snug text-white md:text-7xl"
          >
            Freight Bidding,
            <br />
            <span className="text-orange-500">Without Middlemen</span>
          </h1>

          {/* Description */}
          <p 
            className="mt-6 max-w-2xl text-lg text-gray-300 md:text-xl"
            style={{
              animation: "slideUpFade 0.8s ease-out 0.2s forwards",
              opacity: 0
            }}
          >
            FleetHub connects shippers and carriers through a transparent freight
            marketplace with real-time bidding, shipment tracking, and payment
            visibility.
          </p>

          <p 
            className="mt-4 max-w-2xl text-base text-gray-400"
            style={{
              animation: "slideUpFade 0.8s ease-out 0.4s forwards",
              opacity: 0
            }}
          >
            Create shipments, receive competitive bids, assign carriers, track
            deliveries, manage PODs, and settle payments — all in one platform.
          </p>

          {/* CTA Buttons */}
          <div 
            className="mt-8 flex flex-wrap gap-4"
            style={{
              animation: "slideUpFade 0.8s ease-out 0.6s forwards",
              opacity: 0
            }}
          >
            <button className="rounded-md bg-orange-500 px-8 py-4 text-lg font-semibold text-white cursor-pointer hover:bg-orange-600/90 transition" onClick={() => navigate("/register?role=shipper")}>
              Register as Shipper
            </button>

            <button className="rounded-md border border-gray-400 px-8 py-4 text-lg font-semibold text-white cursor-pointer hover:border-white hover:bg-white/10 transition" onClick={() => navigate("/register?role=carrier")}>
              Register as Carrier
            </button>
          </div>

          {/* Trust Points */}
          <div 
            className="mt-10 flex flex-wrap gap-6 text-sm text-gray-400"
            style={{
              animation: "slideUpFade 0.8s ease-out 0.8s forwards",
              opacity: 0
            }}
          >
            <span>✔ No Broker Fees</span>
            <span>✔ Verified Carriers</span>
            <span>✔ Secure Payments</span>
          </div>
        </div>
      </div>
    </section>
  );
}
