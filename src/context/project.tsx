import { createContext, FC, ReactNode, useContext } from "react";
import type { LxdProject } from "types/project";
import { useLocation } from "react-router-dom";
import { useProjectFetch } from "./useProjects";

interface ContextProps {
  project?: LxdProject;
  isLoading: boolean;
}

const initialState: ContextProps = {
  project: undefined,
  isLoading: false,
};

export const ProjectContext = createContext<ContextProps>(initialState);

interface ProviderProps {
  children: ReactNode;
}

export const ProjectProvider: FC<ProviderProps> = ({ children }) => {
  const location = useLocation();
  const url = location.pathname;
  const project = url.startsWith("/ui/project/") ? url.split("/")[3] : "";

  const enabled = project.length > 0;
  const retry = false;
  const { data, isLoading } = useProjectFetch(project, enabled, retry);

  return (
    <ProjectContext.Provider
      value={{
        project: data,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject() {
  return useContext(ProjectContext);
}
