import { useNavigate } from "react-router-dom";

export default function ForShippers() {
  const navigate = useNavigate();
  return (
    <section className="bg-zinc-950 py-24">
      <div className="mx-auto max-w-7xl px-6 grid gap-16 lg:grid-cols-2 items-center">
        {/* Left */}
        <div>
          <p className="text-sm font-semibold tracking-widest text-orange-500">
            FOR SHIPPERS
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white">
            Built for <span className="text-orange-500">Shippers</span>
          </h2>

          <p className="mt-6 text-gray-400">
            Move your freight faster with access to a nationwide network of
            verified carriers. Post loads, receive competitive bids, and manage
            everything from one dashboard.
          </p>

          <ul className="mt-8 space-y-4 text-gray-300">
            <li>✔ Create shipments in minutes</li>
            <li>✔ Receive bids from verified Indian carriers</li>
            <li>✔ Track shipments in real time</li>
            <li>✔ Manage payments & shipment history</li>
          </ul>

          <button className="mt-10 rounded-md bg-orange-500 px-8 py-4 text-lg font-semibold text-white hover:bg-orange-600/90 transition cursor-pointer" onClick={() => navigate("/register?role=shipper")}>
            Start as Shipper →
          </button>
        </div>

        {/* Right mock */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6 md:p-8 min-h-[260px]">
          <h4 className="text-xl md:text-2xl text-white font-semibold mb-4">Active Shipments</h4>

          {[
            {
              route: "Delhi → Mumbai",
              detail: "10 bids received",
              status: "Pending",
              statusClass: "bg-amber-500/10 text-amber-400 border border-amber-600/20",
            },
            {
              route: "Pune → Bengaluru",
              detail: "Near Ankleshwar",
              status: "In Transit",
              statusClass: "bg-sky-600/10 text-sky-300 border border-sky-600/10",
            },
            {
              route: "Ahmedabad → Chennai",
              detail: "Payment pending",
              status: "Delivered",
              statusClass: "bg-green-600/10 text-green-300 border border-green-600/10",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="mb-3 rounded-lg border border-white/10 bg-black/40 p-4 flex items-start justify-between"
            >
              <div>
                <p className="text-base md:text-lg text-white font-semibold">{s.route}</p>
                <p className="text-sm text-gray-400 mt-1">{s.detail}</p>
              </div>

              <div className={`ml-4 flex-shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${s.statusClass}`}>
                {s.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
