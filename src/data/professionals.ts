export interface Professional {
  id: string;
  name: string;
  profession: string;
  specialties: string[];
  location: string;
  rating: number;
  reviews: number;
  yearsExperience: number;
  verified: boolean;
  hourlyRate: string;
  image: string;
  description: string;
  services: string[];
  availability: string;
}

export const professionals: Professional[] = [
  {
    id: "john-contractor",
    name: "John Mitchell",
    profession: "General Contractor",
    specialties: ["Kitchen Remodels", "Bathroom Renovations", "Home Additions"],
    location: "Downtown Area",
    rating: 4.9,
    reviews: 127,
    yearsExperience: 15,
    verified: true,
    hourlyRate: "$85-120",
    image: "/api/placeholder/150/150",
    description: "Licensed general contractor specializing in residential renovations. Known for quality craftsmanship and on-time project completion.",
    services: ["Full home renovations", "Kitchen remodeling", "Bathroom updates", "Room additions", "Deck construction"],
    availability: "Available for new projects"
  },
  {
    id: "sarah-electrician",
    name: "Sarah Chen",
    profession: "Master Electrician",
    specialties: ["Panel Upgrades", "Smart Home Installation", "Commercial Wiring"],
    location: "North District",
    rating: 4.8,
    reviews: 89,
    yearsExperience: 12,
    verified: true,
    hourlyRate: "$95-140",
    image: "/api/placeholder/150/150",
    description: "Certified master electrician with expertise in modern electrical systems and smart home integration.",
    services: ["Electrical panel upgrades", "Smart home wiring", "Outlet installation", "Lighting design", "EV charger installation"],
    availability: "Booking 2-3 weeks out"
  },
  {
    id: "mike-plumber",
    name: "Mike Rodriguez",
    profession: "Licensed Plumber",
    specialties: ["Pipe Repair", "Water Heater Installation", "Drain Cleaning"],
    location: "South Side",
    rating: 4.7,
    reviews: 156,
    yearsExperience: 18,
    verified: true,
    hourlyRate: "$75-110",
    image: "/api/placeholder/150/150",
    description: "Experienced plumber providing reliable residential and commercial plumbing services with 24/7 emergency availability.",
    services: ["Pipe repair and replacement", "Water heater installation", "Drain cleaning", "Fixture installation", "Sewer line repair"],
    availability: "Same-day emergency service"
  },
  {
    id: "lisa-hvac",
    name: "Lisa Thompson",
    profession: "HVAC Specialist",
    specialties: ["AC Installation", "Heating Systems", "Duct Cleaning"],
    location: "West End",
    rating: 4.9,
    reviews: 94,
    yearsExperience: 14,
    verified: true,
    hourlyRate: "$90-130",
    image: "/api/placeholder/150/150",
    description: "HVAC specialist focused on energy-efficient heating and cooling solutions with excellent customer service.",
    services: ["AC installation and repair", "Heating system maintenance", "Duct cleaning and sealing", "Smart thermostat setup", "Energy audits"],
    availability: "Available next week"
  },
  {
    id: "david-roofing",
    name: "David Park",
    profession: "Roofing Contractor",
    specialties: ["Shingle Replacement", "Gutter Installation", "Roof Inspection"],
    location: "East Hills",
    rating: 4.6,
    reviews: 73,
    yearsExperience: 11,
    verified: true,
    hourlyRate: "$70-100",
    image: "/api/placeholder/150/150",
    description: "Professional roofing contractor with expertise in residential roofing systems and storm damage repair.",
    services: ["Roof replacement", "Shingle repair", "Gutter installation", "Roof inspections", "Skylight installation"],
    availability: "Booking 1-2 weeks out"
  },
  {
    id: "maria-flooring",
    name: "Maria Santos",
    profession: "Flooring Expert",
    specialties: ["Hardwood Installation", "Tile Work", "Laminate Flooring"],
    location: "Central District",
    rating: 4.8,
    reviews: 112,
    yearsExperience: 16,
    verified: true,
    hourlyRate: "$60-95",
    image: "/api/placeholder/150/150",
    description: "Expert flooring installer with extensive experience in all types of residential and commercial flooring solutions.",
    services: ["Hardwood installation", "Tile and stone work", "Laminate flooring", "Carpet installation", "Floor refinishing"],
    availability: "Available for new projects"
  }
];