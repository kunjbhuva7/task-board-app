import React, { useEffect, useState, useContext, useRef } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit2, Search, Filter, Calendar, X, FileText, Download,
  TrendingUp, IndianRupee, Image, UploadCloud, Info, ArrowUpRight,
  PieChart as PieIcon, BarChart2, Eye, EyeOff, CalendarRange, FolderOpen,
  ChevronDown, CreditCard, Wallet, Smartphone, Coins, FileDown, RefreshCw,
  Tag, ListFilter, SlidersHorizontal, ChevronLeft, ChevronRight,
  Utensils, Plane, Tv, Briefcase, Package, Dumbbell, User, Coffee
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const CARD_STYLE = {
  background: 'var(--card-bg)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
  padding: '1.5rem',
  transition: 'transform 0.2s, box-shadow 0.2s, background 0.3s',
};

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Entertainment', 'Office', 'Gym', 'Personal', 'Chai & Coffee', 'Other'];
const CATEGORY_COLORS = {
  'Food': '#FF7E5F',
  'Travel': '#3B82F6',
  'Bills': '#EF4444',
  'Entertainment': '#EC4899',
  'Office': '#10B981',
  'Gym': '#F59E0B',
  'Personal': '#06B6D4',
  'Chai & Coffee': '#B45309',
  'Other': '#8B5CF6'
};

const CATEGORY_EMOJIS = {
  'Food': '🍕',
  'Travel': '✈️',
  'Bills': '🧾',
  'Entertainment': '🍿',
  'Office': '💼',
  'Gym': '💪',
  'Personal': '👤',
  'Chai & Coffee': '☕',
  'Other': '📦',
  'Shopping': '🛍️'
};

const getCategoryStyle = (cat) => {
  const c = cat || 'Other';
  if (c === 'Food') return { bg: 'rgba(255, 126, 95, 0.08)', color: '#FF7E5F', border: 'rgba(255, 126, 95, 0.2)' };
  if (c === 'Travel') return { bg: 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' };
  if (c === 'Bills') return { bg: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' };
  if (c === 'Entertainment') return { bg: 'rgba(236, 72, 153, 0.08)', color: '#EC4899', border: 'rgba(236, 72, 153, 0.2)' };
  if (c === 'Office') return { bg: 'rgba(16, 185, 129, 0.08)', color: '#10B981', border: 'rgba(16, 185, 129, 0.2)' };
  if (c === 'Gym') return { bg: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' };
  if (c === 'Personal') return { bg: 'rgba(6, 182, 212, 0.08)', color: '#06B6D4', border: 'rgba(6, 182, 212, 0.2)' };
  if (c === 'Chai & Coffee') return { bg: 'rgba(180, 83, 9, 0.08)', color: '#B45309', border: 'rgba(180, 83, 9, 0.2)' };
  return { bg: 'rgba(139, 92, 246, 0.08)', color: '#8B5CF6', border: 'rgba(139, 92, 246, 0.2)' }; // Other / Default
};

const getCategoryIcon = (category, color) => {
  const c = category || 'Other';
  if (c === 'Food') return <Utensils size={13} color={color} style={{ flexShrink: 0 }} />;
  if (c === 'Travel') return <Plane size={13} color={color} style={{ flexShrink: 0 }} />;
  if (c === 'Bills') return <FileText size={13} color={color} style={{ flexShrink: 0 }} />;
  if (c === 'Entertainment') return <Tv size={13} color={color} style={{ flexShrink: 0 }} />;
  if (c === 'Office') return <Briefcase size={13} color={color} style={{ flexShrink: 0 }} />;
  if (c === 'Gym') return <Dumbbell size={13} color={color} style={{ flexShrink: 0 }} />;
  if (c === 'Personal') return <User size={13} color={color} style={{ flexShrink: 0 }} />;
  if (c === 'Chai & Coffee') return <Coffee size={13} color={color} style={{ flexShrink: 0 }} />;
  return <Package size={13} color={color} style={{ flexShrink: 0 }} />;
};

// SaaS-style options
const PAYMENT_MODES = ['UPI', 'Card', 'Cash'];
const TAG_OPTIONS = ['Lunch', 'Weekend', 'Shopping', 'Snacks', 'Office', 'Bills', 'Chai & Coffee', 'Other'];

const TAG_STYLES = {
  'Lunch': { bg: 'rgba(255, 126, 95, 0.1)', color: '#FF7E5F', border: 'rgba(255, 126, 95, 0.2)' },
  'Weekend': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' },
  'Shopping': { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', border: 'rgba(139, 92, 246, 0.2)' },
  'Snacks': { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706', border: 'rgba(245, 158, 11, 0.2)' },
  'Office': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'rgba(16, 185, 129, 0.2)' },
  'Bills': { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' },
  'Chai & Coffee': { bg: 'rgba(180, 83, 9, 0.1)', color: '#B45309', border: 'rgba(180, 83, 9, 0.2)' },
  'Other': { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748B', border: 'rgba(100, 116, 139, 0.2)' }
};

const TAG_EMOJIS = {
  'Lunch': '🍔',
  'Weekend': '🏖️',
  'Shopping': '🛍️',
  'Snacks': '🍿',
  'Office': '💼',
  'Bills': '🧾',
  'Chai & Coffee': '☕',
  'Other': '📦'
};

const getTagEmoji = (tag) => {
  const t = (tag || '').trim();
  const matchedKey = Object.keys(TAG_EMOJIS).find(k => k.toLowerCase() === t.toLowerCase());
  return matchedKey ? TAG_EMOJIS[matchedKey] : '🏷️';
};

const PASTEL_PALETTE = [
  { bg: 'rgba(255, 126, 95, 0.1)', color: '#FF7E5F', border: 'rgba(255, 126, 95, 0.25)' }, // Coral Pink
  { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: 'rgba(59, 130, 246, 0.25)' }, // Blue
  { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'rgba(16, 185, 129, 0.25)' }, // Emerald Green
  { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', border: 'rgba(139, 92, 246, 0.25)' }, // Purple / Violet
  { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706', border: 'rgba(245, 158, 11, 0.25)' }, // Amber / Yellow
  { bg: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', border: 'rgba(236, 72, 153, 0.25)' }, // Pink
  { bg: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4', border: 'rgba(6, 182, 212, 0.25)' }, // Cyan
  { bg: 'rgba(14, 165, 233, 0.1)', color: '#0284C7', border: 'rgba(14, 165, 233, 0.25)' }, // Light Blue
  { bg: 'rgba(168, 85, 247, 0.1)', color: '#9333EA', border: 'rgba(168, 85, 247, 0.25)' }, // Purple-indigo
  { bg: 'rgba(244, 63, 94, 0.1)', color: '#E11D48', border: 'rgba(244, 63, 94, 0.25)' }, // Rose
  { bg: 'rgba(20, 184, 166, 0.1)', color: '#0D9488', border: 'rgba(20, 184, 166, 0.25)' }, // Teal
];

const getTagStyle = (tag) => {
  const t = (tag || '').trim();
  const matchedKey = Object.keys(TAG_STYLES).find(k => k.toLowerCase() === t.toLowerCase());
  if (matchedKey) return TAG_STYLES[matchedKey];
  
  if (!t) return { bg: 'rgba(100, 116, 139, 0.08)', color: 'var(--text-secondary)', border: 'rgba(100, 116, 139, 0.15)' };
  
  // Dynamic hash mapping for beautiful custom tag colors!
  let hash = 0;
  for (let i = 0; i < t.length; i++) {
    hash = t.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_PALETTE.length;
  return PASTEL_PALETTE[index];
};

const Expenses = () => {
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const startDateRef = useRef(null);

  // States
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customPrompt, setCustomPrompt] = useState({
    isOpen: false,
    title: '',
    placeholder: '',
    value: '',
    onSubmit: null
  });

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [paymentMode, setPaymentMode] = useState('All');
  const [tag, setTag] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickFilter, setQuickFilter] = useState('All'); // 'All', 'Today', 'Week', 'Month', 'Custom'

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_desc, amount_asc
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Other',
    payment_mode: 'Cash',
    tags: '', // comma-separated list
    receipt_filename: '',
    receipt_mimetype: '',
    receipt_data: '',
    clear_receipt: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Delete Confirm State
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Lightbox State
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Fetch Expenses
  const fetchExpenses = async () => {
    try {
      const params = {};
      if (category && category !== 'All') params.category = category;
      if (search) params.search = search;
      if (paymentMode && paymentMode !== 'All') params.payment_mode = paymentMode;
      if (tag && tag !== 'All') params.tag = tag;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/expenses', { params });
      setExpenses(res.data || []);
      setCurrentPage(1); // Reset page on filter changes
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();

    const s = io(import.meta.env.VITE_API_URL?.replace('/api', '') || (window.location.hostname === 'localhost' ? 'http://localhost:5005' : window.location.origin));
    s.on('tasks_updated', fetchExpenses);

    return () => s.disconnect();
  }, [category, search, startDate, endDate, paymentMode, tag]);

  // Handle Quick Filters
  const handleQuickFilterClick = (mode) => {
    setQuickFilter(mode);
    const today = new Date();

    if (mode === 'All') {
      setStartDate('');
      setEndDate('');
    } else if (mode === 'Today') {
      const todayStr = today.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === 'Week') {
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(lastWeek.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (mode === 'Month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (mode === 'Custom') {
      setTimeout(() => {
        if (startDateRef.current) {
          try {
            startDateRef.current.showPicker();
          } catch (e) {
            startDateRef.current.focus();
          }
        }
      }, 100);
    }
  };

  // Form Management
  const openAddModal = () => {
    setEditingExpense(null);
    setForm({
      amount: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
      category: 'Other',
      payment_mode: 'Cash',
      tags: '',
      receipt_filename: '',
      receipt_mimetype: '',
      receipt_data: '',
      clear_receipt: false
    });
    setModalOpen(true);
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);

    setForm({
      amount: exp.amount,
      description: exp.description,
      expense_date: exp.expense_date,
      category: exp.category || 'Other',
      payment_mode: exp.payment_mode || 'Cash',
      tags: exp.tags || '',
      receipt_filename: exp.receipt_filename || '',
      receipt_mimetype: exp.receipt_mimetype || '',
      receipt_data: exp.receipt_data || '',
      clear_receipt: false
    });
    setModalOpen(true);
  };

  const triggerCustomPrompt = (title, placeholder, defaultValue, onSubmitCallback) => {
    setCustomPrompt({
      isOpen: true,
      title,
      placeholder,
      value: defaultValue || '',
      onSubmit: onSubmitCallback
    });
  };

  // Toggle Tags in Form
  const toggleFormTag = (selectedTag) => {
    let currentTags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    if (selectedTag === 'Other') {
      triggerCustomPrompt(
        "Enter Custom Tag Name 🏷️",
        "e.g. Urgent, Deliverable, Server",
        "",
        (customTag) => {
          if (customTag && customTag.trim()) {
            const trimmed = customTag.trim();
            // Re-evaluate form.tags inside callback to avoid closure staleness
            setForm(prev => {
              let updatedTags = prev.tags ? prev.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
              if (!updatedTags.includes(trimmed)) {
                updatedTags.push(trimmed);
              }
              return { ...prev, tags: updatedTags.join(',') };
            });
          }
        }
      );
      return;
    }
    
    if (currentTags.includes(selectedTag)) {
      currentTags = currentTags.filter(t => t !== selectedTag);
    } else {
      currentTags.push(selectedTag);
    }
    setForm(prev => ({ ...prev, tags: currentTags.join(',') }));
  };

  // Convert File to Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Receipt file size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          receipt_filename: file.name,
          receipt_mimetype: file.type,
          receipt_data: reader.result,
          clear_receipt: false
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFormReceipt = () => {
    setForm(prev => ({
      ...prev,
      receipt_filename: '',
      receipt_mimetype: '',
      receipt_data: '',
      clear_receipt: true
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalForm = { ...form };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, finalForm);
        toast.success('Log entry updated successfully');
      } else {
        await api.post('/expenses', finalForm);
        toast.success('Log entry added successfully');
      }
      setModalOpen(false);
      fetchExpenses();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save log entry';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await api.delete(`/expenses/${expenseToDelete.id}`);
      toast.success('Log entry deleted successfully');
      setExpenseToDelete(null);
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setPaymentMode('All');
    setTag('All');
    setStartDate('');
    setEndDate('');
    setQuickFilter('All');
    toast.success('Filters reset successfully');
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error("No data to export");
      return;
    }
    try {
      const headers = ['Date', 'Category', 'Description', 'Payment Mode', 'Tags', 'Amount (INR)'];
      const rows = expenses.map(exp => [
        exp.expense_date,
        exp.category,
        exp.description,
        exp.payment_mode || 'Cash',
        exp.tags || '',
        exp.amount
      ]);
      const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `expenses_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report exported successfully!");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  // Calculations for Analytics
  const totalSpend = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Today's Spend
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySpend = expenses
    .filter(exp => exp.expense_date === todayStr)
    .reduce((acc, exp) => acc + exp.amount, 0);

  // Yesterday's Spend
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdaySpend = expenses
    .filter(exp => exp.expense_date === yesterdayStr)
    .reduce((acc, exp) => acc + exp.amount, 0);

  let todayVsYesterdayPct = 0;
  if (yesterdaySpend > 0) {
    todayVsYesterdayPct = Math.round(((todaySpend - yesterdaySpend) / yesterdaySpend) * 100);
  } else if (todaySpend > 0) {
    todayVsYesterdayPct = 100;
  }

  // This Month's Spend
  const currentMonthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const thisMonthSpend = expenses
    .filter(exp => exp.expense_date.startsWith(currentMonthYear))
    .reduce((acc, exp) => acc + exp.amount, 0);

  // Last Month's Spend
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthStr = lastMonthDate.toISOString().slice(0, 7); // "YYYY-MM"
  const lastMonthSpend = expenses
    .filter(exp => exp.expense_date.startsWith(lastMonthStr))
    .reduce((acc, exp) => acc + exp.amount, 0);

  let monthVsLastMonthPct = 0;
  if (lastMonthSpend > 0) {
    monthVsLastMonthPct = Math.round(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100);
  } else if (thisMonthSpend > 0) {
    monthVsLastMonthPct = 100;
  }

  // Group by Category
  const byCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'Other';
    acc[cat] = (acc[cat] || 0) + exp.amount;
    return acc;
  }, {});

  const pieData = Object.keys(byCategory).map(cat => ({
    name: cat,
    value: Math.round(byCategory[cat])
  })).sort((a, b) => b.value - a.value);

  // Top Category percentage
  const topCategoryVal = pieData.length > 0 ? pieData[0].value : 0;
  const topCategoryPct = totalSpend > 0 ? Math.round((topCategoryVal / totalSpend) * 100) : 0;

  const topCategory = pieData.length > 0 ? pieData[0].name : 'N/A';

  // Group by Payment Mode
  const byPaymentMode = expenses.reduce((acc, exp) => {
    const pm = exp.payment_mode || 'Cash';
    acc[pm] = (acc[pm] || 0) + exp.amount;
    return acc;
  }, {});

  // Group by Date for Trends
  const byDate = expenses.reduce((acc, exp) => {
    const d = exp.expense_date;
    acc[d] = (acc[d] || 0) + exp.amount;
    return acc;
  }, {});

  const trendData = Object.keys(byDate)
    .sort()
    .map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: Math.round(byDate[date])
    }));

  // ── Client-side Sorting Logic ──
  const sortedExpenses = [...expenses];
  if (sortBy === 'date_desc') {
    sortedExpenses.sort((a, b) => b.expense_date.localeCompare(a.expense_date) || b.id - a.id);
  } else if (sortBy === 'date_asc') {
    sortedExpenses.sort((a, b) => a.expense_date.localeCompare(b.expense_date) || a.id - b.id);
  } else if (sortBy === 'amount_desc') {
    sortedExpenses.sort((a, b) => b.amount - a.amount);
  } else if (sortBy === 'amount_asc') {
    sortedExpenses.sort((a, b) => a.amount - b.amount);
  }

  // ── Pagination Calculation ──
  const totalEntries = sortedExpenses.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const paginatedExpenses = sortedExpenses.slice(startIdx, startIdx + rowsPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  // Payment Mode Badge Icon
  const getPaymentModeIcon = (mode, color) => {
    const m = (mode || '').toUpperCase();
    if (m === 'UPI') return <Smartphone size={13} color={color} style={{ marginRight: '5px', flexShrink: 0 }} />;
    if (m === 'CARD') return <CreditCard size={13} color={color} style={{ marginRight: '5px', flexShrink: 0 }} />;
    return <Coins size={13} color={color} style={{ marginRight: '5px', flexShrink: 0 }} />; // Cash
  };

  // Payment Mode Badge Styles
  const getPaymentModeStyle = (mode) => {
    const m = (mode || '').toUpperCase();
    if (m === 'UPI') return { bg: 'rgba(139, 92, 246, 0.08)', color: '#7C3AED', border: 'rgba(139, 92, 246, 0.15)' };
    if (m === 'CARD') return { bg: 'rgba(59, 130, 246, 0.08)', color: '#1D4ED8', border: 'rgba(59, 130, 246, 0.15)' };
    return { bg: 'rgba(16, 185, 129, 0.08)', color: '#059669', border: 'rgba(16, 185, 129, 0.15)' }; // Cash
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            SpendFlow 🌊
          </h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
            Aesthetic expense tracking, daily budgets, split reports, and transaction activity logs.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px', padding: '0 1.25rem', borderRadius: '12px' }}>
          <Plus size={18} /> Add New Entry
        </button>
      </div>

      {/* ── Analytics Quick Stats (DO NOT CHANGE) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>

        {/* Today's Spend */}
        <div style={{
          ...CARD_STYLE, display: 'flex', alignItems: 'center', gap: '1.2rem'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.03)'; }}>
          <div style={{ background: 'rgba(255, 126, 95, 0.1)', padding: '0.85rem', borderRadius: '15px', color: '#FF7E5F', display: 'flex' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Logged Today</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '0.2rem' }}>
              ₹{todaySpend.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', marginTop: '0.35rem', color: todayVsYesterdayPct >= 0 ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span>{todayVsYesterdayPct >= 0 ? '↑' : '↓'} {Math.abs(todayVsYesterdayPct)}%</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>vs yesterday</span>
            </div>
          </div>
        </div>

        {/* This Month's Spend */}
        <div style={{
          ...CARD_STYLE, display: 'flex', alignItems: 'center', gap: '1.2rem'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.03)'; }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.85rem', borderRadius: '15px', color: '#3B82F6', display: 'flex' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Logged This Month</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '0.2rem' }}>
              ₹{thisMonthSpend.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', marginTop: '0.35rem', color: monthVsLastMonthPct >= 0 ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span>{monthVsLastMonthPct >= 0 ? '↑' : '↓'} {Math.abs(monthVsLastMonthPct)}%</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>vs last month</span>
            </div>
          </div>
        </div>

        {/* Top Spending Category */}
        <div style={{
          ...CARD_STYLE, display: 'flex', alignItems: 'center', gap: '1.2rem'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.03)'; }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.85rem', borderRadius: '15px', color: '#10B981', display: 'flex' }}>
            <PieIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Top Category</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '0.2rem' }}>
              {topCategory}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', marginTop: '0.35rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ color: 'var(--text-primary)' }}>{topCategoryPct}%</span>
              <span style={{ fontWeight: '600' }}>of total logs</span>
            </div>
          </div>
        </div>

        {/* Total Expenses Count */}
        <div style={{
          ...CARD_STYLE, display: 'flex', alignItems: 'center', gap: '1.2rem'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.03)'; }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.85rem', borderRadius: '15px', color: '#8B5CF6', display: 'flex' }}>
            <FolderOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total Logs</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '0.2rem' }}>
              {expenses.length}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
              This month
            </div>
          </div>
        </div>

      </div>

      {/* ── Charts Row (DO NOT CHANGE) ── */}
      {expenses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>

          {/* Trend Chart */}
          <div style={{ ...CARD_STYLE, flex: 1, minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <TrendingUp size={18} color="#FF7E5F" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Daily Spend Trend</h3>
            </div>
            <div style={{ flex: 1, width: '100%', height: '240px' }}>
              {trendData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No trend data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF7E5F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF7E5F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} unit="₹" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg)', backdropFilter: 'blur(10px)', color: 'var(--text-primary)' }} formatter={(val) => [`₹${val}`, 'Logged']} />
                    <Area type="monotone" dataKey="amount" stroke="#FF7E5F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category Breakdown Card */}
          <div style={{ ...CARD_STYLE, flex: '1 1 360px', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <PieIcon size={18} color="#FF7E5F" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Category Breakdown</h3>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              {pieData.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>No data</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* Left: Donut Chart with Center Total */}
                  <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#8B5CF6'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} formatter={(val) => `₹${val}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Total */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.58rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.1 }}>
                        ₹{totalSpend.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Right: Custom Rich Legend List */}
                  <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {pieData.map((item) => {
                      const pct = totalSpend > 0 ? Math.round((item.value / totalSpend) * 100) : 0;
                      const color = CATEGORY_COLORS[item.name] || '#8B5CF6';
                      return (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>{CATEGORY_EMOJIS[item.name] || '📦'}</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            <span>{pct}%</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>·</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>₹{item.value.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Split Card (Companion Card) */}
          <div style={{ ...CARD_STYLE, flex: '1 1 280px', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <CreditCard size={18} color="#FF7E5F" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Payment Split</h3>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
              {['UPI', 'Card', 'Cash'].map(mode => {
                const amount = Math.round(byPaymentMode[mode] || 0);
                const pct = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0;
                const pmStyle = getPaymentModeStyle(mode);
                const emoji = mode === 'UPI' ? '📱' : mode === 'Card' ? '💳' : '💵';

                return (
                  <div key={mode} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: '750', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>{emoji}</span> {mode}
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>
                        ₹{amount.toLocaleString('en-IN')} <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.72rem' }}>({pct}%)</span>
                      </span>
                    </div>
                    {/* Modern Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: pmStyle.color,
                        borderRadius: '10px',
                        transition: 'width 0.4s ease-out'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── SaaS-Style Interactive Bottom Section ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Dynamic Filters Card ── */}
        <div style={{ ...CARD_STYLE, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Row 1: Filter Controls Flex Container */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            width: '100%'
          }}>

            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
              <input
                type="text"
                placeholder="Search description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input"
                style={{ height: '38px', paddingLeft: '2.2rem', borderRadius: '10px' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            {/* Category Dropdown */}
            <div style={{ position: 'relative', width: '150px', flexShrink: 0 }}>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input"
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  paddingLeft: '0.75rem',
                  paddingRight: '2rem',
                  paddingTop: 0,
                  paddingBottom: 0
                }}
              >
                <option value="All">All Categories</option>
                {Array.from(new Set([...CATEGORIES, ...expenses.map(e => e.category).filter(Boolean)])).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Tags Dropdown */}
            <div style={{ position: 'relative', width: '150px', flexShrink: 0 }}>
              <select
                value={tag}
                onChange={e => setTag(e.target.value)}
                className="input"
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  paddingLeft: '0.75rem',
                  paddingRight: '2rem',
                  paddingTop: 0,
                  paddingBottom: 0
                }}
              >
                <option value="All">All Tags</option>
                {Array.from(new Set([...TAG_OPTIONS, ...expenses.flatMap(e => e.tags ? e.tags.split(',').map(t => t.trim()) : []).filter(Boolean)])).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Payment Mode Dropdown */}
            <div style={{ position: 'relative', width: '150px', flexShrink: 0 }}>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                className="input"
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  paddingLeft: '0.75rem',
                  paddingRight: '2rem',
                  paddingTop: 0,
                  paddingBottom: 0
                }}
              >
                <option value="All">All Payment Modes</option>
                {PAYMENT_MODES.map(pm => <option key={pm} value={pm}>{pm}</option>)}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Split Date Picker Inputs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {/* Start Date Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0 0.75rem',
                height: '38px',
                width: '160px',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}>
                <CalendarRange size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input
                  ref={startDateRef}
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setQuickFilter('Custom'); }}
                  style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', width: '100%', cursor: 'pointer' }}
                  title="Start Date"
                />
              </div>

              {/* to Label */}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', padding: '0 0.25rem', flexShrink: 0 }}>to</span>

              {/* End Date Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0 0.75rem',
                height: '38px',
                width: '160px',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}>
                <CalendarRange size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => { setEndDate(e.target.value); setQuickFilter('Custom'); }}
                  style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', width: '100%', cursor: 'pointer' }}
                  title="End Date"
                />
              </div>
            </div>

            {/* Reset Filters Button */}
            {(search || category !== 'All' || paymentMode !== 'All' || tag !== 'All' || startDate || endDate || quickFilter !== 'All') && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  padding: '0 0.85rem',
                  color: '#EF4444',
                  fontWeight: '700',
                  borderRadius: '10px',
                  height: '38px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.2s',
                  width: '120px',
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}>
                <RefreshCw size={12} /> Reset Filters
              </button>
            )}

          </div>

          {/* Row 2: Quick Filter Chips + Actions Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>

            {/* Left: Quick Time Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Today', mode: 'Today' },
                { label: 'This Week', mode: 'Week' },
                { label: 'This Month', mode: 'Month' },
                { label: 'Custom Range', mode: 'Custom' }
              ].map(chip => (
                <button
                  key={chip.mode}
                  onClick={() => handleQuickFilterClick(chip.mode)}
                  style={{
                    background: quickFilter === chip.mode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.03)',
                    color: quickFilter === chip.mode ? '#6366F1' : 'var(--text-secondary)',
                    border: '1px solid ' + (quickFilter === chip.mode ? 'rgba(99, 102, 241, 0.25)' : 'var(--border)'),
                    padding: '0.45rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={e => { if (quickFilter !== chip.mode) e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { if (quickFilter !== chip.mode) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}>
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Right: SaaS Action Controls (Sort + Export) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>

              {/* Sort By Label and Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Sort By</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0 2.2rem 0 1rem', height: '38px', width: '180px' }}>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                  >
                    <option value="date_desc">Date (Newest First)</option>
                    <option value="date_asc">Date (Oldest First)</option>
                    <option value="amount_desc">Amount (High → Low)</option>
                    <option value="amount_asc">Amount (Low → High)</option>
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: '#6366F1',
                  padding: '0 1rem',
                  borderRadius: '10px',
                  height: '38px',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'; }}>
                <FileDown size={14} /> Export <ChevronDown size={12} />
              </button>

            </div>

          </div>

        </div>

        {/* ── Enhanced SaaS Expense Table ── */}
        <div className="table-container" style={{ position: 'relative', overflow: 'visible', background: 'var(--glass-strong)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem 0' }}>
              <div style={{ width: 35, height: 35, border: '3px solid rgba(0,0,0,0.06)', borderTopColor: '#FF7E5F', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            </div>
          ) : paginatedExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <FolderOpen size={45} strokeWidth={1.5} color="var(--text-muted)" />
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>No Matching Expenses Found</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>Modify your SaaS filters or record a new corporate expense above.</p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
                <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--table-head-bg)' }}>
                    <tr>
                      <th style={{ width: '10%', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem' }}>Date</th>
                      <th style={{ width: '14%', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem' }}>Category</th>
                      <th style={{ width: '24%', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem' }}>Description</th>
                      <th style={{ width: '14%', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem' }}>Payment Mode</th>
                      <th style={{ width: '16%', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem' }}>Tags</th>
                      <th style={{ width: '11%', textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem' }}>Amount</th>
                      <th style={{ width: '11%', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem' }}>Receipt</th>
                      <th style={{ width: '10%', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '1rem 1.25rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.map((exp) => {
                      const pmStyle = getPaymentModeStyle(exp.payment_mode);
                      const catStyle = getCategoryStyle(exp.category);
                      const expenseTags = exp.tags ? exp.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

                      return (
                        <tr
                          key={exp.id}
                          style={{ transition: 'all 0.15s ease', cursor: 'default' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--row-hover)';
                            e.currentTarget.style.boxShadow = 'inset 4px 0 0 #FF7E5F';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* 1. Date */}
                          <td style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.82rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            {new Date(exp.expense_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </td>

                          {/* 2. Category */}
                          <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              color: catStyle.color,
                              background: catStyle.bg,
                              border: `1px solid ${catStyle.border}`,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                              whiteSpace: 'nowrap'
                            }}>
                              {getCategoryIcon(exp.category, catStyle.color)}
                              <span>{exp.category}</span>
                            </span>
                          </td>

                          {/* 3. Description */}
                          <td style={{ width: '24%', maxWidth: '24%', wordBreak: 'break-word', whiteSpace: 'normal', fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.88rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            {exp.description}
                          </td>

                          {/* 4. Payment Mode */}
                          <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              background: pmStyle.bg,
                              color: pmStyle.color,
                              border: `1px solid ${pmStyle.border}`,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                              whiteSpace: 'nowrap'
                            }}>
                              {/* inline styles inside payment icons removed in favor of parent gap */}
                              {exp.payment_mode === 'UPI' && <Smartphone size={13} color={pmStyle.color} style={{ flexShrink: 0 }} />}
                              {exp.payment_mode === 'Card' && <CreditCard size={13} color={pmStyle.color} style={{ flexShrink: 0 }} />}
                              {exp.payment_mode !== 'UPI' && exp.payment_mode !== 'Card' && <Coins size={13} color={pmStyle.color} style={{ flexShrink: 0 }} />}
                              <span>{exp.payment_mode || 'Cash'}</span>
                            </span>
                          </td>

                          {/* 5. Tags */}
                          <td style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {expenseTags.length === 0 ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700' }}>-</span>
                              ) : (
                                expenseTags.map(t => {
                                  const tStyle = getTagStyle(t);
                                  return (
                                    <span key={t} style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      padding: '0.25rem 0.7rem',
                                      borderRadius: '20px',
                                      fontSize: '0.68rem',
                                      fontWeight: '800',
                                      background: tStyle.bg,
                                      color: tStyle.color,
                                      border: `1px solid ${tStyle.border}`,
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {/* tag emojis completely removed to match reference UI */}
                                      <span>{t}</span>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>

                          {/* 6. Amount */}
                          <td style={{ fontWeight: '800', color: '#10B981', textAlign: 'right', fontSize: '0.92rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* 7. Receipt status */}
                          <td style={{ textAlign: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            {exp.receipt_data ? (
                              <button onClick={() => setActiveReceipt(exp)} style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#6366F1', padding: '0.35rem 0.65rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                                <FileText size={13} color="#6366F1" /> View Receipt
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700' }}>-</span>
                            )}
                          </td>

                          {/* 8. Actions column */}
                          <td style={{ textAlign: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center' }}>

                              {/* 1. View Lightbox (Eye icon) */}
                              <button
                                disabled={!exp.receipt_data}
                                onClick={() => setActiveReceipt(exp)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: exp.receipt_data ? '#4F46E5' : 'var(--text-muted)',
                                  cursor: exp.receipt_data ? 'pointer' : 'not-allowed',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  transition: 'background 0.2s, color 0.2s',
                                  opacity: exp.receipt_data ? 1 : 0.4
                                }}
                                onMouseEnter={e => { if (exp.receipt_data) e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                title="Preview Invoice"
                              >
                                <Eye size={15} />
                              </button>

                              {/* 2. Direct Download (Download icon) */}
                              {exp.receipt_data ? (
                                <a
                                  href={exp.receipt_data}
                                  download={exp.receipt_filename || 'receipt'}
                                  style={{
                                    color: '#10B981',
                                    padding: '5px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'background 0.2s',
                                    background: 'transparent'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  title="Download Receipt File"
                                >
                                  <Download size={15} />
                                </a>
                              ) : (
                                <button
                                  disabled
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'not-allowed',
                                    padding: '5px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: 0.4
                                  }}
                                >
                                  <Download size={15} />
                                </button>
                              )}

                              {/* 3. Edit Record */}
                              <button onClick={() => openEditModal(exp)} style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Edit Expense">
                                <Edit2 size={15} />
                              </button>

                              {/* 4. Delete Record */}
                              <button onClick={() => setExpenseToDelete(exp)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Delete Expense">
                                <Trash2 size={15} />
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── SaaS Table Footer with Pagination & Rows Per Page ── */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.2rem 1.5rem',
                borderTop: '1px solid var(--border)',
                background: 'var(--table-head-bg)',
                borderBottomLeftRadius: '20px',
                borderBottomRightRadius: '20px',
                flexWrap: 'wrap',
                gap: '1rem',
                width: '100%'
              }}>

                {/* Column 1: Left - Entries Counter */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Showing <strong style={{ color: 'var(--text-primary)' }}>{totalEntries > 0 ? startIdx + 1 : 0}</strong> to{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{Math.min(startIdx + rowsPerPage, totalEntries)}</strong> of{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{totalEntries}</strong> entries
                  </span>
                </div>

                {/* Column 2: Center - Modern Active Page Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>

                  {/* Prev button */}
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { if (currentPage !== 1) e.currentTarget.style.background = 'var(--row-hover)'; }}
                    onMouseLeave={e => { if (currentPage !== 1) e.currentTarget.style.background = 'var(--card-bg)'; }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page number chips */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((pageNum, idx, arr) => {
                      const showDots = idx > 0 && pageNum - arr[idx - 1] > 1;

                      return (
                        <React.Fragment key={pageNum}>
                          {showDots && <span style={{ padding: '0 0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>...</span>}
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            style={{
                              background: currentPage === pageNum ? '#6366F1' : 'var(--card-bg)',
                              color: currentPage === pageNum ? 'white' : 'var(--text-secondary)',
                              border: '1px solid ' + (currentPage === pageNum ? 'transparent' : 'var(--border)'),
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              fontWeight: '800',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { if (currentPage !== pageNum) e.currentTarget.style.background = 'var(--row-hover)'; }}
                            onMouseLeave={e => { if (currentPage !== pageNum) e.currentTarget.style.background = 'var(--card-bg)'; }}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  {/* Next button */}
                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => handlePageChange(currentPage + 1)}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      color: (currentPage === totalPages || totalPages === 0) ? 'var(--text-muted)' : 'var(--text-secondary)',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { if (currentPage !== totalPages && totalPages > 0) e.currentTarget.style.background = 'var(--row-hover)'; }}
                    onMouseLeave={e => { if (currentPage !== totalPages && totalPages > 0) e.currentTarget.style.background = 'var(--card-bg)'; }}
                  >
                    <ChevronRight size={16} />
                  </button>

                </div>

                {/* Column 3: Right - Rows Selection */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500' }}>Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>

              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Add / Edit Expense Modal (SaaS Enhanced) ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setModalOpen(false)} />
          <div style={{
            position: 'relative', background: 'var(--glass-strong)', border: '1px solid var(--border)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)', borderRadius: '24px',
            width: '90vw', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', padding: '2rem', animation: 'fadeIn 0.2s ease', zIndex: 1001
          }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {editingExpense ? '✏️ Edit Log Entry' : '📝 Create New Log Entry'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '8px', transition: 'all 0.2s' }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

              {/* Amount field */}
              <div>
                <label className="label">Amount (₹)</label>
                <div style={{ position: 'relative', marginTop: '0.4rem' }}>
                  <input type="number" step="0.01" required placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input" style={{ paddingLeft: '2.2rem', fontWeight: '700', fontSize: '1.1rem', color: '#10B981' }} />
                  <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#10B981' }}>
                    ₹
                  </span>
                </div>
              </div>

              {/* Description field */}
              <div>
                <label className="label">Description (Activity / Item detail)</label>
                <input type="text" required placeholder="e.g. Server hosting renewal, Office stationery" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" />
              </div>

              {/* Grid: Category and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label className="label">Category</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                      value={form.category}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'Other') {
                          triggerCustomPrompt(
                            "Enter Custom Category Name 📂",
                            "e.g. Server, Software, Travel",
                            "",
                            (customCat) => {
                              if (customCat && customCat.trim()) {
                                const trimmed = customCat.trim();
                                setForm(f => ({ ...f, category: trimmed }));
                              } else {
                                setForm(f => ({ ...f, category: 'Other' }));
                              }
                            }
                          );
                        } else {
                          setForm(f => ({ ...f, category: val }));
                        }
                      }}
                      className="input"
                      style={{
                        width: '100%',
                        cursor: 'pointer',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        paddingRight: '2rem'
                      }}
                    >
                      {Array.from(new Set([...CATEGORIES, form.category])).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" required value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className="input" />
                </div>
              </div>

              {/* Grid: Payment Mode & Tags Label */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>

                {/* Payment Mode Selection */}
                <div>
                  <label className="label">Payment Mode</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {PAYMENT_MODES.map(pm => {
                      const isActive = form.payment_mode === pm;
                      const pmStyle = getPaymentModeStyle(pm);
                      return (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, payment_mode: pm }))}
                          style={{
                            flex: 1,
                            background: isActive ? pmStyle.bg : 'var(--card-bg)',
                            color: isActive ? pmStyle.color : 'var(--text-secondary)',
                            border: `1px solid ${isActive ? pmStyle.color : 'var(--border)'}`,
                            borderRadius: '10px',
                            padding: '0.6rem 0',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.18s'
                          }}
                        >
                          {getPaymentModeIcon(pm)}
                          {pm}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SaaS Tag Chips Selector */}
                <div>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Tag size={13} /> Select Tags (Multiple)
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {(() => {
                      const currentTags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                      const customTagsForCurrentEntry = currentTags.filter(t => !TAG_OPTIONS.includes(t));
                      const visibleChips = [...TAG_OPTIONS.filter(opt => opt !== 'Other'), ...customTagsForCurrentEntry, 'Other'];
                      
                      return visibleChips.map(opt => {
                        const isSelected = currentTags.includes(opt);
                        const tStyle = getTagStyle(opt);
                        
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleFormTag(opt)}
                            style={{
                              background: isSelected ? tStyle.bg : 'transparent',
                              color: isSelected ? tStyle.color : 'var(--text-secondary)',
                              border: `1px ${isSelected ? 'solid' : 'dashed'} ${isSelected ? tStyle.color : 'var(--border)'}`,
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            {isSelected ? '✓ ' : ''}{opt}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="label">Receipt or Bill Upload (Optional)</label>

                {form.receipt_data ? (
                  /* Uploaded File Panel */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.06)', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      <FileText size={20} color="#4F46E5" style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {form.receipt_filename || 'receipt.file'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          File ready to be saved
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={clearFormReceipt} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Remove Receipt">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  /* File Drop area */
                  <div onClick={() => fileInputRef.current.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: '12px', cursor: 'pointer', background: 'var(--table-head-bg)', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#FF7E5F'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <UploadCloud size={28} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Click to upload attachment / document</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max file size: 5MB (PNG, JPG, PDF)</span>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, height: '42px', borderRadius: '10px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, height: '42px', borderRadius: '10px' }}>
                  {isSubmitting ? (
                    <>
                      <div className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div>
                      Saving...
                    </>
                  ) : (
                    editingExpense ? 'Save Changes' : 'Record Entry'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Receipt Full Lightbox Modal ── */}
      {activeReceipt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)' }} onClick={() => setActiveReceipt(null)} />
          <div style={{
            position: 'relative', width: '90vw', maxWidth: '800px', background: 'var(--glass-strong)', border: '1px solid var(--border)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', borderRadius: '24px',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeIn 0.2s ease', zIndex: 2001
          }}>

            {/* Lightbox Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.8rem', borderBottom: '1px solid var(--border)', background: 'var(--table-head-bg)' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  📄 {activeReceipt.receipt_filename || 'Receipt.file'}
                </h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Logged for "{activeReceipt.description}" on {new Date(activeReceipt.expense_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <a href={activeReceipt.receipt_data} download={activeReceipt.receipt_filename || 'receipt'} className="btn btn-secondary" style={{ height: '36px', padding: '0 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '8px', textDecoration: 'none' }}>
                  <Download size={14} /> Download
                </a>
                <button onClick={() => setActiveReceipt(null)} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '8px', transition: 'all 0.2s' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Lightbox Content */}
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.02)', overflowY: 'auto', maxHeight: '75vh' }}>
              {activeReceipt.receipt_mimetype?.startsWith('image/') ? (
                <img src={activeReceipt.receipt_data} alt="Receipt Invoice" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
              ) : (
                /* Fallback for PDFs or other documents */
                <div style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={40} />
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '800' }}>Document Preview Unavailable</h5>
                    <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '300px' }}>
                      This file type ({activeReceipt.receipt_mimetype || 'Unknown'}) cannot be previewed directly. Please use the button below to download and view.
                    </p>
                  </div>
                  <a href={activeReceipt.receipt_data} download={activeReceipt.receipt_filename || 'receipt'} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '10px', height: '40px', padding: '0 1.5rem', textDecoration: 'none' }}>
                    <Download size={16} /> Download File
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Custom Premium Prompt Modal ── */}
      {customPrompt.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setCustomPrompt(p => ({ ...p, isOpen: false }))} />
          <div style={{
            position: 'relative', background: 'var(--glass-strong)', border: '1px solid var(--border)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)', borderRadius: '24px',
            width: '90vw', maxWidth: '400px', display: 'flex', flexDirection: 'column', padding: '1.8rem',
            animation: 'fadeIn 0.2s ease', zIndex: 3001
          }}>
            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
              {customPrompt.title}
            </h4>
            <input
              type="text"
              autoFocus
              placeholder={customPrompt.placeholder}
              value={customPrompt.value}
              onChange={e => setCustomPrompt(p => ({ ...p, value: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  customPrompt.onSubmit && customPrompt.onSubmit(customPrompt.value);
                  setCustomPrompt(p => ({ ...p, isOpen: false }));
                } else if (e.key === 'Escape') {
                  setCustomPrompt(p => ({ ...p, isOpen: false }));
                }
              }}
              className="input"
              style={{
                width: '100%',
                marginBottom: '1.25rem',
                fontWeight: '700',
                fontSize: '0.9rem',
                borderRadius: '10px'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCustomPrompt(p => ({ ...p, isOpen: false }))}
                className="btn btn-secondary"
                style={{ height: '38px', padding: '0 1.25rem', fontSize: '0.82rem', borderRadius: '10px', fontWeight: '700' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  customPrompt.onSubmit && customPrompt.onSubmit(customPrompt.value);
                  setCustomPrompt(p => ({ ...p, isOpen: false }));
                }}
                className="btn btn-primary"
                style={{ height: '38px', padding: '0 1.25rem', fontSize: '0.82rem', borderRadius: '10px', fontWeight: '700' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Delete Confirmation Modal ── */}
      {expenseToDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setExpenseToDelete(null)} />
          <div style={{
            position: 'relative', background: 'var(--glass-strong)', border: '1px solid var(--border)', width: '90%', maxWidth: '400px',
            padding: '2rem', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center', animation: 'fadeIn 0.2s ease', zIndex: 3001
          }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.08)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Trash2 size={28} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '800' }}>Delete Log Entry?</h3>
            <p style={{ margin: '0 0 2rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Are you sure you want to delete the entry for <strong>"{expenseToDelete.description}"</strong> (₹{expenseToDelete.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setExpenseToDelete(null)} style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', background: 'var(--card-bg)', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={executeDeleteExpense} style={{ flex: 1, padding: '0.75rem', border: 'none', background: '#EF4444', color: 'white', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}>
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;
