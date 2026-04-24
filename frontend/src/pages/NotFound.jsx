import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-6xl font-bold text-orange-500">404</h1>
      <p className="mt-4 text-lg">Page not found</p>

      <button
        onClick={() => navigate("/")}
        className="mt-6 px-6 py-3 bg-orange-500 rounded-md font-semibold cursor-pointer"
      >
        Go to Home
      </button>
    </div>
  );
}
