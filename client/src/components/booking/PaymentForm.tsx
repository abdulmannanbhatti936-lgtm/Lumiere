import { useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Magnetic from '@/components/motion/Magnetic';

interface PaymentFormProps {
  onSuccess: () => void;
}

export default function PaymentForm({ onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    setIsProcessing(false);

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed. Please try again.');
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && <p className="text-sm font-medium text-destructive">{errorMessage}</p>}
      <Magnetic className="block w-full">
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isProcessing ? 'Processing payment...' : 'Pay Now'}
        </button>
      </Magnetic>
    </form>
  );
}
