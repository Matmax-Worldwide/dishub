'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  DollarSign, 
  Clock, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Send,
  Download,
  AlertCircle,
  CheckCircle,
  Building,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// TypeScript interfaces for GraphQL integration
interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  incorporationId?: string;
  incorporation?: {
    id: string;
    companyName: string;
    incorporationNumber: string;
  };
  amount: number;
  tax: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  description: string;
  lineItems: InvoiceLineItem[];
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serviceType: 'incorporation' | 'consultation' | 'document_preparation' | 'compliance' | 'other';
}


interface BillingFilters {
  search: string;
  status: string;
  clientId: string;
  dateRange: string;
  amountRange: string;
}

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    invoiceNumber: 'INV-2024-001',
    clientId: 'CLI-001',
    client: {
      id: 'CLI-001',
      name: 'María García',
      email: 'maria@techstart.com',
      company: 'TechStart LLC'
    },
    incorporationId: 'INC-2024-001',
    incorporation: {
      id: 'INC-2024-001',
      companyName: 'TechStart LLC',
      incorporationNumber: 'INC-2024-001'
    },
    amount: 3500,
    tax: 350,
    totalAmount: 3850,
    currency: 'USD',
    status: 'sent',
    issueDate: '2024-01-10T00:00:00Z',
    dueDate: '2024-01-25T00:00:00Z',
    description: 'Delaware LLC Incorporation Services',
    lineItems: [
      {
        id: 'LI-001',
        description: 'Delaware LLC Formation',
        quantity: 1,
        unitPrice: 2500,
        totalPrice: 2500,
        serviceType: 'incorporation'
      },
      {
        id: 'LI-002',
        description: 'Legal Consultation (4 hours)',
        quantity: 4,
        unitPrice: 250,
        totalPrice: 1000,
        serviceType: 'consultation'
      }
    ],
    notes: 'Payment due within 15 days',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z'
  },
  {
    id: 'INV-002',
    invoiceNumber: 'INV-2024-002',
    clientId: 'CLI-002',
    client: {
      id: 'CLI-002',
      name: 'Pedro Martínez',
      email: 'pedro@globaltrading.com',
      company: 'Global Trading Ltd'
    },
    incorporationId: 'INC-2024-002',
    incorporation: {
      id: 'INC-2024-002',
      companyName: 'Global Trading Ltd',
      incorporationNumber: 'INC-2024-002'
    },
    amount: 4200,
    tax: 420,
    totalAmount: 4620,
    currency: 'USD',
    status: 'paid',
    issueDate: '2024-01-05T00:00:00Z',
    dueDate: '2024-01-20T00:00:00Z',
    paidDate: '2024-01-18T14:30:00Z',
    description: 'UK Limited Company Incorporation',
    lineItems: [
      {
        id: 'LI-003',
        description: 'UK Limited Company Formation',
        quantity: 1,
        unitPrice: 3200,
        totalPrice: 3200,
        serviceType: 'incorporation'
      },
      {
        id: 'LI-004',
        description: 'Document Preparation and Review',
        quantity: 1,
        unitPrice: 1000,
        totalPrice: 1000,
        serviceType: 'document_preparation'
      }
    ],
    paymentMethod: 'Bank Transfer',
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-18T14:30:00Z'
  }
];

const mockStats = {
  totalRevenue: 125600,
  monthlyRevenue: 28500,
  pendingInvoices: 12,
  pendingAmount: 45800,
  paidInvoices: 34,
  overdueInvoices: 3,
  averageInvoiceAmount: 3250,
  collectionRate: 94.5
};

export default function BillingPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [filters, setFilters] = useState<BillingFilters>({
    search: '',
    status: '',
    clientId: '',
    dateRange: '',
    amountRange: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'client' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'sent': return <Send className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.billing') || 'Billing & Invoices'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.billingSubtitle') || 'Manage invoices, payments, and billing for legal services'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/${locale}/${tenantSlug}/legal/billing/time-tracking`}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Clock className="h-4 w-4 mr-2" />
            {t('legal.timeTracking') || 'Time Tracking'}
          </Link>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('legal.createInvoice') || 'Create Invoice'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.monthlyRevenue') || 'Monthly Revenue'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(mockStats.monthlyRevenue)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-600 ml-1">{t('legal.vs') || 'vs last month'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.pendingInvoices') || 'Pending Invoices'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.pendingInvoices}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-600 font-medium">
              {formatCurrency(mockStats.pendingAmount)}
            </span>
            <span className="text-gray-600 ml-1">{t('legal.totalPending') || 'total pending'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.paidInvoices') || 'Paid Invoices'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.paidInvoices}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600 font-medium">{mockStats.collectionRate}%</span>
            <span className="text-gray-600 ml-1">{t('legal.collectionRate') || 'collection rate'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.overdueInvoices') || 'Overdue Invoices'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.overdueInvoices}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
            <span className="text-red-600 font-medium">
              {t('legal.requiresAttention') || 'Requires attention'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('legal.searchInvoices') || 'Search invoices...'}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('legal.allStatuses') || 'All Statuses'}</option>
              <option value="draft">{t('legal.invoiceStatus.draft') || 'Draft'}</option>
              <option value="sent">{t('legal.invoiceStatus.sent') || 'Sent'}</option>
              <option value="paid">{t('legal.invoiceStatus.paid') || 'Paid'}</option>
              <option value="overdue">{t('legal.invoiceStatus.overdue') || 'Overdue'}</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('legal.allDates') || 'All Dates'}</option>
              <option value="today">{t('legal.today') || 'Today'}</option>
              <option value="week">{t('legal.thisWeek') || 'This Week'}</option>
              <option value="month">{t('legal.thisMonth') || 'This Month'}</option>
              <option value="quarter">{t('legal.thisQuarter') || 'This Quarter'}</option>
            </select>

            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              {t('legal.moreFilters') || 'More Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('legal.invoicesList') || 'Invoices'}
            </h2>
            <div className="flex items-center space-x-4">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as typeof sortOrder);
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
              >
                <option value="date-desc">{t('legal.sortByDateDesc') || 'Newest First'}</option>
                <option value="date-asc">{t('legal.sortByDateAsc') || 'Oldest First'}</option>
                <option value="amount-desc">{t('legal.sortByAmountDesc') || 'Highest Amount'}</option>
                <option value="amount-asc">{t('legal.sortByAmountAsc') || 'Lowest Amount'}</option>
                <option value="client-asc">{t('legal.sortByClientAsc') || 'Client A-Z'}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getStatusIcon(invoice.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link
                          href={`/${locale}/${tenantSlug}/legal/billing/invoices/${invoice.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {t(`legal.invoiceStatus.${invoice.status}`) || invoice.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {invoice.client.name}
                          {invoice.client.company && ` (${invoice.client.company})`}
                        </p>
                        {invoice.incorporation && (
                          <p className="flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            <Link
                              href={`/${locale}/${tenantSlug}/legal/incorporations/${invoice.incorporation.id}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {invoice.incorporation.companyName}
                            </Link>
                          </p>
                        )}
                        <p className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {t('legal.issued') || 'Issued'}: {formatDate(invoice.issueDate)} | 
                          {t('legal.due') || 'Due'}: {formatDate(invoice.dueDate)}
                        </p>
                        {invoice.paidDate && (
                          <p className="flex items-center text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('legal.paid') || 'Paid'}: {formatDate(invoice.paidDate)}
                          </p>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-2">{invoice.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2 ml-4">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t('legal.subtotal') || 'Subtotal'}: {formatCurrency(invoice.amount, invoice.currency)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      {invoice.status === 'draft' && (
                        <button className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors">
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 