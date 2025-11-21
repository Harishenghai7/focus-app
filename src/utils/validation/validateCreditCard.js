/**
 * validateCreditCard
 * Credit card validation (Luhn algorithm).
 * @param {string} card
 * @returns {boolean} valid
 * @example validateCreditCard('4111111111111111')
 */
export default function validateCreditCard(card) {
  card = card.replace(/\D/g, '');
  let sum = 0, alt = false;
  for (let i = card.length - 1; i >= 0; i--) {
    let n = +card[i];
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
