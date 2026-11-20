'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  LogOut,
  Plus,
  Wallet,
  Sofa,
  Receipt,
  TrendingUp,
  User as UserIcon,
  X,
  Loader2,
  CreditCard,
} from 'lucide-react';

interface User {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  installments: number;
  sheetType: 'Moveis' | 'Comum';
  payerId: number;
  payer: {
    name: string;
  };
  createdAt: string;
}

const RENDA_ARTHUR = 6372;
const RENDA_PYETRA = 1841;
const RENDA_TOTAL = RENDA_ARTHUR + RENDA_PYETRA;

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [activeTab, setActiveTab] = useState<'Todos' | 'Moveis' | 'Comum'>('Todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 'Móveis',
    amount: '',
    installments: '1',
    sheetType: 'Moveis' as 'Moveis' | 'Comum',
  });

  // Recupera sessão salva
  useEffect(() => {
    const saved = localStorage.getItem('casal_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  // Busca despesas quando logado
  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Erro ao carregar despesas:', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

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

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          payerId: user.id,
        }),
      });

      if (res.ok) {
        await fetchExpenses();
        setIsModalOpen(false);
        setFormData({
          description: '',
          category: formData.sheetType === 'Moveis' ? 'Móveis' : 'Moradia',
          amount: '',
          installments: '1',
          sheetType: formData.sheetType,
        });
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Cálculos do Dashboard
  const stats = useMemo(() => {
    const moveis = expenses.filter((e) => e.sheetType === 'Moveis');
    const comuns = expenses.filter((e) => e.sheetType === 'Comum');

    const totalMoveis = moveis.reduce((acc, item) => acc + item.amount, 0);
    const parcelasMesApe = moveis.reduce(
      (acc, item) => acc + item.amount / (item.installments || 1),
      0
    );
    const gastosComunsMes = comuns.reduce((acc, item) => acc + item.amount, 0);
    const comprometidoMes = parcelasMesApe + gastosComunsMes;
    const saldoLivre = RENDA_TOTAL - comprometidoMes;

    return { totalMoveis, parcelasMesApe, gastosComunsMes, comprometidoMes, saldoLivre };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (activeTab === 'Todos') return expenses;
    return expenses.filter((e) => e.sheetType === activeTab);
  }, [expenses, activeTab]);

  // TELA DE LOGIN
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
            <p className="text-sm text-zinc-400 mt-1">
              Controle Financeiro • Novo Apê & Casal
            </p>
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

  // DASHBOARD PRINCIPAL
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3B5BFF] flex items-center justify-center font-bold text-sm shadow-lg shadow-[#3B5BFF]/25">
              A&P
            </div>
            <div>
              <h1 className="font-semibold text-sm sm:text-base leading-tight">
                Finanças do Casal
              </h1>
              <p className="text-xs text-zinc-500">Novo Apê & Rotina</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-zinc-400">Logado como</span>
              <span className="font-semibold text-zinc-100">{user.name}</span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#3B5BFF] hover:bg-[#2f4be0] text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-[#3B5BFF]/20 cursor-pointer"
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
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
              <span>RENDA TOTAL DO CASAL</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{formatBRL(RENDA_TOTAL)}</p>
            <p className="text-xs text-zinc-500 mt-1">
              Arthur {formatBRL(RENDA_ARTHUR)} • Pyetra {formatBRL(RENDA_PYETRA)}
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
              <span>TOTAL MÓVEIS & APÊ</span>
              <Sofa className="w-4 h-4 text-[#3B5BFF]" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{formatBRL(stats.totalMoveis)}</p>
            <p className="text-xs text-zinc-500 mt-1">
              Parcelas/mês: <span className="text-zinc-300">{formatBRL(stats.parcelasMesApe)}</span>
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
              <span>GASTOS COMUNS (MÊS)</span>
              <Receipt className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {formatBRL(stats.gastosComunsMes)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Contas fixas e rotina</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
              <span>SALDO LIVRE NO MÊS</span>
              <TrendingUp
                className={`w-4 h-4 ${stats.saldoLivre >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              />
            </div>
            <p
              className={`text-2xl font-bold tracking-tight ${
                stats.saldoLivre >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatBRL(stats.saldoLivre)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Comprometido: {((stats.comprometidoMes / RENDA_TOTAL) * 100).toFixed(1)}% da renda
            </p>
          </div>
        </section>

        {/* Abas e Tabela de Gastos */}
        <section className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/80 w-fit">
              {(['Todos', 'Moveis', 'Comum'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#3B5BFF] text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab === 'Todos'
                    ? 'Todos os Gastos'
                    : tab === 'Moveis'
                    ? 'Móveis & Apê'
                    : 'Gastos Comuns'}
                </button>
              ))}
            </div>

            <span className="text-xs text-zinc-500">
              {filteredExpenses.length} registro(s) encontrado(s)
            </span>
          </div>

          {loadingExpenses ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#3B5BFF]" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-sm">
              Nenhum gasto registrado ainda. Clique em <strong>Novo Gasto</strong> para começar.
            </div>
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
                        {item.sheetType === 'Moveis' ? (
                          <Sofa className="w-5 h-5" />
                        ) : (
                          <CreditCard className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-sm text-zinc-100">{item.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ${
                              isArthur
                                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                                : 'bg-pink-500/15 text-pink-300 border border-pink-500/20'
                            }`}
                          >
                            <UserIcon className="w-3 h-3" />
                            Lançado por {item.payer?.name || 'Desconhecido'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right pl-13 sm:pl-0">
                      <p className="font-semibold text-sm text-zinc-100">
                        {formatBRL(item.amount)}
                      </p>
                      {item.installments > 1 && (
                        <p className="text-xs text-zinc-400">
                          {item.installments}x de {formatBRL(valorParcela)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal Novo Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Registrar Novo Gasto</h2>
                <p className="text-xs text-zinc-400">
                  Será marcado automaticamente em nome de{' '}
                  <span className="text-zinc-100 font-medium">{user.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(['Moveis', 'Comum'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        sheetType: type,
                        category: type === 'Moveis' ? 'Móveis' : 'Moradia',
                        installments: type === 'Comum' ? '1' : formData.installments,
                      })
                    }
                    className={`py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      formData.sheetType === type
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
                  placeholder={formData.sheetType === 'Moveis' ? 'Ex: Sofá, Forno...' : 'Ex: Luz, Mercado...'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#3B5BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3B5BFF]"
                  >
                    {formData.sheetType === 'Moveis' ? (
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
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#3B5BFF]"
                  />
                </div>
              </div>

              {formData.sheetType === 'Moveis' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Quantidade de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#3B5BFF]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#3B5BFF] hover:bg-[#2f4be0] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar no Banco'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}