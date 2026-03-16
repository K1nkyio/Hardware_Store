// Mock product data for development
export interface Product {
  id: string;
  name: string;
  price_cents: number;
  image_url?: string;
  category?: string;
  description?: string;
  stock?: number;
  status?: string;
}

// Mock products data
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "PVC Elbow 90°",
    price_cents: 4500,
    image_url: "/placeholder.svg",
    category: "Pipes & Fittings",
    description: "High-quality PVC elbow fitting for plumbing applications",
    stock: 50,
    status: "active"
  },
  {
    id: "2", 
    name: "GI Gate Valve 1/2\"",
    price_cents: 32000,
    image_url: "/placeholder.svg",
    category: "Valves",
    description: "Durable galvanized iron gate valve",
    stock: 25,
    status: "active"
  },
  {
    id: "3",
    name: "Stainless Kitchen Faucet",
    price_cents: 185000,
    image_url: "/placeholder.svg", 
    category: "Faucets & Taps",
    description: "Modern stainless steel kitchen faucet",
    stock: 15,
    status: "active"
  },
  {
    id: "4",
    name: "Electrical Wire 14AWG",
    price_cents: 8500,
    image_url: "/placeholder.svg",
    category: "Electrical & Lighting",
    description: "Copper electrical wire for residential wiring",
    stock: 100,
    status: "active"
  },
  {
    id: "5",
    name: "Safety Helmet White",
    price_cents: 12000,
    image_url: "/placeholder.svg",
    category: "Safety Equipment", 
    description: "Construction safety helmet with adjustable strap",
    stock: 30,
    status: "active"
  },
  {
    id: "6",
    name: "All-Purpose Cleaner 1L",
    price_cents: 6500,
    image_url: "/placeholder.svg",
    category: "Cleaning & Home Maintenance",
    description: "Multi-surface cleaning solution",
    stock: 75,
    status: "active"
  },
  {
    id: "7",
    name: "Interior Paint White 5L",
    price_cents: 45000,
    image_url: "/placeholder.svg",
    category: "Paints",
    description: "Premium interior wall paint",
    stock: 20,
    status: "active"
  },
  {
    id: "8",
    name: "Cement Bag 50kg",
    price_cents: 28000,
    image_url: "/placeholder.svg",
    category: "Building & Construction Materials",
    description: "High-grade Portland cement",
    stock: 40,
    status: "active"
  },
  {
    id: "9",
    name: "Copper Pipe 1/2\"",
    price_cents: 15000,
    image_url: "/placeholder.svg",
    category: "Plumbing",
    description: "Type L copper pipe for plumbing",
    stock: 60,
    status: "active"
  },
  {
    id: "10",
    name: "LED Bulb 60W",
    price_cents: 9500,
    image_url: "/placeholder.svg",
    category: "Electrical & Lighting",
    description: "Energy-efficient LED light bulb",
    stock: 80,
    status: "active"
  },
  {
    id: "11",
    name: "Safety Gloves",
    price_cents: 8500,
    image_url: "/placeholder.svg",
    category: "Safety Equipment",
    description: "Heavy-duty work gloves",
    stock: 45,
    status: "active"
  },
  {
    id: "12",
    name: "Floor Cleaner 2L",
    price_cents: 12000,
    image_url: "/placeholder.svg",
    category: "Cleaning & Home Maintenance",
    description: "Professional floor cleaning solution",
    stock: 35,
    status: "active"
  },
  {
    id: "13",
    name: "Exterior Paint Gray 5L",
    price_cents: 52000,
    image_url: "/placeholder.svg",
    category: "Paints",
    description: "Weather-resistant exterior paint",
    stock: 18,
    status: "active"
  },
  {
    id: "14",
    name: "Steel Rebar 12mm",
    price_cents: 18000,
    image_url: "/placeholder.svg",
    category: "Building & Construction Materials",
    description: "Steel reinforcement bar",
    stock: 25,
    status: "active"
  },
  {
    id: "15",
    name: "PEX Pipe 3/4\"",
    price_cents: 22000,
    image_url: "/placeholder.svg",
    category: "Plumbing",
    description: "Flexible PEX tubing for plumbing",
    stock: 55,
    status: "active"
  },
  {
    id: "16",
    name: "Electrical Box 4x4",
    price_cents: 7500,
    image_url: "/placeholder.svg",
    category: "Electrical & Lighting",
    description: "Standard electrical junction box",
    stock: 90,
    status: "active"
  },
  {
    id: "17",
    name: "Safety Glasses",
    price_cents: 5500,
    image_url: "/placeholder.svg",
    category: "Safety Equipment",
    description: "Protective safety eyewear",
    stock: 70,
    status: "active"
  },
  {
    id: "18",
    name: "Window Cleaner 750ml",
    price_cents: 4500,
    image_url: "/placeholder.svg",
    category: "Cleaning & Home Maintenance",
    description: "Streak-free window cleaning solution",
    stock: 85,
    status: "active"
  },
  {
    id: "19",
    name: "Primer Paint 1L",
    price_cents: 15000,
    image_url: "/placeholder.svg",
    category: "Paints",
    description: "Surface preparation primer",
    stock: 40,
    status: "active"
  },
  {
    id: "20",
    name: "Concrete Mix 25kg",
    price_cents: 12000,
    image_url: "/placeholder.svg",
    category: "Building & Construction Materials",
    description: "Ready-to-use concrete mix",
    stock: 30,
    status: "active"
  },
  {
    id: "21",
    name: "ABS Pipe 1\"",
    price_cents: 13000,
    image_url: "/placeholder.svg",
    category: "Plumbing",
    description: "ABS plastic pipe for drainage",
    stock: 65,
    status: "active"
  },
  {
    id: "22",
    name: "LED Strip Light 5m",
    price_cents: 35000,
    image_url: "/placeholder.svg",
    category: "Electrical & Lighting",
    description: "Flexible LED strip lighting",
    stock: 22,
    status: "active"
  },
  {
    id: "23",
    name: "Hard Hat Yellow",
    price_cents: 13000,
    image_url: "/placeholder.svg",
    category: "Safety Equipment",
    description: "Construction hard hat with suspension",
    stock: 28,
    status: "active"
  },
  {
    id: "24",
    name: "Bathroom Cleaner 1L",
    price_cents: 7500,
    image_url: "/placeholder.svg",
    category: "Cleaning & Home Maintenance",
    description: "Specialized bathroom cleaning formula",
    stock: 50,
    status: "active"
  }
];

// Mock API function
export async function getProducts(): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockProducts;
}

// Format price for display
export function formatProductPrice(priceCents: number): string {
  return `₱${(priceCents / 100).toLocaleString()}`;
}

// Get products by category
export function getProductsByCategory(category: string): Product[] {
  return mockProducts.filter(product => 
    product.category?.toLowerCase().includes(category.toLowerCase())
  );
}
