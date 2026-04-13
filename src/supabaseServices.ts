/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';
import { Product, CartItem, PaymentMethod, Ingredient, InventoryLogType, Promotion } from './types';

/**
 * Get public URL for an image in Supabase Storage
 */
export function getImageUrl(path: string, bucket: string = 'product-images') {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a full URL
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Fetch all products from database
 */
export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      // Cashier accounts can be blocked by restrictive RLS on products.
      // Fallback to the cashier-safe RPC so the sales screen still works.
      const { data: cashierData, error: cashierError } = await supabase.rpc('list_cashier_products');
      if (cashierError) throw error;
      const cashierProducts = (cashierData || []).map((p: any) => ({
        ...p,
        image_url: getImageUrl(p.image_url),
        cost: 0,
        stock: 999,
        low_stock_threshold: 0,
        ingredients: [],
        sales_velocity: 'normal',
      }));
      return { success: true, data: cashierProducts };
    }

    // If RLS returns no rows for cashier, try RPC fallback too.
    if (!data || data.length === 0) {
      const { data: cashierData, error: cashierError } = await supabase.rpc('list_cashier_products');
      if (!cashierError && cashierData && cashierData.length > 0) {
        const cashierProducts = cashierData.map((p: any) => ({
          ...p,
          image_url: getImageUrl(p.image_url),
          cost: 0,
          stock: 999,
          low_stock_threshold: 0,
          ingredients: [],
          sales_velocity: 'normal',
        }));
        return { success: true, data: cashierProducts };
      }
    }

    // Map the products to ensure images have correct public URLs
    const products = data.map(p => ({
      ...p,
      image_url: getImageUrl(p.image_url)
    }));

    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error };
  }
}

/**
 * Add a new product to the database
 */
export async function addProduct(product: Omit<Product, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: product.name,
          price: product.price,
          cost: product.cost,
          category: product.category,
          size: product.size,
          flavor: product.flavor,
          image_url: product.image_url,
          available: product.available,
          stock: product.stock,
          low_stock_threshold: product.low_stock_threshold,
          ingredients: product.ingredients,
          sales_velocity: product.sales_velocity,
        },
      ])
      .select();

    if (error) throw error;
    
    // Log activity
    await supabase.rpc('append_activity_log', {
      p_action: 'Product Add',
      p_details: `Added new product: ${product.name}`,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: string, updates: Partial<Product>) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select();

    if (error) throw error;

    // Log activity
    await supabase.rpc('append_activity_log', {
      p_action: 'Product Edit',
      p_details: `Updated product ID: ${productId}`,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    // Log activity
    await supabase.rpc('append_activity_log', {
      p_action: 'Product Delete',
      p_details: `Deleted product ID: ${productId}`,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error };
  }
}

/**
 * Process a sale using the stored procedure
 * This handles transaction creation, item recording, stock deduction, and inventory logging.
 */
export async function processSale(
  cashierId: string,
  paymentMethod: PaymentMethod,
  items: CartItem[],
  subtotal: number,
  tax: number,
  total: number,
  discount: number = 0,
  discountCode?: string,
) {
  try {
    // Format items for the JSONB parameter
    const itemsJson = items.map(item => ({
      id: item.id,
      quantity: item.quantity,
    }));

    const { data, error } = await supabase.rpc('process_sale', {
      p_cashier_id: cashierId,
      p_payment_method: paymentMethod,
      p_discount_code: discountCode || null,
      p_discount: discount,
      p_subtotal: subtotal,
      p_tax: tax,
      p_total: total,
      p_items: itemsJson,
    });

    if (error) throw error;

    // Log activity
    await supabase.rpc('append_activity_log', {
      p_action: 'Sale',
      p_details: `Sale completed. Total: ${total}`,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error processing sale:', error);
    return { success: false, error };
  }
}

/**
 * Fetch all transactions
 */
export async function fetchTransactions() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { success: false, error };
  }
}

/**
 * Fetch all ingredients
 */
export async function fetchIngredients() {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return { success: false, error };
  }
}

/**
 * Adjust ingredient stock using stored procedure
 */
export async function adjustIngredientStock(
  ingredientId: string,
  type: InventoryLogType,
  quantity: number,
  reason: string,
  userId: string,
) {
  try {
    const { data, error } = await supabase.rpc('adjust_ingredient_stock', {
      p_ingredient_id: ingredientId,
      p_type: type,
      p_quantity: quantity,
      p_reason: reason,
      p_user_id: userId,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adjusting ingredient stock:', error);
    return { success: false, error };
  }
}

/**
 * Add a new ingredient
 */
export async function addIngredient(ingredient: {
  name: string;
  unit: string;
  category: 'raw' | 'packaging' | 'sauce';
  low_stock_threshold?: number;
  stock?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .insert([
        {
          name: ingredient.name.trim(),
          unit: ingredient.unit.trim(),
          category: ingredient.category,
          low_stock_threshold: Number(ingredient.low_stock_threshold ?? 0),
          stock: Number(ingredient.stock ?? 0),
        },
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding ingredient:', error);
    return { success: false, error };
  }
}

/**
 * Fetch inventory logs
 */
export async function fetchInventoryLogs() {
  try {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching inventory logs:', error);
    return { success: false, error };
  }
}

/**
 * Fetch promotions
 */
export async function fetchPromotions() {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return { success: false, error };
  }
}

/**
 * Add a promotion
 */
export async function addPromotion(promotion: Omit<Promotion, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .insert([
        {
          code: promotion.code.trim().toUpperCase(),
          description: promotion.description.trim(),
          discount_type: promotion.discount_type,
          value: promotion.value,
          active: promotion.active,
        },
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding promotion:', error);
    return { success: false, error };
  }
}

/**
 * Update a promotion
 */
export async function updatePromotion(promotionId: string, updates: Partial<Promotion>) {
  try {
    const payload: any = {
      ...updates,
    };
    if (typeof payload.code === 'string') payload.code = payload.code.trim().toUpperCase();
    if (typeof payload.description === 'string') payload.description = payload.description.trim();

    const { data, error } = await supabase
      .from('promotions')
      .update(payload)
      .eq('id', promotionId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating promotion:', error);
    return { success: false, error };
  }
}

/**
 * Delete a promotion
 */
export async function deletePromotion(promotionId: string) {
  try {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', promotionId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return { success: false, error };
  }
}

/**
 * Fetch activity logs
 */
export async function fetchActivityLogs() {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return { success: false, error };
  }
}
