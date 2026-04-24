import { FaHandshake, FaBoxOpen, FaMoneyBillWave, FaRegFileAlt } from "react-icons/fa";

export default function PlatformFeatures() {
  return (
    <section className="bg-zinc-950 py-24">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-sm font-semibold tracking-widest text-orange-500">
          PLATFORM FEATURES
        </p>

        <h2 className="mt-4 text-4xl md:text-5xl font-bold text-white">
          Everything You Need in <span className="text-orange-500">One Platform</span>
        </h2>

        <p className="mt-6 max-w-2xl mx-auto text-gray-400">
          Built for modern Indian logistics operations. Streamline your freight
          management with powerful tools designed for efficiency.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Direct Shipper–Carrier Bidding",
              desc: "Connect directly with verified carriers and negotiate rates without brokers taking a cut.",
              icon: FaHandshake,
            },
            {
              title: "End-to-End Shipment Lifecycle",
              desc: "From booking to delivery, manage every step of your freight journey in one dashboard.",
              icon: FaBoxOpen,
            },
            {
              title: "Transparent Pricing & Payments",
              desc: "Know exactly what you pay and get paid. No hidden fees, no surprises.",
              icon: FaMoneyBillWave,
            },
            {
              title: "POD & Delivery Confirmation",
              desc: "Digital proof of delivery with real-time confirmation and document management.",
              icon: FaRegFileAlt,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-zinc-900/40 p-6 text-left hover:border-orange-500 transition-all duration-200"
            >
              <div className="mb-4 w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center">
                {
                  (() => {
                    const Icon = item.icon;
                    return <Icon className="w-6 h-6 text-orange-400" />;
                  })()
                }
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
