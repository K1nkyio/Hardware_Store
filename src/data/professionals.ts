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
  phone: string;
  email: string;
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
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    description: "Licensed general contractor specializing in residential renovations. Known for quality craftsmanship and on-time project completion.",
    services: ["Full home renovations", "Kitchen remodeling", "Bathroom updates", "Room additions", "Deck construction"],
    availability: "Available for new projects",
    phone: "(555) 123-4567",
    email: "john.mitchell@email.com"
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
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
    description: "Certified master electrician with expertise in modern electrical systems and smart home integration.",
    services: ["Electrical panel upgrades", "Smart home wiring", "Outlet installation", "Lighting design", "EV charger installation"],
    availability: "Booking 2-3 weeks out",
    phone: "(555) 234-5678",
    email: "sarah.chen@email.com"
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
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    description: "Experienced plumber providing reliable residential and commercial plumbing services with 24/7 emergency availability.",
    services: ["Pipe repair and replacement", "Water heater installation", "Drain cleaning", "Fixture installation", "Sewer line repair"],
    availability: "Same-day emergency service",
    phone: "(555) 345-6789",
    email: "mike.rodriguez@email.com"
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
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
    description: "HVAC specialist focused on energy-efficient heating and cooling solutions with excellent customer service.",
    services: ["AC installation and repair", "Heating system maintenance", "Duct cleaning and sealing", "Smart thermostat setup", "Energy audits"],
    availability: "Available next week",
    phone: "(555) 456-7890",
    email: "lisa.thompson@email.com"
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
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
    description: "Professional roofing contractor with expertise in residential roofing systems and storm damage repair.",
    services: ["Roof replacement", "Shingle repair", "Gutter installation", "Roof inspections", "Skylight installation"],
    availability: "Booking 1-2 weeks out",
    phone: "(555) 567-8901",
    email: "david.park@email.com"
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
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face",
    description: "Expert flooring installer with extensive experience in all types of residential and commercial flooring solutions.",
    services: ["Hardwood installation", "Tile and stone work", "Laminate flooring", "Carpet installation", "Floor refinishing"],
    availability: "Available for new projects",
    phone: "(555) 678-9012",
    email: "maria.santos@email.com"
  }
];