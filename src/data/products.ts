import { ProductProps } from '@/components/ProductCard';

export const products: ProductProps[] = [
  // Power Tools
  {
    id: '1',
    name: 'DeWalt 20V MAX Cordless Drill',
    description: 'Professional-grade cordless drill with brushless motor and LED work light. Perfect for drilling and fastening applications.',
    price: 129.99,
    originalPrice: 159.99,
    rating: 4.8,
    reviewCount: 2341,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
    category: 'Power Tools',
    brand: 'DeWalt',
    inStock: true,
    isNew: false,
    isBestSeller: true,
    discount: 19
  },
  {
    id: '2',
    name: 'Milwaukee M18 Circular Saw',
    description: 'Cordless circular saw with 7-1/4" blade. Delivers up to 570 crosscuts per charge in 2x4 lumber.',
    price: 199.99,
    rating: 4.7,
    reviewCount: 1876,
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400',
    category: 'Power Tools',
    brand: 'Milwaukee',
    inStock: true,
    isNew: true,
    isBestSeller: false
  },
  {
    id: '3',
    name: 'Makita XPH12Z Hammer Drill',
    description: 'Brushless cordless hammer drill with variable 2-speed transmission. Built for heavy-duty applications.',
    price: 179.99,
    originalPrice: 219.99,
    rating: 4.9,
    reviewCount: 987,
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400',
    category: 'Power Tools',
    brand: 'Makita',
    inStock: true,
    isNew: false,
    isBestSeller: false,
    discount: 18
  },

  // Hand Tools
  {
    id: '4',
    name: 'Stanley 25ft FatMax Tape Measure',
    description: 'Heavy-duty tape measure with 11ft standout and Mylar polyester film for durability.',
    price: 24.99,
    rating: 4.6,
    reviewCount: 3456,
    image: 'https://images.unsplash.com/photo-1609205807107-e1ec4458ffe0?w=400',
    category: 'Hand Tools',
    brand: 'Stanley',
    inStock: true,
    isNew: false,
    isBestSeller: true
  },
  {
    id: '5',
    name: 'Klein Tools Electrician Pliers Set',
    description: 'Professional 3-piece pliers set including needle-nose, lineman, and diagonal cutting pliers.',
    price: 89.99,
    rating: 4.8,
    reviewCount: 1234,
    image: 'https://images.unsplash.com/photo-1567127022-b5fb52ba6336?w=400',
    category: 'Hand Tools',
    brand: 'Klein Tools',
    inStock: true,
    isNew: false,
    isBestSeller: false
  },
  {
    id: '6',
    name: 'Craftsman 230-Piece Tool Set',
    description: 'Complete mechanics tool set with sockets, wrenches, and screwdrivers in organized carrying case.',
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.5,
    reviewCount: 876,
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400',
    category: 'Hand Tools',
    brand: 'Craftsman',
    inStock: true,
    isNew: false,
    isBestSeller: false,
    discount: 25
  },

  // Hardware & Fasteners
  {
    id: '7',
    name: 'Stainless Steel Hex Bolt Assortment',
    description: 'Complete assortment of stainless steel hex bolts, nuts, and washers in organized storage case.',
    price: 39.99,
    rating: 4.4,
    reviewCount: 567,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    category: 'Hardware',
    brand: 'Generic',
    inStock: true,
    isNew: false,
    isBestSeller: false
  },
  {
    id: '8',
    name: 'Galvanized Carriage Bolts 1/2" x 6"',
    description: 'Pack of 25 galvanized carriage bolts with nuts and washers. Perfect for deck and fence construction.',
    price: 18.99,
    rating: 4.3,
    reviewCount: 234,
    image: 'https://images.unsplash.com/photo-1609205806914-41de0c35b0ba?w=400',
    category: 'Hardware',
    brand: 'Generic',
    inStock: true,
    isNew: false,
    isBestSeller: false
  },

  // Lumber & Building Materials
  {
    id: '9',
    name: 'Pressure Treated 2x4x8 Lumber',
    description: 'Ground contact pressure treated pine lumber. Ideal for outdoor construction and landscaping projects.',
    price: 8.99,
    rating: 4.2,
    reviewCount: 1567,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    category: 'Lumber',
    brand: 'Generic',
    inStock: true,
    isNew: false,
    isBestSeller: true
  },
  {
    id: '10',
    name: 'Cedar Deck Boards 5/4" x 6" x 12"',
    description: 'Premium cedar decking boards with natural weather resistance and beautiful grain pattern.',
    price: 24.99,
    rating: 4.7,
    reviewCount: 432,
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    category: 'Lumber',
    brand: 'Generic',
    inStock: true,
    isNew: false,
    isBestSeller: false
  },

  // Electrical
  {
    id: '11',
    name: 'Romex 12-2 AWG Wire 250ft',
    description: 'Non-metallic sheathed cable for residential wiring. UL listed and NEC compliant.',
    price: 89.99,
    rating: 4.6,
    reviewCount: 789,
    image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400',
    category: 'Electrical',
    brand: 'Southwire',
    inStock: true,
    isNew: false,
    isBestSeller: false
  },
  {
    id: '12',
    name: 'GFCI Outlet 20A Tamper Resistant',
    description: 'Ground fault circuit interrupter outlet with LED indicator and weather-resistant cover.',
    price: 19.99,
    rating: 4.5,
    reviewCount: 345,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    category: 'Electrical',
    brand: 'Leviton',
    inStock: false,
    isNew: false,
    isBestSeller: false
  },

  // Plumbing
  {
    id: '13',
    name: 'PVC Pipe Fitting Kit',
    description: 'Complete assortment of PVC fittings including elbows, tees, couplers, and reducers.',
    price: 34.99,
    rating: 4.4,
    reviewCount: 234,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    category: 'Plumbing',
    brand: 'Charlotte Pipe',
    inStock: true,
    isNew: false,
    isBestSeller: false
  },
  {
    id: '14',
    name: 'Brass Ball Valve 3/4 Inch',
    description: 'Full port brass ball valve with lever handle. Lead-free and NSF certified for potable water.',
    price: 12.99,
    rating: 4.7,
    reviewCount: 456,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    category: 'Plumbing',
    brand: 'SharkBite',
    inStock: true,
    isNew: false,
    isBestSeller: false
  },

  // Paint & Supplies
  {
    id: '15',
    name: 'Benjamin Moore Advance Paint 1 Gallon',
    description: 'Premium interior paint with superior coverage and durability. Low VOC formula.',
    price: 64.99,
    rating: 4.8,
    reviewCount: 1234,
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400',
    category: 'Paint',
    brand: 'Benjamin Moore',
    inStock: true,
    isNew: false,
    isBestSeller: true
  },
  {
    id: '16',
    name: 'Purdy XL Elite Paint Brush Set',
    description: 'Professional paint brush set with angled and straight brushes for precision painting.',
    price: 49.99,
    originalPrice: 69.99,
    rating: 4.9,
    reviewCount: 567,
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400',
    category: 'Paint',
    brand: 'Purdy',
    inStock: true,
    isNew: false,
    isBestSeller: false,
    discount: 29
  }
];