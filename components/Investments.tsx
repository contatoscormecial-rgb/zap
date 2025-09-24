
import React, { useState, useEffect, useMemo } from 'react';
import Card from './ui/Card';
import { supabase } from '../services/supabaseClient';
import { Investment } from '../types';
import InvestmentChart from './charts/InvestmentChart';
import { formatCurrencyBRL } from '../utils/formatters';
import { Theme } from '../App';

interface InvestmentsProps {
    theme: Theme;
}

const Investments: React.FC<InvestmentsProps> = ({ theme }) => {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loadingInvestments, setLoadingInvestments] = useState(true);
    const [errorInvestments, setErrorInvestments] = useState<string | null>(null);
    const [showAddInvestmentForm, setShowAddInvestmentForm] = useState(false);

    // Form states for adding new investment
    const [newInvestmentDescription, setNewInvestmentDescription] = useState('');
    const [newInvestmentAmount, setNewInvestmentAmount] = useState('');
    const [newInvestmentDate, setNewInvestmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [addInvestmentLoading, setAddInvestmentLoading] = useState(false);
    const [addInvestmentError, setAddInvestmentError] = useState<string | null>(null);

    const fetchInvestments = async () => {
        setLoadingInvestments(true);
        setErrorInvestments(null);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setInvestments([]);
            setLoadingInvestments(false);
            return;
        }

        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (error) {
            setErrorInvestments(error.message);
            console.error('Error fetching investments:', error.message);
        } else {
            setInvestments(data || []);
        }
        setLoadingInvestments(false);
    };

    useEffect(() => {
        fetchInvestments();
    }, []);

    const investmentChartData = useMemo(() => {
      if (!investments || investments.length === 0) return [];
      const sorted = [...investments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let cumulative = 0;
      const dataMap = new Map<string, number>();

      for(const inv of sorted) {
          cumulative += inv.amount;
          dataMap.set(inv.date, cumulative);
      }
      
      return Array.from(dataMap, ([date, total]) => ({date, total}));
  }, [investments]);

    const handleAddInvestment = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddInvestmentLoading(true);
        setAddInvestmentError(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setAddInvestmentError('Você precisa estar logado para adicionar um investimento.');
            setAddInvestmentLoading(false);
            return;
        }

        const amount = parseFloat(newInvestmentAmount);
        if (isNaN(amount) || amount <= 0) {
            setAddInvestmentError('Please enter a valid amount.');
            setAddInvestmentLoading(false);
            return;
        }
        if (!newInvestmentDescription || !newInvestmentDate) {
            setAddInvestmentError('Please fill all fields.');
            setAddInvestmentLoading(false);
            return;
        }

        const { error } = await supabase.from('investments').insert({
            description: newInvestmentDescription,
            amount: amount,
            date: newInvestmentDate,
            user_id: user.id
        });

        if (error) {
            setAddInvestmentError(error.message);
            console.error('Error adding investment:', error.message);
        } else {
            setNewInvestmentDescription('');
            setNewInvestmentAmount('');
            setNewInvestmentDate(new Date().toISOString().split('T')[0]);
            setShowAddInvestmentForm(false);
            fetchInvestments();
        }
        setAddInvestmentLoading(false);
    };

    const handleDeleteInvestment = async (id: number) => {
        if (window.confirm('Tem certeza que deseja apagar este investimento?')) {
            const { error } = await supabase.from('investments').delete().eq('id', id);
            if (error) {
                console.error('Error deleting investment:', error.message);
                setErrorInvestments('Failed to delete investment.');
            } else {
                fetchInvestments();
            }
        }
    };

    const ActionButton: React.FC<{text: string, onClick: () => void}> = ({text, onClick}) => (
        <button onClick={onClick} className="flex items-center space-x-2 bg-zap-green/20 dark:bg-zap-green/30 text-zap-green-dark dark:text-zap-green-light font-semibold px-3 py-2 rounded-md hover:bg-zap-green/30 dark:hover:bg-zap-green/50 transition-colors text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            <span>{text}</span>
        </button>
    );

    const AddInvestmentForm: React.FC = () => (
        <Card title="Novo Investimento">
            <form className="space-y-4" onSubmit={handleAddInvestment}>
                <div>
                    <label htmlFor="investmentDescription" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Descrição</label>
                    <input type="text" id="investmentDescription" placeholder="Ex: Ações da Empresa X" value={newInvestmentDescription} onChange={(e) => setNewInvestmentDescription(e.target.value)} className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" required />
                </div>
                <div>
                    <label htmlFor="investmentAmount" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Valor</label>
                    <input type="number" id="investmentAmount" placeholder="0.00" value={newInvestmentAmount} onChange={(e) => setNewInvestmentAmount(e.target.value)} className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" step="0.01" required />
                </div>
                <div>
                    <label htmlFor="investmentDate" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Data</label>
                    <input type="date" id="investmentDate" value={newInvestmentDate} onChange={(e) => setNewInvestmentDate(e.target.value)} className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" required />
                </div>
                {addInvestmentError && <p className="text-red-500 text-sm text-center">{addInvestmentError}</p>}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={() => setShowAddInvestmentForm(false)} className="bg-gray-200 dark:bg-zap-border-blue text-gray-800 dark:text-zap-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
                    <button type="submit" className="bg-zap-green-light text-white px-4 py-2 rounded-md hover:bg-green-500 transition-colors" disabled={addInvestmentLoading}>
                        {addInvestmentLoading ? 'Adicionando...' : 'Salvar Investimento'}
                    </button>
                </div>
            </form>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
                {showAddInvestmentForm && <AddInvestmentForm />}
                <Card title="Meus Investimentos" titleAddon={<ActionButton text="Novo Investimento" onClick={() => setShowAddInvestmentForm(!showAddInvestmentForm)} />}>
                    {loadingInvestments ? (
                        <p className="text-center text-gray-500 dark:text-zap-text-secondary py-10">Carregando...</p>
                    ) : errorInvestments ? (
                        <p className="text-center text-red-500 py-10">{errorInvestments}</p>
                    ) : investments.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-zap-text-secondary py-10">Nenhum investimento adicionado.</p>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {investments.map(inv => (
                                <div key={inv.id} className="flex justify-between items-center bg-gray-50 dark:bg-zap-dark-blue p-3 rounded-md border border-gray-200 dark:border-zap-border-blue">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-zap-text-primary">{inv.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-zap-text-secondary">{new Date(inv.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-zap-green-light">{formatCurrencyBRL(inv.amount)}</p>
                                        <button onClick={() => handleDeleteInvestment(inv.id)} className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
            <div className="space-y-6">
                <Card title="Evolução dos Investimentos">
                    {investmentChartData.length > 0 ? (
                        <InvestmentChart data={investmentChartData} theme={theme} />
                    ) : (
                        <p className="text-center text-gray-500 dark:text-zap-text-secondary h-[250px] flex items-center justify-center">Adicione investimentos para ver a evolução.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Investments;
