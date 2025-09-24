
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrencyBRL } from '../../utils/formatters';
import { Theme } from '../../App';

interface InvestmentChartProps {
    data: { date: string, total: number }[];
    theme: Theme;
}

const InvestmentChart: React.FC<InvestmentChartProps> = ({ data, theme }) => {
    const axisColor = theme === 'dark' ? '#8B949E' : '#6B7281';
    const gridColor = theme === 'dark' ? '#30363D' : '#E5E7EB';

    const formatDate = (tickItem: string) => {
        const date = new Date(tickItem + 'T00:00:00'); // Ensure date is parsed as local
        return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" stroke={axisColor} fontSize={12} tickFormatter={formatDate} minTickGap={20}/>
                <YAxis stroke={axisColor} fontSize={12} tickFormatter={(value) => formatCurrencyBRL(value as number).replace(/\s/g, '')} />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#161B22' : '#FFFFFF', 
                        borderColor: theme === 'dark' ? '#30363D' : '#E5E7EB',
                        borderRadius: '0.5rem' 
                    }} 
                    labelStyle={{ color: theme === 'dark' ? '#C9D1D9' : '#1F2937' }}
                    formatter={(value: number) => [formatCurrencyBRL(value), 'Total Investido']}
                    labelFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('pt-BR')}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: axisColor }} />
                <Line type="monotone" dataKey="total" name="Total Investido" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default InvestmentChart;