import Button from "../ui/Button";
import Modal from "./Modal";

export default function ConfirmationModal({
  isOpen,
  onClose,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-gray-300 mb-6 text-left">{message}</div>
      <div className="flex gap-3 justify-end pt-2">
        <Button onClick={onClose} disabled={loading} variant="ghost">
          {cancelText}
        </Button>
        <Button onClick={onConfirm} disabled={loading}>
          {loading ? "Processing..." : confirmText}
        </Button>
      </div>
    </Modal>
  );
}
