export function formatINR(value: number): string {
  if (value === undefined || value === null) return "₹0";
  
  const absVal = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absVal >= 10000000) {
    return `${sign}₹${(absVal / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
  } else if (absVal >= 100000) {
    return `${sign}₹${(absVal / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
  } else {
    return `${sign}₹${absVal.toLocaleString('en-IN')}`;
  }
}
