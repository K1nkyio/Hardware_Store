import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { professionals } from "@/data/professionals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, CheckCircle, Phone, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Professionals() {
  const { t } = useLanguage();
  const [filteredPros, setFilteredPros] = useState(professionals);
  const [professionFilter, setProfessionFilter] = useState<string>("all");
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (professionFilter === "all") {
      setFilteredPros(professionals);
    } else {
      setFilteredPros(professionals.filter(pro => pro.profession.toLowerCase().includes(professionFilter.toLowerCase())));
    }
  }, [professionFilter]);

  const professionCategories = ["all", "General Contractor", "Electrician", "Plumber", "HVAC", "Roofing", "Flooring"];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24">
        <section className="section-sm">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t.professionals.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t.professionals.subtitle}
              </p>
            </div>

            {/* Professional Categories */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
              {Object.entries(t.professionals.categories).map(([key, value]) => (
                <Card key={key} className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 bg-primary rounded"></div>
                    </div>
                    <p className="text-sm font-medium">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filter */}
            <div className="flex justify-between items-center mb-8">
              <Select value={professionFilter} onValueChange={setProfessionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by profession" />
                </SelectTrigger>
                <SelectContent>
                  {professionCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Professionals" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Badge variant="secondary">
                {filteredPros.length} professionals available
              </Badge>
            </div>

            {/* Professionals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPros.map(pro => (
                <Card key={pro.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <img 
                        src={pro.image} 
                        alt={pro.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{pro.name}</CardTitle>
                          {pro.verified && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <CardDescription className="text-primary font-medium">
                          {pro.profession}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{pro.rating}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ({pro.reviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {pro.location}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {pro.yearsExperience} years experience
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pro.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {pro.specialties.slice(0, 2).map(specialty => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-primary">
                        {pro.hourlyRate}/hr
                      </span>
                      <Badge 
                        variant={pro.availability === "Available for new projects" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {pro.availability}
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      {t.professionals.getQuote}
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link to={`/professionals/${pro.id}`}>
                        {t.professionals.viewProfile}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}