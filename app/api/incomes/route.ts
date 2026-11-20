import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const incomes = await prisma.income.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(incomes);
}

export async function POST(request: Request) {
  const { description, amount, userId } = await request.json();
  const income = await prisma.income.create({
    data: {
      description,
      amount: parseFloat(String(amount).replace(',', '.')),
      userId: parseInt(String(userId)),
    },
  });
  return NextResponse.json(income, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  await prisma.income.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
