'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  LogOut,
  Plus,
  Wallet as WalletIcon,
  Sofa,
  Receipt,
  TrendingUp,
  User as UserIcon,
  X,
  Loader2,
  CreditCard,
  Pencil,
  Trash2,
  CalendarClock,
  Calculator,
  ListChecks,
  LayoutDashboard,
  CheckCircle2,
  Circle,
  Ban,
  RotateCcw,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

interface User {
  id: number;
  name: string;
}

interface Wallet {
  id: number;
  name: string;
  type: string;
  user?: { name: string };
}

interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  installments: number;
  sheetType: 'Moveis' | 'Comum';
  payerId: number;
  payer: { name: string };
  walletId?: number | null;
  wallet?: { id: number; name: string; type: string } | null;
  createdAt: string;
}

interface Income {
  id: number;
  description: string;
  amount: number;
  user: { name: string };
  createdAt: string;
}

interface FixedBill {
  id: number;
  description: string;
  amount: number;
  dueDay: number;
  category: string;
  isActive: boolean;
  user: { name: string };
}

interface PriorityItem {
  id: number;
  name: string;
  estimatedPrice: number;
  priority: 'Alta' | 'Média' | 'Baixa';
  purchased: boolean;
  user: { name: string };
}

type MainSection = 'dashboard' | 'expenses' | 'fixed' | 'wallet_income' | 'priorities' | 'calculator';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export default function Home() {
  const [today, setToday] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [section, setSection] = useState<MainSection>('dashboard');
  const [loadingData, setLoadingData] = useState(false);

  // Dados do banco
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);

  // Filtros e Modal de Gastos (Criar / Editar)
  const [expenseFilter, setExpenseFilter] = useState<'Todos' | 'Moveis' | 'Comum'>('Todos');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'Móveis',
    amount: '',
    installments: '1',
    sheetType: 'Moveis' as 'Moveis' | 'Comum',
    walletId: '',
  });

  // Formulários secundários
  const [incomeForm, setIncomeForm] = useState({ description: '', amount: '' });
  const [walletForm, setWalletForm] = useState({ name: '', type: 'Crédito' });
  const [billForm, setBillForm] = useState({
    description: '',
    amount: '',
    dueDay: '10',
    category: 'Moradia',
  });
  const [priorityForm, setPriorityForm] = useState({
    name: '',
    estimatedPrice: '',
    priority: 'Alta' as 'Alta' | 'Média' | 'Baixa',
  });

  // Calculadora de Comprometimento
  const [calcAmount, setCalcAmount] = useState('');
  const [calcInstallments, setCalcInstallments] = useState('1');

useEffect(() => {
  setToday(new Date().getDate());
  const saved = localStorage.getItem('casal_user');
  if (saved) setUser(JSON.parse(saved));
}, []);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const [expRes, incRes, walRes, billRes, prioRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/incomes'),
        fetch('/api/wallets'),
        fetch('/api/fixed-bills'),
        fetch('/api/priorities'),
      ]);
      if (expRes.ok) setExpenses(await expRes.json());
      if (incRes.ok) setIncomes(await incRes.json());
      if (walRes.ok) setWallets(await walRes.json());
      if (billRes.ok) setFixedBills(await billRes.json());
      if (prioRes.ok) setPriorities(await prioRes.json());
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoadingLogin(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Senha inválida.');
      } else {
        setUser(data);
        localStorage.setItem('casal_user', JSON.stringify(data));
        setPassword('');
      }
    } catch {
      setLoginError('Erro de conexão com o servidor.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('casal_user');
    setUser(null);
  };

  // --- GASTOS (CRIAR / EDITAR / EXCLUIR) ---
  const openNewExpenseModal = () => {
    setEditingExpenseId(null);
    setExpenseForm({
      description: '',
      category: 'Móveis',
      amount: '',
      installments: '1',
      sheetType: 'Moveis',
      walletId: wallets[0]?.id ? String(wallets[0].id) : '',
    });
    setIsExpenseModalOpen(true);
  };

  const openEditExpenseModal = (item: Expense) => {
    setEditingExpenseId(item.id);
    setExpenseForm({
      description: item.description,
      category: item.category,
      amount: String(item.amount),
      installments: String(item.installments),
      sheetType: item.sheetType,
      walletId: item.walletId ? String(item.walletId) : '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const url = editingExpenseId ? `/api/expenses/${editingExpenseId}` : '/api/expenses';
      const method = editingExpenseId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          payerId: user.id,
        }),
      });
      if (res.ok) {
        await fetchAllData();
        setIsExpenseModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Deseja realmente excluir este gasto?')) return;
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) fetchAllData();
  };

  // --- RENDAS ---
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await fetch('/api/incomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...incomeForm, userId: user.id }),
    });
    if (res.ok) {
      setIncomeForm({ description: '', amount: '' });
      fetchAllData();
    }
  };

  const handleDeleteIncome = async (id: number) => {
    await fetch(`/api/incomes?id=${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  // --- CARTEIRA ---
  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...walletForm, userId: user.id }),
    });
    if (res.ok) {
      setWalletForm({ name: '', type: 'Crédito' });
      fetchAllData();
    }
  };

  const handleDeleteWallet = async (id: number) => {
    await fetch(`/api/wallets?id=${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  // --- CONTAS FIXAS ---
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await fetch('/api/fixed-bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...billForm, userId: user.id }),
    });
    if (res.ok) {
      setBillForm({ description: '', amount: '', dueDay: '10', category: 'Moradia' });
      fetchAllData();
    }
  };

  const handleToggleBill = async (bill: FixedBill) => {
    await fetch('/api/fixed-bills', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bill.id, isActive: !bill.isActive }),
    });
    fetchAllData();
  };

  const handleDeleteBill = async (id: number) => {
    await fetch(`/api/fixed-bills?id=${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  // --- PRIORIDADES ---
  const handleAddPriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await fetch('/api/priorities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...priorityForm, userId: user.id }),
    });
    if (res.ok) {
      setPriorityForm({ name: '', estimatedPrice: '', priority: 'Alta' });
      fetchAllData();
    }
  };

  const handleTogglePriority = async (item: PriorityItem) => {
    await fetch('/api/priorities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, purchased: !item.purchased }),
    });
    fetchAllData();
  };

  const handleDeletePriority = async (id: number) => {
    await fetch(`/api/priorities?id=${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  // --- CÁLCULOS CONSOLIDADOS ---
  const stats = useMemo(() => {
    const rendaTotal = incomes.reduce((acc, i) => acc + i.amount, 0);
    const moveis = expenses.filter((e) => e.sheetType === 'Moveis');
    const comuns = expenses.filter((e) => e.sheetType === 'Comum');
    const fixasAtivas = fixedBills.filter((b) => b.isActive);

    const totalMoveis = moveis.reduce((acc, item) => acc + item.amount, 0);
    const parcelasMesApe = moveis.reduce(
      (acc, item) => acc + item.amount / (item.installments || 1),
      0
    );
    const gastosComunsMes = comuns.reduce((acc, item) => acc + item.amount, 0);
    const totalFixasMes = fixasAtivas.reduce((acc, item) => acc + item.amount, 0);

    const totalSaidasMes = parcelasMesApe + gastosComunsMes + totalFixasMes;
    const saldoLivre = rendaTotal - totalSaidasMes;
    const percentualComprometido = rendaTotal > 0 ? (totalSaidasMes / rendaTotal) * 100 : 0;

    return {
      rendaTotal,
      totalMoveis,
      parcelasMesApe,
      gastosComunsMes,
      totalFixasMes,
      totalSaidasMes,
      saldoLivre,
      percentualComprometido,
    };
  }, [expenses, incomes, fixedBills]);

  // Próximas contas a vencer (ordenadas a partir do dia de hoje)
const upcomingBills = useMemo(() => {
  return fixedBills
    .filter((b) => b.isActive)
    .sort((a, b) => {
      const diffA = a.dueDay >= today ? a.dueDay - today : a.dueDay + 31 - today;
      const diffB = b.dueDay >= today ? b.dueDay - today : b.dueDay + 31 - today;
      return diffA - diffB;
    });
}, [fixedBills, today]);

  const filteredExpenses = useMemo(() => {
    if (expenseFilter === 'Todos') return expenses;
    return expenses.filter((e) => e.sheetType === expenseFilter);
  }, [expenses, expenseFilter]);

  // Simulação da Calculadora
  const calcResult = useMemo(() => {
    const val = parseFloat(calcAmount.replace(',', '.')) || 0;
    const parc = Math.max(1, parseInt(calcInstallments) || 1);
    const parcelaNova = val / parc;
    const novasSaidas = stats.totalSaidasMes + parcelaNova;
    const novoPercentual = stats.rendaTotal > 0 ? (novasSaidas / stats.rendaTotal) * 100 : 0;
    const impactoPercentual = stats.rendaTotal > 0 ? (parcelaNova / stats.rendaTotal) * 100 : 0;
    const novoSaldoLivre = stats.rendaTotal - novasSaidas;
    return { parcelaNova, novasSaidas, novoPercentual, impactoPercentual, novoSaldoLivre };
  }, [calcAmount, calcInstallments, stats]);

  // --- TELA DE LOGIN ---
  if (!user) {
    return (
      <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#3B5BFF]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#3B5BFF]/15 border border-[#3B5BFF]/30 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[#3B5BFF]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Arthur & Pyetra</h1>
            <p className="text-sm text-zinc-400 mt-1">Controle Financeiro • Novo Apê & Casal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                Sua Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha pessoal..."
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#3B5BFF] focus:ring-1 focus:ring-[#3B5BFF] transition"
                required
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loadingLogin}
              className="w-full bg-[#3B5BFF] hover:bg-[#2f4be0] disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#3B5BFF]/20 cursor-pointer"
            >
              {loadingLogin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar no Painel'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const navItems: { id: MainSection; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'expenses', label: 'Gastos', icon: <Receipt className="w-4 h-4" /> },
    { id: 'fixed', label: 'Contas Fixas', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'wallet_income', label: 'Renda & Carteira', icon: <WalletIcon className="w-4 h-4" /> },
    { id: 'priorities', label: 'Prioridades', icon: <ListChecks className="w-4 h-4" /> },
    { id: 'calculator', label: 'Calculadora', icon: <Calculator className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#09090b]/85 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3B5BFF] flex items-center justify-center font-bold text-sm shadow-lg shadow-[#3B5BFF]/25">
              A&P
            </div>
            <div>
              <h1 className="font-semibold text-sm sm:text-base leading-tight">Finanças do Casal</h1>
              <p className="text-xs text-zinc-500">Logado como {user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={openNewExpenseModal}
              className="bg-[#3B5BFF] hover:bg-[#2f4be0] text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-[#3B5BFF]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Gasto</span>
            </button>

            <button
              onClick={handleLogout}
              title="Sair"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Navegação */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto">
          <nav className="flex items-center gap-1 pb-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  section === item.id
                    ? 'bg-[#3B5BFF]/15 text-[#3B5BFF] border border-[#3B5BFF]/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {loadingData && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3B5BFF]" />
            Sincronizando com o banco...
          </div>
        )}

        {/* ==================== 1. VISÃO GERAL ==================== */}
        {section === 'dashboard' && (
          <div className="space-y-6">
            {/* Resumo Entradas x Saídas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
                  <span>ENTRADAS (RENDA)</span>
                  <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400">{formatBRL(stats.rendaTotal)}</p>
                <p className="text-xs text-zinc-500 mt-1">{incomes.length} fonte(s) de renda</p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
                  <span>SAÍDAS DO MÊS</span>
                  <ArrowDownCircle className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-2xl font-bold text-rose-400">{formatBRL(stats.totalSaidasMes)}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Apê {formatBRL(stats.parcelasMesApe)} • Comuns {formatBRL(stats.gastosComunsMes)} • Fixas {formatBRL(stats.totalFixasMes)}
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
                  <span>SALDO LIVRE NO MÊS</span>
                  <TrendingUp className={`w-4 h-4 ${stats.saldoLivre >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                </div>
                <p className={`text-2xl font-bold ${stats.saldoLivre >= 0 ? 'text-zinc-100' : 'text-rose-400'}`}>
                  {formatBRL(stats.saldoLivre)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Comprometimento: <span className="text-zinc-300 font-medium">{stats.percentualComprometido.toFixed(1)}%</span>
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-2">
                  <span>TOTAL MÓVEIS & APÊ</span>
                  <Sofa className="w-4 h-4 text-[#3B5BFF]" />
                </div>
                <p className="text-2xl font-bold">{formatBRL(stats.totalMoveis)}</p>
                <p className="text-xs text-zinc-500 mt-1">Parcelas/mês: {formatBRL(stats.parcelasMesApe)}</p>
              </div>
            </div>

            {/* Barra de comprometimento visual */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-zinc-400 font-medium">Comprometimento da Renda Mensal</span>
                <span className="font-semibold">{stats.percentualComprometido.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    stats.percentualComprometido > 80
                      ? 'bg-rose-500'
                      : stats.percentualComprometido > 60
                      ? 'bg-amber-500'
                      : 'bg-[#3B5BFF]'
                  }`}
                  style={{ width: `${Math.min(100, stats.percentualComprometido)}%` }}
                />
              </div>
            </div>

            {/* Próximas Contas a Vencer */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-[#3B5BFF]" />
                  <h2 className="font-semibold text-base">Próximas Contas a Vencer</h2>
                </div>
                <button
                  onClick={() => setSection('fixed')}
                  className="text-xs text-[#3B5BFF] hover:underline cursor-pointer"
                >
                  Gerenciar fixas
                </button>
              </div>

              {upcomingBills.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4">
                  Nenhuma conta fixa ativa cadastrada. Adicione na aba <strong>Contas Fixas</strong>.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {upcomingBills.slice(0, 6).map((bill) => (
                    <div
                      key={bill.id}
                      className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{bill.description}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Vence dia <strong className="text-zinc-300">{bill.dueDay}</strong> • {bill.category}
                        </p>
                      </div>
                      <span className="font-semibold text-sm text-amber-400">{formatBRL(bill.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 2. GASTOS (EDITAR / EXCLUIR) ==================== */}
        {section === 'expenses' && (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/80 w-fit">
                {(['Todos', 'Moveis', 'Comum'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setExpenseFilter(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      expenseFilter === tab ? 'bg-[#3B5BFF] text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab === 'Todos' ? 'Todos' : tab === 'Moveis' ? 'Móveis & Apê' : 'Gastos Comuns'}
                  </button>
                ))}
              </div>
              <span className="text-xs text-zinc-500">{filteredExpenses.length} registro(s)</span>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-sm">Nenhum gasto encontrado.</div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {filteredExpenses.map((item) => {
                  const isArthur = item.payer?.name === 'Arthur';
                  const valorParcela = item.amount / (item.installments || 1);
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/20 transition"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            item.sheetType === 'Moveis'
                              ? 'bg-[#3B5BFF]/15 text-[#3B5BFF]'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {item.sheetType === 'Moveis' ? <Sofa className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-zinc-100">{item.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">
                              {item.category}
                            </span>
                            {item.wallet && (
                              <span className="text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                {item.wallet.name}
                              </span>
                            )}
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ${
                                isArthur
                                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                                  : 'bg-pink-500/15 text-pink-300 border border-pink-500/20'
                              }`}
                            >
                              <UserIcon className="w-3 h-3" />
                              {item.payer?.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-sm">{formatBRL(item.amount)}</p>
                          {item.installments > 1 && (
                            <p className="text-xs text-zinc-400">
                              {item.installments}x de {formatBRL(valorParcela)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditExpenseModal(item)}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(item.id)}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-rose-500/20 border border-zinc-800 text-zinc-400 hover:text-rose-400 cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. CONTAS FIXAS ==================== */}
        {section === 'fixed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleAddBill}
              className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 space-y-4 h-fit"
            >
              <h2 className="font-semibold text-base">Nova Conta Fixa</h2>
              <input
                type="text"
                required
                placeholder="Ex: Condomínio, Internet, Netflix..."
                value={billForm.description}
                onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Valor (R$)"
                  value={billForm.amount}
                  onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
                />
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  placeholder="Dia Venc."
                  value={billForm.dueDay}
                  onChange={(e) => setBillForm({ ...billForm, dueDay: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>
              <select
                value={billForm.category}
                onChange={(e) => setBillForm({ ...billForm, category: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
              >
                <option value="Moradia">Moradia</option>
                <option value="Contas Básicas">Contas Básicas</option>
                <option value="Assinaturas">Assinaturas</option>
                <option value="Outros">Outros</option>
              </select>
              <button
                type="submit"
                className="w-full bg-[#3B5BFF] hover:bg-[#2f4be0] text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer"
              >
                Adicionar Conta Fixa
              </button>
            </form>

            <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-3">
              <h2 className="font-semibold text-base mb-2">Contas Cadastradas</h2>
              {fixedBills.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma conta fixa cadastrada.</p>
              ) : (
                fixedBills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      bill.isActive
                        ? 'bg-zinc-950/70 border-zinc-800/80'
                        : 'bg-zinc-950/30 border-zinc-800/40 opacity-50'
                    }`}
                  >
                    <div>
                      <p className={`font-medium text-sm ${!bill.isActive && 'line-through'}`}>
                        {bill.description}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Todo dia {bill.dueDay} • {bill.category} • por {bill.user?.name}
                        {!bill.isActive && ' • CANCELADA'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{formatBRL(bill.amount)}</span>
                      <button
                        onClick={() => handleToggleBill(bill)}
                        title={bill.isActive ? 'Cancelar conta' : 'Reativar conta'}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
                      >
                        {bill.isActive ? <Ban className="w-3.5 h-3.5 text-amber-400" /> : <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-rose-500/20 border border-zinc-800 text-zinc-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== 4. RENDA & CARTEIRA ==================== */}
        {section === 'wallet_income' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controle de Renda */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-base">Entradas / Renda do Casal</h2>
                <p className="text-xs text-zinc-400">Total atual: {formatBRL(stats.rendaTotal)}</p>
              </div>

              <form onSubmit={handleAddIncome} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: Salário, Freela..."
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Valor (R$)"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  className="w-full sm:w-32 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-xl cursor-pointer"
                >
                  +
                </button>
              </form>

              <div className="space-y-2">
                {incomes.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{inc.description}</p>
                      <p className="text-xs text-zinc-500">Por {inc.user?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-400">{formatBRL(inc.amount)}</span>
                      <button
                        onClick={() => handleDeleteIncome(inc.id)}
                        className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carteira de Cartões e Pix */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-base">Carteira (Cartões & Pix)</h2>
                <p className="text-xs text-zinc-400">Ex: Cartão Itaú, Santander, Pix Nubank...</p>
              </div>

              <form onSubmit={handleAddWallet} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nome do cartão ou Pix..."
                  value={walletForm.name}
                  onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm"
                />
                <select
                  value={walletForm.type}
                  onChange={(e) => setWalletForm({ ...walletForm, type: e.target.value })}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="Crédito">Crédito</option>
                  <option value="Débito">Débito</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
                <button
                  type="submit"
                  className="bg-[#3B5BFF] hover:bg-[#2f4be0] text-white text-sm font-medium px-4 py-2 rounded-xl cursor-pointer"
                >
                  +
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wallets.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold">{w.name}</p>
                      <p className="text-xs text-zinc-500">{w.type} • {w.user?.name}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteWallet(w.id)}
                      className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. LISTA DE PRIORIDADES ==================== */}
        {section === 'priorities' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleAddPriority}
              className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 space-y-4 h-fit"
            >
              <h2 className="font-semibold text-base">Adicionar à Lista de Prioridades</h2>
              <input
                type="text"
                required
                placeholder="Ex: Ar-condicionado, Geladeira..."
                value={priorityForm.name}
                onChange={(e) => setPriorityForm({ ...priorityForm, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
              />
              <input
                type="number"
                step="0.01"
                required
                placeholder="Valor Estimado (R$)"
                value={priorityForm.estimatedPrice}
                onChange={(e) => setPriorityForm({ ...priorityForm, estimatedPrice: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
              />
              <select
                value={priorityForm.priority}
                onChange={(e) =>
                  setPriorityForm({ ...priorityForm, priority: e.target.value as 'Alta' | 'Média' | 'Baixa' })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
              >
                <option value="Alta">Prioridade Alta</option>
                <option value="Média">Prioridade Média</option>
                <option value="Baixa">Prioridade Baixa</option>
              </select>
              <button
                type="submit"
                className="w-full bg-[#3B5BFF] hover:bg-[#2f4be0] text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer"
              >
                Salvar Prioridade
              </button>
            </form>

            <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 space-y-3">
              <h2 className="font-semibold text-base mb-2">Próximas Compras do Casal</h2>
              {priorities.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum item na lista de prioridades.</p>
              ) : (
                priorities.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      item.purchased ? 'bg-zinc-950/30 border-zinc-800/40 opacity-60' : 'bg-zinc-950/70 border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleTogglePriority(item)} className="cursor-pointer">
                        {item.purchased ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-500 hover:text-[#3B5BFF]" />
                        )}
                      </button>
                      <div>
                        <p className={`text-sm font-medium ${item.purchased && 'line-through'}`}>{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              item.priority === 'Alta'
                                ? 'bg-rose-500/15 text-rose-400'
                                : item.priority === 'Média'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {item.priority}
                          </span>
                          <span className="text-xs text-zinc-500">por {item.user?.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatBRL(item.estimatedPrice)}</span>
                      <button
                        onClick={() => handleDeletePriority(item.id)}
                        className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== 6. CALCULADORA DE COMPROMETIMENTO ==================== */}
        {section === 'calculator' && (
          <div className="max-w-2xl mx-auto bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#3B5BFF]" />
                Calculadora de Comprometimento da Renda
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Simule uma compra antes de passar o cartão e veja o impacto real no mês do casal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Valor da Compra (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 2500.00"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-[#3B5BFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Número de Parcelas</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={calcInstallments}
                  onChange={(e) => setCalcInstallments(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-[#3B5BFF] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">Parcela Mensal</p>
                <p className="text-lg font-bold text-[#3B5BFF] mt-1">{formatBRL(calcResult.parcelaNova)}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  +{calcResult.impactoPercentual.toFixed(1)}% da renda
                </p>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">Novo Comprometimento</p>
                <p
                  className={`text-lg font-bold mt-1 ${
                    calcResult.novoPercentual > 80
                      ? 'text-rose-400'
                      : calcResult.novoPercentual > 60
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {calcResult.novoPercentual.toFixed(1)}%
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Antes: {stats.percentualComprometido.toFixed(1)}%
                </p>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">Saldo Livre Após Compra</p>
                <p
                  className={`text-lg font-bold mt-1 ${
                    calcResult.novoSaldoLivre >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatBRL(calcResult.novoSaldoLivre)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Por mês</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== MODAL CRIAR / EDITAR GASTO ==================== */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingExpenseId ? 'Editar Gasto' : 'Registrar Novo Gasto'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Lançamento em nome de <span className="text-zinc-100 font-medium">{user.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(['Moveis', 'Comum'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setExpenseForm({
                        ...expenseForm,
                        sheetType: type,
                        category: type === 'Moveis' ? 'Móveis' : 'Moradia',
                        installments: type === 'Comum' ? '1' : expenseForm.installments,
                      })
                    }
                    className={`py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      expenseForm.sheetType === type
                        ? 'bg-[#3B5BFF]/15 border-[#3B5BFF] text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {type === 'Moveis' ? 'Móveis & Apê' : 'Gasto Comum'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sofá, Mercado, Luz..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Categoria</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm"
                  >
                    {expenseForm.sheetType === 'Moveis' ? (
                      <>
                        <option value="Móveis">Móveis</option>
                        <option value="Eletrodoméstico">Eletrodoméstico</option>
                        <option value="Reforma">Reforma</option>
                        <option value="Decoração">Decoração</option>
                      </>
                    ) : (
                      <>
                        <option value="Moradia">Moradia</option>
                        <option value="Contas Básicas">Contas Básicas</option>
                        <option value="Alimentação">Alimentação</option>
                        <option value="Lazer">Lazer</option>
                        <option value="Outros">Outros</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Carteira / Cartão</label>
                  <select
                    value={expenseForm.walletId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, walletId: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="">Sem carteira</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={expenseForm.installments}
                    onChange={(e) => setExpenseForm({ ...expenseForm, installments: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#3B5BFF] hover:bg-[#2f4be0] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingExpenseId ? (
                  'Salvar Alterações'
                ) : (
                  'Salvar Gasto'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}