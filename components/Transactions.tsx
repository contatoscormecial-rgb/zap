import React, { useState, useEffect, useMemo } from 'react';
import Card from './ui/Card';
import { Transaction } from '../types';
import { supabase } from '../services/supabaseClient';
import { formatCurrencyBRL } from '../utils/formatters';

type TransactionFilter = 'all' | 'single' | 'recurring';

// Edit Modal Component
const EditTransactionModal: React.FC<{
    transaction: Transaction;
    onSave: (transaction: Transaction) => Promise<void>;
    onClose: () => void;
}> = ({ transaction, onSave, onClose }) => {
    const [formData, setFormData] = useState<Transaction>(transaction);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData(transaction);
    }, [transaction]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const numericAmount = parseFloat(String(formData.amount));
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert("Por favor, insira um valor válido e maior que zero.");
            setIsSubmitting(false);
            return;
        }
        await onSave({ ...formData, amount: numericAmount });
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-zap-card-blue rounded-lg p-6 w-full max-w-lg border border-gray-200 dark:border-zap-border-blue">
                 <h2 className="text-xl font-semibold text-gray-800 dark:text-zap-text-primary mb-4">Editar Transação</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-2">Tipo</label>
                        <div className="flex items-center space-x-4">
                           <label className="flex items-center"><input type="radio" name="type" className="form-radio text-zap-green-light focus:ring-zap-green-light" checked={formData.type === 'income'} onChange={() => setFormData({...formData, type: 'income'})} /> <span className="ml-2">Receita</span></label>
                           <label className="flex items-center"><input type="radio" name="type" className="form-radio text-zap-red focus:ring-zap-red" checked={formData.type === 'expense'} onChange={() => setFormData({...formData, type: 'expense'})}/> <span className="ml-2">Despesa</span></label>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="edit-recurring" name="recurring" className="form-checkbox text-zap-green-light rounded focus:ring-zap-green-light" checked={formData.recurring} onChange={handleChange} />
                        <label htmlFor="edit-recurring" className="ml-2 text-sm">Transação recorrente</label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="edit-category" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Categoria</label>
                            <select id="edit-category" name="category" value={formData.category} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light">
                                <option value="">Selecione...</option>
                                <option>Alimentação</option>
                                <option>Transporte</option>
                                <option>Moradia</option>
                                <option>Lazer</option>
                                <option>Salário</option>
                                <option>Outros</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor="edit-amount" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Valor</label>
                            <input type="number" step="0.01" id="edit-amount" name="amount" placeholder="R$ 0,00" value={formData.amount} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-date" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Data</label>
                            <input type="date" id="edit-date" name="date" value={formData.date} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                        </div>
                        <div>
                             <label htmlFor="edit-description" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Descrição</label>
                            <input type="text" id="edit-description" name="description" placeholder="Descreva a transação" value={formData.description} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-zap-border-blue text-gray-800 dark:text-zap-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-zap-green-light text-white font-semibold py-2 px-4 rounded-md hover:bg-green-500 transition-colors disabled:bg-gray-500">
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setTransactions([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
        } else {
            setTransactions(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleDelete = async (id: number) => {
        const transactionToDelete = transactions.find(t => t.id === id);
        if (!transactionToDelete) return;

        const confirmed = window.confirm(`Tem certeza que deseja excluir a transação "${transactionToDelete.description}"?`);
        
        if (confirmed) {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting transaction:', error);
                alert(`Falha ao excluir a transação: ${error.message}`);
            } else {
                setTransactions(currentTransactions =>
                    currentTransactions.filter(transaction => transaction.id !== id)
                );
            }
        }
    };

    const handleUpdate = async (updatedTransaction: Transaction) => {
        const { id, user_id, created_at, ...updateData } = updatedTransaction;
        const { error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', updatedTransaction.id);

        if (error) {
            console.error('Error updating transaction:', error);
            alert(`Erro ao atualizar transação: ${error.message}`);
        } else {
            setEditingTransaction(null);
            fetchTransactions();
        }
    };


    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                t.category.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (transactionFilter === 'all') {
                return searchMatch;
            } else if (transactionFilter === 'single') {
                return searchMatch && !t.recurring;
            } else if (transactionFilter === 'recurring') {
                return searchMatch && t.recurring;
            }
            return false;
        });
    }, [transactions, searchTerm, transactionFilter]);

    const AddTransactionForm: React.FC = () => {
        const [type, setType] = useState<'income' | 'expense'>('income');
        const [isRecurring, setIsRecurring] = useState(false);
        const [category, setCategory] = useState('');
        const [amount, setAmount] = useState('');
        const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
        const [description, setDescription] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                alert("Por favor, insira um valor válido e maior que zero.");
                return;
            }
            if (!category) {
                alert("Por favor, selecione uma categoria.");
                return;
            }

            setIsSubmitting(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                     const { error } = await supabase.from('transactions').insert({
                        description,
                        category,
                        amount: numericAmount,
                        type,
                        date,
                        recurring: isRecurring,
                        user_id: user.id
                    });

                    if (error) {
                        console.error('Error adding transaction:', error);
                        alert(`Erro ao adicionar transação: ${error.message}`);
                    } else {
                        // Reset form
                        setDescription('');
                        setCategory('');
                        setAmount('');
                        setDate(new Date().toISOString().slice(0, 10));
                        setIsRecurring(false);
                        setType('income');
                        // Refresh transactions
                        fetchTransactions();
                    }
                } else {
                    alert("Sessão expirada. Por favor, faça login novamente.");
                }
            } catch (err: any) {
                console.error("Unexpected error submitting form:", err);
                alert(`Ocorreu um erro inesperado: ${err.message}`);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <Card title="Nova Transação">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-2">Tipo</label>
                        <div className="flex items-center space-x-4">
                           <label className="flex items-center"><input type="radio" name="type" className="form-radio text-zap-green-light focus:ring-zap-green-light" checked={type === 'income'} onChange={() => setType('income')} /> <span className="ml-2">Receita</span></label>
                           <label className="flex items-center"><input type="radio" name="type" className="form-radio text-zap-red focus:ring-zap-red" checked={type === 'expense'} onChange={() => setType('expense')}/> <span className="ml-2">Despesa</span></label>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="recurring" className="form-checkbox text-zap-green-light rounded focus:ring-zap-green-light" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                        <label htmlFor="recurring" className="ml-2 text-sm">Transação recorrente (receita/despesa fixa)</label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Categoria</label>
                            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light">
                                <option value="">Selecione...</option>
                                <option>Alimentação</option>
                                <option>Transporte</option>
                                <option>Moradia</option>
                                <option>Lazer</option>
                                <option>Salário</option>
                                <option>Outros</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor="value" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Valor</label>
                            <input type="number" step="0.01" id="value" placeholder="R$ 0,00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Data</label>
                            <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                        </div>
                        <div>
                             <label htmlFor="description" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Descrição</label>
                            <input type="text" id="description" placeholder="Descreva a transação" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-zap-green-light text-white font-semibold py-2.5 rounded-md hover:bg-green-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Adicionando...' : 'Adicionar Transação'}
                    </button>
                </form>
            </Card>
        );
    };
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    }

    return (
        <>
            {editingTransaction && (
                <EditTransactionModal
                    transaction={editingTransaction}
                    onSave={handleUpdate}
                    onClose={() => setEditingTransaction(null)}
                />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-zap-text-primary">Transações</h2>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Pesquisar Registro..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 pl-10 pr-4 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zap-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        
                        <div className="flex border-b border-gray-200 dark:border-zap-border-blue mb-4">
                            <button onClick={() => setTransactionFilter('all')} className={`px-4 py-2 text-sm ${transactionFilter === 'all' ? 'border-b-2 border-zap-blue text-gray-800 dark:text-zap-text-primary' : 'text-gray-500 dark:text-zap-text-secondary'}`}>Todas</button>
                            <button onClick={() => setTransactionFilter('single')} className={`px-4 py-2 text-sm ${transactionFilter === 'single' ? 'border-b-2 border-zap-blue text-gray-800 dark:text-zap-text-primary' : 'text-gray-500 dark:text-zap-text-secondary'}`}>Únicas</button>
                            <button onClick={() => setTransactionFilter('recurring')} className={`px-4 py-2 text-sm ${transactionFilter === 'recurring' ? 'border-b-2 border-zap-blue text-gray-800 dark:text-zap-text-primary' : 'text-gray-500 dark:text-zap-text-secondary'}`}>Recorrentes</button>
                        </div>


                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-zap-text-secondary">
                                <thead className="text-xs text-gray-700 dark:text-zap-text-secondary uppercase bg-gray-100 dark:bg-zap-dark-blue">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Descrição</th>
                                        <th scope="col" className="px-6 py-3">Categoria</th>
                                        <th scope="col" className="px-6 py-3">Valor</th>
                                        <th scope="col" className="px-6 py-3">Tipo</th>
                                        <th scope="col" className="px-6 py-3">Data</th>
                                        <th scope="col" className="px-6 py-3">Recorrente</th>
                                        <th scope="col" className="px-6 py-3">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={7} className="text-center py-4">Carregando...</td></tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-4">Nenhuma transação encontrada.</td></tr>
                                    ) : filteredTransactions.map(t => (
                                        <tr key={t.id} className="bg-white dark:bg-zap-card-blue border-b border-gray-200 dark:border-zap-border-blue hover:bg-gray-50 dark:hover:bg-zap-border-blue/50">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-zap-text-primary whitespace-nowrap">{t.description}</td>
                                            <td className="px-6 py-4">{t.category}</td>
                                            <td className={`px-6 py-4 font-semibold ${t.type === 'income' ? 'text-zap-green-light' : 'text-zap-red'}`}>
                                                {t.type === 'income' ? '+' : '-'}{formatCurrencyBRL(t.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'}`}>
                                                    {t.type === 'income' ? 'Receita' : 'Despesa'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{formatDate(t.date)}</td>
                                            <td className="px-6 py-4">{t.recurring ? 'Sim' : 'Não'}</td>
                                            <td className="px-6 py-4 flex items-center space-x-2">
                                                <button onClick={() => setEditingTransaction(t)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Editar</button>
                                                <button onClick={() => handleDelete(t.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <AddTransactionForm />
                </div>
            </div>
        </>
    );
};

export default Transactions;