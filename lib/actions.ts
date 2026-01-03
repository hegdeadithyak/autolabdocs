'use server';

import { db } from './db';
import { createSession, deleteSession, getSession } from './session';
import { User, Project, ProjectType, ParsedCell, IdeFile } from '../types'; // App types
import bcrypt from 'bcryptjs';
import { ProjectType as PrismaProjectType, IdeLanguage, BugStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Helper to map Prisma Project to App Project
function mapProject(p: any): Project {
  return {
    id: p.id,
    name: p.name,
    type: p.type === PrismaProjectType.COLAB ? ProjectType.COLAB : ProjectType.IDE,
    lastModified: p.updatedAt,
    createdAt: p.createdAt,
    notebookContent: p.notebookContent as ParsedCell[] | null,
    files: p.files ? (p.files as any[]).map(f => ({
        id: f.id,
        name: f.name,
        content: f.content,
        isExecuted: f.isExecuted,
        lastInput: f.lastInput,
        lastOutput: f.lastOutput,
        lastError: f.lastError
    })) : undefined,
    filesCount: Array.isArray(p.files) ? (p.files as any[]).length : 0,
    language: p.language ? p.language.toString().toLowerCase() : undefined
  };
}

export async function getMeAction() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, coins: true }
  });

  if (!user) throw new Error("User not found");
  return { user: { id: user.id, name: user.name || '', email: user.email, coins: user.coins } };
}

export async function loginAction(email: string, pass: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  await createSession(user.id);
  return { user: { id: user.id, name: user.name || '', email: user.email, coins: user.coins } };
}

export async function registerAction(name: string, email: string, pass: string) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(pass, 10);
  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  await createSession(user.id);
  return { user: { id: user.id, name: user.name || '', email: user.email, coins: user.coins } };
}

export async function logoutAction() {
  await deleteSession();
}

export async function getProjectsAction() {
  const session = await getSession();
  if (!session) return [];

  const projects = await db.project.findMany({
    where: { userId: session.userId },
    include: { files: true },
    orderBy: { createdAt: 'desc' }
  });

  return projects.map(mapProject);
}

export async function createProjectAction(name: string, type: ProjectType) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const prismaType = type === ProjectType.COLAB ? PrismaProjectType.COLAB : PrismaProjectType.IDE;

  const project = await db.project.create({
    data: {
      name,
      type: prismaType,
      userId: session.userId,
      notebookContent: [],
      language: IdeLanguage.PYTHON // Default
    },
    include: { files: true }
  });
  
  revalidatePath('/');
  return mapProject(project);
}

export async function deleteProjectAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  await db.project.delete({
    where: { id, userId: session.userId }
  });
  revalidatePath('/');
}

export async function updateFileAction(fileId: string, data: Partial<IdeFile>) {
    const session = await getSession();
    if (!session) throw new Error("Not authenticated");

    // We verify ownership via the project relation
    const updated = await db.ideFile.update({
        where: { 
            id: fileId,
            project: { userId: session.userId } 
        },
        data: {
            name: data.name,
            content: data.content,
            isExecuted: data.isExecuted,
            lastInput: data.lastInput,
            lastOutput: data.lastOutput,
            lastError: data.lastError
        }
    });

    return updated;
}

export async function updateProjectAction(project: Project) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  // Note: IDE Language handling
  let ideLang: IdeLanguage = IdeLanguage.PYTHON; // Default
  if (project.language) {
      if (project.language.toLowerCase() === 'cpp') ideLang = IdeLanguage.CPP;
      if (project.language.toLowerCase() === 'c') ideLang = IdeLanguage.C;
  }

  // Use transaction to update project metadata and sync files if provided
  const updated = await db.$transaction(async (tx) => {
    // 1. Update Project basic info
    const p = await tx.project.update({
        where: { id: project.id, userId: session.userId },
        data: {
            notebookContent: project.notebookContent as any,
            language: ideLang
        },
        include: { files: true }
    });

    // 2. If project.files is present, we sync them (Upsert)
    // For scaling to 100k, we shouldn't do this often, 
    // but we keep it for compatibility with the current full-sync UI.
    if (project.files) {
        for (const file of project.files) {
            await tx.ideFile.upsert({
                where: { id: file.id },
                create: {
                    id: file.id,
                    name: file.name,
                    content: file.content || '',
                    projectId: project.id,
                    isExecuted: file.isExecuted || false
                },
                update: {
                    name: file.name,
                    content: file.content,
                    isExecuted: file.isExecuted
                }
            });
        }
        
        // Refresh with latest files
        return await tx.project.findUnique({
            where: { id: project.id },
            include: { files: true }
        });
    }

    return p;
  });

  return mapProject(updated);
}

export async function getProjectAction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const project = await db.project.findUnique({
    where: { id, userId: session.userId },
    include: { files: true }
  });

  return mapProject(project);
}

// --- Bug Report & Coins Actions ---

const ADMIN_EMAIL = 'adithyahegdek@gmail.com';

export async function submitBugReportAction(description: string, screenshot?: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  await db.bugReport.create({
    data: {
      userId: session.userId,
      description,
      screenshot,
    }
  });
  revalidatePath('/'); // Revalidate to show new bug in list
}

export async function getUserBugReportsAction() {
  const session = await getSession();
  if (!session) return [];

  return await db.bugReport.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAllBugReportsAction() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (user?.email !== ADMIN_EMAIL) throw new Error("Unauthorized");

  return await db.bugReport.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateBugReportAction(id: string, status: BugStatus, reply?: string, coinsAwarded?: number) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (user?.email !== ADMIN_EMAIL) throw new Error("Unauthorized");

  // Update bug report
  const bug = await db.bugReport.update({
    where: { id },
    data: {
      status,
      adminReply: reply
    }
  });

  // Award coins if specified
  if (coinsAwarded && coinsAwarded > 0) {
    await db.user.update({
      where: { id: bug.userId },
      data: {
        coins: { increment: coinsAwarded }
      }
    });
  }

  revalidatePath('/admin/bugs');
  return bug;
}

export async function getCoinsAction() {
  const session = await getSession();
  if (!session) return 0;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { coins: true }
  });

  return user?.coins || 0;
}

