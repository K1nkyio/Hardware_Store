import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { projectGuides } from "@/data/projectGuides";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Clock, 
  BarChart3, 
  Users, 
  CheckCircle, 
  Star,
  Hammer,
  ShoppingBag,
  PlayCircle
} from "lucide-react";

export default function ProjectDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [project, setProject] = useState(projectGuides.find(p => p.id === id));
  const [currentStep, setCurrentStep] = useState(1);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const difficultyColors = {
    'Beginner': 'bg-success text-success-foreground',
    'Intermediate': 'bg-warning text-warning-foreground', 
    'Advanced': 'bg-destructive text-destructive-foreground'
  };

  const projectSteps = [
    { id: 1, title: "Planning & Preparation", description: "Gather all materials and tools, measure your space, and create a detailed plan.", duration: "30 minutes" },
    { id: 2, title: "Site Preparation", description: "Clear the work area and set up safety equipment. Mark measurements and prepare the foundation.", duration: "1 hour" },
    { id: 3, title: "Foundation Work", description: "Begin the structural foundation work according to your project requirements.", duration: "2-3 hours" },
    { id: 4, title: "Main Construction", description: "Execute the primary building phase with careful attention to measurements and safety.", duration: "4-6 hours" },
    { id: 5, title: "Assembly & Joining", description: "Connect all components securely using proper joinery techniques.", duration: "2-3 hours" },
    { id: 6, title: "Finishing Touches", description: "Apply finishes, stains, or paint. Install hardware and complete detail work.", duration: "2-4 hours" },
    { id: 7, title: "Quality Check", description: "Inspect all work for quality and safety. Make any necessary adjustments.", duration: "30 minutes" },
    { id: 8, title: "Cleanup & Maintenance", description: "Clean up the work area and establish a maintenance schedule for your project.", duration: "1 hour" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24">
        {/* Header Section */}
        <section className="section-sm">
          <div className="container">
            <div className="mb-6">
              <Button variant="ghost" asChild className="mb-4">
                <Link to="/projects">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={difficultyColors[project.difficulty]}>
                    {project.difficulty}
                  </Badge>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {project.duration}
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    {project.completions.toLocaleString()} completed
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {project.title}
                </h1>
                
                <p className="text-lg text-muted-foreground mb-6">
                  {project.description}
                </p>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-1" />
                    <span className="font-semibold">{project.rating}</span>
                    <span className="text-muted-foreground ml-1">({project.completions} reviews)</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    {project.steps} steps
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button size="lg" className="btn-primary">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Start Project
                  </Button>
                  <Button variant="outline" size="lg">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Get Materials
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-80 object-cover rounded-xl shadow-lg"
                />
                <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="lg">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Materials & Tools Section */}
        <section className="section-sm bg-muted/30">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Materials Needed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {project.materials.map((material, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-success mr-2" />
                        {material}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Hammer className="mr-2 h-5 w-5" />
                    Tools Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {project.tools.map((tool, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-success mr-2" />
                        {tool}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Step-by-Step Guide */}
        <section className="section-sm">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Step-by-Step Guide</h2>
              <p className="text-muted-foreground">Follow these detailed steps to complete your project successfully.</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{currentStep} of {projectSteps.length}</span>
                </div>
                <Progress value={(currentStep / projectSteps.length) * 100} className="h-2" />
              </div>
              
              <div className="space-y-4">
                {projectSteps.map((step, index) => (
                  <Card key={step.id} className={`transition-all duration-200 ${
                    index + 1 === currentStep ? 'ring-2 ring-primary shadow-lg' : 
                    index + 1 < currentStep ? 'bg-muted/50' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          index + 1 < currentStep ? 'bg-success text-success-foreground' :
                          index + 1 === currentStep ? 'bg-primary text-primary-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1 < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{step.title}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {step.duration}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{step.description}</p>
                          {index + 1 === currentStep && (
                            <div className="mt-4 flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => setCurrentStep(Math.min(currentStep + 1, projectSteps.length))}
                                disabled={currentStep === projectSteps.length}
                              >
                                Complete Step
                              </Button>
                              {index > 0 && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setCurrentStep(Math.max(currentStep - 1, 1))}
                                >
                                  Previous
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {currentStep === projectSteps.length && (
                <Card className="mt-8 bg-success/10 border-success">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Congratulations!</h3>
                    <p className="text-muted-foreground mb-4">
                      You've successfully completed the {project.title} project. 
                      Share your results with the community!
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button>Share Your Project</Button>
                      <Button variant="outline" asChild>
                        <Link to="/projects">Browse More Projects</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}