// Core types for the multi-tenant system
import { 
  User, 
  Tenant, 
  BusinessType, 
  Category, 
  Product, 
  TenantUser, 
  PaymentRecord, 
  AuditLog
} from '@prisma/client'

import {
  UserRoleType,
  TenantRoleType,
  SubscriptionStatusType,
  SubscriptionPlanType,
  PaymentMethodType,
  PaymentStatusType,
  AuditActionType
} from '@/lib/validation'

// Extended types with relations
export type UserWithRelations = User & {
  tenantUsers: (TenantUser & { tenant: Tenant })[]
  createdTenants: Tenant[]
}

export type TenantWithRelations = Tenant & {
  businessType: BusinessType
  createdBy: User
  tenantUsers: (TenantUser & { user: User })[]
  categories: Category[]
  products: Product[]
  paymentHistory: PaymentRecord[]
}

export type CategoryWithRelations = Category & {
  tenant: Tenant
  products: Product[]
  createdBy: User
}

export type ProductWithRelations = Product & {
  tenant: Tenant
  category: Category
  createdBy: User
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRoleType
  tenantUsers: {
    tenantId: string
    role: TenantRoleType
  }[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// Tenant types
export interface TenantTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
}

export interface TenantSettings {
  nameEn: string
  nameAr?: string
  logoUrl?: string
  phone?: string
  email: string
  address?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  currency?: string
  timezone?: string
  defaultLanguage?: string
}

export interface CreateTenantData {
  businessName: string
  businessNameAr?: string
  businessTypeId: string
  email: string
  phone?: string
  address?: string
  ownerName: string
  ownerEmail: string
  ownerPhone?: string
  defaultLanguage?: string
  currency?: string
  subscriptionPlan?: SubscriptionPlanType
  monthlyFee?: number
}

// Menu types
export interface MenuCategory {
  id: string
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  imageUrl?: string
  isActive: boolean
  sortOrder: number
  products: MenuProduct[]
}

export interface MenuProduct {
  id: string
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  imageUrl?: string
  imageUrls: string[]
  basePrice: number
  currency: string
  discountPrice?: number
  isActive: boolean
  isOutOfStock: boolean
  isFeatured: boolean
  preparationTime?: string
  ingredientsEn: string[]
  ingredientsAr: string[]
  allergensEn: string[]
  allergensAr: string[]
}

// Form types
export interface CategoryFormData {
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  imageUrl?: string
  isActive: boolean
  showInMenu: boolean
  sortOrder: number
}

export interface ProductFormData {
  categoryId: string
  nameEn: string
  nameAr: string
  descriptionEn?: string
  descriptionAr?: string
  basePrice: number
  discountPrice?: number
  discountStartDate?: Date
  discountEndDate?: Date
  isActive: boolean
  isFeatured: boolean
  isOutOfStock: boolean
  stockQuantity?: number
  preparationTime?: string
  servingSize?: string
  calories?: number
  ingredientsEn: string[]
  ingredientsAr: string[]
  allergensEn: string[]
  allergensAr: string[]
  imageUrl?: string
  imageUrls: string[]
}

// Billing types
export interface PaymentFormData {
  tenantId: string
  amount: number
  paymentMethod: PaymentMethodType
  paymentReference?: string
  billingPeriodStart: Date
  billingPeriodEnd: Date
  notes?: string
}

export interface BillingOverview {
  totalMonthlyRevenue: number
  outstandingAmount: number
  collectionRate: number
  churnRate: number
  averageDaysOverdue: number
  tenantsCount: {
    current: number
    gracePeriod: number
    overdue: number
    suspended: number
    cancelled: number
  }
}

// Export all Prisma types
export type {
  User,
  Tenant,
  BusinessType,
  Category,
  Product,
  TenantUser,
  PaymentRecord,
  AuditLog
}

// Export validation types
export type {
  UserRoleType,
  TenantRoleType,
  SubscriptionStatusType,
  SubscriptionPlanType,
  PaymentMethodType,
  PaymentStatusType,
  AuditActionType
}