import { capitalizeWords } from "../../utils/formatters";

export default function Badge({ text, variant = "neutral", size = "md" }) {
  const variants = {
    success: "bg-green-600/30 text-green-300",
    warning: "bg-yellow-500/30 text-yellow-300",
    danger: "bg-red-600/30 text-red-300",
    info: "bg-blue-600/30 text-blue-300",
    neutral: "bg-gray-500/30 text-gray-300",
    purple: "bg-purple-600/30 text-purple-300",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs rounded-md",
    md: "px-4 py-1.5 text-sm rounded-lg",
    lg: "px-5 py-2 text-lg rounded-lg",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold whitespace-nowrap
        ${variants[variant]}
        ${sizes[size]}
      `}
    >
      {capitalizeWords(text)}
    </span>
  );
}
