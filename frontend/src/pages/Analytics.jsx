import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MessageSquare, Star, Clock } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard } from '@/components/analytics/StatCard';
import { FunnelChart } from '@/components/analytics/FunnelChart';
import { formatDate } from '@/utils/formatters';
import api from '@/services/api';

const DATE_RANGES = ['Last 7 days', 'Last 14 days', 'Last 30 days', 'All time'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-float)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Last 14 days');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, campRes] = await Promise.all([
          api.get('/analytics/overview', { params: { range: dateRange } }),
          api.get('/campaigns')
        ]);
        if (statsRes.data.success) setStats(statsRes.data.data);
        if (campRes.data.success) setCampaigns(campRes.data.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const chartData = stats?.dailyStats || [];

  const funnel = stats ? [
    { stage: 'Total Leads', count: stats.totalLeads, fill: 'var(--accent)' },
    { stage: 'Qualified', count: stats.qualifiedLeads, fill: 'var(--warning)' },
    { stage: 'Hot (Sales Ready)', count: stats.hotLeads, fill: 'var(--danger)' },
    { stage: 'Converted', count: stats.convertedLeads, fill: 'var(--success)' },
  ] : [];

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Campaign performance and AI agent metrics
          </p>
        </div>
        {/* Date range picker */}
        <div className="flex items-center gap-1">
          {DATE_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: dateRange === r ? 'var(--accent)' : 'var(--bg-glass)',
                color: dateRange === r ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Messages Sent" value={stats?.messagesSent || 0} icon={<MessageSquare size={15} />} color="accent" />
        <StatCard title="Reply Rate" value={stats?.avgReplyRate || 0} unit="%" icon={<TrendingUp size={15} />} color="success" />
        <StatCard title="Qual. Rate" value={stats?.avgQualRate || 0} unit="%" icon={<Star size={15} />} color="warning" />
        <StatCard title="Converted" value={stats?.convertedLeads || 0} icon={<Clock size={15} />} color="accent" />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Line chart — takes 2/3 */}
        <div className="lg:col-span-2 card-no-hover">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md" style={{ color: 'var(--text-primary)' }}>Message Volume</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: 'var(--accent)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: 'var(--success)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Received</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="sent"
                name="Sent"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent)' }}
              />
              <Line
                type="monotone"
                dataKey="received"
                name="Received"
                stroke="var(--success)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--success)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="card-no-hover">
          <h3 className="text-md mb-4" style={{ color: 'var(--text-primary)' }}>Lead Funnel</h3>
          <FunnelChart data={funnel} />
          <div className="space-y-2 mt-4">
            {funnel.map((stage, i) => (
              <div key={stage.stage} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: stage.fill }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stage.stage}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {stage.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign summary table */}
      <div className="card-no-hover !p-0 overflow-hidden mt-6">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-md" style={{ color: 'var(--text-primary)' }}>Campaign Performance</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Leads</th>
              <th>Sent</th>
              <th>Reply Rate</th>
              <th>Qualified</th>
              <th>Converted</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(r => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td>{r.totalLeads || 0}</td>
                <td>{r.messagesSent || 0}</td>
                <td>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>{r.replyRate || 0}%</span>
                </td>
                <td>{r.qualified || 0}</td>
                <td>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{r.converted || 0}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
