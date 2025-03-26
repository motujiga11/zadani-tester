export function getInvoiceContext(domain, price) {
  const vatMap = {
    cz: { vatLabel: '21 %', vatRate: 0.21, currency: 'Kč', invoiceLabel: 'Faktura', draftLabel: 'Návrh' },
    sk: { vatLabel: '20 %', vatRate: 0.20, currency: '€', invoiceLabel: 'Faktúra', draftLabel: 'Návrh' },
    com: { vatLabel: '23 %', vatRate: 0.23, currency: '$', invoiceLabel: 'Invoice', draftLabel: 'Draft' }
  };

  const { vatLabel, vatRate, currency, invoiceLabel, draftLabel } = vatMap[domain];
  const vatAmount = price * vatRate;
  const total = price + vatAmount;

  // Escape special characters in currency string for regex
  const escapedCurrency = currency.replace(/([.*+?^=!:${}()|[\]\\])/g, '\\$1');

  let expectedTotalRegex;

  if (domain === 'com') {
    expectedTotalRegex = new RegExp(`\\$${total.toFixed(2)}`);
  } else if (domain === 'sk') {
    const formatted = total
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '[ \\u00A0]?');

    expectedTotalRegex = new RegExp(`${formatted}(\\s|\\u00A0)*${escapedCurrency}`);
  } else {
    const formatted = total.toFixed(2).replace('.', ',');
    expectedTotalRegex = new RegExp(`${formatted}(\\s|\\u00A0)*${escapedCurrency}`);
  }

  return {
    vatLabel,
    vatRate,
    currency,
    invoiceLabel,
    draftLabel,
    vatAmount,
    total,
    expectedTotalRegex
  };
}
