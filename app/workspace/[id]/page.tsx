'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Project, ProjectType } from '../../../types';
import { ColabWorkspace } from '../../../components/ColabWorkspace';
import SineWaveLoading from '../../../components/SineWaveLoading';
import { PreviewModal, PreviewFile } from '../../../components/PreviewModal';
import { generateWordDocument } from '../../../components/exportService';
import { useAuth } from '../../../components/AuthProvider';

const IdeWorkspace = dynamic(
  () => import('../../../components/IdeWorkspace').then((mod) => mod.IdeWorkspace),
  { ssr: false }
);

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!id) return;
        const p = await api.getProject(id);
        setProject(p);
      } catch (err) {
        console.error("Failed to load project", err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, router]);

  if (loading) {
    return <SineWaveLoading />;
  }

  if (!project) {
    return null; // or redirecting
  }

  const handleBack = () => {
    router.push('/');
  };

  const ideFiles: PreviewFile[] = project.files?.map(f => ({
    name: f.name,
    content: f.content,
    type: 'code',
    lastOutput: f.lastOutput
  })) || [];

  return (
    <>
      {project.type === ProjectType.COLAB ? (
        <ColabWorkspace
          project={project}
          onBack={handleBack}
          onProjectUpdate={setProject}
          api={{ updateProject: api.updateProject }}
        />
      ) : (
        <div className="h-screen overflow-hidden bg-[#1e1e1e] pt-[60px] md:pt-0"> 
           <div className="h-[calc(100vh-64px)]">
            <IdeWorkspace
                project={project}
                onBack={handleBack}
                onExport={() => setShowPreview(true)}
                onProjectUpdate={setProject}
                api={{ updateProject: api.updateProject, updateFile: api.updateFile }}
            />
           </div>
        </div>
      )}
      {showPreview && (
        <PreviewModal
          title={project.name}
          files={ideFiles}
          onClose={() => setShowPreview(false)}
          onDownload={() => generateWordDocument(project)}
        />
      )}
    </>
  );
}