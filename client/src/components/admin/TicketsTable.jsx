import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { ticketsService } from '../../services/ticketsService';
import { productsService } from '../../services/productsService';
import { usersService } from '../../services/usersService';
import { emailService } from '../../services/emailService';
import { exportToExcel, exportToPDF } from '../../services/exportService';

const DEFAULT_SUPPORT_AGENTS = [
  { name: 'Mohamed Asfaque', email: 'carrezzaglobalsolutions@gmail.com', role: 'Support Engineer' },
  { name: 'Sarah Jenkins', email: 'carrezzaglobalsolutions@gmail.com', role: 'Support Lead' },
  { name: 'Alex Rivera', email: 'carrezzaglobalsolutions@gmail.com', role: 'Product Manager' },
  { name: 'John Doe', email: 'carrezzaglobalsolutions@gmail.com', role: 'Support Engineer' },
  { name: 'Tech Support', email: 'carrezzaglobalsolutions@gmail.com', role: 'Support Engineer' }
];


const TicketsTable = () => {
  const [tickets, setTickets] = useState([]);
  const [products, setProducts] = useState([]);
  const [teamMembers, setTeamMembers] = useState(DEFAULT_SUPPORT_AGENTS);
  
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketProductFilter, setTicketProductFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');

  // Expanded ticket state for slide-over drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [emailSendingStatus, setEmailSendingStatus] = useState({});
  const [emailToast, setEmailToast] = useState({ show: false, message: '', type: 'success' });

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const [exportToast, setExportToast] = useState('');
  const exportRef = useRef(null);

  const showNotificationToast = (message, type = 'success', duration = 4500) => {
    setEmailToast({ show: true, message, type });
    setTimeout(() => {
      setEmailToast({ show: false, message: '', type: 'success' });
    }, duration);
  };

  const fetchTicketsAndProducts = async () => {
    try {
      const [tData, pData, uData] = await Promise.all([
        ticketsService.getTickets(),
        productsService.getProducts(),
        usersService.getUsers()
      ]);
      setTickets(tData);
      setProducts(pData);
      
      if (uData && uData.length > 0) {
        // Merge fetched users with defaults
        const memberMap = new Map();
        DEFAULT_SUPPORT_AGENTS.forEach(m => memberMap.set(m.name.toLowerCase(), m));
        uData.forEach(u => {
          if (u.name) {
            memberMap.set(u.name.toLowerCase(), {
              name: u.name,
              email: u.email || `${u.name.toLowerCase().replace(/\s+/g, '.')}@zuna.com`,
              role: u.role || 'Member'
            });
          }
        });
        setTeamMembers(Array.from(memberMap.values()));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTicketsAndProducts();
    setRefreshing(false);
  };

  useEffect(() => {
    // Initial fetch
    fetchTicketsAndProducts();

    // Subscribe to live Firestore & local ticket updates
    const unsubscribeTickets = ticketsService.subscribeTickets((updatedTickets) => {
      setTickets(updatedTickets);
    });

    // BroadcastChannel cross-tab listener for instant real-time updates across localhost tabs
    let bc;
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        bc = new BroadcastChannel('zuna_tickets_channel');
        bc.onmessage = (event) => {
          if (event.data) {
            const newTicket = event.data;
            setTickets((prev) => {
              const exists = prev.some(t => t.id === newTicket.id || (t.subject === newTicket.subject && t.clientName === newTicket.clientName));
              if (exists) return prev;
              return [newTicket, ...prev];
            });
            try {
              const current = JSON.parse(localStorage.getItem('zuna_tickets') || '[]');
              const exists = current.some(t => t.id === newTicket.id);
              if (!exists) {
                localStorage.setItem('zuna_tickets', JSON.stringify([newTicket, ...current]));
              }
            } catch (e) {}
          }
        };
      } catch (err) {}
    }

    return () => {
      if (unsubscribeTickets) unsubscribeTickets();
      if (bc) bc.close();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTicketStatusChange = async (ticketId, newStatus) => {
    try {
      await ticketsService.updateTicketStatus(ticketId, newStatus);
      fetchTicketsAndProducts();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update ticket status');
    }
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      await ticketsService.updateTicketPriority(ticketId, newPriority);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority: newPriority } : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, priority: newPriority } : null);
      }
    } catch (err) {
      console.error('Error updating priority:', err);
      alert('Failed to update ticket priority');
    }
  };

  const handleAgentChange = async (ticketId, newAgentName) => {
    try {
      const targetTicket = tickets.find(t => t.id === ticketId) || selectedTicket || {};
      let agentEmail = '';

      if (newAgentName && newAgentName !== 'Unassigned') {
        const foundMember = teamMembers.find(m => m.name.toLowerCase() === newAgentName.toLowerCase());
        agentEmail = foundMember?.email || '';
      }

      // Update Firestore / Local Storage
      await ticketsService.updateTicketAgent(ticketId, newAgentName, agentEmail);
      
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, assignedAgent: newAgentName, assignedAgentEmail: agentEmail } : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, assignedAgent: newAgentName, assignedAgentEmail: agentEmail } : null);
      }

      // If assigned to a real agent with an email, send email via Resend
      if (newAgentName && newAgentName !== 'Unassigned' && agentEmail) {
        setEmailSendingStatus(prev => ({ ...prev, [ticketId]: true }));
        showNotificationToast(`⏳ Assigning & dispatching Resend email to ${agentEmail}...`, 'info', 2500);

        const emailResult = await emailService.sendTicketAssignmentEmail({
          ticket: { ...targetTicket, assignedAgent: newAgentName, assignedAgentEmail: agentEmail },
          agentName: newAgentName,
          agentEmail: agentEmail
        });

        setEmailSendingStatus(prev => ({ ...prev, [ticketId]: false }));

        if (emailResult.success) {
          showNotificationToast(`✓ Ticket #${ticketId} assigned & email dispatched to ${agentEmail} via Resend!`, 'success', 5000);
        } else {
          showNotificationToast(`Ticket #${ticketId} assigned to ${newAgentName}. Resend alert: ${emailResult.error}`, 'warning', 6000);
        }
      } else if (newAgentName === 'Unassigned') {
        showNotificationToast(`Ticket #${ticketId} marked as Unassigned`, 'info', 3000);
      }
    } catch (err) {
      console.error('Error updating assigned agent:', err);
      showNotificationToast('Failed to update assigned agent', 'error');
    }
  };

  const handleManualSendEmail = async (ticket) => {
    if (!ticket || !ticket.assignedAgent || ticket.assignedAgent === 'Unassigned') {
      alert('Please assign a team member to this ticket first.');
      return;
    }

    const foundMember = teamMembers.find(m => m.name.toLowerCase() === ticket.assignedAgent.toLowerCase());
    const agentEmail = ticket.assignedAgentEmail || foundMember?.email;

    if (!agentEmail) {
      alert(`No email address registered for ${ticket.assignedAgent}. Add their email in the Team Manager.`);
      return;
    }

    setEmailSendingStatus(prev => ({ ...prev, [ticket.id]: true }));
    showNotificationToast(`⏳ Sending ticket details to ${agentEmail} via Resend...`, 'info', 2500);

    const emailResult = await emailService.sendTicketAssignmentEmail({
      ticket: ticket,
      agentName: ticket.assignedAgent,
      agentEmail: agentEmail
    });

    setEmailSendingStatus(prev => ({ ...prev, [ticket.id]: false }));

    if (emailResult.success) {
      showNotificationToast(`✓ Resend email successfully sent to ${agentEmail}!`, 'success', 5000);
    } else {
      showNotificationToast(`Resend dispatch notice: ${emailResult.error}`, 'warning', 6000);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await ticketsService.deleteTicket(ticketId);
        setTickets(tickets.filter(t => t.id !== ticketId));
        setExportToast('Ticket deleted successfully');
        setTimeout(() => setExportToast(''), 3000);
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(null);
        }
      } catch (err) {
        console.error('Error deleting ticket:', err);
        alert('Failed to delete ticket');
      }
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);

    const newReply = {
      sender: 'Agent',
      author: 'Admin Support',
      text: replyText.trim(),
      timestamp: 'Just now'
    };

    try {
      const updated = await ticketsService.addTicketReply(selectedTicket.id, newReply);
      setReplyText('');
      fetchTicketsAndProducts();
      if (updated) {
        setSelectedTicket(updated);
      } else {
        const updatedMsgs = [...(selectedTicket.messages || []), newReply];
        setSelectedTicket({ ...selectedTicket, messages: updatedMsgs });
      }
    } catch (err) {
      console.error('Error adding reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const renderIcon = (iconName, size = 18, className = "") => {
    const IconComponent = Icons[iconName] || Icons.LifeBuoy;
    return <IconComponent className={className} size={size} />;
  };

  const renderPriorityBadge = (priority) => {
    const p = (priority || 'medium').toString().trim().toLowerCase();
    if (p === 'urgent') {
      return (
        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
          ⚡ Urgent
        </span>
      );
    }
    if (p === 'high') {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
          High
        </span>
      );
    }
    if (p === 'low') {
      return (
        <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.74rem', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
          Low
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(0, 132, 255, 0.12)', color: 'var(--accent)', border: '1px solid rgba(0, 132, 255, 0.25)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.74rem', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
        Medium
      </span>
    );
  };

  const renderProductBadge = (productName) => {
    const p = productName || 'General Support';
    let style = { background: 'rgba(0, 132, 255, 0.12)', color: '#0084FF', border: '1px solid rgba(0, 132, 255, 0.3)' };

    if (p.includes('Clinic')) {
      style = { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    } else if (p.includes('School')) {
      style = { background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' };
    } else if (p.includes('College')) {
      style = { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
    } else if (p.includes('Attendance') || p.includes('HRMS')) {
      style = { background: 'rgba(0, 245, 212, 0.12)', color: '#00F5D4', border: '1px solid rgba(0, 245, 212, 0.3)' };
    }

    return (
      <span style={{ ...style, padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        {p}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const s = status || 'open';
    if (s === 'in-progress') {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
          In Progress
        </span>
      );
    }
    if (s === 'resolved') {
      return (
        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
          ✓ Resolved
        </span>
      );
    }
    if (s === 'closed') {
      return (
        <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
          Closed
        </span>
      );
    }
    return (
      <span className="badge-pulse" style={{ background: 'rgba(0, 245, 212, 0.12)', color: '#00F5D4', border: '1px solid rgba(0, 245, 212, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        Open
      </span>
    );
  };

  const getTicketTimestamp = (ticket) => {
    const val = ticket.createdAt;
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = new Date(val).getTime();
      return isNaN(parsed) ? 0 : parsed;
    }
    if (val?.toDate && typeof val.toDate === 'function') {
      return val.toDate().getTime();
    }
    if (val?.seconds) {
      return val.seconds * 1000;
    }
    return 0;
  };

  const filteredTickets = tickets.filter(ticket => {
    const customerName = ticket.clientName || ticket.raisedBy?.name || ticket.customer_name || '';
    const customerEmail = ticket.clientEmail || ticket.raisedBy?.email || ticket.customer_email || '';
    const prodName = ticket.productName || ticket.product_name || '';
    const ticketPriority = (ticket.priority || 'medium').toString().trim().toLowerCase();

    const matchesSearch = 
      ticket.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      customerName.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      customerEmail.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(ticketSearch.toLowerCase());
    
    const matchesStatus = ticketStatusFilter === 'all' || ticket.status === ticketStatusFilter;
    const matchesProduct = ticketProductFilter === 'all' || prodName.toLowerCase().includes(ticketProductFilter.toLowerCase());
    const matchesPriority = ticketPriorityFilter === 'all' || ticketPriority === ticketPriorityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesProduct && matchesPriority;
  }).sort((a, b) => getTicketTimestamp(b) - getTicketTimestamp(a));

  const handleExportExcel = () => {
    const data = filteredTickets.map(t => ({
      'Ticket ID': t.id,
      'Client Name': t.clientName || t.customer_name,
      'Client Email': t.clientEmail || t.customer_email,
      'Product': t.productName || t.product_name,
      'Priority': t.priority || 'Medium',
      'Status': t.status,
      'Subject': t.subject,
      'Assigned Agent': t.assignedAgent || 'Unassigned'
    }));

    exportToExcel(data, null, 'Zuna_Support_Tickets');
    setExportOpen(false);
    setExportToast('✓ Tickets Exported to Excel!');
    setTimeout(() => setExportToast(''), 3000);
  };

  const handleExportPDF = () => {
    const headers = ['Ticket ID', 'Client Name', 'Product', 'Priority', 'Status', 'Subject'];
    const rows = filteredTickets.map(t => [
      `#${t.id}`,
      t.clientName || t.customer_name,
      t.productName || t.product_name,
      t.priority || 'Medium',
      t.status,
      t.subject
    ]);

    exportToPDF('Multi-Product Support Tickets', headers, rows, 'Zuna_Support_Tickets');
    setExportOpen(false);
    setExportToast('✓ Tickets PDF Document Generated!');
    setTimeout(() => setExportToast(''), 3000);
  };

  return (
    <div className="admin-panel" style={{ position: 'relative' }}>
      {/* Header Bar */}
      <div className="panel-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--admin-text-main)', margin: 0 }}>Multi-Product Ticket Monitor</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
            Monitor and reply to support tickets from Attendance HRMS, Clinic System, School System, and College System.
          </p>
        </div>

        <div className="panel-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary admin-refresh-btn" 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
          >
            <Icons.RotateCw size={15} className={refreshing ? 'spin-icon' : ''} style={{ color: 'var(--accent)', marginRight: '0.4rem' }} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>

          {exportToast && (
            <span style={{ background: '#00F5D4', color: '#0f172a', padding: '0.35rem 0.85rem', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
              {exportToast}
            </span>
          )}

          {/* Search Input */}
          <div className="search-input-wrapper">
            <Icons.Search size={15} className="search-icon-svg" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search ticket ID, client..." 
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              style={{ width: '210px' }}
            />
          </div>

          {/* Filter by Product */}
          <select 
            className="filter-select"
            value={ticketProductFilter}
            onChange={(e) => setTicketProductFilter(e.target.value)}
          >
            <option value="all">All Ecosystem Products</option>
            <option value="Attendance">Attendance (HRMS)</option>
            <option value="Clinic">Clinic Management System</option>
            <option value="School">School Management System</option>
            <option value="College">College Management System</option>
            <option value="General">General Support</option>
          </select>

          {/* Filter by Priority */}
          <select 
            className="filter-select"
            value={ticketPriorityFilter}
            onChange={(e) => setTicketPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Filter by Status */}
          <select 
            className="filter-select"
            value={ticketStatusFilter}
            onChange={(e) => setTicketStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Export Dropdown */}
          <div className="navbar-dropdown-wrapper" ref={exportRef}>
            <button 
              className="btn btn-secondary"
              onClick={() => setExportOpen(!exportOpen)}
              style={{ padding: '0.55rem 0.95rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', height: '36px' }}
            >
              <Icons.Download size={15} /> Export
            </button>

            {exportOpen && (
              <div className="navbar-dropdown-panel" style={{ width: '200px', top: 'calc(100% + 0.4rem)', right: 0 }}>
                <div className="dropdown-header">Export Format</div>
                <div className="user-dropdown-menu">
                  <button className="dropdown-item" onClick={handleExportExcel}>
                    <Icons.FileSpreadsheet size={15} style={{ color: '#10b981' }} />
                    <span>Download Excel</span>
                  </button>
                  <button className="dropdown-item" onClick={handleExportPDF}>
                    <Icons.FileText size={15} style={{ color: '#ef4444' }} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email / Action Toast Alert */}
      {emailToast.show && (
        <div style={{
          position: 'sticky',
          top: '10px',
          zIndex: 100,
          margin: '0.75rem 1.5rem',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: emailToast.type === 'success' 
            ? 'rgba(16, 185, 129, 0.18)' 
            : emailToast.type === 'warning' 
              ? 'rgba(245, 158, 11, 0.18)' 
              : emailToast.type === 'info'
                ? 'rgba(0, 132, 255, 0.18)'
                : 'rgba(239, 68, 68, 0.18)',
          border: `1px solid ${
            emailToast.type === 'success' 
              ? 'rgba(16, 185, 129, 0.4)' 
              : emailToast.type === 'warning' 
                ? 'rgba(245, 158, 11, 0.4)' 
                : emailToast.type === 'info'
                  ? 'rgba(0, 132, 255, 0.4)'
                  : 'rgba(239, 68, 68, 0.4)'
          }`,
          color: emailToast.type === 'success' 
            ? '#10b981' 
            : emailToast.type === 'warning' 
              ? '#fbbf24' 
              : emailToast.type === 'info'
                ? '#38bdf8'
                : '#f87171',
          fontSize: '0.86rem',
          fontWeight: 600,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Icons.Mail size={18} />
            <span>{emailToast.message}</span>
          </div>
          <button 
            onClick={() => setEmailToast({ show: false, message: '', type: 'success' })}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.2rem' }}
          >
            <Icons.X size={16} />
          </button>
        </div>
      )}

      {/* Tickets Table */}
      <div className="admin-table-container" style={{ width: '100%', overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>Ticket ID</th>
              <th style={{ minWidth: '190px' }}>Client Name</th>
              <th style={{ width: '170px' }}>Product Tag</th>
              <th style={{ width: '110px' }}>Priority</th>
              <th style={{ minWidth: '250px' }}>Subject / Issue</th>
              <th style={{ width: '120px' }}>Status</th>
              <th style={{ width: '170px' }}>Assigned Agent</th>
              <th style={{ width: '120px' }}>Created Date</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map(ticket => {
              const clientName = ticket.clientName || ticket.raisedBy?.name || ticket.customer_name || 'Client';
              const clientEmail = ticket.clientEmail || ticket.raisedBy?.email || ticket.customer_email || 'client@zuna.com';
              const prodName = ticket.productName || ticket.product_name || 'HRMS';
              const isSending = emailSendingStatus[ticket.id];

              return (
                <tr 
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                    #{ticket.id}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{clientName}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{clientEmail}</span>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {renderProductBadge(prodName)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                    <select
                      className="filter-select"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', borderRadius: '50px', cursor: 'pointer', fontWeight: 600 }}
                      value={(ticket.priority || 'medium').toString().toLowerCase()}
                      onChange={(e) => handlePriorityChange(ticket.id, e.target.value)}
                    >
                      <option value="urgent">⚡ Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <strong style={{ color: 'var(--admin-text-main)', fontSize: '0.88rem', display: 'block', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.subject}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.description}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {renderStatusBadge(ticket.status)}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-main)', fontWeight: 500, whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <select
                        className="filter-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', borderRadius: '8px', cursor: 'pointer', maxWidth: '145px' }}
                        value={ticket.assignedAgent || 'Unassigned'}
                        onChange={(e) => handleAgentChange(ticket.id, e.target.value)}
                        disabled={isSending}
                      >
                        <option value="Unassigned">Unassigned</option>
                        {teamMembers.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                      {isSending && (
                        <Icons.RotateCw size={14} className="spin-icon" style={{ color: 'var(--accent)' }} title="Sending assignment email via Resend..." />
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                    {typeof ticket.createdAt === 'string' ? new Date(ticket.createdAt).toLocaleDateString('en-GB') : (ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString('en-GB') : 'Today')}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setSelectedTicket(ticket)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', marginRight: '0.4rem' }}
                    >
                      View Thread
                    </button>
                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      title="Delete ticket"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem', verticalAlign: 'middle' }}
                    >
                      <Icons.Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
                  No support tickets matching your selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TICKET DETAIL & CONVERSATION THREAD DRAWER */}
      {selectedTicket && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '660px', width: '90%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="admin-modal-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent)' }}>Ticket #{selectedTicket.id}</span>
                  {renderProductBadge(selectedTicket.productName || selectedTicket.product_name)}
                  {renderPriorityBadge(selectedTicket.priority)}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--admin-text-main)' }}>{selectedTicket.subject}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                <Icons.X size={20} />
              </button>
            </div>

            {/* Metadata Controls */}
            <div style={{ padding: '0.85rem 0', borderBottom: '1px solid var(--admin-border)', display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 1fr', gap: '0.65rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.74rem' }}>Client Name</span>
                <strong style={{ color: 'var(--admin-text-main)', display: 'block', marginTop: '0.2rem' }}>{selectedTicket.clientName || selectedTicket.customer_name || 'Client'}</strong>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.74rem' }}>Assigned Agent</span>
                  {selectedTicket.assignedAgent && selectedTicket.assignedAgent !== 'Unassigned' && (
                    <button
                      onClick={() => handleManualSendEmail(selectedTicket)}
                      title="Send ticket details via Resend email"
                      style={{ background: 'none', border: 'none', color: '#00F5D4', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}
                    >
                      <Icons.Mail size={12} /> Resend Mail
                    </button>
                  )}
                </div>
                <select 
                  className="filter-select"
                  style={{ width: '100%', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}
                  value={selectedTicket.assignedAgent || 'Unassigned'}
                  onChange={(e) => handleAgentChange(selectedTicket.id, e.target.value)}
                  disabled={emailSendingStatus[selectedTicket.id]}
                >
                  <option value="Unassigned">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
                {selectedTicket.assignedAgent && selectedTicket.assignedAgent !== 'Unassigned' && (
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '0.2rem', display: 'block' }}>
                    ✉ {selectedTicket.assignedAgentEmail || teamMembers.find(m => m.name.toLowerCase() === selectedTicket.assignedAgent.toLowerCase())?.email || 'No email'}
                  </span>
                )}
              </div>
              <div>
                <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.74rem', marginBottom: '0.2rem' }}>Priority Level</span>
                <select 
                  className="filter-select"
                  style={{ width: '100%', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}
                  value={(selectedTicket.priority || 'medium').toString().toLowerCase()}
                  onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">⚡ Urgent</option>
                </select>
              </div>
              <div>
                <span style={{ color: 'var(--admin-text-muted)', display: 'block', fontSize: '0.74rem', marginBottom: '0.2rem' }}>Update Status</span>
                <select 
                  className="filter-select"
                  style={{ width: '100%', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}
                  value={selectedTicket.status}
                  onChange={(e) => handleTicketStatusChange(selectedTicket.id, e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Conversation Thread Messages */}
            <div style={{ padding: '1rem 0', flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--theme-toggle-bg, rgba(255,255,255,0.03))', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Initial Ticket Description:</div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-main)', lineHeight: 1.5 }}>{selectedTicket.description}</p>
              </div>

              {(selectedTicket.messages || [
                { sender: 'Client', author: `${selectedTicket.clientName || 'Client'} Support`, text: selectedTicket.description, timestamp: '2 hours ago' }
              ]).map((msg, i) => (
                <div 
                  key={i} 
                  style={{ 
                    alignSelf: msg.sender === 'Agent' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: msg.sender === 'Agent' ? 'rgba(0, 132, 255, 0.12)' : 'var(--theme-toggle-bg, rgba(255,255,255,0.04))',
                    border: msg.sender === 'Agent' ? '1px solid rgba(0, 132, 255, 0.25)' : '1px solid var(--admin-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                    <strong style={{ color: msg.sender === 'Agent' ? 'var(--accent)' : '#00F5D4' }}>{msg.author || msg.sender}</strong>
                    <span style={{ color: 'var(--admin-text-muted)' }}>{msg.timestamp}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--admin-text-main)', lineHeight: 1.45 }}>{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} style={{ paddingTop: '1rem', borderTop: '1px solid var(--admin-border)', display: 'flex', gap: '0.75rem' }}>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="Write reply to client..." 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{ flexGrow: 1, fontSize: '0.85rem' }}
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={sendingReply}
                style={{ whiteSpace: 'nowrap', padding: '0.6rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Icons.Send size={15} /> {sendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsTable;
