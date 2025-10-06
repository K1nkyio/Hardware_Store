import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { projectGuides } from "@/data/projectGuides";
import ProjectGuideCard from "@/components/ProjectGuideCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Projects() {
  const { t } = useLanguage();
  const [filteredGuides, setFilteredGuides] = useState(projectGuides);
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let filtered = projectGuides;
    
    if (skillFilter !== "all") {
      filtered = filtered.filter(guide => guide.difficulty === skillFilter);
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(guide => guide.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    
    setFilteredGuides(filtered);
  }, [skillFilter, categoryFilter]);

  const categories = ["all", ...Array.from(new Set(projectGuides.map(guide => guide.category)))];
  const difficulties = ["all", "Beginner", "Intermediate", "Advanced"];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24">
        <section className="section-sm">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t.projects.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t.projects.subtitle}
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t.projects.filters.skill} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.projects.filters.allSkills}</SelectItem>
                    <SelectItem value="Beginner">{t.projects.filters.beginner}</SelectItem>
                    <SelectItem value="Intermediate">{t.projects.filters.intermediate}</SelectItem>
                    <SelectItem value="Advanced">{t.projects.filters.advanced}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t.projects.filters.category} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? t.common.allCategories : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Badge variant="secondary">
                {t.projects.filters.showing} {filteredGuides.length} {t.projects.filters.guides}
              </Badge>
            </div>

            {/* Project Guides Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map(guide => (
                <ProjectGuideCard key={guide.id} project={guide} />
              ))}
            </div>

            {filteredGuides.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  {t.common.noMatchFilters}
                </p>
                <Button onClick={() => {
                  setSkillFilter("all");
                  setCategoryFilter("all");
                }}>
                  {t.common.clearFilters}
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}