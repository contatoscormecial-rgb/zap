
export type Page = 'Relatórios' | 'Transações' | 'Cartões' | 'Lembretes' | 'Investimentos' | 'Exportar' | 'WhatsApp';

export interface Transaction {
  id: number;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD
  recurring: boolean;
  user_id?: string;
  created_at?: string;
}

export interface CardData {
    id: number;
    name: string;
    type: 'credit' | 'debit';
    due_date: string;
    limit_amount: number;
    user_id?: string;
    created_at?: string;
}

export interface Investment {
    id: number;
    description: string;
    amount: number;
    date: string; // YYYY-MM-DD
    user_id?: string;
    created_at?: string;
}

export interface Budget {
    id: number;
    category: string;
    limit_amount: number;
    user_id?: string;
    created_at?: string;
}

export interface FuturePurchase {
    id: number;
    description: string;
    estimated_amount: number;
    purchase_date: string; // YYYY-MM-DD
    user_id?: string;
    created_at?: string;
}

export interface Reminder {
    id: number;
    text: string;
    date: string; // YYYY-MM-DD
    user_id?: string;
    created_at?: string;
}

export interface FinancialGoal {
    id: number;
    text: string;
    target_amount: number;
    current_amount: number;
    user_id?: string;
    created_at?: string;
}

export interface WhatsAppNumber {
  id: string; // uuid
  user_id: string;
  name: string;
  number: string;
  is_active: boolean;
  description?: string | null;
  created_at: string;
  updated_at: string;
}