/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';
import { User, Role } from './types';

/**
 * Simple password hashing using SubtleCrypto (for demo - not production-grade)
 * In production, use proper backend hashing with bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Register a new user
 */
export async function registerUser(name: string, email: string, password: string, role: Role = 'cashier') {
  try {
    if (!name.trim()) {
      return { success: false, error: 'Name is required' };
    }
    if (!email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Check if user already exists
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: name.trim(),
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role,
          avatar: `https://i.pravatar.cc/150?u=${email}`,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id, name, email, role, avatar');

    if (error) {
      console.error('Registration error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Failed to create user' };
    }

    const user = data[0];
    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error };
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string) {
  try {
    if (!email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    // Get user from database
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, role, avatar, password_hash, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !users) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!users.is_active) {
      return { success: false, error: 'User account is inactive' };
    }

    // Verify password
    const passwordHash = await hashPassword(password);
    if (passwordHash !== users.password_hash) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', users.id);

    const user: User = {
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatar: users.avatar,
      lastLogin: new Date().toISOString(),
    };

    // Store session
    localStorage.setItem('surfries_auth_user', JSON.stringify(user));
    localStorage.setItem('surfries_auth_token', users.id);

    return { success: true, data: user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error };
  }
}

/**
 * Logout user
 */
export function logoutUser() {
  localStorage.removeItem('surfries_auth_user');
  localStorage.removeItem('surfries_auth_token');
}

/**
 * Get current user from session
 */
export function getCurrentUser(): User | null {
  try {
    const userJson = localStorage.getItem('surfries_auth_user');
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('surfries_auth_token');
}

/**
 * Fetch all users (for admin)
 */
export async function fetchAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar, is_active, last_login, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error };
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, newRole: Role) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error };
  }
}

/**
 * Deactivate user (admin only)
 */
export async function deactivateUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error deactivating user:', error);
    return { success: false, error };
  }
}

/**
 * Reactivate user (admin only)
 */
export async function reactivateUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error reactivating user:', error);
    return { success: false, error };
  }
}

/**
 * Change user password
 */
export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    // Verify old password
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      return { success: false, error: 'User not found' };
    }

    const oldHash = await hashPassword(oldPassword);
    if (oldHash !== userData.password_hash) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true, data: { message: 'Password changed successfully' } };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error };
  }
}
