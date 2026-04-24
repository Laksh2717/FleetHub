export default function PageLoader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="h-10 w-10 border-4 border-white/20 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-gray-400 text-md">{text}</p>
    </div>
  );
}
