import { useNavigate } from "react-router-dom";

export default function ForCarriers() {
  const navigate = useNavigate();
  return (
    <section className="bg-zinc-950 py-24">
      <div className="mx-auto max-w-7xl px-6 grid gap-16 lg:grid-cols-2 items-center">
        {/* Left mock */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6 md:p-8 min-h-[260px]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl md:text-2xl text-white font-semibold">Available Loads</h4>
            <div className="ml-4 flex-shrink-0 rounded-full bg-emerald-600/10 text-emerald-300 px-3 py-1 text-sm font-semibold">
              12 new
            </div>
          </div>

          {[
            {
              route: "Jaipur → Delhi",
              weight: "25 Tons Grain",
              amount: "₹1,85,000",
            },
            {
              route: "Nagpur → Hyderabad",
              weight: "15 Tons Cement",
              amount: "₹85,000",
            },
            {
              route: "Surat → Mumbai",
              weight: "20 Tons Steel Rods",
              amount: "₹1,20,000",
            },
          ].map((load, i) => (
            <div
              key={i}
              className="mb-3 rounded-lg border border-white/10 bg-black/40 p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-base md:text-lg text-white font-semibold">{load.route}</p>
                <p className="text-sm text-gray-400 mt-1">{load.weight}</p>
              </div>

              <div className="ml-4 flex-shrink-0 text-orange-400 font-semibold">{load.amount}</div>
            </div>
          ))}
        </div>

        {/* Right */}
        <div>
          <p className="text-sm font-semibold tracking-widest text-orange-500">
            FOR CARRIERS
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white">
            Built for <span className="text-orange-500">Carriers</span>
          </h2>

          <p className="mt-6 text-gray-400">
            Keep your trucks loaded and your business growing. Discover loads,
            bid competitively, and get paid on time.
          </p>

          <ul className="mt-8 space-y-4 text-gray-300">
            <li>✔ Discover open shipments instantly</li>
            <li>✔ Bid on loads that match your fleet</li>
            <li>✔ Track active deliveries</li>
            <li>✔ Faster payments with full visibility</li>
          </ul>

          <button className="mt-10 rounded-md bg-orange-500 px-8 py-4 text-lg font-semibold text-white hover:bg-orange-600/90 transition cursor-pointer" onClick={() => navigate("/register?role=carrier")}>
            Start as Carrier →
          </button>
        </div>
      </div>
    </section>
  );
}
