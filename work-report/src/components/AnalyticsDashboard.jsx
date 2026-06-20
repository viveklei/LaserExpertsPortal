import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import './AnalyticsDashboard.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const AnalyticsDashboard = ({ history }) => {
    const categoryData = useMemo(() => {
        const counts = {};
        history.forEach(report => {
            const items = report.data || report.tasks || [];
            items.forEach(item => {
                const cat = item.category || 'General';
                counts[cat] = (counts[cat] || 0) + 1;
            });
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [history]);

    const activityData = useMemo(() => {
        // Last 7 days activity
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        return last7Days.map(date => {
            const count = history
                .filter(r => r.date === date)
                .reduce((sum, r) => sum + (r.data || r.tasks || []).length, 0);

            return {
                date: date.split('-').slice(1).join('/'),
                tasks: count
            };
        });
    }, [history]);

    if (history.length === 0) {
        return (
            <div className="analytics-empty">
                <p>No data yet. Save some reports to see insights!</p>
            </div>
        );
    }

    return (
        <div className="analytics-dashboard animate-fade-in">
            <div className="chart-container">
                <h4>Task Distribution</h4>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={categoryData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                    {categoryData.map((entry, index) => (
                        <div key={index} className="legend-item">
                            <span className="dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <span className="label">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chart-container">
                <h4>Productivity Streak (Last 7 Days)</h4>
                <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
