import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * ExcelUploader
 * Step 1 of lead import: drag & drop or browse for .xlsx / .csv
 * Calls onParsed({ headers, rows, fileName }) when parsing is done
 */
export function ExcelUploader({ onParsed, onCancel }) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = useCallback(async (file) => {
    setError(null);
    setParsing(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (!rows || rows.length < 2) {
        setError('The file appears to be empty. Please upload a file with at least one data row.');
        setParsing(false);
        return;
      }

      const headers = rows[0].map(String);
      const dataRows = rows.slice(1).filter(r => r.some(c => c !== ''));

      onParsed({ headers, rows: dataRows, fileName: file.name, file });
    } catch (err) {
      setError('Could not read the file. Please make sure it is a valid Excel or CSV file.');
    } finally {
      setParsing(false);
    }
  }, [onParsed]);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) handleFile(accepted[0]);
  }, [handleFile]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: parsing,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200',
          isDragActive && 'scale-[1.01]',
          parsing && 'pointer-events-none opacity-60'
        )}
        style={{
          borderColor: isDragActive ? 'var(--accent)' : 'var(--border-subtle)',
          background: isDragActive ? 'var(--accent-light)' : 'var(--bg-surface)',
        }}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4',
            isDragActive && 'animate-drag-float'
          )}
          style={{ background: isDragActive ? 'var(--accent)' : 'var(--accent-light)' }}
        >
          {parsing ? (
            <div className="animate-spin">
              <FileSpreadsheet size={22} style={{ color: isDragActive ? '#fff' : 'var(--accent)' }} />
            </div>
          ) : (
            <Upload size={22} style={{ color: isDragActive ? '#fff' : 'var(--accent)' }} />
          )}
        </div>

        {parsing ? (
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Reading file…</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Parsing columns and rows</p>
          </div>
        ) : isDragActive ? (
          <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Drop the file here</p>
        ) : (
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Drop your leads spreadsheet here
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              or click to browse &nbsp;·&nbsp; Supports .xlsx, .xls, .csv
            </p>
          </div>
        )}
      </div>

      {error && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm animate-slide-up"
          style={{ background: 'var(--danger-bg)', border: '1px solid rgba(192,64,64,0.2)', color: 'var(--danger)' }}
        >
          <X size={14} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div
        className="px-4 py-3 rounded-xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Expected columns</p>
        <div className="flex flex-wrap gap-1.5">
          {['Name', 'Phone', 'Email (optional)', 'Company (optional)', 'City (optional)'].map(col => (
            <span
              key={col}
              className="text-[11px] px-2 py-0.5 rounded-md font-medium"
              style={{
                background: col.includes('optional') ? 'var(--bg-glass)' : 'var(--accent-light)',
                color: col.includes('optional') ? 'var(--text-muted)' : 'var(--accent-text)',
                border: `1px solid ${col.includes('optional') ? 'var(--border-subtle)' : 'rgba(196,101,74,0.2)'}`,
              }}
            >
              {col}
            </span>
          ))}
        </div>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="btn-ghost w-full text-center text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
