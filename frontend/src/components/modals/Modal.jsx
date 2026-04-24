import { createPortal } from "react-dom";
import { useEffect } from "react";

export default function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="
          relative
          bg-black/90
          border border-white/20
          rounded-xl
          p-8
          max-w-md
          w-full
          mx-4
          max-h-[90vh]
          overflow-y-auto
          animate-modal-slide-up
        "
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
