import { supabase } from './supabase.js';

export const auth = {
  /**
   * Initialize authentication state listener
   * @param {Function} onAuthStateChange Callback function when auth state changes 
   */
  init(onAuthStateChange) {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      onAuthStateChange(session);
    });

    // Listen for changes
    supabase.auth.onAuthStateChange((_event, session) => {
      onAuthStateChange(session);
    });
  },

  /**
   * Sign up a new user
   */
  async signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error };
    }
  },

  /**
   * Log in an existing user
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error };
    }
  },

  /**
   * Log out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error };
    }
  }
};
