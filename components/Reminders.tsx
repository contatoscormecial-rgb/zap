import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import { supabase } from '../services/supabaseClient';
import { Reminder, FinancialGoal } from '../types';
import { formatCurrencyBRL } from '../utils/formatters';

const Reminders: React.FC = () => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [goals, setGoals] = useState<FinancialGoal[]>([]);
    
    const [loadingReminders, setLoadingReminders] = useState(true);
    const [loadingGoals, setLoadingGoals] = useState(true);

    const [remindersError, setRemindersError] = useState<string | null>(null);
    const [goalsError, setGoalsError] = useState<string | null>(null);
    
    const [showAddReminder, setShowAddReminder] = useState(false);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [updatingGoal, setUpdatingGoal] = useState<FinancialGoal | null>(null);


    const fetchData = async () => {
        setLoadingReminders(true);
        setLoadingGoals(true);
        setRemindersError(null);
        setGoalsError(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoadingReminders(false);
            setLoadingGoals(false);
            return;
        }

        // Fetch Reminders
        const { data: remindersData, error: remindersErr } = await supabase.from('reminders').select('*').eq('user_id', user.id).order('date');
        if (remindersErr) {
            if (remindersErr.message.includes("does not exist")) setRemindersError("Tabela 'reminders' não encontrada no banco de dados.");
            else setRemindersError("Erro ao buscar lembretes.");
        } else setReminders(remindersData || []);
        setLoadingReminders(false);

        // Fetch Goals
        const { data: goalsData, error: goalsErr } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at');
         if (goalsErr) {
            if (goalsErr.message.includes("does not exist")) setGoalsError("Tabela 'goals' não encontrada.");
            else setGoalsError("Erro ao buscar metas.");
        } else setGoals(goalsData || []);
        setLoadingGoals(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const deleteReminder = async (id: number) => {
        if(window.confirm('Tem certeza que deseja apagar este lembrete?')) {
            await supabase.from('reminders').delete().eq('id', id);
            fetchData();
        }
    };
    
    const deleteGoal = async (id: number) => {
        if(window.confirm('Tem certeza que deseja apagar esta meta?')) {
            await supabase.from('goals').delete().eq('id', id);
            fetchData();
        }
    };

    const handleUpdateGoal = async (goal: FinancialGoal, amount: number, type: 'add' | 'subtract') => {
        const newAmount = type === 'add'
            ? goal.current_amount + amount
            : goal.current_amount - amount;

        const { error } = await supabase
            .from('goals')
            .update({ current_amount: newAmount < 0 ? 0 : newAmount })
            .eq('id', goal.id);

        if (error) {
            console.error('Error updating goal:', error);
            alert(`Erro ao atualizar meta: ${error.message}`);
        } else {
            setUpdatingGoal(null); // Close modal
            fetchData(); // Refresh data
        }
    };

    const UpdateGoalModal: React.FC<{
        goal: FinancialGoal;
        onUpdate: (goal: FinancialGoal, amount: number, type: 'add' | 'subtract') => Promise<void>;
        onClose: () => void;
    }> = ({ goal, onUpdate, onClose }) => {
        const [amount, setAmount] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleSubmit = async (type: 'add' | 'subtract') => {
            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                alert("Por favor, insira um valor válido.");
                return;
            }
            setIsSubmitting(true);
            await onUpdate(goal, numericAmount, type);
            setIsSubmitting(false);
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                <div className="bg-white dark:bg-zap-card-blue rounded-lg p-6 w-full max-w-sm border border-gray-200 dark:border-zap-border-blue">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-zap-text-primary mb-4">Atualizar Meta</h2>
                    <p className="text-gray-500 dark:text-zap-text-secondary mb-2">Meta: <span className="font-medium text-gray-800 dark:text-zap-text-primary">{goal.text}</span></p>
                    <p className="text-gray-500 dark:text-zap-text-secondary mb-4">Progresso Atual: <span className="font-medium text-gray-800 dark:text-zap-text-primary">{formatCurrencyBRL(goal.current_amount)}</span></p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="update-amount" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Valor</label>
                            <input
                                type="number"
                                step="0.01"
                                id="update-amount"
                                placeholder="R$ 0,00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light"
                            />
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-zap-border-blue text-gray-800 dark:text-zap-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">Cancelar</button>
                            <button type="button" onClick={() => handleSubmit('subtract')} disabled={isSubmitting} className="bg-zap-red text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition-colors disabled:bg-gray-500 text-sm">
                                {isSubmitting ? '...' : 'Remover'}
                            </button>
                            <button type="button" onClick={() => handleSubmit('add')} disabled={isSubmitting} className="bg-zap-green-light text-white font-semibold py-2 px-4 rounded-md hover:bg-green-500 transition-colors disabled:bg-gray-500 text-sm">
                                {isSubmitting ? '...' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const ActionButton: React.FC<{text: string; onClick: () => void}> = ({text, onClick}) => (
        <button onClick={onClick} className="flex items-center space-x-2 bg-zap-green/20 dark:bg-zap-green/30 text-zap-green-dark dark:text-zap-green-light font-semibold px-3 py-2 rounded-md hover:bg-zap-green/30 dark:hover:bg-zap-green/50 transition-colors text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
            <span>{text}</span>
        </button>
    );

    const GoalItem: React.FC<{ goal: FinancialGoal }> = ({ goal }) => {
        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
        return (
            <div className="bg-gray-50 dark:bg-zap-dark-blue p-3 rounded-md border border-gray-200 dark:border-zap-border-blue space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-medium text-gray-800 dark:text-zap-text-primary">{goal.text}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                         <button onClick={() => setUpdatingGoal(goal)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-semibold">Atualizar</button>
                         <button onClick={() => deleteGoal(goal.id)} className="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 text-xs">Excluir</button>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 text-gray-500 dark:text-zap-text-secondary">
                        <span>{formatCurrencyBRL(goal.current_amount)}</span>
                        <span>{formatCurrencyBRL(goal.target_amount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-zap-border-blue rounded-full h-2"><div className="bg-zap-green-light h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div>
                </div>
            </div>
        );
    };

    const AddForm: React.FC<{type: 'reminder' | 'goal', onSave: () => void, onCancel: () => void}> = ({ type, onSave, onCancel }) => {
        const [description, setDescription] = useState('');
        const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
        const [targetAmount, setTargetAmount] = useState('');

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            if (type === 'reminder') {
                await supabase.from('reminders').insert({ text: description, date: date, user_id: user.id });
            } else {
                await supabase.from('goals').insert({ text: description, target_amount: parseFloat(targetAmount), current_amount: 0, user_id: user.id });
            }
            onSave();
        };

        return (
            <Card title={type === 'reminder' ? "Novo Lembrete" : "Nova Meta"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    {type === 'reminder' && <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />}
                    {type === 'goal' && <input type="number" step="0.01" placeholder="Valor da Meta" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />}
                    <div className="flex justify-end space-x-2"><button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-zap-border-blue px-4 py-2 rounded text-sm">Cancelar</button><button type="submit" className="bg-zap-green-light text-white px-4 py-2 rounded text-sm">Salvar</button></div>
                </form>
            </Card>
        );
    };

    return (
        <>
            {updatingGoal && (
                <UpdateGoalModal
                    goal={updatingGoal}
                    onUpdate={handleUpdateGoal}
                    onClose={() => setUpdatingGoal(null)}
                />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                    {showAddReminder && <AddForm type="reminder" onSave={() => { fetchData(); setShowAddReminder(false); }} onCancel={() => setShowAddReminder(false)} />}
                    <Card title="Lembretes" titleAddon={!remindersError && <ActionButton text="Novo Lembrete" onClick={() => setShowAddReminder(!showAddReminder)} />}>
                        {remindersError ? <p className="text-center text-yellow-500">{remindersError}</p> : loadingReminders ? <p className="text-center text-gray-500 dark:text-zap-text-secondary">Carregando...</p> : reminders.length === 0 ? <p className="text-center text-gray-500 dark:text-zap-text-secondary py-10">Nenhum lembrete cadastrado.</p> : (
                            <div className="space-y-3">
                                {reminders.map(r => (
                                    <div key={r.id} className="flex items-center justify-between bg-gray-50 dark:bg-zap-dark-blue p-3 rounded-md border border-gray-200 dark:border-zap-border-blue">
                                        <div>
                                            <p className='text-gray-800 dark:text-zap-text-primary'>{r.text}</p>
                                            <p className="text-xs text-gray-500 dark:text-zap-text-secondary">{new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <button onClick={() => deleteReminder(r.id)} className="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 text-xs">Excluir</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
                <div className="space-y-4">
                    {showAddGoal && <AddForm type="goal" onSave={() => { fetchData(); setShowAddGoal(false); }} onCancel={() => setShowAddGoal(false)} />}
                    <Card title="Metas Financeiras" titleAddon={!goalsError && <ActionButton text="Nova Meta" onClick={() => setShowAddGoal(!showAddGoal)} />}>
                        {goalsError ? <p className="text-center text-yellow-500">{goalsError}</p> : loadingGoals ? <p className="text-center text-gray-500 dark:text-zap-text-secondary">Carregando...</p> : goals.length === 0 ? <p className="text-center text-gray-500 dark:text-zap-text-secondary py-10">Nenhuma meta definida.</p> : (
                            <div className="space-y-3">
                               {goals.map(g => <GoalItem key={g.id} goal={g} />)}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
};

export default Reminders;