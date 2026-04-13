import { GoogleGenerativeAI } from '@google/generative-ai';
import { Transaction } from './types';

interface ReportData {
  transactionCount: number;
  totalRevenue: number;
  totalDiscount: number;
  avgOrderValue: number;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
  categoryBreakdown: Array<{ name: string; revenue: number }>;
  transactions: Transaction[];
  reportRange?: string;
  reportCategory?: string;
  lowStockCount?: number;
  productPerformance?: Array<{
    name: string;
    sold: number;
    remaining: number;
    sales: number;
    estimatedProfit: number;
  }>;
  totalEstimatedProfit?: number;
  totalUnitsSold?: number;
  totalUnitsRemaining?: number;
}

const formatPeso = (amount: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);

const getTransactionItems = (tx: any) => tx?.items ?? tx?.transaction_items ?? [];

const titleCase = (value: string) =>
  value
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const sanitizeInsightText = (text: string) =>
  text
    .replace(/[*#`_>~]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Generate AI insights based on actual app data.
 * Output is sanitized so markdown symbols do not appear in the UI.
 */
export async function generateInsights(reportData: ReportData): Promise<string> {
  const rangeLabel = reportData.reportRange ? titleCase(reportData.reportRange) : 'Selected';
  const categoryLabel =
    reportData.reportCategory && reportData.reportCategory !== 'all'
      ? titleCase(reportData.reportCategory)
      : 'All Items';

  const topItems = reportData.topProducts.slice(0, 3);
  const paymentCounts = reportData.transactions.reduce(
    (acc, tx: any) => {
      const method = tx?.payment_method ?? tx?.paymentMethod ?? 'cash';
      acc[method] = (acc[method] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const unitCount = reportData.transactions.reduce((sum, tx: any) => {
    return sum + getTransactionItems(tx).reduce((n: number, item: any) => n + Number(item.quantity ?? 0), 0);
  }, 0);
  const avgItemsPerOrder = reportData.transactionCount > 0 ? unitCount / reportData.transactionCount : 0;

  const categoryText = reportData.categoryBreakdown.length
    ? [...reportData.categoryBreakdown]
      .sort((a, b) => b.revenue - a.revenue)
      .map((c, i) => `${i + 1}. ${titleCase(c.name)} (${formatPeso(c.revenue)})`)
      .join('\n')
    : 'No category sales data';

  const topProductsText = topItems.length
    ? topItems
      .map((p, i) => `${i + 1}. ${p.name} - ${p.qty} sold, ${formatPeso(p.revenue)} revenue`)
      .join('\n')
    : 'No top products in this range';

  const paymentText = Object.keys(paymentCounts).length
    ? Object.entries(paymentCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([method, count]) => `${titleCase(method)}: ${count}`)
      .join(', ')
    : 'No payment data';

  const productPerformanceText = (reportData.productPerformance ?? [])
    .slice(0, 8)
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} - Sold: ${item.sold}, Remaining: ${item.remaining}, Sales: ${formatPeso(item.sales)}, Est. Profit: ${formatPeso(item.estimatedProfit)}`,
    )
    .join('\n');

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key missing. Set VITE_GEMINI_API_KEY in your environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `
You are a POS business analyst. Use ONLY the numbers provided.

Report context:
- Range: ${rangeLabel}
- Category filter: ${categoryLabel}
- Generated at: ${new Date().toLocaleString('en-PH')}

Metrics:
- Transactions: ${reportData.transactionCount}
- Revenue: ${formatPeso(reportData.totalRevenue)}
- Discounts: ${formatPeso(reportData.totalDiscount)}
- Average order value: ${formatPeso(reportData.avgOrderValue)}
- Average items per order: ${avgItemsPerOrder.toFixed(1)}
- Low-stock items: ${reportData.lowStockCount ?? 0}
- Total products sold: ${(reportData.totalUnitsSold ?? 0).toLocaleString()} units
- Total products remaining: ${(reportData.totalUnitsRemaining ?? 0).toLocaleString()} units
- Estimated profit: ${formatPeso(reportData.totalEstimatedProfit ?? 0)}

Top products:
${topProductsText}

Category revenue:
${categoryText}

Payment usage:
${paymentText}

Product sales and stock summary:
${productPerformanceText || 'No product performance summary available'}

Return plain text only with this exact section layout:
Business Insights Report
Key Business Insights
Predictive Insights
Top Recommendations
Immediate Next Steps

Rules:
- No markdown symbols. Do not use **, ##, bullet characters, or backticks.
- Use Philippine Peso formatting when mentioning money.
- Keep it practical and specific to this POS data.
- Avoid technical codes, UUIDs, and internal IDs. Use product names and business language only.
- Give direct manager-style language.
- Include at least 3 clear recommendations.
- 2-4 short lines per section.
`.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return sanitizeInsightText(text);
}
