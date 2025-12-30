import { Project, User, ProjectType, IdeFile } from "../types";
import { 
  getMeAction, 
  loginAction, 
  registerAction, 
  logoutAction,
  getProjectsAction,
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
  getProjectAction,
  updateFileAction,
} from './actions';

export const api = {
  getMe: async () => {
    return await getMeAction();
  },
  login: async (email: string, pass: string) => {
    return await loginAction(email, pass);
  },
  register: async (name: string, email: string, pass: string) => {
    return await registerAction(name, email, pass);
  },
  logout: async () => {
    return await logoutAction();
  },
  getProjects: async (): Promise<Project[]> => {
    return await getProjectsAction();
  },
  createProject: async (name: string, type: ProjectType): Promise<Project> => {
    return await createProjectAction(name, type);
  },
  deleteProject: async (id: string): Promise<void> => {
    return await deleteProjectAction(id);
  },
  updateProject: async (project: Project): Promise<Project> => {
    return await updateProjectAction(project);
  },
  updateFile: async (fileId: string, data: Partial<IdeFile>): Promise<void> => {
    await updateFileAction(fileId, data);
  },
  getProject: async (id: string): Promise<Project> => {
    return await getProjectAction(id);
  },
};
