import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Digite uma senha.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { password },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao validar acesso.' }, { status: 500 });
  }
}