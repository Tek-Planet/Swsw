export const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    default:
      return "₹";
  }
};
