import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { toast } from 'react-hot-toast';

interface CreditsAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  subscriptionTier: string;
  currentGymCredits: number | "unlimited";
  currentIntervalCredits: number;
  onCreditsUpdated: () => void;
}

export default function CreditsAdjustmentModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  subscriptionTier,
  currentGymCredits,
  currentIntervalCredits,
  onCreditsUpdated
}: CreditsAdjustmentModalProps) {
  const [gymCredits, setGymCredits] = useState<number | "unlimited">(currentGymCredits);
  const [intervalCredits, setIntervalCredits] = useState<number>(currentIntervalCredits);
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setGymCredits(currentGymCredits);
      setIntervalCredits(currentIntervalCredits);
    }
  }, [isOpen, currentGymCredits, currentIntervalCredits]);

  const applyPlanDefaults = () => {
    switch (subscriptionTier.toLowerCase()) {
      case 'basic':
        setGymCredits(8);
        setIntervalCredits(0);
        break;
      case 'gold':
        setGymCredits(8);
        setIntervalCredits(4);
        break;
      case 'premium':
        setGymCredits("unlimited");
        setIntervalCredits(4);
        break;
      default:
        setGymCredits(currentGymCredits);
        setIntervalCredits(currentIntervalCredits);
    }
    setReason(`Credit adjustment based on ${subscriptionTier} plan`);
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/credits`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gymCredits,
          intervalCredits,
          reason
        }),
      });

      if (!response.ok) throw new Error('Failed to adjust credits');
      
      toast.success('Credits adjusted successfully');
      onCreditsUpdated();
      onClose();
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast.error('Failed to adjust credits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">
              Adjust Credits for {clientName}
            </Dialog.Title>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Subscription Plan: <span className="font-medium">{subscriptionTier}</span>
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={applyPlanDefaults}
              className="w-full mb-4"
            >
              Apply Plan Defaults
            </Button>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <Label htmlFor="gymCredits">Gym Access Credits</Label>
              <div className="flex items-center mt-1">
                {gymCredits === "unlimited" ? (
                  <>
                    <Input 
                      type="text" 
                      id="gymCredits" 
                      value="Unlimited" 
                      disabled 
                      className="flex-1 mr-2"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setGymCredits(8)}
                      size="sm"
                    >
                      Set Limited
                    </Button>
                  </>
                ) : (
                  <>
                    <Input 
                      type="number" 
                      id="gymCredits" 
                      value={gymCredits} 
                      onChange={(e) => setGymCredits(Number(e.target.value))}
                      className="flex-1 mr-2"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setGymCredits("unlimited")}
                      size="sm"
                    >
                      Set Unlimited
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="intervalCredits">Interval Session Credits</Label>
              <Input 
                type="number" 
                id="intervalCredits" 
                value={intervalCredits} 
                onChange={(e) => setIntervalCredits(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason for Adjustment</Label>
              <Input 
                type="text" 
                id="reason" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you adjusting credits?"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}