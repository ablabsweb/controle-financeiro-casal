import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const bills = await prisma.fixedBill.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { dueDay: 'asc' },
  });
  return NextResponse.json(bills);
}

export async function POST(request: Request) {
  const { description, amount, dueDay, category, userId } = await request.json();
  const bill = await prisma.fixedBill.create({
    data: {
      description,
      amount: parseFloat(String(amount).replace(',', '.')),
      dueDay: parseInt(String(dueDay)),
      category,
      userId: parseInt(String(userId)),
    },
  });
  return NextResponse.json(bill, { status: 201 });
}

export async function PATCH(request: Request) {
  const { id, isActive } = await request.json();
  const bill = await prisma.fixedBill.update({
    where: { id: parseInt(String(id)) },
    data: { isActive },
  });
  return NextResponse.json(bill);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  await prisma.fixedBill.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}