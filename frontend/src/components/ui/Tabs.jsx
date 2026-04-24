export default function Tabs({
  tabs,
  activeTab,
  onChange,
}) {
  return (
    <div className="flex gap-4 mb-2 pb-2 border-b border-white/10">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-6 py-3 font-semibold transition cursor-pointer ${
            activeTab === tab.value
              ? "border-b-2 border-orange-500 text-orange-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
