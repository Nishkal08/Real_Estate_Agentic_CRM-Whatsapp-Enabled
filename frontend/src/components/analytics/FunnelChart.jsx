import { ResponsiveContainer, FunnelChart as RechartsFunnel, Funnel, LabelList, Tooltip } from 'recharts';
import { mockAnalytics } from '@/utils/mockData';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="px-3 py-2 rounded-xl text-sm"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-float)',
        color: 'var(--text-primary)',
      }}
    >
      <span className="font-medium">{d.stage}:</span>{' '}
      <span style={{ color: 'var(--accent)' }}>{d.count} leads</span>
    </div>
  );
}

export function FunnelChart({ data = mockAnalytics.funnel }) {
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <RechartsFunnel>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="count"
            data={data}
            isAnimationActive
            animationDuration={800}
          >
            <LabelList
              position="inside"
              fill="#fff"
              stroke="none"
              dataKey="stage"
              style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}
            />
          </Funnel>
        </RechartsFunnel>
      </ResponsiveContainer>
    </div>
  );
}
