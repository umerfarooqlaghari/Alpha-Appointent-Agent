export function getCurrencySymbol(currency: string = "USD"): string {
  const code = (currency || "USD").toUpperCase();
  switch (code) {
    case "USD":
    case "CAD":
    case "AUD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "PKR":
      return "Rs ";
    case "INR":
      return "₹";
    case "AED":
      return "AED ";
    case "SAR":
      return "SAR ";
    case "JPY":
      return "¥";
    default:
      return `${code} `;
  }
}

export function formatPrice(amount: number | string, currency: string = "USD"): string {
  const symbol = getCurrencySymbol(currency);
  const num = typeof amount === "number" ? amount : parseFloat(amount || "0");
  return `${symbol}${num.toFixed(2)}`;
}
