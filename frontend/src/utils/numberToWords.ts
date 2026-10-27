/**
 * Indian Number to Words converter (Lakhs & Crores)
 * e.g. 19498 => "INR Nineteen Thousand, Four Hundred And Ninety-Eight Rupees Only."
 * e.g. 952399 => "INR Nine Lakh, Fifty-Two Thousand, Three Hundred And Ninety-Nine Rupees Only."
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
    if (n > 0) str += 'And ';
  }
  if (n > 0 && n < 20) {
    str += ones[n] + ' ';
  } else if (n >= 20) {
    const t = tens[Math.floor(n / 10)];
    const o = ones[n % 10];
    str += o ? `${t}-${o} ` : `${t} `;
  }
  return str.trim();
}

export function numberToWordsINR(amount: number): string {
  if (amount === 0 || isNaN(amount)) return 'INR Zero Rupees Only.';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let num = rupees;
  let words = '';

  const crores = Math.floor(num / 10000000);
  num %= 10000000;

  const lakhs = Math.floor(num / 100000);
  num %= 100000;

  const thousands = Math.floor(num / 1000);
  num %= 1000;

  const hundredsAndBelow = num;

  if (crores > 0) {
    words += convertBelowThousand(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertBelowThousand(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertBelowThousand(thousands) + ' Thousand ';
  }
  if (hundredsAndBelow > 0) {
    if (words && hundredsAndBelow < 100) words += 'And ';
    words += convertBelowThousand(hundredsAndBelow) + ' ';
  }

  words = words.trim();
  if (!words) words = 'Zero';

  let result = (isNegative ? 'Minus ' : '') + words + ' Rupees';

  if (paise > 0) {
    result += ' And ' + convertBelowThousand(paise) + ' Paise';
  }

  return `INR ${result} Only.`;
}
