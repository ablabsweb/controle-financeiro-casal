import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, category, amount, installments, sheetType, payerId } = body;

    const expense = await prisma.expense.create({
      data: {
        description,
        category,
        amount: parseFloat(String(amount).replace(',', '.')),
        installments: parseInt(String(installments)) || 1,
        sheetType,
        payerId: parseInt(String(payerId)),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('ERRO AO SALVAR GASTO:', error);
    return NextResponse.json({ error: 'Erro ao registrar a despesa.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        payer: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error('ERRO AO BUSCAR GASTOS:', error);
    return NextResponse.json({ error: 'Erro ao buscar despesas.' }, { status: 500 });
  }
}