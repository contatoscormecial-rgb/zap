import React, { useState, useEffect, useMemo } from 'react';
import Card from './ui/Card';
import { supabase } from '../services/supabaseClient';
import { CardData, Budget, Transaction, FuturePurchase } from '../types';
import { formatCurrencyBRL } from '../utils/formatters';

const Cards: React.FC = () => {
    const [showAddCardForm, setShowAddCardForm] = useState(false);
    const [cards, setCards] = useState<CardData[]>([]);
    const [loadingCards, setLoadingCards] = useState(true);

    const [showAddBudgetForm, setShowAddBudgetForm] = useState(false);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingBudgets, setLoadingBudgets] = useState(true);
    const [budgetFeatureError, setBudgetFeatureError] = useState<string | null>(null);

    const [showAddPurchaseForm, setShowAddPurchaseForm] = useState(false);
    const [futurePurchases, setFuturePurchases] = useState<FuturePurchase[]>([]);
    const [loadingPurchases, setLoadingPurchases] = useState(true);
    const [purchaseFeatureError, setPurchaseFeatureError] = useState<string | null>(null);

    const fetchAllData = async () => {
        setLoadingCards(true);
        setLoadingBudgets(true);
        setLoadingPurchases(true);
        setBudgetFeatureError(null);
        setPurchaseFeatureError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoadingCards(false);
            setLoadingBudgets(false);
            setLoadingPurchases(false);
            return;
        }

        // Fetch Cards
        const { data: cardData, error: cardError } = await supabase.from('cards').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (cardError) console.error('Error fetching cards:', cardError);
        else setCards(cardData || []);
        setLoadingCards(false);

        // Fetch Budgets (using spending_limits table)
        const { data: budgetData, error: budgetError } = await supabase.from('spending_limits').select('*').eq('user_id', user.id);
        if (budgetError) {
            console.error('Error fetching budgets:', budgetError.message);
            if (budgetError.message.includes("does not exist")) {
                setBudgetFeatureError("A funcionalidade de 'Limites de Gastos' parece não estar configurada (tabela 'spending_limits' ausente).");
            } else {
                setBudgetFeatureError("Ocorreu um erro ao carregar os limites de gastos.");
            }
            setBudgets([]);
        } else {
            setBudgets(budgetData || []);
        }

        // Fetch transactions for budgets
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const { data: transactionData, error: transactionError } = await supabase.from('transactions').select('*').eq('user_id', user.id).eq('type', 'expense').gte('date', firstDay).lte('date', lastDay);
        if (transactionError) console.error('Error fetching transactions:', transactionError);
        else setTransactions(transactionData || []);
        setLoadingBudgets(false);

        // Fetch Future Purchases
        const { data: purchaseData, error: purchaseError } = await supabase.from('future_purchases').select('*').eq('user_id', user.id).order('purchase_date', { ascending: true });
        if (purchaseError) {
             console.error('Error fetching future purchases:', purchaseError.message);
            if (purchaseError.message.includes("does not exist")) {
                setPurchaseFeatureError("A funcionalidade de 'Compras Futuras' parece não estar configurada (tabela 'future_purchases' ausente).");
            } else {
                setPurchaseFeatureError("Ocorreu um erro ao carregar as compras futuras.");
            }
            setFuturePurchases([]);
        } else {
            setFuturePurchases(purchaseData || []);
        }
        setLoadingPurchases(false);
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const spentAmounts = useMemo(() => {
        const spent: Record<string, number> = {};
        for (const budget of budgets) {
            spent[budget.category] = transactions
                .filter(t => t.category === budget.category)
                .reduce((sum, t) => sum + t.amount, 0);
        }
        return spent;
    }, [budgets, transactions]);
    
    // Add Card Form Component
    const AddCardForm: React.FC<{onSuccess: () => void}> = ({onSuccess}) => {
        const [name, setName] = useState('');
        const [type, setType] = useState<'credit' | 'debit'>('credit');
        const [dueDate, setDueDate] = useState('');
        const [limit, setLimit] = useState('');

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('cards').insert({ name, type, due_date: dueDate, limit_amount: parseFloat(limit), user_id: user.id });
                if (error) alert(`Error: ${error.message}`);
                else onSuccess();
            }
        };

        return (
            <Card title="Adicionar Novo Cartão">
                 <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="cardName" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Nome do Cartão</label>
                        <input type="text" id="cardName" placeholder="Ex: Nubank, Bradesco, Inter" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-2">Tipo</label>
                         <div className="flex items-center space-x-4">
                            <label className="flex items-center"><input type="radio" name="cardType" className="form-radio text-zap-green-light" checked={type === 'credit'} onChange={() => setType('credit')} /> <span className="ml-2">Crédito</span></label>
                            <label className="flex items-center"><input type="radio" name="cardType" className="form-radio text-zap-green-light" checked={type === 'debit'} onChange={() => setType('debit')}/> <span className="ml-2">Débito</span></label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Vencimento</label>
                        <input type="text" id="dueDate" placeholder="Ex: Dia 10" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    </div>
                    <div>
                        <label htmlFor="totalLimit" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Limite</label>
                        <input type="number" step="0.01" id="totalLimit" placeholder="Ex: 1000.00" value={limit} onChange={e => setLimit(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setShowAddCardForm(false)} className="bg-gray-200 dark:bg-zap-border-blue text-gray-800 dark:text-zap-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="bg-zap-green-light text-white px-4 py-2 rounded-md hover:bg-green-500">Salvar Cartão</button>
                    </div>
                 </form>
            </Card>
        );
    };
    
    // Add Budget Form Component
    const AddBudgetForm: React.FC<{onSuccess: () => void}> = ({onSuccess}) => {
        const [category, setCategory] = useState('');
        const [limit, setLimit] = useState('');
        
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('spending_limits').insert({ category, limit_amount: parseFloat(limit), user_id: user.id });
                if (error) alert(`Error: ${error.message}`);
                else onSuccess();
            }
        }

        return (
            <Card title="Adicionar Limite de Gasto">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="category" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Categoria</label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light">
                            <option value="">Selecione...</option>
                            <option>Alimentação</option>
                            <option>Transporte</option>
                            <option>Moradia</option>
                            <option>Lazer</option>
                            <option>Outros</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="budgetLimit" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Limite Mensal</label>
                        <input type="number" step="0.01" id="budgetLimit" placeholder="Ex: 500.00" value={limit} onChange={e => setLimit(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    </div>
                     <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setShowAddBudgetForm(false)} className="bg-gray-200 dark:bg-zap-border-blue text-gray-800 dark:text-zap-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="bg-zap-green-light text-white px-4 py-2 rounded-md hover:bg-green-500">Adicionar Limite</button>
                    </div>
                </form>
            </Card>
        )
    };

    // Add Purchase Form Component
    const AddPurchaseForm: React.FC<{onSuccess: () => void}> = ({onSuccess}) => {
        const [description, setDescription] = useState('');
        const [amount, setAmount] = useState('');
        const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0,10));
        
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('future_purchases').insert({ description, estimated_amount: parseFloat(amount), purchase_date: purchaseDate, user_id: user.id });
                if (error) alert(`Error: ${error.message}`);
                else onSuccess();
            }
        }

        return (
            <Card title="Adicionar Compra Futura">
                <form className="space-y-4" onSubmit={handleSubmit}>
                     <div>
                        <label htmlFor="purchaseDescription" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Descrição</label>
                        <input type="text" id="purchaseDescription" placeholder="Ex: Novo Celular" value={description} onChange={e => setDescription(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    </div>
                    <div>
                        <label htmlFor="purchaseAmount" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Valor Estimado</label>
                        <input type="number" step="0.01" id="purchaseAmount" placeholder="Ex: 3500.00" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    </div>
                    <div>
                        <label htmlFor="purchaseDate" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Data da Compra</label>
                        <input type="date" id="purchaseDate" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    </div>
                     <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setShowAddPurchaseForm(false)} className="bg-gray-200 dark:bg-zap-border-blue text-gray-800 dark:text-zap-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="bg-zap-green-light text-white px-4 py-2 rounded-md hover:bg-green-500">Salvar</button>
                    </div>
                </form>
            </Card>
        )
    };

    const CardItem: React.FC<{card: CardData}> = ({ card }) => (
        <div className="bg-gray-50 dark:bg-zap-dark-blue p-4 rounded-lg border border-gray-200 dark:border-zap-border-blue">
            <h3 className="font-bold text-lg text-gray-800 dark:text-zap-text-primary">{card.name}</h3>
            <p className="text-sm text-gray-500 dark:text-zap-text-secondary capitalize">{card.type}</p>
            <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-zap-text-secondary">Limite: <span className="font-semibold text-gray-800 dark:text-zap-text-primary">{formatCurrencyBRL(card.limit_amount)}</span></p>
                <p className="text-sm text-gray-500 dark:text-zap-text-secondary">Vencimento: <span className="font-semibold text-gray-800 dark:text-zap-text-primary">{card.due_date}</span></p>
            </div>
        </div>
    );

    const BudgetItem: React.FC<{budget: Budget}> = ({ budget }) => {
        const spent = spentAmounts[budget.category] || 0;
        const limit = budget.limit_amount;
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;
        const progressBarColor = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

        return (
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-800 dark:text-zap-text-primary">{budget.category}</span>
                    <span className="text-gray-500 dark:text-zap-text-secondary">{formatCurrencyBRL(spent)} / {formatCurrencyBRL(limit)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zap-border-blue rounded-full h-2">
                    <div className={`${progressBarColor} h-2 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
            </div>
        )
    };
    
    const FuturePurchaseItem: React.FC<{purchase: FuturePurchase, onDelete: (id: number) => void}> = ({ purchase, onDelete }) => (
        <div className="flex justify-between items-center bg-gray-50 dark:bg-zap-dark-blue p-3 rounded-md border border-gray-200 dark:border-zap-border-blue">
            <div>
                <p className="font-medium text-gray-800 dark:text-zap-text-primary">{purchase.description}</p>
                <p className="text-sm text-gray-500 dark:text-zap-text-secondary">{formatCurrencyBRL(purchase.estimated_amount)} em {new Date(purchase.purchase_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
            </div>
            <button onClick={() => onDelete(purchase.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">Excluir</button>
        </div>
    );


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                 <Card title="Controle de Cartões">
                    <button onClick={() => setShowAddCardForm(!showAddCardForm)} className="bg-zap-green-light text-white font-semibold py-2 px-4 rounded-md hover:bg-green-500 transition-colors text-sm">+ Novo Cartão</button>
                    <div className="mt-4 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 text-sm rounded-lg p-4">
                        <p><span className="font-bold">Atenção:</span> As despesas registradas nessa seção <span className="font-bold">NÃO</span> são ligadas às despesas e receitas normais do Zap Financeiro.</p>
                    </div>
                 </Card>

                 {showAddCardForm && <AddCardForm onSuccess={() => { setShowAddCardForm(false); fetchAllData(); }} />}
                 
                 <Card title="MEUS CARTÕES">
                    {loadingCards ? (
                         <p className="text-center py-10 text-gray-500 dark:text-zap-text-secondary">Carregando cartões...</p>
                    ) : cards.length === 0 ? (
                         <div className="text-center py-10">
                            <p className="text-gray-500 dark:text-zap-text-secondary mb-4">Nenhum cartão cadastrado</p>
                            <button onClick={() => setShowAddCardForm(true)} className="bg-gray-200 dark:bg-zap-border-blue text-gray-800 dark:text-zap-text-primary font-semibold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">Adicionar Novo Cartão</button>
                         </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {cards.map(card => <CardItem key={card.id} card={card} />)}
                        </div>
                    )}
                 </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                {showAddBudgetForm && !budgetFeatureError && <AddBudgetForm onSuccess={() => { setShowAddBudgetForm(false); fetchAllData(); }} />}
                
                <Card title="Limites de Gastos">
                    {budgetFeatureError ? (
                         <div className="text-center bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 text-sm rounded-lg p-4">
                            <p className="font-semibold mb-2">Funcionalidade Indisponível</p>
                            <p>{budgetFeatureError}</p>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => setShowAddBudgetForm(!showAddBudgetForm)} className="bg-zap-green-light text-white font-semibold py-2 px-4 rounded-md hover:bg-green-500 transition-colors text-sm w-full mb-4">+ Adicionar Limite</button>
                            <div className="mb-4 bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-sm rounded-lg p-3">
                                <p><span className="font-bold">Como funciona:</span> O progresso de cada limite é calculado automaticamente com base nas despesas que você registra na página de 'Transações' para o mês atual.</p>
                            </div>
                            {loadingBudgets ? (
                                <p className="text-center py-10 text-gray-500 dark:text-zap-text-secondary">Carregando limites...</p>
                            ) : budgets.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 dark:text-zap-text-secondary">
                                    <p>Nenhum limite de gastos definido.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {budgets.map(budget => <BudgetItem key={budget.id} budget={budget} />)}
                                </div>
                            )}
                        </>
                    )}
                </Card>

                {showAddPurchaseForm && !purchaseFeatureError && <AddPurchaseForm onSuccess={() => { setShowAddPurchaseForm(false); fetchAllData(); }} />}
                 
                <Card title="Compras Futuras">
                    {purchaseFeatureError ? (
                        <div className="text-center bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 text-sm rounded-lg p-4">
                            <p className="font-semibold mb-2">Funcionalidade Indisponível</p>
                            <p>{purchaseFeatureError}</p>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => setShowAddPurchaseForm(!showAddPurchaseForm)} className="bg-zap-green-light text-white font-semibold py-2 px-4 rounded-md hover:bg-green-500 transition-colors text-sm w-full mb-4">+ Adicionar Compra</button>
                            {loadingPurchases ? (
                                <p className="text-center py-10 text-gray-500 dark:text-zap-text-secondary">Carregando compras...</p>
                            ) : futurePurchases.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 dark:text-zap-text-secondary">
                                    <p>Nenhuma compra futura registrada.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {futurePurchases.map(p => <FuturePurchaseItem key={p.id} purchase={p} onDelete={async (id) => { if(window.confirm('Excluir esta compra?')) { await supabase.from('future_purchases').delete().eq('id', id); fetchAllData(); }}} />)}
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Cards;