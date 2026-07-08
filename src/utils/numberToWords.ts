export function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  
  const numStr = Math.floor(num).toString();
  const padded = numStr.padStart(9, '0');
  const n = padded.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  
  let str = '';
  
  // Crore
  const crore = parseInt(n[1]);
  if (crore > 0) {
    str += (a[crore] || b[Math.floor(crore / 10)] + ' ' + a[crore % 10]) + 'Crore ';
  }
  
  // Lakh
  const lakh = parseInt(n[2]);
  if (lakh > 0) {
    str += (a[lakh] || b[Math.floor(lakh / 10)] + ' ' + a[lakh % 10]) + 'Lakh ';
  }
  
  // Thousand
  const thousand = parseInt(n[3]);
  if (thousand > 0) {
    str += (a[thousand] || b[Math.floor(thousand / 10)] + ' ' + a[thousand % 10]) + 'Thousand ';
  }
  
  // Hundred
  const hundred = parseInt(n[4]);
  if (hundred > 0) {
    str += a[hundred] + 'Hundred ';
  }
  
  // Tens & Ones
  const tens = parseInt(n[5]);
  if (tens > 0) {
    if (str !== '') str += 'and ';
    str += (a[tens] || b[Math.floor(tens / 10)] + ' ' + a[tens % 10]);
  }
  
  return str.trim() + ' Only';
}
