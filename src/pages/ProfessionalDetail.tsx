import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Star, Clock, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { professionals } from "@/data/professionals";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfessionalDetail() {
  const { id } = useParams();
  const professional = professionals.find(p => p.id === id);

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Professional not found</h1>
          <Link to="/professionals">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Professionals
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link to="/professionals">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Professionals
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Professional Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row gap-6">
                    <img
                      src={professional.image}
                      alt={professional.name}
                      className="w-32 h-32 rounded-lg object-cover mx-auto md:mx-0"
                    />
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <CardTitle className="text-2xl">{professional.name}</CardTitle>
                        {professional.verified && (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      <p className="text-lg text-muted-foreground mb-2">{professional.profession}</p>
                      <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{professional.rating}</span>
                          <span className="text-muted-foreground">({professional.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{professional.yearsExperience} years exp.</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{professional.location}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">About</h3>
                      <p className="text-muted-foreground">{professional.description}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-3">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {professional.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-3">Services Offered</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {professional.services.map((service) => (
                          <li key={service} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm">{service}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Card */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{professional.phone}</p>
                        <p className="text-sm text-muted-foreground">Phone</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{professional.email}</p>
                        <p className="text-sm text-muted-foreground">Email</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{professional.location}</p>
                        <p className="text-sm text-muted-foreground">Service Area</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Hourly Rate</span>
                      <span className="text-lg font-bold text-primary">{professional.hourlyRate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{professional.availability}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button className="w-full" size="lg">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                    <Button variant="outline" className="w-full" size="lg">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                    <Button variant="secondary" className="w-full" size="lg">
                      Get Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}