import deckImage from "@/assets/deck-building.jpg";
import coffeeTableImage from "@/assets/wooden-coffee-table.jpg";
import firePitImage from "@/assets/stone-fire-pit.jpg";
import bookshelfImage from "@/assets/built-in-bookshelf.jpg";
import pergolaImage from "@/assets/pergola-construction.jpg";
import floatingShelvesImage from "@/assets/floating-shelves.jpg";
import bathroomVanityImage from "@/assets/bathroom-vanity.jpg";
import gardenBedImage from "@/assets/raised-garden-bed.jpg";
import backsplashImage from "@/assets/kitchen-backsplash.jpg";
import closetOrganizerImage from "@/assets/closet-organizer.jpg";
import modernShelfImage from "@/assets/floating-shelf-modern.jpg";
import smartSwitchImage from "@/assets/smart-light-switches.jpg";
import planterBoxImage from "@/assets/garden-planter-box.jpg";
import mudroomBenchImage from "@/assets/mudroom-bench.jpg";
import tileFloorImage from "@/assets/tile-floor-installation.jpg";
import accentWallImage from "@/assets/wood-accent-wall.jpg";

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
    image: deckImage,
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
    id: "wooden-coffee-table",
    title: "Rustic Wooden Coffee Table",
    description: "Build a stunning rustic coffee table using reclaimed wood. Perfect for beginners wanting to learn basic woodworking joints and finishing techniques.",
    image: coffeeTableImage,
    difficulty: "Beginner",
    duration: "1 day",
    category: "Furniture",
    materials: ["Reclaimed wood planks", "Wood glue", "Wood screws", "Wood stain", "Polyurethane finish"],
    tools: ["Miter saw", "Sander", "Drill", "Clamps"],
    steps: 8,
    rating: 4.6,
    completions: 890
  },
  {
    id: "outdoor-fire-pit",
    title: "Stone Fire Pit Construction",
    description: "Create a cozy outdoor gathering spot with a custom stone fire pit. Learn about proper drainage, safety clearances, and fire-resistant materials.",
    image: firePitImage,
    difficulty: "Intermediate",
    duration: "1-2 days",
    category: "Outdoor",
    materials: ["Fire bricks", "Stone blocks", "Sand", "Gravel", "Metal fire ring"],
    tools: ["Shovel", "Level", "Wheelbarrow", "Rubber mallet"],
    steps: 10,
    rating: 4.8,
    completions: 650
  },
  {
    id: "built-in-bookshelf",
    title: "Built-in Bookshelf System",
    description: "Transform any wall into a stunning library with custom built-in bookshelves. Includes advanced carpentry techniques and trim work.",
    image: bookshelfImage,
    difficulty: "Advanced",
    duration: "3-4 days",
    category: "Storage",
    materials: ["Plywood sheets", "Hardwood trim", "Adjustable shelf pins", "Crown molding"],
    tools: ["Table saw", "Router", "Nail gun", "Pocket hole jig"],
    steps: 18,
    rating: 4.9,
    completions: 320
  },
  {
    id: "pergola-construction",
    title: "Backyard Pergola Build",
    description: "Add shade and style to your outdoor space with a custom pergola. Learn post installation, beam connections, and lattice work.",
    image: pergolaImage,
    difficulty: "Intermediate",
    duration: "2-3 days",
    category: "Outdoor",
    materials: ["Pressure-treated posts", "Laminated beams", "Lattice panels", "Post anchors"],
    tools: ["Circular saw", "Impact driver", "Post level", "Speed square"],
    steps: 14,
    rating: 4.5,
    completions: 780
  },
  {
    id: "floating-shelves",
    title: "Install Floating Shelves",
    description: "Add stylish storage to any room with custom floating shelves. Learn proper wall mounting techniques and achieve a professional finish.",
    image: floatingShelvesImage,
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
    image: bathroomVanityImage,
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
    image: gardenBedImage,
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
    image: backsplashImage,
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
    image: closetOrganizerImage,
    difficulty: "Intermediate",
    duration: "1 day",
    category: "Storage",
    materials: ["Melamine boards", "Closet rods", "Shelf pins", "L-brackets"],
    tools: ["Circular saw", "Drill", "Pocket hole jig", "Router"],
    steps: 9,
    rating: 4.6,
    completions: 750
  },
  {
    id: "modern-floating-shelf",
    title: "Build a Modern Floating Shelf",
    description: "Create sleek, minimalist floating shelves that appear to hover on your wall. Perfect for modern home aesthetics with hidden bracket systems.",
    image: modernShelfImage,
    difficulty: "Beginner",
    duration: "3-4 hours",
    category: "Storage",
    materials: ["Hardwood board", "Hidden floating brackets", "Wood finish", "Wall anchors"],
    tools: ["Router", "Drill", "Level", "Stud finder"],
    steps: 6,
    rating: 4.7,
    completions: 1400
  },
  {
    id: "smart-light-switches",
    title: "Install Smart Light Switches",
    description: "Upgrade your home with smart lighting control. Learn proper electrical connections, wire management, and smart home integration.",
    image: smartSwitchImage,
    difficulty: "Intermediate",
    duration: "2-3 hours",
    category: "Electrical",
    materials: ["Smart switches", "Wire nuts", "Electrical tape", "Cable labels"],
    tools: ["Wire strippers", "Voltage tester", "Screwdriver set", "Needle-nose pliers"],
    steps: 8,
    rating: 4.5,
    completions: 680
  },
  {
    id: "garden-planter-box",
    title: "Build a Garden Planter Box",
    description: "Construct a large, durable planter box for vegetables or flowers. Features proper drainage, soil depth, and weather-resistant construction.",
    image: planterBoxImage,
    difficulty: "Beginner",
    duration: "4-5 hours",
    category: "Garden",
    materials: ["Cedar planks", "Galvanized screws", "Landscape fabric", "Drainage gravel"],
    tools: ["Miter saw", "Drill", "Square", "Measuring tape"],
    steps: 10,
    rating: 4.8,
    completions: 2200
  },
  {
    id: "mudroom-bench",
    title: "Built-in Mudroom Bench",
    description: "Create functional entryway storage with a custom mudroom bench featuring cubby holes, hooks, and hidden storage compartments.",
    image: mudroomBenchImage,
    difficulty: "Advanced",
    duration: "2-3 days",
    category: "Storage",
    materials: ["Plywood", "Hardwood trim", "Piano hinge", "Coat hooks", "Cushion foam"],
    tools: ["Table saw", "Router", "Pocket hole jig", "Nail gun"],
    steps: 16,
    rating: 4.9,
    completions: 420
  },
  {
    id: "tile-floor-installation",
    title: "Install Ceramic Tile Flooring",
    description: "Master the art of tile installation with proper substrate preparation, layout planning, cutting techniques, and professional finishing.",
    image: tileFloorImage,
    difficulty: "Advanced",
    duration: "3-4 days",
    category: "Flooring",
    materials: ["Ceramic tiles", "Tile adhesive", "Grout", "Tile spacers", "Underlayment"],
    tools: ["Tile saw", "Trowel", "Grout float", "Tile nippers", "Level"],
    steps: 14,
    rating: 4.4,
    completions: 380
  },
  {
    id: "wood-accent-wall",
    title: "Create a Wood Accent Wall",
    description: "Transform any room with a stunning wood accent wall. Learn board selection, spacing techniques, and finishing for a professional look.",
    image: accentWallImage,
    difficulty: "Intermediate",
    duration: "1-2 days",
    category: "Interior",
    materials: ["Wood planks", "Wood stain", "Construction adhesive", "Finish nails"],
    tools: ["Miter saw", "Nail gun", "Level", "Stud finder"],
    steps: 11,
    rating: 4.6,
    completions: 950
  }
];