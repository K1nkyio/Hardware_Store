import { Clock, Layers, ArrowUpRight } from "lucide-react";
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
  'Beginner': 'bg-success/10 text-success border-success/20',
  'Intermediate': 'bg-warning/10 text-warning border-warning/20', 
  'Advanced': 'bg-destructive/10 text-destructive border-destructive/20'
};

export default function ProjectGuideCard({ project }: ProjectGuideCardProps) {
  return (
    <Link to={`/projects/${project.id}`} className="group block">
      <div className="relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/20">
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img 
            src={project.image} 
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          {/* Difficulty badge */}
          <div className="absolute top-4 left-4">
            <Badge className={`${difficultyColors[project.difficulty]} border text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm`}>
              {project.difficulty}
            </Badge>
          </div>

          {/* Category chip */}
          <div className="absolute top-4 right-4">
            <span className="bg-foreground/60 backdrop-blur-sm text-primary-foreground text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
              {project.category}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 -mt-6 relative">
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              <span className="font-medium">{project.duration}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
              <Layers className="h-3 w-3" />
              <span className="font-medium">{project.steps} steps</span>
            </div>
          </div>
          
          <h3 className="font-bold text-lg mb-2 leading-snug group-hover:text-primary transition-colors duration-300">
            {project.title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
          
          <div className="flex items-center text-sm font-bold text-primary opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            Start Project <ArrowUpRight className="ml-1 h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
