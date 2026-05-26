import { useState, useEffect, useCallback } from "react";

// Stripe publishable key for Google Pay gateway tokenization
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

// Google Pay configuration using PAYMENT_GATEWAY tokenization with Stripe

const GOOGLE_PAY_CONFIG = {
  environment: import.meta.env.VITE_ENV == "production" ? "PRODUCTION" : "TEST" as any, 
  merchantInfo: {
    merchantId: "BCR2DN5TZCL47ZBP", // Your Google Pay merchant ID
    merchantName: "GRID Events",
  },
  allowedPaymentMethods: [
    {
      type: "CARD" as google.payments.api.PaymentMethodType,
      parameters: {
        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"] as google.payments.api.CardAuthMethod[],
        allowedCardNetworks: ["MASTERCARD", "VISA"] as google.payments.api.CardNetwork[],
      },
      tokenizationSpecification: {
        type: "PAYMENT_GATEWAY" as const,
        parameters: {
          gateway: "stripe",
          "stripe:version": "2022-11-15",
          "stripe:publishableKey": STRIPE_PUBLISHABLE_KEY,
        },
      },
    },
  ],
};

export const useGooglePay = (totalAmount: number, currencyCode: string = "INR") => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if Google Pay is available (simplified check)
    // Google Pay is generally available on Android Chrome and desktop Chrome
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge|Edg/i.test(navigator.userAgent);
    const isSafari = true; ///Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    console.log(isChrome, "chrome state");
    // Google Pay is NOT available on Safari (iOS or macOS)
    // Also check if Stripe publishable key is configured
    setIsAvailable(!!STRIPE_PUBLISHABLE_KEY);
  }, []);

  const getPaymentDataRequest = useCallback((): google.payments.api.PaymentDataRequest => {
    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: GOOGLE_PAY_CONFIG.allowedPaymentMethods,
      transactionInfo: {
        totalPriceStatus: "FINAL",
        totalPrice: totalAmount.toFixed(2),
        currencyCode,
        countryCode: "IN",
      },
      merchantInfo: GOOGLE_PAY_CONFIG.merchantInfo,
    };
  }, [totalAmount, currencyCode]);

  return {
    isAvailable,
    environment: GOOGLE_PAY_CONFIG.environment,
    paymentRequest: getPaymentDataRequest(),
    merchantInfo: GOOGLE_PAY_CONFIG.merchantInfo,
    allowedPaymentMethods: GOOGLE_PAY_CONFIG.allowedPaymentMethods,
  };
};
