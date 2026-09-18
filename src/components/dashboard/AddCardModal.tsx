import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CreditCard } from 'lucide-react';

export interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard?: (card: { number: string; expiry: string; cvv: string; holder: string }) => void;
}

export function AddCardModal({ isOpen, onClose, onAddCard }: AddCardModalProps) {
  const [holder, setHolder] = useState('SAJIBUR RAHMAN');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    onAddCard?.({ number, expiry, cvv, holder });
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Card"
      description="Link a new debit or credit payment card to your Finexy wallet"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
          >
            {isSuccess ? 'Adding...' : 'Add Card'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-primary mb-1">
            Cardholder Name
          </label>
          <Input
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            placeholder="Name on card"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-primary mb-1">
            Card Number
          </label>
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="•••• •••• •••• ••••"
            maxLength={19}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-primary mb-1">
              Expiry Date
            </label>
            <Input
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              maxLength={5}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary mb-1">
              CVV
            </label>
            <Input
              type="password"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="•••"
              maxLength={4}
              required
            />
          </div>
        </div>

        {isSuccess && (
          <div className="p-3 bg-success/15 border border-success/30 rounded-xl text-center text-xs font-semibold text-success animate-in fade-in-50">
            Card connected successfully!
          </div>
        )}
      </form>
    </Modal>
  );
}

export default AddCardModal;
