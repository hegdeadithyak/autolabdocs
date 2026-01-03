export enum ProjectType {
  COLAB = "COLAB",
  IDE = "IDE",
}

export interface User {
  id: string;
  name: string;
  email: string;
  coins: number;
}

export interface CellOutput {
  type: 'text' | 'image' | 'error' | 'html';
  mimeType?: string;
  data: string;
}

export interface ParsedCell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  executionCount?: number | string | null;
  outputs?: CellOutput[];
}

export interface IdeFile {
  id: string;
  name: string;
  content: string;
  isExecuted?: boolean;
  lastInput?: string;
  lastOutput?: string;
  lastError?: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  lastModified: Date;
  notebookContent?: ParsedCell[] | null;
  files?: IdeFile[];
  filesCount?: number;
  createdAt: Date;
  language?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}