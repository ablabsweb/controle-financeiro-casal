import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { description, category, amount, installments, sheetType, walletId } = body;

    const updated = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        description,
        category,
        amount: parseFloat(String(amount).replace(',', '.')),
        installments: parseInt(String(installments)) || 1,
        sheetType,
        walletId: walletId ? parseInt(String(walletId)) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao editar despesa.' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao excluir despesa.' }, { status: 500 });
  }
}