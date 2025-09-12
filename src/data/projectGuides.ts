export interface ProjectGuide {
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
  rating: number;
  completions: number;
}

export const projectGuides: ProjectGuide[] = [
  {
    id: "deck-building",
    title: "Build a Simple Deck",
    description: "Create a beautiful outdoor deck perfect for entertaining and relaxation. This comprehensive guide covers planning, materials, and step-by-step construction.",
    image: "/api/placeholder/400/300",
    difficulty: "Intermediate",
    duration: "2-3 days",
    category: "Outdoor",
    materials: ["Pressure-treated lumber", "Deck screws", "Joist hangers", "Concrete footings"],
    tools: ["Circular saw", "Drill", "Level", "Measuring tape"],
    steps: 12,
    rating: 4.7,
    completions: 1250
  },
  {
    id: "floating-shelves",
    title: "Install Floating Shelves",
    description: "Add stylish storage to any room with custom floating shelves. Learn proper wall mounting techniques and achieve a professional finish.",
    image: "/api/placeholder/400/300",
    difficulty: "Beginner",
    duration: "2-4 hours",
    category: "Storage",
    materials: ["Pine boards", "Hidden brackets", "Wall anchors", "Wood stain"],
    tools: ["Stud finder", "Level", "Drill", "Router"],
    steps: 8,
    rating: 4.5,
    completions: 2100
  },
  {
    id: "bathroom-vanity",
    title: "Replace Bathroom Vanity",
    description: "Upgrade your bathroom with a new vanity installation. Includes plumbing connections, countertop mounting, and finishing touches.",
    image: "/api/placeholder/400/300",
    difficulty: "Advanced",
    duration: "1-2 days",
    category: "Bathroom",
    materials: ["Vanity cabinet", "Countertop", "Faucet", "P-trap assembly"],
    tools: ["Pipe wrench", "Jigsaw", "Tile saw", "Plumbing snake"],
    steps: 15,
    rating: 4.3,
    completions: 450
  },
  {
    id: "raised-garden-bed",
    title: "Build Raised Garden Beds",
    description: "Create productive garden spaces with cedar raised beds. Perfect for beginners wanting to start vegetable gardening.",
    image: "/api/placeholder/400/300",
    difficulty: "Beginner",
    duration: "4-6 hours",
    category: "Garden",
    materials: ["Cedar boards", "Corner brackets", "Landscape fabric", "Soil"],
    tools: ["Miter saw", "Drill", "Shovel", "Garden rake"],
    steps: 10,
    rating: 4.8,
    completions: 1800
  },
  {
    id: "kitchen-backsplash",
    title: "Tile Kitchen Backsplash",
    description: "Transform your kitchen with a custom tile backsplash. Learn cutting techniques, adhesive application, and grouting for professional results.",
    image: "/api/placeholder/400/300",
    difficulty: "Intermediate",
    duration: "1-2 days",
    category: "Kitchen",
    materials: ["Subway tiles", "Tile adhesive", "Grout", "Tile spacers"],
    tools: ["Tile cutter", "Trowel", "Grout float", "Tile saw"],
    steps: 11,
    rating: 4.4,
    completions: 920
  },
  {
    id: "closet-organizer",
    title: "Custom Closet Organization",
    description: "Maximize closet space with a custom organization system. Build adjustable shelving and hanging solutions.",
    image: "/api/placeholder/400/300",
    difficulty: "Intermediate",
    duration: "1 day",
    category: "Storage",
    materials: ["Melamine boards", "Closet rods", "Shelf pins", "L-brackets"],
    tools: ["Circular saw", "Drill", "Pocket hole jig", "Router"],
    steps: 9,
    rating: 4.6,
    completions: 750
  }
];