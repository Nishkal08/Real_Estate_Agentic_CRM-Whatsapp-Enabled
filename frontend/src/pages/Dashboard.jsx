import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Megaphone, MessageSquare, Star,
  Flame, CheckCircle2, Zap, Bell, Activity,
  ArrowRight, PlayCircle
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard } from '@/components/analytics/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import useActivityStore from '@/stores/activityStore';
import useAuthStore from '@/stores/authStore';
import { formatRelativeTime } from '@/utils/formatters';
import { toast } from '@/stores/uiStore';
import api from '@/services/api';

const ACTIVITY_ICONS = {
  hot_lead:         <Flame size={13} />,
  message_sent:     <MessageSquare size={13} />,
  message_received: <MessageSquare size={13} />,
  qualified:        <Star size={13} />,
  campaign_launched: <Megaphone size={13} />,
  appointment_booked: <CheckCircle2 size={13} />,
};

const ACTIVITY_COLORS = {
  hot_lead:          { bg: 'var(--danger-bg)',  color: 'var(--danger)' },
  message_sent:      { bg: 'var(--accent-light)', color: 'var(--accent)' },
  message_received:  { bg: 'var(--accent-light)', color: 'var(--accent)' },
  qualified:         { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  campaign_launched: { bg: 'var(--success-bg)', color: 'var(--success)' },
  appointment_booked:{ bg: 'var(--success-bg)', color: 'var(--success)' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activities } = useActivityStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [hotLeads, setHotLeads] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);

  const handleActivityClick = (act) => {
    useActivityStore.getState().markRead(act.id);
    if (act.leadId) {
      navigate('/conversations');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, leadsRes, campaignsRes, activitiesRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/leads?status=hot'),
          api.get('/campaigns'),
          api.get('/analytics/activity')
        ]);
        
        if (statsRes.data.success) setStats(statsRes.data.data);
        if (leadsRes.data.success) setHotLeads(leadsRes.data.data.leads || []);
        if (campaignsRes.data.success) {
          const campaigns = campaignsRes.data.data;
          setActiveCampaign(campaigns.find(c => c.status === 'active') || null);
        }
        if (activitiesRes.data.success) {
          useActivityStore.getState().setActivities(activitiesRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLoadDemo = () => {
    toast.success('Demo data loaded! SolarBright — Ahmedabad is active.', { title: 'Demo Mode' });
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display" style={{ color: 'var(--text-primary)' }}>Good afternoon, {user?.name || 'User'}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Your agents handled <strong style={{ color: 'var(--text-primary)' }}>312</strong> conversations today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<PlayCircle size={14} />}
            onClick={handleLoadDemo}
          >
            Load Demo
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Megaphone size={14} />}
            onClick={() => navigate('/campaigns')}
          >
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads ?? 0}
          icon={<Users size={15} />}
          trend={12}
          trendLabel="this week"
          loading={loading}
          color="accent"
        />
        <StatCard
          title="Active Campaigns"
          value={stats?.activeCampaigns ?? 0}
          icon={<Megaphone size={15} />}
          loading={loading}
          color="success"
        />
        <StatCard
          title="Messages Sent"
          value={stats?.messagesSent ?? 0}
          icon={<MessageSquare size={15} />}
          trend={8}
          trendLabel="vs last week"
          loading={loading}
          color="accent"
        />
        <StatCard
          title="Qualified Leads"
          value={stats?.qualifiedLeads ?? 0}
          icon={<Star size={15} />}
          trend={25}
          trendLabel="this month"
          loading={loading}
          color="warning"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity Feed — takes 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live activity */}
          <div className="card-no-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-md" style={{ color: 'var(--text-primary)' }}>Live Activity</h2>
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                >
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  AI Running
                </span>
              </div>
              <button
                className="text-xs font-medium"
                style={{ color: 'var(--accent)' }}
                onClick={() => useActivityStore.getState().markAllRead()}
              >
                Mark all read
              </button>
            </div>

            <div className="space-y-3">
              {activities.slice(0, 6).map((act) => {
                const actColor = ACTIVITY_COLORS[act.type] || ACTIVITY_COLORS.message_sent;
                return (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 py-2 px-3 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: act.read ? 'transparent' : 'var(--accent-light)',
                      borderLeft: act.read ? 'none' : `2px solid var(--accent)`,
                    }}
                    onClick={() => handleActivityClick(act)}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: actColor.bg, color: actColor.color }}
                    >
                      {ACTIVITY_ICONS[act.type] || <Activity size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {act.title}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                        {act.description}
                      </p>
                    </div>
                    <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Campaign mini view */}
          {activeCampaign && (
            <div className="card-no-hover">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md" style={{ color: 'var(--text-primary)' }}>Active Campaign</h2>
                <button
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: 'var(--accent)' }}
                  onClick={() => navigate('/campaigns')}
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div
                className="flex items-start justify-between p-4 rounded-xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {activeCampaign.name}
                    </p>
                    <Badge variant="active" dot={false}>Active</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    {[
                      { label: 'Leads', val: activeCampaign.totalLeads },
                      { label: 'Reply Rate', val: `${activeCampaign.replyRate}%` },
                      { label: 'Qualified', val: activeCampaign.qualified },
                    ].map((m) => (
                      <div key={m.label}>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{m.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Hot leads alert */}
          {hotLeads.length > 0 && (
            <div
              className="card-no-hover"
              style={{ borderLeft: '3px solid var(--danger)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--danger-bg)' }}
                >
                  <Flame size={13} style={{ color: 'var(--danger)' }} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>
                  {hotLeads.length} Hot Lead{hotLeads.length > 1 ? 's' : ''}
                </h2>
              </div>

              {hotLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-start gap-3 py-2 cursor-pointer group"
                  onClick={() => navigate('/leads')}
                >
                  <div className="avatar avatar-sm hot-badge flex-shrink-0">
                    {lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                      {lead.name}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {lead.lastMessage}
                    </p>
                  </div>
                </div>
              ))}

              <Button
                variant="danger"
                size="sm"
                className="w-full mt-3"
                onClick={() => navigate('/conversations')}
              >
                Take Over
              </Button>
            </div>
          )}

          {/* Quick stats panel */}
          <div className="card-no-hover space-y-4">
            <h2 className="text-md" style={{ color: 'var(--text-primary)' }}>Quick Stats</h2>
            {[
              { label: 'Reply Rate', value: `${stats?.avgReplyRate || 0}%`, color: 'var(--accent)' },
              { label: 'Qual. Rate', value: `${stats?.avgQualRate || 0}%`, color: 'var(--success)' },
              { label: 'Today Messages', value: stats?.todayMessages || 0, color: 'var(--text-primary)' },
              { label: 'Converted', value: stats?.convertedLeads || 0, color: 'var(--success)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span className="text-sm font-semibold stat-value" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* AI Status */}
          <div
            className="card-no-hover flex items-center gap-3"
            style={{ background: 'var(--accent-light)', border: '1px solid rgba(94,106,210,0.2)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              <Zap size={16} color="#fff" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>AI Agent Active</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Monitoring {stats?.activeLeads || 0} conversations
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
