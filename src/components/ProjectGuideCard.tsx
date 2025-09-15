import { Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export interface ProjectGuideProps {
  id: string;
  title: string;
  description: string;
  image: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  category: string;
  materials: string[];
  tools: string[];
  steps: number;
}

interface ProjectGuideCardProps {
  project: ProjectGuideProps;
}

const difficultyColors = {
  'Beginner': 'bg-success text-success-foreground',
  'Intermediate': 'bg-warning text-warning-foreground', 
  'Advanced': 'bg-destructive text-destructive-foreground'
};

export default function ProjectGuideCard({ project }: ProjectGuideCardProps) {
  return (
    <Link to={`/projects/${project.id}`} className="block">
      <div className="project-card group">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={project.image} 
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge className={difficultyColors[project.difficulty]}>
              {project.difficulty}
            </Badge>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{project.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{project.steps} steps</span>
            </div>
          </div>
          
          <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">{project.category}</span>
            <div className="flex items-center text-primary group-hover:text-primary/80 transition-colors">
              <span className="text-sm font-medium mr-1">Start Project</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}