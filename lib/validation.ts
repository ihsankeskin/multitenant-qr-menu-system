// Validation utilities for SQLite schema enum-like fields and JSON handling

// Enum-like constants and validation functions
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN', 
  TENANT_MANAGER: 'TENANT_MANAGER',
  TENANT_STAFF: 'TENANT_STAFF'
} as const;

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  GRACE_PERIOD: 'GRACE_PERIOD',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED'
} as const;

export const SubscriptionPlan = {
  BASIC: 'BASIC',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE'
} as const;

export const TenantRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER', 
  STAFF: 'STAFF'
} as const;

export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT_CARD: 'CREDIT_CARD',
  DIGITAL_WALLET: 'DIGITAL_WALLET',
  CHECK: 'CHECK',
  OTHER: 'OTHER'
} as const;

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
} as const;

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  SUSPEND: 'SUSPEND',
  ACTIVATE: 'ACTIVATE',
  PAYMENT_UPDATE: 'PAYMENT_UPDATE'
} as const;

// Type definitions
export type UserRoleType = typeof UserRole[keyof typeof UserRole];
export type SubscriptionStatusType = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];
export type SubscriptionPlanType = typeof SubscriptionPlan[keyof typeof SubscriptionPlan];
export type TenantRoleType = typeof TenantRole[keyof typeof TenantRole];
export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];
export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];
export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

// Validation functions
export const isValidUserRole = (role: string): role is UserRoleType => {
  return Object.values(UserRole).includes(role as UserRoleType);
};

export const isValidSubscriptionStatus = (status: string): status is SubscriptionStatusType => {
  return Object.values(SubscriptionStatus).includes(status as SubscriptionStatusType);
};

export const isValidSubscriptionPlan = (plan: string): plan is SubscriptionPlanType => {
  return Object.values(SubscriptionPlan).includes(plan as SubscriptionPlanType);
};

export const isValidTenantRole = (role: string): role is TenantRoleType => {
  return Object.values(TenantRole).includes(role as TenantRoleType);
};

export const isValidPaymentMethod = (method: string): method is PaymentMethodType => {
  return Object.values(PaymentMethod).includes(method as PaymentMethodType);
};

export const isValidPaymentStatus = (status: string): status is PaymentStatusType => {
  return Object.values(PaymentStatus).includes(status as PaymentStatusType);
};

export const isValidAuditAction = (action: string): action is AuditActionType => {
  return Object.values(AuditAction).includes(action as AuditActionType);
};

// JSON array handling utilities
export const stringArrayToJson = (arr: string[]): string => {
  return JSON.stringify(arr);
};

export const jsonToStringArray = (jsonStr: string | null): string[] => {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// JSON object handling utilities  
export const objectToJson = <T>(obj: T): string => {
  return JSON.stringify(obj);
};

export const jsonToObject = <T>(jsonStr: string | null, defaultValue: T): T => {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return defaultValue;
  }
};

// Decimal handling utilities for precise monetary calculations
export const decimalToNumber = (decimal: number | string): number => {
  return typeof decimal === 'string' ? parseFloat(decimal) : decimal;
};

export const numberToDecimal = (num: number, precision: number = 2): number => {
  return Math.round((num + Number.EPSILON) * Math.pow(10, precision)) / Math.pow(10, precision);
};

// Validation schemas for API endpoints
export const validateUserRole = (role: unknown): UserRoleType => {
  if (typeof role !== 'string' || !isValidUserRole(role)) {
    throw new Error(`Invalid user role: ${role}. Must be one of: ${Object.values(UserRole).join(', ')}`);
  }
  return role;
};

export const validateSubscriptionStatus = (status: unknown): SubscriptionStatusType => {
  if (typeof status !== 'string' || !isValidSubscriptionStatus(status)) {
    throw new Error(`Invalid subscription status: ${status}. Must be one of: ${Object.values(SubscriptionStatus).join(', ')}`);
  }
  return status;
};

export const validateSubscriptionPlan = (plan: unknown): SubscriptionPlanType => {
  if (typeof plan !== 'string' || !isValidSubscriptionPlan(plan)) {
    throw new Error(`Invalid subscription plan: ${plan}. Must be one of: ${Object.values(SubscriptionPlan).join(', ')}`);
  }
  return plan;
};

export const validateTenantRole = (role: unknown): TenantRoleType => {
  if (typeof role !== 'string' || !isValidTenantRole(role)) {
    throw new Error(`Invalid tenant role: ${role}. Must be one of: ${Object.values(TenantRole).join(', ')}`);
  }
  return role;
};

export const validatePaymentMethod = (method: unknown): PaymentMethodType => {
  if (typeof method !== 'string' || !isValidPaymentMethod(method)) {
    throw new Error(`Invalid payment method: ${method}. Must be one of: ${Object.values(PaymentMethod).join(', ')}`);
  }
  return method;
};

export const validatePaymentStatus = (status: unknown): PaymentStatusType => {
  if (typeof status !== 'string' || !isValidPaymentStatus(status)) {
    throw new Error(`Invalid payment status: ${status}. Must be one of: ${Object.values(PaymentStatus).join(', ')}`);
  }
  return status;
};

export const validateAuditAction = (action: unknown): AuditActionType => {
  if (typeof action !== 'string' || !isValidAuditAction(action)) {
    throw new Error(`Invalid audit action: ${action}. Must be one of: ${Object.values(AuditAction).join(', ')}`);
  }
  return action;
};