
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrencyBRL } from '../../utils/formatters';
import { Theme } from '../../App';

interface BalanceLineChartProps {
    data: any[];
    theme: Theme;
}

const BalanceLineChart: React.FC<BalanceLineChartProps> = ({ data, theme }) => {
    const axisColor = theme === 'dark' ? '#8B949E' : '#6B7281';
    const gridColor = theme === 'dark' ? '#30363D' : '#E5E7EB';
    
    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
                <YAxis stroke={axisColor} fontSize={12} tickFormatter={(value) => formatCurrencyBRL(value as number).replace(/\s/g, '')} />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#161B22' : '#FFFFFF', 
                        borderColor: theme === 'dark' ? '#30363D' : '#E5E7EB',
                        borderRadius: '0.5rem' 
                    }} 
                    labelStyle={{ color: theme === 'dark' ? '#C9D1D9' : '#1F2937' }}
                    formatter={(value: number, name: string) => [formatCurrencyBRL(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: axisColor }} />
                <Line type="monotone" dataKey="Receita" stroke="#22C55E" name="Receita" strokeWidth={2} />
                <Line type="monotone" dataKey="Despesa" stroke="#EF4444" name="Despesa" strokeWidth={2} />
                <Line type="monotone" dataKey="Saldo" stroke="#3B82F6" name="Saldo" strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default BalanceLineChart;