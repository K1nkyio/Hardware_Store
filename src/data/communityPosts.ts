export interface CommunityPost {
  id: string;
  type: 'showcase' | 'question' | 'event';
  title: string;
  author: string;
  authorImage: string;
  content: string;
  image?: string;
  date: string;
  likes: number;
  comments: number;
  tags: string[];
  category: string;
}

export const communityPosts: CommunityPost[] = [
  {
    id: "deck-transformation",
    type: "showcase",
    title: "Complete Deck Makeover - Before & After",
    author: "Tom Wilson",
    authorImage: "/api/placeholder/50/50",
    content: "Just finished this amazing deck transformation using pressure-treated lumber and composite decking. The difference is incredible! Total project took about 3 weekends.",
    image: "/api/placeholder/600/400",
    date: "2 days ago",
    likes: 47,
    comments: 12,
    tags: ["deck", "outdoor", "DIY"],
    category: "Project Showcase"
  },
  {
    id: "kitchen-help",
    type: "question",
    title: "Need advice on kitchen backsplash tile layout",
    author: "Jennifer Lee",
    authorImage: "/api/placeholder/50/50",
    content: "Working on my first tile backsplash project. Should I center the tiles on the range or start from a corner? The space is a bit tricky with windows on both sides.",
    date: "5 hours ago",
    likes: 8,
    comments: 15,
    tags: ["kitchen", "tile", "advice"],
    category: "Help & Questions"
  },
  {
    id: "workshop-event",
    type: "event",
    title: "Weekend Workshop: Introduction to Woodworking",
    author: "BuildMaster Pro",
    authorImage: "/api/placeholder/50/50",
    content: "Join us this Saturday for a hands-on woodworking workshop! Learn basic techniques, tool safety, and create a simple project to take home. All skill levels welcome.",
    date: "Tomorrow",
    likes: 23,
    comments: 8,
    tags: ["workshop", "woodworking", "learning"],
    category: "Events & Workshops"
  },
  {
    id: "bathroom-renovation",
    type: "showcase",
    title: "Small Bathroom Big Impact - 5x7 Renovation",
    author: "Alex Rodriguez",
    authorImage: "/api/placeholder/50/50",
    content: "Transformed our tiny bathroom with smart storage solutions and a modern design. Proving that size doesn't matter when you have the right plan!",
    image: "/api/placeholder/600/400",
    date: "1 week ago",
    likes: 89,
    comments: 23,
    tags: ["bathroom", "renovation", "small-space"],
    category: "Project Showcase"
  },
  {
    id: "tool-recommendation",
    type: "question",
    title: "Best circular saw for beginner DIYer?",
    author: "Mike Chen",
    authorImage: "/api/placeholder/50/50",
    content: "Looking to buy my first circular saw for basic home projects. What features should I prioritize? Budget is around $150-200.",
    date: "3 days ago",
    likes: 12,
    comments: 19,
    tags: ["tools", "recommendation", "beginner"],
    category: "Tool Talk"
  },
  {
    id: "safety-workshop",
    type: "event",
    title: "Power Tool Safety Certification Course",
    author: "Safety First Training",
    authorImage: "/api/placeholder/50/50",
    content: "Professional safety certification for power tool use. Required for some contractor licenses. Includes hands-on training and safety equipment overview.",
    date: "Next Friday",
    likes: 15,
    comments: 4,
    tags: ["safety", "certification", "professional"],
    category: "Professional Development"
  }
];

export const communityCategories = [
  "All Posts",
  "Project Showcase", 
  "Help & Questions",
  "Tool Talk",
  "Events & Workshops",
  "Professional Development"
];