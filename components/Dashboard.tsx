import React, { useState, useEffect, useMemo } from 'react';
import Card from './ui/Card';
import { COLORS_EXPENSE, COLORS_INCOME } from '../constants';
import DistributionPieChart from './charts/DistributionPieChart';
import BalanceChart from './charts/BalanceChart';
import BalanceLineChart from './charts/BalanceLineChart';
import { supabase } from '../services/supabaseClient';
import { Transaction } from '../types';
import { formatCurrencyBRL } from '../utils/formatters';
import { Theme } from '../App';

type DistributionTab = 'Despesas' | 'Receitas' | 'Ambos';
type DateFilter = 'Hoje' | '7 Dias' | 'Este Mês' | 'Mês Passado' | null;
type ChartType = 'bar' | 'line';

interface DashboardProps {
    theme: Theme;
}


const Dashboard: React.FC<DashboardProps> = ({ theme }) => {
  const [distributionTab, setDistributionTab] = useState<DistributionTab>('Despesas');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilter>('Este Mês');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');


  useEffect(() => {
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
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data || []);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Date Filtering
    if (activeDateFilter) {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch(activeDateFilter) {
        case 'Hoje':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case '7 Dias':
          startDate = new Date(new Date().setDate(now.getDate() - 6));
          startDate.setHours(0,0,0,0);
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'Este Mês':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'Mês Passado':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
      }

      if (startDate && endDate) {
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        filtered = filtered.filter(t => {
            const transactionDate = new Date(t.date + 'T00:00:00').getTime();
            return transactionDate >= startTime && transactionDate <= endTime;
        });
      }
    }

    // Description filtering
    if (descriptionFilter.trim() !== '') {
        filtered = filtered.filter(t => t.description.toLowerCase().includes(descriptionFilter.toLowerCase()));
    }

    return filtered;
  }, [transactions, activeDateFilter, descriptionFilter]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const expenseDistribution = Object.entries(
    filteredTransactions.filter(t => t.type === 'expense').reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]: [string, number]) => ({ name, value }));

  const incomeDistribution = Object.entries(
    filteredTransactions.filter(t => t.type === 'income').reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]: [string, number]) => ({ name, value }));

  const balanceEvolution = filteredTransactions.reduce((acc: Record<string, {name: string, Receita: number, Despesa: number, Saldo: number}>, t) => {
    const month = new Date(t.date + 'T00:00:00').toLocaleString('default', { month: '2-digit', year: '2-digit' });
    if (!acc[month]) {
      acc[month] = { name: month, Receita: 0, Despesa: 0, Saldo: 0 };
    }
    if (t.type === 'income') {
      acc[month].Receita += t.amount;
    } else {
      acc[month].Despesa += t.amount;
    }
    return acc;
  }, {} as Record<string, {name: string, Receita: number, Despesa: number, Saldo: number}>);

  const balanceEvolutionData = Object.values(balanceEvolution).map((d: {name: string; Receita: number; Despesa: number; Saldo: number;}) => ({...d, Saldo: d.Receita - d.Despesa})).sort((a, b) => {
      const [aMonth, aYear] = a.name.split('/');
      const [bMonth, bYear] = b.name.split('/');
      return new Date(`20${aYear}-${aMonth}-01`).getTime() - new Date(`20${bYear}-${bMonth}-01`).getTime();
  });

  const topExpenses = useMemo(() => {
    return [...filteredTransactions]
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
  }, [filteredTransactions]);

  const topIncomes = useMemo(() => {
      return [...filteredTransactions]
          .filter(t => t.type === 'income')
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
  }, [filteredTransactions]);

  const renderDistributionContent = () => {
    switch(distributionTab) {
      case 'Despesas':
        return (
          <>
            <DistributionPieChart data={expenseDistribution} colors={COLORS_EXPENSE} theme={theme} />
            <div className="mt-4 space-y-2 text-sm">
                {expenseDistribution.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_EXPENSE[index % COLORS_EXPENSE.length] }}></span>
                            <span style={{ color: COLORS_EXPENSE[index % COLORS_EXPENSE.length] }}>{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-zap-text-primary">{formatCurrencyBRL(item.value)}</span>
                    </div>
                ))}
            </div>
          </>
        );
      case 'Receitas':
        return (
          <>
            <DistributionPieChart data={incomeDistribution} colors={COLORS_INCOME} theme={theme} />
             <div className="mt-4 space-y-2 text-sm">
                {incomeDistribution.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_INCOME[index % COLORS_INCOME.length] }}></span>
                            <span style={{ color: COLORS_INCOME[index % COLORS_INCOME.length] }}>{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-zap-text-primary">{formatCurrencyBRL(item.value)}</span>
                    </div>
                ))}
            </div>
          </>
        );
      case 'Ambos':
        return (
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <h3 className="text-center font-semibold text-gray-500 dark:text-zap-text-secondary text-base mb-2">Despesas</h3>
                    {expenseDistribution.length > 0 ? (
                        <>
                            <DistributionPieChart data={expenseDistribution} colors={COLORS_EXPENSE} theme={theme} />
                            <div className="mt-4 space-y-1 text-xs">
                                {expenseDistribution.map((item, index) => (
                                    <div key={item.name} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_EXPENSE[index % COLORS_EXPENSE.length] }}></span><span style={{ color: COLORS_EXPENSE[index % COLORS_EXPENSE.length] }}>{item.name}</span></div>
                                        <span className="font-semibold text-gray-800 dark:text-zap-text-primary">{formatCurrencyBRL(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <p className="text-center text-gray-500 dark:text-zap-text-secondary py-10">Nenhuma despesa</p>}
                </div>
                <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-200 dark:border-zap-border-blue pt-4 md:pt-0 md:pl-6">
                    <h3 className="text-center font-semibold text-gray-500 dark:text-zap-text-secondary text-base mb-2">Receitas</h3>
                    {incomeDistribution.length > 0 ? (
                        <>
                            <DistributionPieChart data={incomeDistribution} colors={COLORS_INCOME} theme={theme} />
                            <div className="mt-4 space-y-1 text-xs">
                                {incomeDistribution.map((item, index) => (
                                    <div key={item.name} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_INCOME[index % COLORS_INCOME.length] }}></span><span style={{ color: COLORS_INCOME[index % COLORS_INCOME.length] }}>{item.name}</span></div>
                                        <span className="font-semibold text-gray-800 dark:text-zap-text-primary">{formatCurrencyBRL(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <p className="text-center text-gray-500 dark:text-zap-text-secondary py-10">Nenhuma receita</p>}
                </div>
            </div>
        );
      default:
        return null;
    }
  }

  const FilterButton: React.FC<{label: DateFilter}> = ({label}) => (
    <button 
      onClick={() => setActiveDateFilter(label)}
      className={`w-full border text-gray-500 dark:text-zap-text-secondary py-2 rounded-md hover:bg-gray-200 dark:hover:bg-zap-border-blue hover:text-gray-800 dark:hover:text-zap-text-primary transition-colors text-sm ${activeDateFilter === label ? 'bg-gray-200 dark:bg-zap-border-blue text-gray-900 dark:text-zap-text-primary border-zap-green-light' : 'bg-white dark:bg-zap-card-blue border-gray-200 dark:border-zap-border-blue'}`}
    >
      {label}
    </button>
  );
  
  const SummaryCard: React.FC<{title: string, amount: number, colorClass: string}> = ({title, amount, colorClass}) => (
      <div className={`${colorClass} p-4 rounded-lg shadow-md`}>
          <div className="flex justify-between items-center mb-1">
              <h3 className="text-md font-semibold text-white">{title}</h3>
              <div className="relative group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 R 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="absolute bottom-full -translate-x-1/2 left-1/2 mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      {`Total de ${title.toLowerCase()} no período selecionado.`}
                  </span>
              </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrencyBRL(amount)}</p>
      </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3 space-y-6">
        <Card title="Filtros">
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-zap-text-secondary mb-2">Filtros de Data</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <FilterButton label="Hoje" />
                        <FilterButton label="7 Dias" />
                        <FilterButton label="Este Mês" />
                        <FilterButton label="Mês Passado" />
                    </div>
                    
                    <button onClick={() => setActiveDateFilter(null)} className="text-center w-full text-gray-500 dark:text-zap-text-secondary text-xs mt-2 hover:text-gray-700 dark:hover:text-zap-text-primary">Limpar Filtros de Data</button>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-zap-text-secondary mb-2">Filtro por Descrição</h4>
                    <div className="flex space-x-2">
                        <input type="text" placeholder="Filtrar por descrição..." value={descriptionFilter} onChange={(e) => setDescriptionFilter(e.target.value)} className="flex-grow bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light"/>
                    </div>
                </div>
            </div>
        </Card>
        <div className="space-y-4">
            <SummaryCard title="Saldo Total" amount={totalBalance} colorClass="bg-zap-green" />
            <SummaryCard title="Receitas Totais" amount={totalIncome} colorClass="bg-zap-green-light" />
            <SummaryCard title="Despesas Totais" amount={totalExpense} colorClass="bg-zap-red" />
        </div>
      </aside>

      <div className="lg:col-span-9 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Distribuição dos Gastos e Ganhos">
                <div className="flex justify-center border-b border-gray-200 dark:border-zap-border-blue mb-4">
                    <button onClick={() => setDistributionTab('Despesas')} className={`px-4 py-2 text-sm ${distributionTab === 'Despesas' ? 'border-b-2 border-zap-blue text-gray-800 dark:text-zap-text-primary' : 'text-gray-500 dark:text-zap-text-secondary'}`}>Despesas</button>
                    <button onClick={() => setDistributionTab('Receitas')} className={`px-4 py-2 text-sm ${distributionTab === 'Receitas' ? 'border-b-2 border-zap-blue text-gray-800 dark:text-zap-text-primary' : 'text-gray-500 dark:text-zap-text-secondary'}`}>Receitas</button>
                    <button onClick={() => setDistributionTab('Ambos')} className={`px-4 py-2 text-sm ${distributionTab === 'Ambos' ? 'border-b-2 border-zap-blue text-gray-800 dark:text-zap-text-primary' : 'text-gray-500 dark:text-zap-text-secondary'}`}>Ambos</button>
                </div>
                {renderDistributionContent()}
            </Card>

            <Card title="Evolução do Saldo" titleAddon={
                <div className="flex items-center space-x-1 border border-gray-300 dark:border-zap-border-blue rounded-md p-0.5 text-xs">
                    <button onClick={() => setChartType('bar')} className={`px-3 py-1 rounded ${chartType === 'bar' ? 'bg-gray-200 dark:bg-zap-border-blue text-gray-900 dark:text-zap-text-primary' : 'text-gray-600 dark:text-zap-text-secondary'}`}>Barras</button>
                    <button onClick={() => setChartType('line')} className={`px-3 py-1 rounded ${chartType === 'line' ? 'bg-gray-200 dark:bg-zap-border-blue text-gray-900 dark:text-zap-text-primary' : 'text-gray-600 dark:text-zap-text-secondary'}`}>Linha</button>
                </div>
            }>
                {chartType === 'bar' ? <BalanceChart data={balanceEvolutionData} theme={theme} /> : <BalanceLineChart data={balanceEvolutionData} theme={theme} />}
            </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Top Gastos">
                {topExpenses.length > 0 ? (
                    <div className="space-y-3 h-40 overflow-y-auto pr-2">
                        {topExpenses.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                                <div className="flex flex-col overflow-hidden mr-2">
                                    <span className="font-medium text-gray-800 dark:text-zap-text-primary truncate" title={item.description}>{item.description}</span>
                                    <span className="text-xs text-gray-500 dark:text-zap-text-secondary">{item.category}</span>
                                </div>
                                <span className="font-semibold text-zap-red whitespace-nowrap">{formatCurrencyBRL(item.amount)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-zap-text-secondary h-40 flex items-center justify-center">Nenhum gasto no período selecionado.</p>
                )}
            </Card>
            <Card title="Top Receitas">
                {topIncomes.length > 0 ? (
                    <div className="space-y-3 h-40 overflow-y-auto pr-2">
                        {topIncomes.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                                <div className="flex flex-col overflow-hidden mr-2">
                                    <span className="font-medium text-gray-800 dark:text-zap-text-primary truncate" title={item.description}>{item.description}</span>
                                    <span className="text-xs text-gray-500 dark:text-zap-text-secondary">{item.category}</span>
                                </div>
                                <span className="font-semibold text-zap-green-light whitespace-nowrap">{formatCurrencyBRL(item.amount)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-zap-text-secondary h-40 flex items-center justify-center">Nenhuma receita no período selecionado.</p>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;