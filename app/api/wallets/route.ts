import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const wallets = await prisma.wallet.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { id: 'desc' },
  });
  return NextResponse.json(wallets);
}

export async function POST(request: Request) {
  const { name, type, userId } = await request.json();
  const wallet = await prisma.wallet.create({
    data: { name, type, userId: parseInt(String(userId)) },
  });
  return NextResponse.json(wallet, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  await prisma.wallet.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
