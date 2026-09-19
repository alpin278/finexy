import type { Wallet } from '../../types/finance';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function DeleteWalletDialog({ wallet, onCancel, onConfirm }: { wallet?: Wallet | null; onCancel: () => void; onConfirm: () => void }) {
  return <Modal isOpen={Boolean(wallet)} onClose={onCancel} title={wallet ? `Archive “${wallet.name}”?` : 'Archive wallet?'} description="Archived wallets are removed from the active list without changing transaction records." maxWidth="sm" footer={<><Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button><Button variant="primary" size="sm" className="bg-danger hover:bg-danger/90" onClick={onConfirm}>Archive Wallet</Button></>}><p className="text-sm leading-relaxed text-secondary">This does not mutate Transactions; their persisted ledger records remain unchanged.</p></Modal>;
}
