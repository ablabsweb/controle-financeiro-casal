import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const items = await prisma.priorityItem.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { name, estimatedPrice, priority, userId } = await request.json();
  const item = await prisma.priorityItem.create({
    data: {
      name,
      estimatedPrice: parseFloat(String(estimatedPrice).replace(',', '.')),
      priority,
      userId: parseInt(String(userId)),
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(request: Request) {
  const { id, purchased } = await request.json();
  const item = await prisma.priorityItem.update({
    where: { id: parseInt(String(id)) },
    data: { purchased },
  });
  return NextResponse.json(item);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  await prisma.priorityItem.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}