import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, category, amount, installments, sheetType, payerId, walletId } = body;

    const expense = await prisma.expense.create({
      data: {
        description,
        category,
        amount: parseFloat(String(amount).replace(',', '.')),
        installments: parseInt(String(installments)) || 1,
        sheetType,
        payerId: parseInt(String(payerId)),
        walletId: walletId ? parseInt(String(walletId)) : null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao registrar despesa.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        payer: { select: { name: true } },
        wallet: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar despesas.' }, { status: 500 });
  }
}