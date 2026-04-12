import { supabase } from './supabaseClient';
import { Product, CartItem, PaymentMethod } from './types';

/**
 * Add a new product to the database
 */
export async function addProduct(product: Omit<Product, 'id'>) {
  try {
    console.log('Attempting to add product:', product);
    
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: product.name,
          description: `${product.size} - ${product.flavor}`,
          price: product.price,
          category: product.category,
          image_url: product.image,
          cost: product.cost || 0,
          stock: product.stock || 0,
          low_stock_threshold: product.lowStockThreshold || 10,
          available: product.available !== false,
          size: product.size || 'medium',
          flavor: product.flavor || 'classic',
        },
      ])
      .select();

    if (error) {
      console.error('❌ Supabase Insert Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
    
    console.log('✅ Product added successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error adding product:', error);
    return { success: false, error };
  }
}

/**
 * Update an existing product in the database
 */
export async function updateProduct(productId: string, updates: Partial<Product>) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        description: updates.size && updates.flavor ? `${updates.size} - ${updates.flavor}` : undefined,
        price: updates.price,
        category: updates.category,
        image_url: updates.image,
        cost: updates.cost,
        stock: updates.stock,
        low_stock_threshold: updates.lowStockThreshold,
        available: updates.available,
        size: updates.size,
        flavor: updates.flavor,
      })
      .eq('id', productId)
      .select();

    if (error) {
      console.error('Supabase error:', error.message);
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error };
  }
}

/**
 * Delete a product from the database
 */
export async function deleteProduct(productId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Supabase error:', error.message);
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error };
  }
}

/**
 * Fetch all products from database
 */
export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error };
  }
}

/**
 * Create an order with order items
 */
export async function createOrder(
  cartItems: CartItem[],
  paymentMethod: PaymentMethod,
  totalAmount: number,
  discount: number = 0,
  discountCode?: string,
) {
  try {
    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Create the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          order_number: orderNumber,
          total_amount: totalAmount,
          status: 'completed',
        },
      ])
      .select();

    if (orderError) throw orderError;

    const order = orderData[0];

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return { success: true, data: { order, orderItems } };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error };
  }
}

/**
 * Fetch all orders with their items
 */
export async function fetchOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          products (
            name,
            price,
            image_url
          )
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error };
  }
}

/**
 * Fetch a single order with its items
 */
export async function fetchOrder(orderId: number) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          products (
            name,
            price,
            image_url
          )
        )
      `,
      )
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { success: false, error };
  }
}

/**
 * Update product stock after order (deduct sold quantity)
 */
export async function updateProductStockAfterOrder(productId: string, quantitySold: number) {
  try {
    // Get current stock
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    const newStock = Math.max(0, (currentProduct?.stock || 0) - quantitySold);

    // Update stock
    const { data, error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating product stock:', error);
    return { success: false, error };
  }
}

/**
 * Create or get ingredients table records
 */
export async function saveIngredientStock(ingredientId: string, newStock: number, reason: string) {
  try {
    // First, try to update existing ingredient
    const { data: updateData, error: updateError } = await supabase
      .from('ingredients')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', ingredientId)
      .select();

    if (updateError && updateError.code !== 'PGRST116') {
      throw updateError;
    }

    // If no rows updated, insert new ingredient
    if (!updateData || updateData.length === 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('ingredients')
        .insert([{ id: ingredientId, stock: newStock, reason, updated_at: new Date().toISOString() }])
        .select();

      if (insertError) throw insertError;
      return { success: true, data: insertData };
    }

    return { success: true, data: updateData };
  } catch (error) {
    console.error('Error saving ingredient stock:', error);
    return { success: false, error };
  }
}

/**
 * Log inventory transaction
 */
export async function logInventoryTransaction(
  itemId: string,
  itemName: string,
  type: 'in' | 'out' | 'waste' | 'sale',
  quantity: number,
  unit: string,
  reason: string,
  userId: string,
) {
  try {
    const { data, error } = await supabase
      .from('inventory_logs')
      .insert([
        {
          item_id: itemId,
          item_name: itemName,
          type,
          quantity,
          unit,
          reason,
          user_id: userId,
          timestamp: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error logging inventory transaction:', error);
    return { success: false, error };
  }
}
