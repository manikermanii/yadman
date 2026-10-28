// Persian digit converter and price formatters

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(n: number | string | null | undefined): string {
  if (n === undefined || n === null) return '';
  const str = String(n);
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

export function formatToman(price: number | string | null | undefined): string {
  const num = typeof price === 'number' ? (isNaN(price) ? 0 : price) : Number(price) || 0;
  const formatted = num.toLocaleString('en-US');
  return `${toPersianDigits(formatted)} تومان`;
}

export function formatWeight(grams: number | string | null | undefined): string {
  const num = typeof grams === 'number' ? (isNaN(grams) ? 0 : grams) : Number(grams) || 0;
  if (num >= 1000) {
    const kg = (num / 1000).toFixed(1);
    return `${toPersianDigits(kg)} کیلوگرم`;
  }
  return `${toPersianDigits(num)} گرم`;
}

