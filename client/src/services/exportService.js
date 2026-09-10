// Export Service for downloading reports in Excel (.csv/.xlsx) and PDF formats

/**
 * Export array of objects to Excel / CSV spreadsheet format
 * @param {Array} data - Array of records
 * @param {Array} headers - Optional column titles [ { key, label } ]
 * @param {String} filename - File name without extension
 */
export const exportToExcel = (data, headers, filename = 'Zuna_Admin_Report') => {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  const columns = headers || Object.keys(data[0]).map(k => ({ key: k, label: k.toUpperCase() }));
  
  // Header row
  let csvContent = columns.map(c => `"${c.label}"`).join(',') + '\n';
  
  // Data rows
  data.forEach(row => {
    const rowValues = columns.map(col => {
      let val = row[col.key];
      if (val === undefined || val === null) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      // Escape double quotes
      const stringified = String(val).replace(/"/g, '""');
      return `"${stringified}"`;
    });
    csvContent += rowValues.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data report as formatted printable PDF document with full navigation controls
 * @param {String} title - Report title
 * @param {Array} headers - Column names array
 * @param {Array} rows - Rows array of array values
 * @param {String} filename - File name
 */
export const exportToPDF = (title, headers, rows, filename = 'Zuna_Admin_Report') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF reports');
    return;
  }

  const dateStr = new Date().toLocaleString();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title} - Zuna Admin</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #f1f5f9; }
          
          /* Top Screen Control Bar (Hidden on Exported PDF/Print) */
          .no-print-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #0f172a;
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 12px;
            margin-bottom: 24px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }
          .btn-control {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .btn-control:hover { background: rgba(255, 255, 255, 0.22); transform: translateY(-1px); }
          .btn-close { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); color: #f87171; }
          .btn-close:hover { background: #ef4444; color: #ffffff; }

          /* PDF Report Container */
          .pdf-container { background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); max-width: 1000px; margin: 0 auto; }
          .pdf-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0084FF; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 800; color: #0084FF; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500; }
          .date-badge { font-size: 12px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-weight: 600; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .pdf-footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }

          /* Print Media Styles: Hide Control Bar in Printed/Exported PDF */
          @media print {
            body { padding: 0; background: #ffffff; }
            .no-print-bar { display: none !important; }
            .pdf-container { box-shadow: none; padding: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <!-- Top Screen Control Navigation Bar -->
        <div class="no-print-bar">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button className="btn-control" onclick="returnToDashboard()">
              ← Back to Dashboard
            </button>
            <span style="font-size: 13px; color: #94a3b8; font-weight: 500;">PDF Document Preview</span>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <button className="btn-control" onclick="window.print()">
              🖨️ Print / Save as PDF
            </button>
            <button className="btn-control btn-close" onclick="returnToDashboard()" title="Close and return to dashboard">
              ✕ Close
            </button>
          </div>
        </div>

        <!-- Document Content -->
        <div class="pdf-container">
          <div class="pdf-header">
            <div>
              <div class="logo">Zuna Enterprise Admin</div>
              <div class="subtitle">${title} • Official Report</div>
            </div>
            <div class="date-badge">Generated: ${dateStr}</div>
          </div>

          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="pdf-footer">
            <span>Confidential • Zuna Multi-Product B2B SaaS Engine</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

        <script>
          function returnToDashboard() {
            if (window.opener && !window.opener.closed) {
              try { window.opener.focus(); } catch(e) {}
              window.close();
            } else {
              window.location.href = '/admin/dashboard';
            }
          }

          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
