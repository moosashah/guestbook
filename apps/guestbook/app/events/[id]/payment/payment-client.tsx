'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loadStripe } from '@stripe/stripe-js';

interface Event {
  id: string;
  name: string;
  description?: string;
  package: 'basic' | 'premium' | 'deluxe';
  payment_status: string;
}

interface PaymentClientProps {
  event: Event;
}

export default function PaymentClient({ event }: PaymentClientProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<
    'basic' | 'premium' | 'deluxe'
  >(event.package);

  const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

  if (!STRIPE_PUBLIC_KEY) {
    throw new Error('STRIPE_PUBLIC_KEY is not set');
  }

  const packagePrices = {
    basic: 19,
    premium: 39,
    deluxe: 79,
  };

  const packageFeatures = {
    basic: {
      messages: 25,
      features: ['25 messages', 'Basic editing', 'QR code sharing'],
    },
    premium: {
      messages: 100,
      features: [
        '100 messages',
        'Advanced editing',
        'Custom branding',
        'QR code sharing',
      ],
    },
    deluxe: {
      messages: 500,
      features: [
        '500 messages',
        'Premium editing',
        'Custom branding',
        'Priority support',
        'QR code sharing',
      ],
    },
  };

  const price = packagePrices[selectedPackage];

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Create checkout session with the event ID
      const checkoutData = {
        package: selectedPackage,
        eventId: event.id,
      };

      console.log('Creating checkout session...');
      const checkoutResponse = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await checkoutResponse.json();

      // Redirect to Stripe Checkout
      const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(
        `Failed to process payment. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='container mx-auto py-8 px-4 max-w-4xl'>
      <div className='mb-6'>
        <Link
          href={`/events/${event.id}`}
          className='inline-flex items-center text-sm text-primary/60 hover:text-primary mb-4'
        >
          <ArrowLeft className='mr-1 size-4' />
          Back to Event Details
        </Link>
        <h1 className='text-3xl font-bold'>Complete Your Purchase</h1>
        <p className='text-muted-foreground mt-2'>
          Complete payment to activate your event: {event.name}
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Event Summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h3 className='font-medium text-lg'>{event.name}</h3>
                {event.description && (
                  <p className='text-muted-foreground mt-1'>
                    {event.description}
                  </p>
                )}
              </div>

              <div className='border-t pt-4'>
                <h4 className='font-medium mb-4'>Choose Your Package</h4>
                <div className='space-y-3'>
                  {Object.entries(packageFeatures).map(([pkg, details]) => (
                    <div
                      key={pkg}
                      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                        selectedPackage === pkg
                          ? 'border-primary bg-primary/5 hover:bg-primary/10'
                          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() =>
                        setSelectedPackage(
                          pkg as 'basic' | 'premium' | 'deluxe'
                        )
                      }
                    >
                      <div className='flex items-center space-x-3'>
                        <div className='flex-1'>
                          <div className='flex items-center justify-between'>
                            <span className='text-lg font-medium capitalize'>
                              {pkg}
                            </span>
                            <span className='text-xl font-bold'>
                              $
                              {packagePrices[pkg as keyof typeof packagePrices]}
                            </span>
                          </div>
                          <ul className='text-sm text-muted-foreground mt-2 space-y-1'>
                            {details.features.map(feature => (
                              <li key={feature} className='flex items-start'>
                                <Check className='mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between'>
                <span>
                  {selectedPackage.charAt(0).toUpperCase() +
                    selectedPackage.slice(1)}{' '}
                  Package
                </span>
                <span>${price}.00</span>
              </div>
              <div className='flex justify-between text-sm text-muted-foreground'>
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className='border-t pt-4 flex justify-between font-medium text-lg'>
                <span>Total</span>
                <span>${price}.00</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handlePayment}
                className='w-full'
                disabled={isProcessing}
                size='lg'
              >
                {isProcessing ? 'Processing...' : `Pay $${price} Now`}
              </Button>
            </CardFooter>
          </Card>

          <div className='mt-6 text-center text-sm text-muted-foreground'>
            <p>Secure payment powered by Stripe</p>
            <p className='mt-1'>
              Your event will be activated immediately after payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
