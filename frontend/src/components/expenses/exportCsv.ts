import type { Expense, Brand } from '../../types';
import { CATEGORY_CONFIG } from './expenseConfig';

const CSV_HEADERS = [
  'Date',
  'Expense Title',
  'Category',
  'Amount (INR)',
  'Payment Status',
  'Payment Mode',
  'Associated Brand/Client',
  'Employee Name',
  'Description / Purpose',
];

const quote = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

/** Builds and downloads a CSV of the currently filtered expenses. */
export function exportExpensesToCsv(expenses: Expense[], brands: Brand[]): void {
  const rows = expenses.map((e) => {
    const linkedBrand = brands.find((b: any) => b.id === e.brandId);
    return [
      e.date || 'N/A',
      quote(e.title || e.category || 'Expense'),
      CATEGORY_CONFIG[e.category]?.label || e.category,
      e.amount,
      e.paymentStatus || 'Paid',
      e.paymentMode || 'Corporate Card',
      linkedBrand ? quote(linkedBrand.name) : 'General / Other (Overhead)',
      e.employeeName ? quote(e.employeeName) : 'N/A',
      quote(e.description || e.note || ''),
    ];
  });

  const csv =
    'data:text/csv;charset=utf-8,' +
    [CSV_HEADERS.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csv));
  link.setAttribute(
    'download',
    `retentio-expenses-report-${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
