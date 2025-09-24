import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrencyBRL } from '../../utils/formatters';
import { Theme } from '../../App';

interface ChartData {
    name: string;
    value: number;
}

interface DistributionPieChartProps {
    data: ChartData[];
    colors: string[];
    theme: Theme;
}

const DistributionPieChart: React.FC<DistributionPieChartProps> = ({ data, colors, theme }) => {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#161B22' : '#FFFFFF',
                        borderColor: theme === 'dark' ? '#30363D' : '#E5E7EB',
                        borderRadius: '0.5rem'
                    }}
                    itemStyle={{ color: theme === 'dark' ? '#C9D1D9' : '#1F2937' }}
                    formatter={(value: number, name: string) => [formatCurrencyBRL(value), name]}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default DistributionPieChart;