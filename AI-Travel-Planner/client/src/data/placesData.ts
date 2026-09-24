import { getDestinationImage, getDestinationThumbnail } from './destinationImages';
import indianDestinationsMaster from './indianDestinationsMaster.json';

export interface IndianDestinationItem {
  name: string;
  slug: string;
  state: string;
  category: string;
  primaryLandmarks?: string[];
  searchQueries?: string[];
  country?: string;
}

export const INDIAN_DESTINATIONS_MASTER: IndianDestinationItem[] = indianDestinationsMaster as IndianDestinationItem[];

export function findDestinationMaster(nameOrSlug: string): IndianDestinationItem | undefined {
  const norm = nameOrSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const clean = nameOrSlug.toLowerCase().trim();
  return INDIAN_DESTINATIONS_MASTER.find(
    (d) => d.slug === norm || d.name.toLowerCase() === clean || d.slug === clean
  );
}

export interface Place {
  id: string;
  slug?: string;
  name: string;
  location: string;
  state: string;
  category: string;
  rating: string;
  heroImage: string;
  thumbnailImage?: string;
  gallery: string[];
  description: string;
  highlights: string[];
  bestTime: string;
  idealDuration: string;
  avgBudget: string;
  temperature: string;
  tags: string[];
}

export const DESTINATION_IMAGES: Record<string, string> = {
  Puri: getDestinationImage('Puri', '/destination-images/puri.webp'),
  Goa: getDestinationImage('Goa', '/destination-images/goa.webp'),
  Jaipur: getDestinationImage('Jaipur', '/destination-images/jaipur.webp'),
  Agra: getDestinationImage('Agra', '/destination-images/agra.webp'),
  Varanasi: getDestinationImage('Varanasi', '/destination-images/varanasi.webp'),
  Manali: getDestinationImage('Manali', '/destination-images/manali.webp'),
  Munnar: getDestinationImage('Munnar', '/destination-images/munnar.webp'),
  Darjeeling: getDestinationImage('Darjeeling', '/destination-images/darjeeling.webp'),
  Mumbai: getDestinationImage('Mumbai', '/destination-images/mumbai.webp'),
  Delhi: getDestinationImage('Delhi', '/destination-images/delhi.webp'),
  Kerala: getDestinationImage('Kerala', 'https://images.pexels.com/photos/30778230/pexels-photo-30778230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  Rishikesh: getDestinationImage('Rishikesh', 'https://images.pexels.com/photos/5205541/pexels-photo-5205541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  Udaipur: getDestinationImage('Udaipur', 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=940&q=80'),
  Pondicherry: getDestinationImage('Pondicherry', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=940&q=80'),
  Ladakh: getDestinationImage('Ladakh', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=940&q=80'),
  Hampi: getDestinationImage('Hampi', 'https://images.unsplash.com/photo-1600100397608-f010f44383aa?auto=format&fit=crop&w=940&q=80'),
  Kashmir: getDestinationImage('Kashmir', 'https://images.unsplash.com/photo-1566837489311-10ed4c9957e8?auto=format&fit=crop&w=940&q=80'),
};

export const PLACES: Place[] = [
  {
    id: 'jaipur-palaces',
    name: 'Jaipur Palaces',
    location: 'Jaipur',
    state: 'Rajasthan',
    category: 'Culture & history',
    rating: '4.8',
    heroImage: 'https://images.pexels.com/photos/32261804/pexels-photo-32261804.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/32261804/pexels-photo-32261804.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/161401/fathpur-sikri-agra-india-monument-161401.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/3881104/pexels-photo-3881104.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'The capital of Rajasthan, famously known as the "Pink City" for its terracotta-pink buildings. Founded in 1727 by Maharaja Sawai Jai Singh II, Jaipur forms part of India\'s Golden Triangle. The city is a dazzling blend of grandiose palaces, hilltop forts, bustling bazaars overflowing with textiles and gems, and astronomical wonders like Jantar Mantar.',
    highlights: ['Amber Fort elephant ride & mirror palace', 'Hawa Mahal (Palace of Winds)', 'City Palace & museum', 'Jantar Mantar observatory', 'Johari Bazaar shopping for jewellery & textiles'],
    bestTime: 'Oct – Mar',
    idealDuration: '3–4 days',
    avgBudget: '₹10,000 – ₹18,000',
    temperature: '15–32°C',
    tags: ['Heritage', 'Forts', 'Palaces', 'Culture', 'Photography'],
  },
  {
    id: 'kerala-backwaters',
    name: 'Kerala Backwaters',
    location: 'Alleppey & Kumarakom',
    state: 'Kerala',
    category: 'Nature escape',
    rating: '4.9',
    heroImage: 'https://images.pexels.com/photos/30778230/pexels-photo-30778230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/30778230/pexels-photo-30778230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/18435639/pexels-photo-18435639.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/20035465/pexels-photo-20035465.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/17928231/pexels-photo-17928231.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'A tranquil labyrinth of over 900 km of interconnected canals, rivers, and lakes fringed by swaying coconut palms and emerald paddy fields. Glide through rural villages aboard a traditional kettuvallam (thatched houseboat), feast on fresh Karimeen fish curry, and watch village life drift by at the pace of the water.',
    highlights: ['Overnight traditional houseboat cruise', 'Village canoe tours through narrow canals', 'Ayurvedic wellness treatments', 'Sunset over Vembanad Lake', 'Local Kerala sadya feast on banana leaf'],
    bestTime: 'Sep – Mar',
    idealDuration: '2–3 days',
    avgBudget: '₹8,000 – ₹20,000',
    temperature: '22–32°C',
    tags: ['Houseboat', 'Backwaters', 'Relaxation', 'Ayurveda', 'Scenic'],
  },
  {
    id: 'goa-beaches',
    name: 'Goa Beaches',
    location: 'Goa',
    state: 'Goa',
    category: 'Beach getaway',
    rating: '4.7',
    heroImage: 'https://images.pexels.com/photos/28368719/pexels-photo-28368719.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/28368719/pexels-photo-28368719.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/3881104/pexels-photo-3881104.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'India\'s sun-soaked coastal paradise, where Portuguese heritage meets tropical beach culture. From the lively shacks and nightlife of North Goa (Baga, Anjuna) to the serene, palm-backed white sands of South Goa (Palolem, Agonda), Goa offers something for every mood. Explore UNESCO-listed Baroque churches in Old Goa, spice plantations, and fresh seafood.',
    highlights: ['Sunset at Palolem & Anjuna beaches', 'Old Goa UNESCO Baroque churches', 'Dudhsagar Waterfalls trek', 'Water sports: parasailing, jet ski', 'Saturday night flea markets'],
    bestTime: 'Nov – Feb',
    idealDuration: '4–5 days',
    avgBudget: '₹12,000 – ₹25,000',
    temperature: '24–33°C',
    tags: ['Beaches', 'Nightlife', 'Seafood', 'Water Sports', 'Sunset'],
  },
  {
    id: 'taj-mahal',
    name: 'Taj Mahal',
    location: 'Agra',
    state: 'Uttar Pradesh',
    category: 'Heritage',
    rating: '5.0',
    heroImage: 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/161401/fathpur-sikri-agra-india-monument-161401.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/12112985/pexels-photo-12112985.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/32261804/pexels-photo-32261804.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'An ivory-white marble mausoleum on the south bank of the Yamuna River, commissioned in 1632 by Mughal Emperor Shah Jahan for his favorite wife, Mumtaz Mahal. Widely regarded as the greatest architectural achievement in Mughal architecture, this UNESCO World Heritage Site attracts millions every year with its symmetry, inlay work, and changing hues at sunrise and sunset.',
    highlights: ['Sunrise view from Mehtab Bagh', 'Intricate marble pietra dura inlay work', 'Agra Fort (Mughal royal residence)', 'Fatehpur Sikri day excursion', 'Petha tasting (local sweet delicacy)'],
    bestTime: 'Oct – Mar',
    idealDuration: '1–2 days',
    avgBudget: '₹5,000 – ₹10,000',
    temperature: '12–30°C',
    tags: ['Wonder of the World', 'Mughal', 'Architecture', 'Romantic', 'UNESCO'],
  },
  {
    id: 'manali-hills',
    name: 'Manali Hills',
    location: 'Manali',
    state: 'Himachal Pradesh',
    category: 'Mountain escape',
    rating: '4.8',
    heroImage: 'https://images.pexels.com/photos/29494184/pexels-photo-29494184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/29494184/pexels-photo-29494184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/20035465/pexels-photo-20035465.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/20035528/pexels-photo-20035528.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/5205541/pexels-photo-5205541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'Perched at 2,050 m in the Beas River valley, Manali is India\'s favorite Himalayan playground. Surrounded by snow-capped peaks, pine forests, and apple orchards, it caters equally to backpackers, honeymooners, and thrill-seekers. Solang Valley provides paragliding and skiing, while the Atal Tunnel connects to the remote, surreal landscapes of Lahaul and Spiti.',
    highlights: ['Rohtang Pass snow viewpoints', 'Solang Valley paragliding & skiing', 'Atal Tunnel drive to Sissu', 'Old Manali cafes & wooden houses', 'Hadimba Devi Temple in cedar forest'],
    bestTime: 'Oct – Jun',
    idealDuration: '3–5 days',
    avgBudget: '₹8,000 – ₹16,000',
    temperature: '-2–20°C',
    tags: ['Snow', 'Mountains', 'Adventure', 'Paragliding', 'Himalayas'],
  },
  {
    id: 'varanasi-ghats',
    name: 'Varanasi Ghats',
    location: 'Varanasi',
    state: 'Uttar Pradesh',
    category: 'Soulful escape',
    rating: '4.6',
    heroImage: 'https://images.pexels.com/photos/12112985/pexels-photo-12112985.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/12112985/pexels-photo-12112985.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/18435639/pexels-photo-18435639.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/17928231/pexels-photo-17928231.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'One of the world\'s oldest continuously inhabited cities and the spiritual heart of India. Varanasi sits on the banks of the sacred Ganges, its 88 ghats alive with pilgrims, sadhus, and rituals. The dawn boat ride past the ghats and the evening Ganga Aarti at Dashashwamedh Ghat create an unforgettable sensory experience.',
    highlights: ['Sunrise boat ride on the Ganges', 'Ganga Aarti evening prayer ceremony', 'Kashi Vishwanath Temple', 'Sarnath deer park & Dhamek Stupa', 'Banarasi silk saree weaving walks'],
    bestTime: 'Oct – Mar',
    idealDuration: '2–3 days',
    avgBudget: '₹6,000 – ₹12,000',
    temperature: '10–35°C',
    tags: ['Spiritual', 'Ganges', 'Temples', 'Ancient', 'Heritage'],
  },
  {
    id: 'munnar-tea-gardens',
    name: 'Munnar Tea Gardens',
    location: 'Munnar',
    state: 'Kerala',
    category: 'Scenic viewpoint',
    rating: '4.9',
    heroImage: 'https://images.pexels.com/photos/17928231/pexels-photo-17928231.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/17928231/pexels-photo-17928231.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/30778230/pexels-photo-30778230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/20035465/pexels-photo-20035465.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/29494184/pexels-photo-29494184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'A hill station in the Western Ghats, 1,600 m above sea level, blanketed in emerald tea plantations. Munnar\'s rolling hills, mist-covered valleys, and cool climate make it a perfect retreat from the plains. Visit tea factories, Eravikulam National Park (home of the Nilgiri tahr), Mattupetty Dam, and Top Station for jaw-dropping views.',
    highlights: ['Tea plantation walks & factory tours', 'Eravikulam National Park & Nilgiri tahr', 'Mattupetty Dam & speedboat rides', 'Top Station clouds & viewpoints', 'Lush spice gardens'],
    bestTime: 'Sep – Mar',
    idealDuration: '3–4 days',
    avgBudget: '₹8,000 – ₹15,000',
    temperature: '10–25°C',
    tags: ['Tea Gardens', 'Hill Station', 'Nature', 'Wildlife', 'Greenery'],
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    location: 'Rishikesh',
    state: 'Uttarakhand',
    category: 'Adventure',
    rating: '4.7',
    heroImage: 'https://images.pexels.com/photos/5205541/pexels-photo-5205541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    gallery: [
      'https://images.pexels.com/photos/5205541/pexels-photo-5205541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/20035465/pexels-photo-20035465.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/29494184/pexels-photo-29494184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/12112985/pexels-photo-12112985.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'The "Yoga Capital of the World" — a spiritual town where the holy Ganges rushes out of the Himalayas into the plains. Rishikesh seamlessly blends ashrams, yoga retreats, and heart-pounding adventure sports. White-water rafting on the Ganges, bungee jumping, and riverside camping draw thrill-seekers from across the globe.',
    highlights: ['White-water rafting (Grade III–IV rapids)', 'Beatles Ashram & graffiti forest', 'Lakshman Jhula & Ram Jhula bridges', 'Evening Ganga Aarti at Triveni Ghat', 'Riverside camping & bungee jump'],
    bestTime: 'Sep – Apr',
    idealDuration: '3–4 days',
    avgBudget: '₹7,000 – ₹14,000',
    temperature: '8–35°C',
    tags: ['Yoga', 'Rafting', 'Adventure', 'Spiritual', 'Camping'],
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    location: 'Udaipur',
    state: 'Rajasthan',
    category: 'Heritage & Romance',
    rating: '4.9',
    heroImage: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=940&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=940&q=80',
      'https://images.pexels.com/photos/32261804/pexels-photo-32261804.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/12112985/pexels-photo-12112985.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'Known as the "City of Lakes" and the "Venice of the East", Udaipur is nestled around azure lakes and hemmed in by lush green Aravalli Hills. The monumental City Palace towers over the tranquil waters of Lake Pichola. Sunset boat rides, illuminated palaces, and candlelit rooftop dining create India\'s most romantic destination.',
    highlights: ['Lake Pichola sunset boat ride', 'Grand City Palace complex', 'Jag Mandir island palace', 'Monsoon Palace hill views', 'Saheliyon-ki-Bari gardens'],
    bestTime: 'Oct – Mar',
    idealDuration: '3–4 days',
    avgBudget: '₹12,000 – ₹22,000',
    temperature: '12–30°C',
    tags: ['Lakes', 'Palaces', 'Romantic', 'Heritage', 'Royalty'],
  },
  {
    id: 'darjeeling',
    name: 'Darjeeling',
    location: 'Darjeeling',
    state: 'West Bengal',
    category: 'Mountain retreat',
    rating: '4.8',
    heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=940&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=940&q=80',
      'https://images.pexels.com/photos/17928231/pexels-photo-17928231.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/29494184/pexels-photo-29494184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/5205541/pexels-photo-5205541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'The "Queen of the Hills", famed for its world-renowned orthodox black tea, panoramic vistas of Mount Kanchenjunga (the world\'s third highest peak), and the historic UNESCO Darjeeling Himalayan Toy Train. Wander through mist-cloaked tea estates, enjoy steaming momos, and watch the sun rise in golden splendor from Tiger Hill.',
    highlights: ['Tiger Hill sunrise over Mt. Kanchenjunga', 'Darjeeling Himalayan Toy Train steam ride', 'Happy Valley Tea Estate tour', 'Batasia Loop war memorial', 'Mall Road & Glenary\'s bakery'],
    bestTime: 'Mar – May & Oct – Dec',
    idealDuration: '3–4 days',
    avgBudget: '₹9,000 – ₹18,000',
    temperature: '5–18°C',
    tags: ['Tea', 'Toy Train', 'Kanchenjunga', 'Hills', 'Scenic'],
  },
  {
    id: 'pondicherry',
    name: 'Pondicherry',
    location: 'Pondicherry',
    state: 'Puducherry',
    category: 'Coastal heritage',
    rating: '4.7',
    heroImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=940&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=940&q=80',
      'https://images.pexels.com/photos/28368719/pexels-photo-28368719.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/30778230/pexels-photo-30778230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'A charming seaside union territory reflecting a distinct blend of French colonial heritage and Tamil culture. Known as the "French Riviera of the East", its French Quarter (White Town) features pastel mustard-yellow villas, bougainvillea-draped lanes, chic bohemian cafes, and serene seaside promenades along the Bay of Bengal.',
    highlights: ['French Quarter (White Town) cycling tour', 'Auroville & Matrimandir golden globe', 'Promenade Beach evening walk', 'Aurobindo Ashram meditation', 'Surfing at Paradise Beach'],
    bestTime: 'Oct – Mar',
    idealDuration: '2–3 days',
    avgBudget: '₹8,000 – ₹16,000',
    temperature: '22–32°C',
    tags: ['French Colony', 'Beach', 'Cafes', 'Auroville', 'Peaceful'],
  },
  {
    id: 'ladakh',
    name: 'Ladakh',
    location: 'Leh & Ladakh',
    state: 'Ladakh',
    category: 'High Altitude Wonder',
    rating: '4.9',
    heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=940&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=940&q=80',
      'https://images.unsplash.com/photo-1594226896207-6b453a2a3e0f?auto=format&fit=crop&w=940&q=80',
      'https://images.pexels.com/photos/29494184/pexels-photo-29494184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/20035465/pexels-photo-20035465.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'The "Land of High Passes" — a surreal high-altitude cold desert nestled between the Karakoram and Great Himalaya ranges. Ladakh is famed for crystal-clear turquoise alpine lakes like Pangong Tso and Tso Moriri, millennia-old cliffside Buddhist gompas, rugged moonscapes, and high motorable mountain roads.',
    highlights: ['Pangong Tso turquoise lake glamping', 'Nubra Valley sand dunes & Bactrian camels', 'Khardung La pass (17,982 ft)', 'Thiksey & Hemis monasteries', 'Stargazing at Hanle Dark Sky Reserve'],
    bestTime: 'May – Sep',
    idealDuration: '6–8 days',
    avgBudget: '₹25,000 – ₹45,000',
    temperature: '5–22°C',
    tags: ['High Altitude', 'Mountains', 'Lakes', 'Monasteries', 'Biking'],
  },
  {
    id: 'hampi',
    name: 'Hampi',
    location: 'Hampi',
    state: 'Karnataka',
    category: 'Ancient Ruins & UNESCO',
    rating: '4.8',
    heroImage: 'https://images.unsplash.com/photo-1600100397608-f010f44383aa?auto=format&fit=crop&w=940&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600100397608-f010f44383aa?auto=format&fit=crop&w=940&q=80',
      'https://images.pexels.com/photos/32261804/pexels-photo-32261804.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/161401/fathpur-sikri-agra-india-monument-161401.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: 'A UNESCO World Heritage Site set amidst an otherworldly boulder-strewn landscape by the Tungabhadra River. Hampi was the capital of the Vijayanagara Empire in the 14th century, one of the richest and largest cities in the world of its era. Today, its ruins comprise over 1,600 monuments, grand stone temples, and royal pavilions.',
    highlights: ['Virupaksha Temple & stone chariot', 'Sunset from Matanga Hill', 'Coracle boat ride on Tungabhadra river', 'Lotus Mahal & Elephant Stables', 'Bouldering and hippie island exploration'],
    bestTime: 'Oct – Mar',
    idealDuration: '2–3 days',
    avgBudget: '₹6,000 – ₹12,000',
    temperature: '18–34°C',
    tags: ['Ruins', 'Heritage', 'Temples', 'History', 'Boulders'],
  }
];

export function getOrCreatePlace(nameOrId: string, stateHint?: string): Place {
  const clean = nameOrId.trim();
  const existing = PLACES.find(
    (p) =>
      p.id.toLowerCase() === clean.toLowerCase() ||
      (p.slug && p.slug.toLowerCase() === clean.toLowerCase()) ||
      p.name.toLowerCase() === clean.toLowerCase() ||
      p.location.toLowerCase() === clean.toLowerCase() ||
      p.name.toLowerCase().includes(clean.toLowerCase())
  );
  if (existing) return existing;

  const rawSlug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const master = findDestinationMaster(clean) || findDestinationMaster(rawSlug);
  const displayName = master ? master.name : clean;
  const slug = master ? master.slug : rawSlug;
  const state = master ? master.state : (stateHint || 'India');
  const category = master ? master.category : 'Featured Destination';
  const landmarks = master?.primaryLandmarks || [];

  const localCurated = getDestinationImage(displayName) || getDestinationImage(slug) || getDestinationImage(clean);
  const fallbackImg =
    (localCurated && localCurated !== '/placeholder-travel.svg')
      ? localCurated
      : (DESTINATION_IMAGES[displayName] || DESTINATION_IMAGES[clean] || DESTINATION_IMAGES['Kerala'] || '/placeholder-travel.svg');

  const thumbnailImg = (localCurated && localCurated !== '/placeholder-travel.svg')
    ? (getDestinationThumbnail(displayName) || getDestinationThumbnail(slug) || getDestinationThumbnail(clean))
    : fallbackImg;

  const highlights = landmarks.length > 0
    ? [
        ...landmarks.slice(0, 3).map((l) => `Visit ${l} in ${displayName}`),
        `Authentic regional cuisine and local delicacies in ${state}`,
        `Cultural heritage tours and historic walks`,
        `Local bazaars, handicrafts, and artisan shopping`,
        `Serene nature escapes and unforgettable photographic spots`,
      ]
    : [
        `Iconic viewpoints and scenic sights in and around ${displayName}`,
        `Authentic regional cuisine and local delicacies`,
        `Cultural heritage tours and historic walks`,
        `Local bazaars, handicrafts, and artisan shopping`,
        `Serene nature escapes and unforgettable photographic spots`,
      ];

  const newPlace: Place = {
    id: slug || `place-${Date.now()}`,
    slug,
    name: displayName,
    location: displayName,
    state,
    category,
    rating: '4.8',
    heroImage: fallbackImg,
    thumbnailImage: thumbnailImg,
    gallery: [
      fallbackImg,
      'https://images.pexels.com/photos/28368719/pexels-photo-28368719.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/29494184/pexels-photo-29494184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/32261804/pexels-photo-32261804.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    description: `Discover the breathtaking attractions, rich cultural heritage, and scenic wonders of ${displayName}, ${state}. Perfect for travelers looking for authentic experiences, scenic sightseeing, regional delicacies, and unforgettable memories.`,
    highlights,
    bestTime: 'Oct – Mar',
    idealDuration: '3–4 days',
    avgBudget: '₹8,000 – ₹18,000',
    temperature: '18–30°C',
    tags: [displayName, state, category, ...landmarks.slice(0, 2), 'Explore'],
  };

  PLACES.push(newPlace);
  return newPlace;
}

export function findPlaceByName(name: string): Place {
  const clean = name.trim().toLowerCase();
  const found = PLACES.find(
    (p) =>
      p.name.toLowerCase() === clean ||
      (p.slug && p.slug.toLowerCase() === clean) ||
      p.location.toLowerCase() === clean ||
      p.id.toLowerCase() === clean ||
      p.name.toLowerCase().includes(clean) ||
      clean.includes(p.location.toLowerCase()) ||
      clean.includes(p.name.toLowerCase())
  );
  if (found) return found;
  return getOrCreatePlace(name);
}

export function findPlaceById(id: string): Place {
  const clean = id.trim();
  const found = PLACES.find(
    (p) =>
      p.id === clean ||
      p.id.toLowerCase() === clean.toLowerCase() ||
      (p.slug && p.slug.toLowerCase() === clean.toLowerCase())
  );
  if (found) return found;
  const name = clean.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return getOrCreatePlace(name);
}
