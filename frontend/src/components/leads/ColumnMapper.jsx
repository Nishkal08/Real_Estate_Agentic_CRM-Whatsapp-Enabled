import { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';

const REQUIRED_FIELDS = [
  { key: 'name',  label: 'Full Name',    required: true },
  { key: 'phone', label: 'Phone Number', required: true },
];
const OPTIONAL_FIELDS = [
  { key: 'email',   label: 'Email Address' },
  { key: 'company', label: 'Company / Business' },
  { key: 'city',    label: 'City' },
  { key: 'source',  label: 'Lead Source' },
];

/**
 * ColumnMapper
 * Step 2 of lead import: user maps Excel columns to required/optional fields
 * Shows a live 5-row preview that updates as mappings change
 */
export function ColumnMapper({ headers, rows, fileName, onConfirm, onBack }) {
  const [mapping, setMapping] = useState(() => {
    const init = {};
    // Auto-detect common column names
    headers.forEach(h => {
      const lower = h.toLowerCase().replace(/[^a-z]/g, '');
      if (['name', 'fullname', 'customername', 'leadname'].includes(lower)) init.name = h;
      if (['phone', 'mobile', 'phoneno', 'mobileno', 'contact'].includes(lower)) init.phone = h;
      if (['email', 'emailaddress', 'mail'].includes(lower)) init.email = h;
      if (['company', 'business', 'organisation', 'organization', 'firm'].includes(lower)) init.company = h;
      if (['city', 'location', 'town'].includes(lower)) init.city = h;
      if (['source', 'leadsource', 'origin'].includes(lower)) init.source = h;
    });
    return init;
  });

  const previewRows = rows.slice(0, 5);
  const allRequiredMapped = REQUIRED_FIELDS.every(f => mapping[f.key]);
  const totalLeads = rows.length;

  const getColumnIndex = (colName) => headers.indexOf(colName);

  const MappingSelect = ({ field }) => (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {field.label}
          </span>
          {field.required && (
            <span style={{ color: 'var(--accent)', fontSize: 10 }}>*</span>
          )}
        </div>
        {field.required && !mapping[field.key] && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--danger)' }}>Required</p>
        )}
      </div>

      <div className="flex-1 relative">
        <select
          value={mapping[field.key] || ''}
          onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value || undefined }))}
          className="input text-xs appearance-none pr-8"
          style={{ cursor: 'pointer' }}
        >
          <option value="">— Not mapped —</option>
          {headers.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>

      <div className="w-5 flex-shrink-0">
        {mapping[field.key] ? (
          <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
        ) : field.required ? (
          <AlertCircle size={14} style={{ color: 'var(--danger)' }} />
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* File info */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'var(--success-bg)', border: '1px solid rgba(74,103,65,0.2)' }}
      >
        <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>
            {fileName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {totalLeads} rows detected · {headers.length} columns
          </p>
        </div>
      </div>

      {/* Column mapping */}
      <div className="card-no-hover space-y-5">
        <div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Required Fields
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Map these two columns to import leads
          </p>
        </div>
        <div className="space-y-3">
          {REQUIRED_FIELDS.map(f => <MappingSelect key={f.key} field={f} />)}
        </div>

        <div className="divider" />

        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Optional Fields
          </h3>
          <div className="space-y-3">
            {OPTIONAL_FIELDS.map(f => <MappingSelect key={f.key} field={f} />)}
          </div>
        </div>
      </div>

      {/* Live preview table */}
      {allRequiredMapped && (
        <div className="card-no-hover !p-0 overflow-hidden animate-slide-up">
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Preview — first 5 rows
            </h3>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {totalLeads} leads total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]
                    .filter(f => mapping[f.key])
                    .map(f => (
                      <th key={f.key}>{f.label}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]
                      .filter(f => mapping[f.key])
                      .map(f => (
                        <td key={f.key} style={{ fontSize: 12 }}>
                          {row[getColumnIndex(mapping[f.key])] || (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="btn-ghost text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Back
        </button>
        <Button
          variant="primary"
          icon={<ArrowRight size={14} />}
          disabled={!allRequiredMapped}
          onClick={() => onConfirm({ mapping, totalLeads })}
        >
          Import {totalLeads} Lead{totalLeads !== 1 ? 's' : ''}
        </Button>
      </div>

      {!allRequiredMapped && (
        <p className="text-xs text-center animate-fade-in" style={{ color: 'var(--danger)' }}>
          Map Name and Phone columns to continue
        </p>
      )}
    </div>
  );
}
