import Modal from "./Modal";
import Button from "../ui/Button";

export default function LoginRoleSelectModal({ isOpen, onClose, onSelect }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-3xl font-bold text-orange-500 mb-2">
        Login to FleetHub
      </h2>

      <p className="text-gray-400 text-sm mb-8">
        Select your account type to continue
      </p>

      <div className="flex flex-col gap-4">
        <Button
          className="w-full py-3 text-base font-semibold"
          onClick={() => onSelect("shipper")}
        >
          Login as Shipper
        </Button>

        <Button
          className="w-full py-3 text-base font-semibold"
          onClick={() => onSelect("carrier")}
        >
          Login as Carrier
        </Button>
      </div>
    </Modal>
  );
}
