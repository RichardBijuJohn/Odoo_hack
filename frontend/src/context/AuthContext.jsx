import React, { createContext, useContext, useState, useEffect } from 'react';

// Default initial accounts for demonstration and immediate login
const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Sarah Jenkins (Admin)',
    email: 'admin@brightloop.io',
    role: 'admin', // admin, staff, customer
    companyName: 'Brightloop HQ',
    createdAt: '2026-01-15'
  },
  {
    id: 2,
    name: 'Alex Rivera (Staff)',
    email: 'staff@brightloop.io',
    role: 'staff',
    companyName: 'Brightloop Ops',
    createdAt: '2026-02-10'
  },
  {
    id: 3,
    name: 'Acme Studio (Customer)',
    email: 'client@acme.com',
    role: 'customer',
    companyName: 'Acme Studio Inc.',
    createdAt: '2026-03-01'
  }
];

const AuthContext = createContext(null);

export const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length <= 8) {
    errors.push('Password must be more than 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter (a-z)');
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`]/.test(password)) {
    errors.push('Must contain at least one special character (e.g. !@#$%)');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('bl_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('bl_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [resetTokens, setResetTokens] = useState(() => {
    const saved = localStorage.getItem('bl_reset_tokens');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bl_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bl_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('bl_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('bl_reset_tokens', JSON.stringify(resetTokens));
  }, [resetTokens]);

  // Sign up a new small business / user (default customer / business account)
  const register = ({ name, email, password, companyName, role = 'customer' }) => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check email uniqueness
    const exists = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (exists) {
      throw new Error('An account with this email already exists.');
    }

    // Password validation rule check
    const validation = validatePassword(password);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const newUser = {
      id: Date.now(),
      name: name || companyName || 'New Business User',
      email: normalizedEmail,
      companyName: companyName || name,
      role: role,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return newUser;
  };

  // Sign in existing user
  const login = (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      throw new Error('No account found with this email address.');
    }

    // In local demo mode, any password >= 6 or matching registered works
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Switch quick role for testing/demo
  const switchUser = (role) => {
    const match = users.find(u => u.role === role);
    if (match) {
      setCurrentUser(match);
    }
  };

  // Generate a password reset link
  const requestPasswordReset = (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error('No registered account found with this email.');
    }

    const token = 'rst_' + Math.random().toString(36).substring(2, 10);
    const resetEntry = {
      email: normalizedEmail,
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 // 1 hour
    };

    setResetTokens(prev => [...prev.filter(r => r.email !== normalizedEmail), resetEntry]);
    return { token, resetLink: `${window.location.origin}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}` };
  };

  // Reset password using token
  const completePasswordReset = (email, token, newPassword) => {
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    const found = resetTokens.find(r => r.email.toLowerCase() === email.toLowerCase() && r.token === token);
    if (!found) {
      throw new Error('Invalid or expired password reset link.');
    }

    setResetTokens(prev => prev.filter(r => r.token !== token));
    return true;
  };

  // Add staff member (Only admin can call this)
  const addStaffMember = ({ name, email, role = 'staff', department = 'Operations' }) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Permission Denied: Only Admins can add staff members.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('A user or staff member with this email already exists.');
    }

    const newStaff = {
      id: Date.now(),
      name,
      email: normalizedEmail,
      role, // staff
      department,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers(prev => [...prev, newStaff]);
    return newStaff;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        register,
        login,
        logout,
        switchUser,
        requestPasswordReset,
        completePasswordReset,
        addStaffMember,
        isAdmin: currentUser?.role === 'admin',
        isStaff: currentUser?.role === 'staff',
        isCustomer: currentUser?.role === 'customer'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
