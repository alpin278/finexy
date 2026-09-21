import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';

export interface TransferModalProps {
  isOpen: boolean;
  mode: 'transfer' | 'request';
  onClose: () => void;
}

export function TransferModal({ isOpen, mode, onClose }: TransferModalProps) {
  const isTransfer = mode === 'transfer';
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('w-usd');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isTransfer ? 'Transfer Funds' : 'Request Payment'}
      description={
        isTransfer
          ? 'Send funds instantly to any contact or verified bank account'
          : 'Generate a payment request link or bill an existing contact'
      }
      footer={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            leftIcon={<Icon name={isTransfer ? 'arrow-up-right' : 'arrow-down-left'} />}
          >
            {isSuccess ? 'Processing...' : isTransfer ? 'Confirm Transfer' : 'Send Request'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-primary mb-1">
            {isTransfer ? 'Recipient Email or Tag' : 'Payer Email or Phone'}
          </label>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={isTransfer ? 'e.g. alex@example.com' : 'e.g. client@company.com'}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-primary mb-1">
              Amount ($)
            </label>
            <AmountInput
              value={amount}
              onValueChange={setAmount}
              locale="en-US"
              numberFormat="1,234.56"
              maximumFractionDigits={2}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary mb-1">
              Wallet
            </label>
            <Select
              options={[
                { value: 'w-usd', label: 'USD ($22,678)' },
                { value: 'w-eur', label: 'EUR (€18,345)' },
                { value: 'w-gbp', label: 'GBP (£15,000)' },
              ]}
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full h-10"
            />
          </div>
        </div>

        {isSuccess && (
          <div className="p-3 bg-success/15 border border-success/30 rounded-xl text-center text-xs font-semibold text-success animate-in fade-in-50">
            {isTransfer ? 'Transfer initiated successfully!' : 'Request link dispatched!'}
          </div>
        )}
      </form>
    </Modal>
  );
}

export default TransferModal;
