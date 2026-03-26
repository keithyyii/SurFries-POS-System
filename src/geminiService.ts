import { GoogleGenerativeAI } from '@google/generative-ai';
import { Transaction } from './types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface ReportData {
  transactionCount: number;
  totalRevenue: number;
  totalDiscount: number;
  avgOrderValue: number;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
  categoryBreakdown: Array<{ name: string; revenue: number }>;
  transactions: Transaction[];
}

/**
 * Generate insights and suggestions from report data using Gemini API
 */
export async function generateInsights(reportData: ReportData): Promise<string> {
  try {
   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Format the report data for Gemini
    const reportSummary = `
POS System Report Analysis Request:

BUSINESS METRICS:
- Total Transactions: ${reportData.transactionCount}
- Total Revenue: $${reportData.totalRevenue.toFixed(2)}
- Total Discounts Applied: $${reportData.totalDiscount.toFixed(2)}
- Average Order Value: $${reportData.avgOrderValue.toFixed(2)}

TOP 5 PRODUCTS:
${reportData.topProducts
  .slice(0, 5)
  .map((p, i) => `${i + 1}. ${p.name} - ${p.qty} units sold, $${p.revenue.toFixed(2)} revenue`)
  .join('\n')}

SALES BY CATEGORY:
${reportData.categoryBreakdown
  .map((c) => `- ${c.name}: $${c.revenue.toFixed(2)}`)
  .join('\n')}

Please analyze this POS system data and provide:
1. Key business insights about sales performance
2. Top 3 specific recommendations to boost revenue
3. Products or categories that need attention
4. Customer behavior patterns observed
5. Inventory or pricing suggestions

Format your response in clear, actionable bullet points.
    `;

    const result = await model.generateContent(reportSummary);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}
