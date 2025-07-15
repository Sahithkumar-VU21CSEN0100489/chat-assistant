export const login = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: any }> => {
  if (!email || !password) {
    return { success: false, message: 'Email and password are required' };
  }
  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password })
    });
    const data = await response.json();
    if (response.ok && data.access_token) {
      localStorage.setItem('token', data.access_token);
      if (data.user_id) localStorage.setItem('userId', data.user_id.toString());
      return { success: true, message: 'Login successful', user: { email, userId: data.user_id } };
    } else {
      return { success: false, message: data.detail || 'Login failed' };
    }
  } catch (err) {
    return { success: false, message: 'Network error' };
  }
};

export const signup = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: any }> => {
  if (!email || !password) {
    return { success: false, message: 'Email and password are required' };
  }
  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, email, password })
    });
    const data = await response.json();
    if (response.ok && data.id) {
      localStorage.setItem('userId', data.id.toString());
      return { success: true, message: 'Signup successful', user: { email, userId: data.id } };
    } else {
      return { success: false, message: data.detail || 'Signup failed' };
    }
  } catch (err) {
    return { success: false, message: 'Network error' };
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
};

export const getCurrentUser = (): any => {
  // Optionally decode the JWT token to get user info
  const token = localStorage.getItem('token');
  if (!token) return null;
  // You can decode the JWT here if needed
  return { token };
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export const requestOtp = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.detail || 'Failed to send OTP' };
    }
  } catch (err) {
    return { success: false, message: 'Network error' };
  }
};

export const verifyOtp = async (email: string, otp: string): Promise<{ success: boolean; message: string; user?: any }> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await response.json();
    if (response.ok && data.access_token) {
      localStorage.setItem('token', data.access_token);
      if (data.user_id) localStorage.setItem('userId', data.user_id.toString());
      return { success: true, message: 'Login successful', user: { email, userId: data.user_id } };
    } else {
      return { success: false, message: data.detail || 'Invalid OTP' };
    }
  } catch (err) {
    return { success: false, message: 'Network error' };
  }
};

export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, new_password: newPassword })
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.detail || 'Failed to reset password' };
    }
  } catch (err) {
    return { success: false, message: 'Network error' };
  }
};