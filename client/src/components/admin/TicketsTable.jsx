import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiMessageSquare,
  FiUser,
  FiMail,
  FiSend,
  FiX,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiFileText,
  FiInbox
} from 'react-icons/fi';
import { useTickets } from '../../hooks/useTickets.js';
import { useTeam } from '../../hooks/useTeam.js';
import { useProducts } from '../../hooks/useProducts.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PriorityBadge, StatusBadge } from '../common/Badge.jsx';
import { TableSkeleton } from '../common/Skeleton.jsx';
import { ticketsService } from '../../services/ticketsService.js';
import { useToast } from '../../context/ToastContext.jsx';

export const TicketsTable = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { team } = useTeam();
  const { products } = useProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');

  const { tickets, loading, pulsingRowId, updateTicket, notifyAgent, refetch } = useTickets({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
    product_id: productFilter === 'ALL' ? undefined : productFilter,
    search: searchTerm || undefined
  });

  // Selected Ticket for Drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filtered tickets in memory if needed
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (productFilter !== 'ALL' && t.productId !== productFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchSubject = t.subject?.toLowerCase().includes(q);
      const matchClient = t.clientName?.toLowerCase().includes(q) || t.clientEmail?.toLowerCase().includes(q);
      const matchId = t.id?.toString().includes(q);
      if (!matchSubject && !matchClient && !matchId) return false;
    }
    return true;
  });

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await ticketsService.exportTickets(format);
      showToast(`Tickets exported to ${format.toUpperCase()} successfully`, 'success');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const updated = await updateTicket(selectedTicket.id, { status: newStatus });
      setSelectedTicket((prev) => ({ ...prev, ...updated, status: newStatus }));
    } catch (err) {
      // Toast already shown in hook
    }
  };

  const handleAgentAssignment = async (agentId) => {
    if (!selectedTicket) return;
    try {
      const updated = await updateTicket(selectedTicket.id, { assignedAdminId: agentId || null });
      const foundAgent = team.find((m) => m.id === agentId);
      setSelectedTicket((prev) => ({
        ...prev,
        ...updated,
        assignedAdminId: agentId,
        assignedAdmin: foundAgent || null
      }));
    } catch (err) {
      // Toast handled in hook
    }
  };

  const handleNotifyAgent = async () => {
    if (!selectedTicket) return;
    setNotifying(true);
    try {
      await notifyAgent(selectedTicket.id);
    } finally {
      setNotifying(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const newMsg = await ticketsService.addMessage(selectedTicket.id, replyText.trim(), isInternalNote);
      setSelectedTicket((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), newMsg]
      }));
      setReplyText('');
      showToast(isInternalNote ? 'Internal note added' : 'Reply sent to customer', 'success');
    } catch (err) {
      showToast(`Failed to post message: ${err.message}`, 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  return (
    <div className="admin-container">
      {/* Header & Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Support Ticket Queue</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Consolidated cross-app incident dispatching and resolution hub.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="btn-secondary"
            style={{ height: '38px', gap: '6px' }}
          >
            <FiDownload size={16} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="btn-secondary"
            style={{ height: '38px', gap: '6px' }}
          >
            <FiFileText size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div
        className="card"
        style={{
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          alignItems: 'center'
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <FiSearch
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '13px', pointerEvents: 'none' }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tickets by ID, subject, customer..."
            className="input-field"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: '130px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: '130px' }}
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Product Filter */}
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="ALL">All Products</option>
          {products.map((prod) => (
            <option key={prod.id} value={prod.id}>
              {prod.title}
            </option>
          ))}
        </select>
      </div>

      {/* Ticket Table (Desktop) / Cards (Mobile) */}
      {loading ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 'var(--space-10) var(--space-4)',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <FiInbox size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.125rem', color: 'var(--text)', marginBottom: '4px' }}>
            No Support Tickets Found
          </h3>
          <p style={{ fontSize: '0.875rem' }}>
            Try adjusting your search criteria or filters to locate tickets.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Tabular View */}
          <div className="table-container hide-on-mobile">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Subject & Details</th>
                  <th>Product</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Agent</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const isPulsing = pulsingRowId === ticket.id;

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={isPulsing ? 'row-pulse' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 800, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                        #{ticket.id}
                      </td>
                      <td style={{ maxWidth: '320px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                          {ticket.subject}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {ticket.clientName} ({ticket.clientEmail})
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          {ticket.product?.title || ticket.productNameSnapshot || 'General'}
                        </span>
                      </td>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td>
                        {ticket.assignedAdmin ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiUser size={14} color="var(--accent)" />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                              {ticket.assignedAdmin.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-disabled)' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="show-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="card card-hover"
                style={{ cursor: 'pointer', padding: 'var(--space-4)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.875rem' }}>
                    #{ticket.id}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>

                <h4 style={{ fontSize: '0.9375rem', marginBottom: '4px', lineHeight: 1.3 }}>
                  {ticket.subject}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {ticket.clientName} • {ticket.product?.title || 'General'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span>{ticket.assignedAdmin?.name || 'Unassigned'}</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Slide-Over Detail Drawer */}
      <AnimatePresence>
        {selectedTicket && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9960,
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(43, 33, 24, 0.45)',
                backdropFilter: 'blur(4px)'
              }}
            />

            {/* Slide-Over Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="glass-panel"
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '640px',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-card, 24px) 0 0 var(--radius-card, 24px)',
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: 'none',
                background: 'var(--bg-card)',
                overflowY: 'auto'
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: 'var(--space-5) var(--space-6)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--surface)',
                  zIndex: 10
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                      Ticket #{selectedTicket.id}
                    </span>
                    <PriorityBadge priority={selectedTicket.priority} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Created on {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="btn-ghost"
                  style={{ padding: '8px', borderRadius: 'var(--radius-full)' }}
                >
                  <FiX size={22} />
                </button>
              </div>

              {/* Drawer Body */}
              <div style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Lifecycle Stepper */}
                <div style={{ background: 'var(--surface-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                    Status Lifecycle
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {statuses.map((st) => {
                      const isCurrent = selectedTicket.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(st)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '0.6875rem',
                            fontWeight: isCurrent ? 800 : 500,
                            background: isCurrent ? 'var(--accent)' : 'var(--surface)',
                            color: isCurrent ? 'var(--accent-contrast)' : 'var(--text-muted)',
                            border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            textAlign: 'center'
                          }}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assignment & Nodemailer Email Dispatch Panel */}
                <div style={{ background: 'var(--surface-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Assigned Support Engineer
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={selectedTicket.assignedAdminId || ''}
                      onChange={(e) => handleAgentAssignment(e.target.value)}
                      className="input-field"
                      style={{ flex: 1, minWidth: '180px' }}
                    >
                      <option value="">Unassigned</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleNotifyAgent}
                      disabled={notifying || !selectedTicket.assignedAdminId}
                      className="btn-primary"
                      style={{ height: '42px', padding: '0 14px', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
                    >
                      <FiMail size={16} />
                      <span>{notifying ? 'Dispatching...' : 'Notify via Nodemailer'}</span>
                    </button>
                  </div>
                </div>

                {/* Ticket Details */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>
                    {selectedTicket.subject}
                  </h3>
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      color: 'var(--text)',
                      whiteSpace: 'pre-wrap',
                      border: '1px solid var(--border)'
                    }}
                  >
                    {selectedTicket.description || 'No description provided.'}
                  </div>
                </div>

                {/* Customer Details Box */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Name</span>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px' }}>
                      {selectedTicket.clientName || 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Email</span>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px' }}>
                      {selectedTicket.clientEmail || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Threaded Messages Conversation */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                    Conversation Thread ({selectedTicket.messages?.length || 0})
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {selectedTicket.messages?.map((msg, idx) => (
                      <div
                        key={msg.id || idx}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-sm)',
                          background: msg.isInternal ? 'var(--warning-bg)' : 'var(--surface-2)',
                          border: `1px solid ${msg.isInternal ? 'rgba(245, 158, 11, 0.3)' : 'var(--border)'}`,
                          alignSelf: msg.senderRole === 'ADMIN' ? 'flex-end' : 'flex-start',
                          maxWidth: '90%'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 700, color: msg.isInternal ? 'var(--warning)' : 'var(--accent)' }}>
                            {msg.authorAdmin?.name || msg.senderName || 'Support Team'}{' '}
                            {msg.isInternal && '(Internal Note)'}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text)' }}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input Box */}
                  <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={isInternalNote ? 'Type an internal team note...' : 'Type a response to the customer...'}
                      className="input-field"
                      style={{ height: 'auto', padding: '12px' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <span>Internal Note (Team only)</span>
                      </label>

                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="btn-primary"
                        style={{ height: '36px', padding: '0 16px', gap: '6px' }}
                      >
                        <FiSend size={14} />
                        <span>{sendingReply ? 'Posting...' : 'Send Message'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketsTable;
