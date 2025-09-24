
import React, { useState } from 'react';
import Card from './ui/Card';
import { supabase } from '../services/supabaseClient';
import { Transaction } from '../types';

const Export: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Você precisa estar logado para exportar dados.');
        setIsExporting(false);
        return;
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error || !transactions) {
      alert('Erro ao buscar transações para exportar.');
      console.error(error);
      setIsExporting(false);
      return;
    }

    if (transactions.length === 0) {
      alert('Nenhuma transação para exportar.');
      setIsExporting(false);
      return;
    }

    // Convert to CSV
    const headers = ['id', 'description', 'category', 'amount', 'type', 'date', 'recurring'];
    const csvRows = [
      headers.join(','),
      ...transactions.map((t: Transaction) => [
        t.id,
        `"${t.description.replace(/"/g, '""')}"`, // Handle quotes in description
        t.category,
        t.amount,
        t.type,
        t.date,
        t.recurring,
      ].join(','))
    ];
    const csvString = csvRows.join('\n');

    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'zap_financeiro_transacoes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="Exportar Dados">
        <div className="text-center space-y-4 p-8">
            <p className="text-zap-text-secondary">Exporte suas transações para um arquivo CSV, compatível com Excel e outras planilhas, para análises detalhadas ou para manter um backup local.</p>
            <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-zap-green-light text-white font-semibold py-2.5 px-6 rounded-md hover:bg-green-500 transition-colors inline-flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>{isExporting ? 'Exportando...' : 'Exportar para CSV'}</span>
            </button>
        </div>
      </Card>
    </div>
  );
};

export default Export;
