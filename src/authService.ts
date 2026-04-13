/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';
import { User, Role } from './types';

/**
 * Login user with email and password using Supabase Auth
 */
export async function loginUser(email: string, password: string) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'User not found' };
    }

    // Fetch staff profile from staff_users table
    const { data: staffData, error: staffError } = await supabase
      .from('staff_users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (staffError) {
      console.error('Error fetching staff profile:', staffError);
      return { success: false, error: 'Staff profile not found' };
    }

    const user: User = {
      id: staffData.id,
      auth_user_id: staffData.auth_user_id,
      name: staffData.name,
      email: staffData.email,
      role: staffData.role as Role,
      avatar_url: staffData.avatar_url,
      last_login: staffData.last_login,
    };

    // Update last login timestamp in staff_users
    await supabase.rpc('touch_staff_last_login');

    return { success: true, data: user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  await supabase.auth.signOut();
}

/**
 * Get current authenticated user session and profile
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return null;

    const { data: staffData, error } = await supabase
      .from('staff_users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (error || !staffData) return null;

    return {
      id: staffData.id,
      auth_user_id: staffData.auth_user_id,
      name: staffData.name,
      email: staffData.email,
      role: staffData.role as Role,
      avatar_url: staffData.avatar_url,
      last_login: staffData.last_login,
    };
  } catch {
    return null;
  }
}

/**
 * Create a new staff account (requires manager role)
 */
export async function registerUser(name: string, email: string, password: string, role: Role = 'cashier') {
  try {
    const { data, error } = await supabase.rpc('create_staff_account', {
      p_name: name,
      p_email: email,
      p_password: password,
      p_role: role,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch all staff users (for managers)
 */
export async function fetchAllUsers() {
  try {
    const { data, error } = await supabase
      .from('staff_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching staff:', error);
    return { success: false, error };
  }
}

/**
 * Update a staff account (manager only)
 */
export async function updateStaffAccount(
  staffId: string,
  updates: { name: string; role: Role; avatar_url?: string | null },
) {
  try {
    const { data, error } = await supabase.rpc('update_staff_account', {
      p_staff_id: staffId,
      p_name: updates.name,
      p_role: updates.role,
      p_avatar_url: updates.avatar_url ?? null,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating staff account:', error);
    return { success: false, error };
  }
}

/**
 * Reset a staff password directly (manager only)
 */
export async function resetStaffPassword(staffId: string, newPassword: string) {
  try {
    const { data, error } = await supabase.rpc('reset_staff_password', {
      p_staff_id: staffId,
      p_new_password: newPassword,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error resetting staff password:', error);
    return { success: false, error };
  }
}
