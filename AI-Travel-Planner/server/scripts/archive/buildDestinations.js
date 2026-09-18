const fs = require("fs");
const path = require("path");

// Top 10 PILOT destinations (STRICT REQUIREMENT: must be 1-10)
const pilotDestinations = [
  {
    name: "Puri",
    slug: "puri",
    state: "Odisha",
    category: "Beach / Heritage",
    primaryLandmarks: ["Jagannath Temple", "Puri Beach", "Gundicha Temple"],
    searchQueries: ["Puri Beach Odisha", "Jagannath Temple Puri", "Puri Odisha landmark", "Puri sea beach Odisha"]
  },
  {
    name: "Goa",
    slug: "goa",
    state: "Goa",
    category: "Beach / Heritage",
    primaryLandmarks: ["Baga Beach", "Fort Aguada", "Basilica of Bom Jesus", "Palolem Beach"],
    searchQueries: ["Goa beach India", "Fort Aguada Goa", "Baga Beach Goa", "Goa tourism landscape"]
  },
  {
    name: "Jaipur",
    slug: "jaipur",
    state: "Rajasthan",
    category: "Heritage / Palaces",
    primaryLandmarks: ["Hawa Mahal", "Amber Fort", "City Palace", "Jal Mahal"],
    searchQueries: ["Hawa Mahal Jaipur", "Amber Fort Jaipur", "Jaipur Rajasthan palace", "Jal Mahal Jaipur"]
  },
  {
    name: "Agra",
    slug: "agra",
    state: "Uttar Pradesh",
    category: "Heritage / Wonder of World",
    primaryLandmarks: ["Taj Mahal", "Agra Fort", "Fatehpur Sikri", "Mehtab Bagh"],
    searchQueries: ["Taj Mahal Agra", "Agra Fort Uttar Pradesh", "Fatehpur Sikri Agra", "Taj Mahal monument India"]
  },
  {
    name: "Varanasi",
    slug: "varanasi",
    state: "Uttar Pradesh",
    category: "Spiritual / Ghats",
    primaryLandmarks: ["Dashashwamedh Ghat", "Kashi Vishwanath Temple", "Assi Ghat", "Ganges River"],
    searchQueries: ["Varanasi Ghats Ganges", "Dashashwamedh Ghat Varanasi", "Kashi Vishwanath Varanasi", "Varanasi riverfront Ganga"]
  },
  {
    name: "Manali",
    slug: "manali",
    state: "Himachal Pradesh",
    category: "Hill Station / Valley",
    primaryLandmarks: ["Solang Valley", "Rohtang Pass", "Hadimba Temple", "Jogini Waterfall"],
    searchQueries: ["Solang Valley Manali", "Manali Himachal Pradesh mountains", "Hadimba Temple Manali", "Rohtang Pass Himachal"]
  },
  {
    name: "Munnar",
    slug: "munnar",
    state: "Kerala",
    category: "Hill Station / Tea Gardens",
    primaryLandmarks: ["Tea Gardens", "Anamudi Peak", "Mattupetty Dam", "Eravikulam National Park"],
    searchQueries: ["Munnar tea gardens Kerala", "Munnar hills landscape", "Mattupetty Dam Munnar", "Eravikulam Munnar"]
  },
  {
    name: "Darjeeling",
    slug: "darjeeling",
    state: "West Bengal",
    category: "Hill Station / Tea Heritage",
    primaryLandmarks: ["Tiger Hill", "Batasia Loop", "Darjeeling Himalayan Railway", "Peace Pagoda"],
    searchQueries: ["Darjeeling tea gardens West Bengal", "Batasia Loop Darjeeling", "Tiger Hill Darjeeling", "Darjeeling toy train"]
  },
  {
    name: "Mumbai",
    slug: "mumbai",
    state: "Maharashtra",
    category: "Metropolis / Coastal",
    primaryLandmarks: ["Gateway of India", "Marine Drive", "Chhatrapati Shivaji Terminus", "Bandra-Worli Sea Link"],
    searchQueries: ["Gateway of India Mumbai", "Marine Drive Mumbai", "Chhatrapati Shivaji Terminus Mumbai", "Mumbai skyline sea link"]
  },
  {
    name: "Delhi",
    slug: "delhi",
    state: "Delhi",
    category: "National Capital / Heritage",
    primaryLandmarks: ["India Gate", "Red Fort", "Qutub Minar", "Humayun's Tomb", "Lotus Temple"],
    searchQueries: ["India Gate Delhi", "Qutub Minar Delhi", "Humayun's Tomb Delhi", "Red Fort Delhi"]
  }
];

// Additional destinations by region to complete exactly 300
const regionalDestinations = [
  // ODISHA
  { name: "Konark", slug: "konark", state: "Odisha", category: "Heritage / UNESCO", primaryLandmarks: ["Sun Temple Konark", "Chandrabhaga Beach"], searchQueries: ["Konark Sun Temple Odisha", "Sun Temple Konark architecture", "Chandrabhaga Beach Konark"] },
  { name: "Bhubaneswar", slug: "bhubaneswar", state: "Odisha", category: "Temple City / Heritage", primaryLandmarks: ["Lingaraj Temple", "Udayagiri Caves", "Mukteshwar Temple"], searchQueries: ["Lingaraj Temple Bhubaneswar", "Mukteshwar Temple Bhubaneswar", "Udayagiri Khandagiri Bhubaneswar"] },
  { name: "Chilika Lake", slug: "chilika-lake", state: "Odisha", category: "Lagoon / Wildlife", primaryLandmarks: ["Kalijai Island", "Nalbana Sanctuary"], searchQueries: ["Chilika Lake Odisha", "Chilika lagoon boats Odisha", "Chilika Lake birds"] },
  { name: "Gopalpur", slug: "gopalpur", state: "Odisha", category: "Beach / Coastal", primaryLandmarks: ["Gopalpur Beach", "Gopalpur Lighthouse"], searchQueries: ["Gopalpur on Sea Odisha", "Gopalpur Beach Odisha", "Gopalpur lighthouse"] },
  { name: "Simlipal", slug: "simlipal", state: "Odisha", category: "National Park / Waterfall", primaryLandmarks: ["Barehipani Falls", "Joranda Falls"], searchQueries: ["Simlipal National Park Odisha", "Barehipani Falls Simlipal", "Simlipal tiger reserve"] },
  { name: "Koraput", slug: "koraput", state: "Odisha", category: "Hills / Tribal Culture", primaryLandmarks: ["Deomali Peak", "Duduma Waterfalls", "Kolab Dam"], searchQueries: ["Deomali peak Koraput", "Duduma Falls Koraput", "Koraput hills Odisha"] },
  { name: "Dhauli", slug: "dhauli", state: "Odisha", category: "Buddhist Heritage", primaryLandmarks: ["Shanti Stupa", "Ashokan Edicts"], searchQueries: ["Dhauli Shanti Stupa Odisha", "Dhauli peace pagoda Bhubaneswar"] },
  { name: "Chandipur", slug: "chandipur", state: "Odisha", category: "Beach / Hide and Seek Sea", primaryLandmarks: ["Chandipur Beach"], searchQueries: ["Chandipur sea beach Odisha", "Chandipur on sea Balasore"] },
  { name: "Raghurajpur", slug: "raghurajpur", state: "Odisha", category: "Heritage Crafts Village", primaryLandmarks: ["Pattachitra Village", "Gotipua Dance"], searchQueries: ["Raghurajpur craft village Odisha", "Raghurajpur Pattachitra art"] },
  { name: "Sambalpur", slug: "sambalpur", state: "Odisha", category: "Dam / Textile / Temples", primaryLandmarks: ["Hirakud Dam", "Samaleswari Temple"], searchQueries: ["Hirakud Dam Sambalpur Odisha", "Samaleswari Temple Sambalpur"] },

  // WEST BENGAL
  { name: "Kolkata", slug: "kolkata", state: "West Bengal", category: "Metropolis / Colonial", primaryLandmarks: ["Victoria Memorial", "Howrah Bridge", "Dakshineswar Kali Temple"], searchQueries: ["Victoria Memorial Kolkata", "Howrah Bridge Kolkata", "Dakshineswar Temple Kolkata"] },
  { name: "Kalimpong", slug: "kalimpong", state: "West Bengal", category: "Hill Station / Monasteries", primaryLandmarks: ["Deolo Hill", "Morgan House"], searchQueries: ["Kalimpong hill station West Bengal", "Deolo Hill Kalimpong", "Morgan House Kalimpong"] },
  { name: "Sundarbans", slug: "sundarbans", state: "West Bengal", category: "Mangrove / Wildlife", primaryLandmarks: ["Sundarbans Forest", "Sajnekhali"], searchQueries: ["Sundarbans National Park mangrove", "Sundarbans delta West Bengal", "Sundarbans boat river"] },
  { name: "Digha", slug: "digha", state: "West Bengal", category: "Beach / Coastal", primaryLandmarks: ["New Digha Beach", "Udaipur Beach Digha"], searchQueries: ["Digha sea beach West Bengal", "New Digha beach coast"] },
  { name: "Mandarmani", slug: "mandarmani", state: "West Bengal", category: "Beach / Coastal", primaryLandmarks: ["Mandarmani Beach"], searchQueries: ["Mandarmani beach West Bengal", "Mandarmani sea coast"] },
  { name: "Kurseong", slug: "kurseong", state: "West Bengal", category: "Hill Station / Tea", primaryLandmarks: ["Eagle's Crag", "Makaibari"], searchQueries: ["Kurseong tea garden West Bengal", "Eagle's Crag Kurseong"] },
  { name: "Mirik", slug: "mirik", state: "West Bengal", category: "Lake / Hill Station", primaryLandmarks: ["Sumendu Lake"], searchQueries: ["Mirik lake West Bengal", "Sumendu Lake Mirik"] },
  { name: "Dooars", slug: "dooars", state: "West Bengal", category: "Forests / Foothills", primaryLandmarks: ["Gorumara National Park", "Jaldapara"], searchQueries: ["Gorumara National Park Dooars", "Jaldapara sanctuary Dooars"] },
  { name: "Shantiniketan", slug: "shantiniketan", state: "West Bengal", category: "Cultural / Heritage", primaryLandmarks: ["Visva Bharati", "Tagore Ashram"], searchQueries: ["Shantiniketan Visva Bharati", "Rabindranath Tagore Shantiniketan"] },
  { name: "Bishnupur", slug: "bishnupur", state: "West Bengal", category: "Terracotta Temples", primaryLandmarks: ["Rasmancha", "Jor Bangla"], searchQueries: ["Bishnupur terracotta temple", "Rasmancha Bishnupur West Bengal"] },

  // RAJASTHAN
  { name: "Udaipur", slug: "udaipur", state: "Rajasthan", category: "Lakes / Palaces", primaryLandmarks: ["City Palace Udaipur", "Lake Pichola", "Jag Mandir"], searchQueries: ["City Palace Udaipur Rajasthan", "Lake Pichola Udaipur", "Udaipur lake palace"] },
  { name: "Jodhpur", slug: "jodhpur", state: "Rajasthan", category: "Blue City / Forts", primaryLandmarks: ["Mehrangarh Fort", "Umaid Bhawan", "Jaswant Thada"], searchQueries: ["Mehrangarh Fort Jodhpur", "Umaid Bhawan Palace Jodhpur", "Jaswant Thada Jodhpur"] },
  { name: "Jaisalmer", slug: "jaisalmer", state: "Rajasthan", category: "Desert / Forts", primaryLandmarks: ["Jaisalmer Fort", "Sam Sand Dunes", "Patwon Haveli"], searchQueries: ["Jaisalmer Fort Rajasthan", "Sam Sand Dunes Jaisalmer", "Patwon Ki Haveli Jaisalmer"] },
  { name: "Pushkar", slug: "pushkar", state: "Rajasthan", category: "Sacred Lake / Desert", primaryLandmarks: ["Pushkar Lake", "Brahma Temple Pushkar"], searchQueries: ["Pushkar Lake Rajasthan", "Brahma Temple Pushkar"] },
  { name: "Bikaner", slug: "bikaner", state: "Rajasthan", category: "Heritage / Forts", primaryLandmarks: ["Junagarh Fort", "Laxmi Niwas"], searchQueries: ["Junagarh Fort Bikaner", "Laxmi Niwas Palace Bikaner"] },
  { name: "Mount Abu", slug: "mount-abu", state: "Rajasthan", category: "Hill Station / Temples", primaryLandmarks: ["Dilwara Temples", "Nakki Lake"], searchQueries: ["Dilwara Temples Mount Abu", "Nakki Lake Mount Abu Rajasthan"] },
  { name: "Ranthambore", slug: "ranthambore", state: "Rajasthan", category: "National Park / Wildlife", primaryLandmarks: ["Ranthambore Fort", "Tiger Reserve"], searchQueries: ["Ranthambore National Park Rajasthan", "Ranthambore Fort Rajasthan"] },
  { name: "Chittorgarh", slug: "chittorgarh", state: "Rajasthan", category: "Fort / Valour", primaryLandmarks: ["Chittorgarh Fort", "Vijay Stambha"], searchQueries: ["Chittorgarh Fort Rajasthan", "Vijay Stambha Chittorgarh"] },
  { name: "Ajmer", slug: "ajmer", state: "Rajasthan", category: "Sufi Pilgrimage / Forts", primaryLandmarks: ["Ajmer Sharif Dargah", "Ana Sagar Lake"], searchQueries: ["Ajmer Sharif Dargah Rajasthan", "Ana Sagar Lake Ajmer"] },
  { name: "Kumbhalgarh", slug: "kumbhalgarh", state: "Rajasthan", category: "Great Wall of India", primaryLandmarks: ["Kumbhalgarh Fort Wall"], searchQueries: ["Kumbhalgarh Fort Rajasthan", "Kumbhalgarh wall Rajasthan"] },
  { name: "Bundi", slug: "bundi", state: "Rajasthan", category: "Stepwells / Forts", primaryLandmarks: ["Taragarh Fort Bundi", "Raniji Ki Baori"], searchQueries: ["Taragarh Fort Bundi Rajasthan", "Raniji Ki Baori stepwell"] },
  { name: "Bharatpur", slug: "bharatpur", state: "Rajasthan", category: "Bird Sanctuary / UNESCO", primaryLandmarks: ["Keoladeo National Park"], searchQueries: ["Keoladeo National Park Bharatpur", "Keoladeo Ghana bird sanctuary"] },
  { name: "Alwar", slug: "alwar", state: "Rajasthan", category: "Forts / Lakes", primaryLandmarks: ["Bhangarh Fort", "Siliserh Lake"], searchQueries: ["Bhangarh Fort Rajasthan", "Siliserh Lake Alwar"] },
  { name: "Mandawa", slug: "mandawa", state: "Rajasthan", category: "Fresco Havelis", primaryLandmarks: ["Mandawa Havelis", "Mandawa Fort"], searchQueries: ["Mandawa haveli Shekhawati", "Mandawa Fort Rajasthan"] },
  { name: "Shekhawati", slug: "shekhawati", state: "Rajasthan", category: "Open Air Art Gallery", primaryLandmarks: ["Nawalgarh Havelis", "Fatehpur Havelis"], searchQueries: ["Shekhawati haveli paintings Rajasthan", "Nawalgarh haveli Shekhawati"] },
  { name: "Ranakpur", slug: "ranakpur", state: "Rajasthan", category: "Marble Jain Temples", primaryLandmarks: ["Ranakpur Jain Temple"], searchQueries: ["Ranakpur Jain Temple marble pillars", "Ranakpur temple architecture"] },
  { name: "Nathdwara", slug: "nathdwara", state: "Rajasthan", category: "Spiritual / Shrinathji", primaryLandmarks: ["Shrinathji Temple", "Statue of Belief"], searchQueries: ["Shrinathji Temple Nathdwara", "Statue of Belief Nathdwara Shiva"] },

  // GUJARAT
  { name: "Rann of Kutch", slug: "rann-of-kutch", state: "Gujarat", category: "White Salt Desert", primaryLandmarks: ["White Rann", "Kala Dungar"], searchQueries: ["White Rann of Kutch Gujarat", "Kala Dungar Kutch"] },
  { name: "Statue of Unity", slug: "statue-of-unity", state: "Gujarat", category: "World's Tallest Statue", primaryLandmarks: ["Statue of Unity", "Sardar Sarovar"], searchQueries: ["Statue of Unity Gujarat", "Statue of Unity monument India"] },
  { name: "Ahmedabad", slug: "ahmedabad", state: "Gujarat", category: "Heritage City / UNESCO", primaryLandmarks: ["Sabarmati Ashram", "Adalaj Stepwell"], searchQueries: ["Adalaj Stepwell Ahmedabad", "Sabarmati Ashram Ahmedabad"] },
  { name: "Somnath", slug: "somnath", state: "Gujarat", category: "Jyotirlinga / Coastal", primaryLandmarks: ["Somnath Temple", "Somnath Coast"], searchQueries: ["Somnath Temple Gujarat", "Somnath Temple sea coast"] },
  { name: "Dwarka", slug: "dwarka", state: "Gujarat", category: "Char Dham / Coastal", primaryLandmarks: ["Dwarkadhish Temple", "Bet Dwarka"], searchQueries: ["Dwarkadhish Temple Gujarat", "Dwarka Temple sea India"] },
  { name: "Gir National Park", slug: "gir-national-park", state: "Gujarat", category: "Asiatic Lions / Wildlife", primaryLandmarks: ["Sasan Gir"], searchQueries: ["Gir National Park Asiatic lion", "Sasan Gir sanctuary Gujarat"] },
  { name: "Bhuj", slug: "bhuj", state: "Gujarat", category: "Desert Capital / Palaces", primaryLandmarks: ["Aina Mahal", "Prag Mahal"], searchQueries: ["Prag Mahal Bhuj", "Aina Mahal Bhuj Kutch"] },
  { name: "Saputara", slug: "saputara", state: "Gujarat", category: "Hill Station / Dangs", primaryLandmarks: ["Saputara Lake", "Gira Falls"], searchQueries: ["Saputara hill station Gujarat", "Gira Falls Saputara"] },
  { name: "Modhera", slug: "modhera", state: "Gujarat", category: "Sun Temple / Heritage", primaryLandmarks: ["Sun Temple Modhera", "Surya Kund"], searchQueries: ["Sun Temple Modhera Gujarat", "Modhera Sun Temple stepwell"] },
  { name: "Champaner", slug: "champaner", state: "Gujarat", category: "UNESCO Archaeology", primaryLandmarks: ["Jami Masjid Champaner", "Pavagadh"], searchQueries: ["Champaner Pavagadh Archaeological Park", "Jami Masjid Champaner Gujarat"] },
  { name: "Vadodara", slug: "vadodara", state: "Gujarat", category: "Royal Palaces", primaryLandmarks: ["Laxmi Vilas Palace"], searchQueries: ["Laxmi Vilas Palace Vadodara", "Sayaji Baug Vadodara"] },
  { name: "Patan", slug: "patan", state: "Gujarat", category: "Rani Ki Vav / UNESCO", primaryLandmarks: ["Rani Ki Vav Stepwell"], searchQueries: ["Rani Ki Vav stepwell Patan Gujarat UNESCO", "Rani Ki Vav subterranean carvings"] },
  { name: "Dholavira", slug: "dholavira", state: "Gujarat", category: "Harappan Civilization", primaryLandmarks: ["Dholavira Ruins"], searchQueries: ["Dholavira Harappan site ruins Gujarat", "Dholavira Indus Valley reservoir"] },
  { name: "Palitana", slug: "palitana", state: "Gujarat", category: "Jain Temples / Shatrunjaya", primaryLandmarks: ["Shatrunjaya Hill Temples"], searchQueries: ["Palitana Jain temples Shatrunjaya Gujarat", "Palitana hill temples"] },

  // HIMACHAL PRADESH
  { name: "Shimla", slug: "shimla", state: "Himachal Pradesh", category: "Colonial Capital / Hills", primaryLandmarks: ["The Ridge", "Mall Road", "Christ Church"], searchQueries: ["The Ridge Shimla Christ Church", "Mall Road Shimla hills", "Jakhu Temple Shimla"] },
  { name: "Dharamshala", slug: "dharamshala", state: "Himachal Pradesh", category: "Cricket / Kangra Valley", primaryLandmarks: ["HPCA Stadium", "Bhagsunag Falls"], searchQueries: ["Dharamshala cricket stadium mountains", "Bhagsunag Waterfall Dharamshala"] },
  { name: "McLeod Ganj", slug: "mcleod-ganj", state: "Himachal Pradesh", category: "Little Lhasa / Dalai Lama", primaryLandmarks: ["Tsuglagkhang", "Namgyal Monastery"], searchQueries: ["Tsuglagkhang McLeod Ganj", "Namgyal Monastery Dharamshala", "Triund trek McLeodganj"] },
  { name: "Dalhousie", slug: "dalhousie", state: "Himachal Pradesh", category: "Hill Station / Pines", primaryLandmarks: ["Panchpula", "Dainkund Peak"], searchQueries: ["Dalhousie hill station Himachal", "Dainkund Peak Dalhousie"] },
  { name: "Khajjiar", slug: "khajjiar", state: "Himachal Pradesh", category: "Mini Switzerland", primaryLandmarks: ["Khajjiar Lake", "Meadows"], searchQueries: ["Khajjiar meadow lake Himachal", "Khajjiar Mini Switzerland India"] },
  { name: "Spiti Valley", slug: "spiti-valley", state: "Himachal Pradesh", category: "Cold Desert / Monasteries", primaryLandmarks: ["Key Monastery", "Chandratal Lake"], searchQueries: ["Key Monastery Spiti Valley", "Chandratal Lake Himachal", "Dhankar Monastery Spiti"] },
  { name: "Kasol", slug: "kasol", state: "Himachal Pradesh", category: "Parvati Valley / Trekking", primaryLandmarks: ["Parvati River", "Kheerganga"], searchQueries: ["Kasol Parvati River Himachal", "Parvati Valley Kasol"] },
  { name: "Kullu", slug: "kullu", state: "Himachal Pradesh", category: "Valley of Gods / Beas", primaryLandmarks: ["Beas River", "Bijli Mahadev"], searchQueries: ["Kullu valley Beas River", "Bijli Mahadev Kullu"] },
  { name: "Bir Billing", slug: "bir-billing", state: "Himachal Pradesh", category: "Paragliding Capital", primaryLandmarks: ["Billing Launch Site", "Chokling Monastery"], searchQueries: ["Bir Billing paragliding Himachal", "Billing launch site mountains"] },
  { name: "Kaza", slug: "kaza", state: "Himachal Pradesh", category: "High Altitude Spiti", primaryLandmarks: ["Sakya Tangyud Monastery"], searchQueries: ["Kaza Spiti Valley landscape", "Kaza town mountains Himachal"] },
  { name: "Kufri", slug: "kufri", state: "Himachal Pradesh", category: "Snow Views / Pines", primaryLandmarks: ["Mahasu Peak"], searchQueries: ["Kufri snow view Shimla", "Mahasu Peak Kufri"] },
  { name: "Chamba", slug: "chamba", state: "Himachal Pradesh", category: "Heritage / Ravi River", primaryLandmarks: ["Laxmi Narayan Temple Chamba"], searchQueries: ["Chamba valley Himachal Pradesh", "Laxmi Narayan Temple Chamba"] },
  { name: "Kinnaur", slug: "kinnaur", state: "Himachal Pradesh", category: "Apple Valleys / Kinner Kailash", primaryLandmarks: ["Kalpa", "Sangla Valley", "Chitkul"], searchQueries: ["Chitkul Kinnaur Himachal", "Kalpa Kinner Kailash view", "Sangla Valley Kinnaur"] },
  { name: "Tirthan Valley", slug: "tirthan-valley", state: "Himachal Pradesh", category: "Trout / Great Himalayan Park", primaryLandmarks: ["Tirthan River", "Jalori Pass"], searchQueries: ["Tirthan Valley Himachal river", "Jalori Pass Himachal", "Great Himalayan National Park Tirthan"] },
  { name: "Jibhi", slug: "jibhi", state: "Himachal Pradesh", category: "Pine Forests / Waterfalls", primaryLandmarks: ["Jibhi Waterfall", "Chehni Kothi"], searchQueries: ["Jibhi Himachal Pradesh valley waterfall", "Chehni Kothi tower Jibhi"] },

  // UTTARAKHAND
  { name: "Rishikesh", slug: "rishikesh", state: "Uttarakhand", category: "Yoga / Ganga / Adventure", primaryLandmarks: ["Laxman Jhula", "Ram Jhula", "Triveni Ghat"], searchQueries: ["Laxman Jhula Rishikesh Ganga", "Ram Jhula Rishikesh", "Triveni Ghat Rishikesh aarti"] },
  { name: "Haridwar", slug: "haridwar", state: "Uttarakhand", category: "Sacred Ghats / Kumbh", primaryLandmarks: ["Har Ki Pauri", "Mansa Devi"], searchQueries: ["Har Ki Pauri Haridwar Ganga aarti", "Haridwar ghats Ganga"] },
  { name: "Mussoorie", slug: "mussoorie", state: "Uttarakhand", category: "Queen of Hills", primaryLandmarks: ["Kempty Falls", "Gun Hill", "Camel's Back"], searchQueries: ["Kempty Falls Mussoorie", "Gun Hill Mussoorie landscape", "Mussoorie hill station Uttarakhand"] },
  { name: "Nainital", slug: "nainital", state: "Uttarakhand", category: "Lake District / Hills", primaryLandmarks: ["Naini Lake", "Naina Devi Temple"], searchQueries: ["Naini Lake Nainital boats", "Nainital hill station lake Uttarakhand"] },
  { name: "Auli", slug: "auli", state: "Uttarakhand", category: "Skiing / Nanda Devi Peak", primaryLandmarks: ["Auli Ropeway", "Auli Artificial Lake"], searchQueries: ["Auli skiing snow Uttarakhand", "Auli ropeway Nanda Devi", "Auli meadows mountains"] },
  { name: "Jim Corbett", slug: "jim-corbett", state: "Uttarakhand", category: "First National Park / Tigers", primaryLandmarks: ["Dhikala Safari", "Corbett Falls"], searchQueries: ["Jim Corbett National Park Uttarakhand", "Corbett jungle safari tiger"] },
  { name: "Kedarnath", slug: "kedarnath", state: "Uttarakhand", category: "Himalayan Char Dham", primaryLandmarks: ["Kedarnath Temple", "Mandakini Valley"], searchQueries: ["Kedarnath Temple Uttarakhand Himalayas", "Kedarnath Jyotirlinga snow"] },
  { name: "Badrinath", slug: "badrinath", state: "Uttarakhand", category: "Himalayan Char Dham", primaryLandmarks: ["Badrinath Temple", "Mana Village"], searchQueries: ["Badrinath Temple Uttarakhand", "Mana Village Badrinath"] },
  { name: "Valley of Flowers", slug: "valley-of-flowers", state: "Uttarakhand", category: "UNESCO Alpine Meadow", primaryLandmarks: ["Pushpawati Valley", "Hemkund Sahib"], searchQueries: ["Valley of Flowers National Park Uttarakhand", "Valley of Flowers meadow blooms"] },
  { name: "Ranikhet", slug: "ranikhet", state: "Uttarakhand", category: "Pine Woods / Cantonment", primaryLandmarks: ["Chaubatia Gardens", "Golf Course"], searchQueries: ["Ranikhet hill station Uttarakhand", "Chaubatia Gardens Ranikhet"] },
  { name: "Almora", slug: "almora", state: "Uttarakhand", category: "Cultural Hills", primaryLandmarks: ["Jageshwar Dham", "Kasar Devi"], searchQueries: ["Jageshwar Dham Almora", "Kasar Devi Almora"] },
  { name: "Kausani", slug: "kausani", state: "Uttarakhand", category: "Trishul Peak Panoramas", primaryLandmarks: ["Anasakti Ashram", "Trishul View"], searchQueries: ["Kausani Himalayan view peaks", "Anasakti Ashram Kausani"] },
  { name: "Lansdowne", slug: "lansdowne", state: "Uttarakhand", category: "Quiet Oak Hills", primaryLandmarks: ["Bhulla Tal", "Tip N Top"], searchQueries: ["Bhulla Tal Lansdowne Uttarakhand", "Tip In Top Lansdowne"] },
  { name: "Chopta", slug: "chopta", state: "Uttarakhand", category: "Tungnath Trek / Bugyals", primaryLandmarks: ["Tungnath Temple", "Chandrashila"], searchQueries: ["Tungnath Temple Chopta Uttarakhand", "Chandrashila peak view"] },
  { name: "Dehradun", slug: "dehradun", state: "Uttarakhand", category: "Doon Valley / Capital", primaryLandmarks: ["Forest Research Institute", "Robber's Cave"], searchQueries: ["Forest Research Institute Dehradun architecture", "Robber's Cave Guchhupani Dehradun"] },
  { name: "Mukteshwar", slug: "mukteshwar", state: "Uttarakhand", category: "Himalayan Cliffs / Fruit Orchards", primaryLandmarks: ["Mukteshwar Dham", "Chauli Ki Jali"], searchQueries: ["Mukteshwar Dham temple Uttarakhand", "Chauli Ki Jali cliffs Mukteshwar"] },
  { name: "Bhimtal", slug: "bhimtal", state: "Uttarakhand", category: "Island Lake", primaryLandmarks: ["Bhimtal Lake Island"], searchQueries: ["Bhimtal lake island Uttarakhand", "Bhimtal boating hills"] },

  // JAMMU & KASHMIR AND LADAKH
  { name: "Srinagar", slug: "srinagar", state: "Jammu and Kashmir", category: "Dal Lake / Mughal Gardens", primaryLandmarks: ["Dal Lake", "Shalimar Bagh", "Nishat Bagh"], searchQueries: ["Dal Lake Srinagar shikara houseboat", "Shalimar Bagh Srinagar", "Nishat Bagh Mughal garden"] },
  { name: "Gulmarg", slug: "gulmarg", state: "Jammu and Kashmir", category: "Meadow / Gondola / Snow", primaryLandmarks: ["Gulmarg Gondola", "Apharwat Peak"], searchQueries: ["Gulmarg Gondola snow Kashmir", "Gulmarg meadow flowers"] },
  { name: "Pahalgam", slug: "pahalgam", state: "Jammu and Kashmir", category: "Betaab Valley / Lidder", primaryLandmarks: ["Betaab Valley", "Aru Valley", "Lidder River"], searchQueries: ["Betaab Valley Pahalgam Kashmir", "Aru Valley Pahalgam", "Lidder River Pahalgam landscape"] },
  { name: "Sonamarg", slug: "sonamarg", state: "Jammu and Kashmir", category: "Meadow of Gold / Glaciers", primaryLandmarks: ["Thajiwas Glacier", "Sindh River"], searchQueries: ["Thajiwas Glacier Sonamarg Kashmir", "Sonamarg meadow river mountains"] },
  { name: "Patnitop", slug: "patnitop", state: "Jammu and Kashmir", category: "Pine Meadows / Chenab", primaryLandmarks: ["Natha Top", "Sanasar Lake"], searchQueries: ["Patnitop pine meadow Kashmir", "Sanasar lake Patnitop"] },
  { name: "Leh Ladakh", slug: "leh-ladakh", state: "Ladakh", category: "High Himalayas / Monasteries", primaryLandmarks: ["Thiksey Monastery", "Shanti Stupa Leh", "Leh Palace"], searchQueries: ["Thiksey Monastery Ladakh", "Shanti Stupa Leh Ladakh", "Leh Palace Ladakh"] },
  { name: "Pangong Tso", slug: "pangong-tso", state: "Ladakh", category: "High Altitude Blue Lake", primaryLandmarks: ["Pangong Lake"], searchQueries: ["Pangong Tso Lake Ladakh blue", "Pangong Lake mountains reflection"] },
  { name: "Nubra Valley", slug: "nubra-valley", state: "Ladakh", category: "Hunder Dunes / Camels", primaryLandmarks: ["Hunder Sand Dunes", "Diskit Monastery"], searchQueries: ["Hunder sand dunes Nubra Valley", "Diskit Monastery Buddha statue"] },
  { name: "Zanskar", slug: "zanskar", state: "Ladakh", category: "Remote Gorges / Monasteries", primaryLandmarks: ["Phuktal Monastery", "Zanskar River"], searchQueries: ["Phuktal Monastery Zanskar cliff", "Zanskar River gorge Ladakh"] },
  { name: "Tso Moriri", slug: "tso-moriri", state: "Ladakh", category: "High Wetland Lake", primaryLandmarks: ["Tso Moriri Lake", "Korzok Monastery"], searchQueries: ["Tso Moriri Lake Ladakh mountain", "Korzok monastery Tso Moriri"] },

  // KERALA
  { name: "Alappuzha", slug: "alappuzha", state: "Kerala", category: "Backwaters / Houseboats", primaryLandmarks: ["Alleppey Canals", "Vembanad Lake"], searchQueries: ["Alappuzha backwaters houseboat Kerala", "Alleppey backwaters canals"] },
  { name: "Kochi", slug: "kochi", state: "Kerala", category: "Colonial Port / Spice Coast", primaryLandmarks: ["Chinese Fishing Nets", "Fort Kochi"], searchQueries: ["Chinese Fishing Nets Fort Kochi", "Fort Kochi heritage Kerala"] },
  { name: "Wayanad", slug: "wayanad", state: "Kerala", category: "Western Ghats / Waterfalls", primaryLandmarks: ["Banasura Sagar Dam", "Edakkal Caves"], searchQueries: ["Banasura Sagar Dam Wayanad", "Edakkal Caves Wayanad"] },
  { name: "Varkala", slug: "varkala", state: "Kerala", category: "Sea Cliffs / Sunset", primaryLandmarks: ["Varkala Cliff", "Papanasam Beach"], searchQueries: ["Varkala Cliff beach sunset Kerala", "Papanasam Beach Varkala"] },
  { name: "Kovalam", slug: "kovalam", state: "Kerala", category: "Crescent Beach / Lighthouse", primaryLandmarks: ["Lighthouse Beach Kovalam"], searchQueries: ["Kovalam Lighthouse Beach Kerala", "Kovalam beach sea coast"] },
  { name: "Thekkady", slug: "thekkady", state: "Kerala", category: "Periyar Wildlife Sanctuary", primaryLandmarks: ["Periyar Lake", "Elephant Safari"], searchQueries: ["Periyar National Park Thekkady", "Periyar Lake boat wildlife Kerala"] },
  { name: "Kumarakom", slug: "kumarakom", state: "Kerala", category: "Bird Sanctuary / Lake", primaryLandmarks: ["Kumarakom Bird Sanctuary"], searchQueries: ["Kumarakom backwaters Kerala", "Kumarakom Bird Sanctuary"] },
  { name: "Bekal", slug: "bekal", state: "Kerala", category: "Sea Fortress", primaryLandmarks: ["Bekal Fort", "Bekal Beach"], searchQueries: ["Bekal Fort sea Kerala", "Bekal Fort coastal fortress"] },
  { name: "Athirappilly", slug: "athirappilly", state: "Kerala", category: "Niagara of South India", primaryLandmarks: ["Athirappilly Falls"], searchQueries: ["Athirappilly Waterfalls Kerala Niagara", "Athirappilly falls river"] },
  { name: "Poovar", slug: "poovar", state: "Kerala", category: "Estuary / Golden Beach", primaryLandmarks: ["Poovar Island", "Neyyar Estuary"], searchQueries: ["Poovar Island estuary beach Kerala", "Poovar backwaters boat"] },
  { name: "Vagamon", slug: "vagamon", state: "Kerala", category: "Pine Valley / Rolling Green", primaryLandmarks: ["Vagamon Meadows", "Pine Forest"], searchQueries: ["Vagamon pine forest hills Kerala", "Vagamon green meadows landscape"] },
  { name: "Kollam", slug: "kollam", state: "Kerala", category: "Ashtamudi Lake / Munroe Island", primaryLandmarks: ["Munroe Island", "Ashtamudi Lake"], searchQueries: ["Munroe Island backwaters Kollam canals", "Ashtamudi Lake Kollam Kerala"] },
  { name: "Kannur", slug: "kannur", state: "Kerala", category: "Drive-in Beach / Theyyam", primaryLandmarks: ["Muzhappilangad Beach", "St. Angelo Fort"], searchQueries: ["Muzhappilangad Drive in Beach Kannur", "St. Angelo Fort sea Kannur Kerala"] },
  { name: "Thrissur", slug: "thrissur", state: "Kerala", category: "Cultural Capital / Pooram", primaryLandmarks: ["Vadakkunnathan Temple"], searchQueries: ["Vadakkunnathan Temple Thrissur Kerala", "Thrissur Pooram festival temple"] },
  { name: "Kozhikode", slug: "kozhikode", state: "Kerala", category: "Malabar Coast / Beach", primaryLandmarks: ["Kappad Beach", "Kozhikode Beach"], searchQueries: ["Kozhikode Beach sunset Kerala", "Kappad Beach Vasco da Gama Kozhikode"] },

  // TAMIL NADU & PUDUCHERRY
  { name: "Ooty", slug: "ooty", state: "Tamil Nadu", category: "Queen of Hills / Nilgiris", primaryLandmarks: ["Nilgiri Toy Train", "Botanical Garden Ooty"], searchQueries: ["Nilgiri Mountain Railway toy train Ooty", "Ooty Botanical Garden Nilgiris"] },
  { name: "Kodaikanal", slug: "kodaikanal", state: "Tamil Nadu", category: "Star Lake / Pillar Rocks", primaryLandmarks: ["Kodaikanal Lake", "Pillar Rocks"], searchQueries: ["Kodaikanal Lake Tamil Nadu", "Pillar Rocks Kodaikanal"] },
  { name: "Madurai", slug: "madurai", state: "Tamil Nadu", category: "Meenakshi Temple / Ancient City", primaryLandmarks: ["Meenakshi Amman Temple"], searchQueries: ["Meenakshi Amman Temple Madurai gopuram", "Thirumalai Nayakkar Mahal Madurai"] },
  { name: "Mahabalipuram", slug: "mahabalipuram", state: "Tamil Nadu", category: "Shore Temple / UNESCO", primaryLandmarks: ["Shore Temple", "Pancha Rathas"], searchQueries: ["Shore Temple Mahabalipuram sea", "Pancha Rathas Mamallapuram"] },
  { name: "Rameswaram", slug: "rameswaram", state: "Tamil Nadu", category: "Pamban Bridge / Ramanathaswamy", primaryLandmarks: ["Pamban Bridge", "Ramanathaswamy Temple"], searchQueries: ["Pamban Bridge Rameswaram train sea", "Ramanathaswamy Temple corridor"] },
  { name: "Kanyakumari", slug: "kanyakumari", state: "Tamil Nadu", category: "Cape Comorin / Sunrise Sunset", primaryLandmarks: ["Vivekananda Rock", "Thiruvalluvar Statue"], searchQueries: ["Vivekananda Rock Memorial Kanyakumari", "Thiruvalluvar Statue sea"] },
  { name: "Thanjavur", slug: "thanjavur", state: "Tamil Nadu", category: "Brihadisvara / Chola Empire", primaryLandmarks: ["Brihadisvara Temple"], searchQueries: ["Brihadisvara Temple Thanjavur Big Temple", "Thanjavur temple Chola architecture"] },
  { name: "Chennai", slug: "chennai", state: "Tamil Nadu", category: "Marina Beach / Cultural Capital", primaryLandmarks: ["Marina Beach", "Kapaleeshwarar Temple"], searchQueries: ["Marina Beach Chennai coastline", "Kapaleeshwarar Temple Mylapore Chennai"] },
  { name: "Pondicherry", slug: "pondicherry", state: "Puducherry", category: "French Quarter / Auroville", primaryLandmarks: ["Promenade Beach", "White Town", "Matrimandir"], searchQueries: ["Promenade Beach Pondicherry", "French Quarter White Town Pondicherry", "Auroville Matrimandir Pondicherry"] },
  { name: "Yercaud", slug: "yercaud", state: "Tamil Nadu", category: "Shevaroy Hills / Lake", primaryLandmarks: ["Yercaud Lake", "Lady's Seat"], searchQueries: ["Yercaud Lake hills Tamil Nadu", "Lady's Seat Yercaud viewpoint"] },
  { name: "Coonoor", slug: "coonoor", state: "Tamil Nadu", category: "Tea Hills / Sim's Park", primaryLandmarks: ["Sim's Park", "Dolphin's Nose Coonoor"], searchQueries: ["Sim's Park Coonoor Nilgiris", "Dolphin's Nose Coonoor tea hills"] },
  { name: "Dhanushkodi", slug: "dhanushkodi", state: "Tamil Nadu", category: "Ghost Town / Ocean End", primaryLandmarks: ["Dhanushkodi Ruined Church"], searchQueries: ["Dhanushkodi ruined church sea Tamil Nadu", "Dhanushkodi beach road ocean"] },
  { name: "Tiruvannamalai", slug: "tiruvannamalai", state: "Tamil Nadu", category: "Arunachala Hill / Shiva", primaryLandmarks: ["Annamalaiyar Temple", "Arunachala"], searchQueries: ["Annamalaiyar Temple Tiruvannamalai gopuram", "Arunachala mountain hill Tamil Nadu"] },
  { name: "Kanchipuram", slug: "kanchipuram", state: "Tamil Nadu", category: "Silk & Thousand Temples", primaryLandmarks: ["Ekambareswarar Temple", "Kailasanathar"], searchQueries: ["Kailasanathar Temple Kanchipuram", "Ekambareswarar Temple Kanchipuram"] },
  { name: "Chettinad", slug: "chettinad", state: "Tamil Nadu", category: "Mansions / Heritage Cuisine", primaryLandmarks: ["Chettinad Mansions Karaikudi"], searchQueries: ["Chettinad mansion Karaikudi Tamil Nadu", "Chettinad palace architecture"] },

  // KARNATAKA
  { name: "Hampi", slug: "hampi", state: "Karnataka", category: "Vijayanagara Ruins / UNESCO", primaryLandmarks: ["Stone Chariot", "Virupaksha Temple"], searchQueries: ["Stone Chariot Hampi Vittala Temple", "Virupaksha Temple Hampi", "Hampi boulder ruins Karnataka"] },
  { name: "Mysore", slug: "mysore", state: "Karnataka", category: "City of Palaces", primaryLandmarks: ["Mysore Palace", "Chamundi Hill"], searchQueries: ["Mysore Palace illuminated Karnataka", "Mysore Palace daytime architecture"] },
  { name: "Coorg", slug: "coorg", state: "Karnataka", category: "Scotland of India / Coffee", primaryLandmarks: ["Abbey Falls", "Golden Temple Kushalnagar"], searchQueries: ["Abbey Falls Coorg Karnataka", "Namdroling Monastery Golden Temple Bylakuppe"] },
  { name: "Gokarna", slug: "gokarna", state: "Karnataka", category: "Om Beach / Coastal Trek", primaryLandmarks: ["Om Beach", "Kudle Beach"], searchQueries: ["Om Beach Gokarna Karnataka", "Kudle Beach Gokarna sea"] },
  { name: "Chikmagalur", slug: "chikmagalur", state: "Karnataka", category: "Highest Peak / Coffee Hills", primaryLandmarks: ["Mullayanagiri Peak", "Baba Budangiri"], searchQueries: ["Mullayanagiri peak Chikmagalur", "Baba Budangiri hills Chikmagalur"] },
  { name: "Badami", slug: "badami", state: "Karnataka", category: "Chalukya Rock Caves / Lake", primaryLandmarks: ["Badami Caves", "Agastya Lake"], searchQueries: ["Badami Cave Temples Karnataka", "Bhutanatha Temple Agastya Lake Badami"] },
  { name: "Bengaluru", slug: "bengaluru", state: "Karnataka", category: "Silicon Valley / Gardens", primaryLandmarks: ["Vidhana Soudha", "Bangalore Palace"], searchQueries: ["Vidhana Soudha Bangalore Bengaluru", "Bangalore Palace Karnataka"] },
  { name: "Jog Falls", slug: "jog-falls", state: "Karnataka", category: "Mighty Waterfalls", primaryLandmarks: ["Sharavathi Falls"], searchQueries: ["Jog Falls Karnataka Sharavathi", "Jog Falls monsoon waterfall India"] },
  { name: "Udupi", slug: "udupi", state: "Karnataka", category: "St. Mary's Basalt / Coastal", primaryLandmarks: ["St. Mary's Island", "Malpe Beach"], searchQueries: ["St. Mary's Island columnar basalt Udupi", "Malpe Beach Udupi"] },
  { name: "Murudeshwar", slug: "murudeshwar", state: "Karnataka", category: "Colossal Shiva / Arabian Sea", primaryLandmarks: ["Murudeshwar Shiva Statue"], searchQueries: ["Murudeshwar Shiva statue sea coast Karnataka", "Murudeshwar Temple Raja Gopura"] },
  { name: "Dandeli", slug: "dandeli", state: "Karnataka", category: "Jungle / White Water Rafting", primaryLandmarks: ["Kali River Rafting", "Syntheri Rocks"], searchQueries: ["Kali River Dandeli rafting Karnataka", "Syntheri Rocks Dandeli"] },
  { name: "Belur", slug: "belur", state: "Karnataka", category: "Hoysala Sculptures / UNESCO", primaryLandmarks: ["Chennakeshava Temple"], searchQueries: ["Chennakeshava Temple Belur Hoysala architecture", "Belur temple stone carvings Karnataka"] },
  { name: "Halebidu", slug: "halebidu", state: "Karnataka", category: "Hoysala Masterpieces", primaryLandmarks: ["Hoysaleshwara Temple"], searchQueries: ["Hoysaleshwara Temple Halebidu carvings", "Halebidu Hoysala temple stone reliefs"] },
  { name: "Pattadakal", slug: "pattadakal", state: "Karnataka", category: "UNESCO Temple Complex", primaryLandmarks: ["Virupaksha Pattadakal"], searchQueries: ["Pattadakal temple complex UNESCO Chalukya", "Virupaksha Temple Pattadakal Karnataka"] },
  { name: "Bandipur", slug: "bandipur", state: "Karnataka", category: "Tiger Reserve / Wildlife", primaryLandmarks: ["Bandipur Safari"], searchQueries: ["Bandipur National Park tiger elephant safari", "Himavad Gopalaswamy Betta Bandipur"] },
  { name: "Kabini", slug: "kabini", state: "Karnataka", category: "River Jungle Safari", primaryLandmarks: ["Kabini River Backwaters"], searchQueries: ["Kabini river boat wildlife safari", "Nagarhole tiger reserve Kabini"] },
  { name: "Sakleshpur", slug: "sakleshpur", state: "Karnataka", category: "Star Fort / Green Valleys", primaryLandmarks: ["Manjarabad Fort", "Bisle Ghat"], searchQueries: ["Manjarabad star fort Sakleshpur", "Bisle Ghat viewpoint Western Ghats"] },
  { name: "Aihole", slug: "aihole", state: "Karnataka", category: "Cradle of Temple Architecture", primaryLandmarks: ["Durga Temple Aihole", "Lad Khan Temple"], searchQueries: ["Durga Temple Aihole Chalukya Karnataka", "Aihole temple complex"] },
  { name: "Bijapur", slug: "bijapur", state: "Karnataka", category: "Gol Gumbaz / Whispering Gallery", primaryLandmarks: ["Gol Gumbaz", "Ibrahim Rauza"], searchQueries: ["Gol Gumbaz Bijapur dome Karnataka", "Ibrahim Rauza Bijapur"] },
  { name: "Bidar", slug: "bidar", state: "Karnataka", category: "Bidar Fort / Bahmani", primaryLandmarks: ["Bidar Fort", "Mahmud Gawan Madrasa"], searchQueries: ["Bidar Fort ramparts Karnataka", "Mahmud Gawan Madrasa Bidar"] },

  // ANDHRA PRADESH & TELANGANA
  { name: "Visakhapatnam", slug: "visakhapatnam", state: "Andhra Pradesh", category: "Coastal Hills / Beaches", primaryLandmarks: ["Rishikonda Beach", "Kailasagiri"], searchQueries: ["Rishikonda Beach Visakhapatnam", "Kailasagiri Vizag hills", "INS Kursura Submarine Museum Vizag"] },
  { name: "Tirupati", slug: "tirupati", state: "Andhra Pradesh", category: "Venkateswara / Sacred Hills", primaryLandmarks: ["Tirumala Venkateswara Temple"], searchQueries: ["Tirumala Venkateswara Temple Tirupati", "Tirupati hills temple gopuram"] },
  { name: "Araku Valley", slug: "araku-valley", state: "Andhra Pradesh", category: "Coffee Hills / Borra Caves", primaryLandmarks: ["Borra Caves", "Chaparai Cascades"], searchQueries: ["Borra Caves Araku Valley", "Araku Valley coffee plantations"] },
  { name: "Gandikota", slug: "gandikota", state: "Andhra Pradesh", category: "Grand Canyon of India", primaryLandmarks: ["Pennar River Gorge", "Gandikota Fort"], searchQueries: ["Gandikota Grand Canyon Pennar River", "Gandikota gorge canyon Andhra"] },
  { name: "Lepakshi", slug: "lepakshi", state: "Andhra Pradesh", category: "Monolithic Nandi / Frescoes", primaryLandmarks: ["Veerabhadra Temple", "Lepakshi Nandi"], searchQueries: ["Lepakshi Nandi monolithic bull", "Veerabhadra Temple Lepakshi architecture"] },
  { name: "Srisailam", slug: "srisailam", state: "Andhra Pradesh", category: "Jyotirlinga / Krishna Gorge", primaryLandmarks: ["Mallikarjuna Temple", "Srisailam Dam"], searchQueries: ["Mallikarjuna Temple Srisailam Jyotirlinga", "Srisailam Dam Krishna river gorge"] },
  { name: "Rajahmundry", slug: "rajahmundry", state: "Andhra Pradesh", category: "Godavari Culture / Papikondalu", primaryLandmarks: ["Godavari Arch Bridge", "Papikondalu"], searchQueries: ["Godavari Arch Bridge Rajahmundry", "Papikondalu hills river cruise Godavari"] },
  { name: "Horsley Hills", slug: "horsley-hills", state: "Andhra Pradesh", category: "Serene Hills", primaryLandmarks: ["Gali Bandalu"], searchQueries: ["Horsley Hills Andhra Pradesh viewpoint", "Horsley Hills eucalyptus landscape"] },
  { name: "Amaravati", slug: "amaravati", state: "Andhra Pradesh", category: "Buddhist Heritage / Stupa", primaryLandmarks: ["Amaravati Mahachaitya Stupa", "Dhyana Buddha"], searchQueries: ["Dhyana Buddha statue Amaravati Andhra", "Amaravati Stupa Buddhist ruins"] },
  { name: "Hyderabad", slug: "hyderabad", state: "Telangana", category: "Charminar / Golconda", primaryLandmarks: ["Charminar", "Golconda Fort", "Hussain Sagar"], searchQueries: ["Charminar monument Hyderabad", "Golconda Fort Hyderabad ruins", "Hussain Sagar Buddha statue Hyderabad"] },
  { name: "Warangal", slug: "warangal", state: "Telangana", category: "Kakatiya Arch / Ramappa", primaryLandmarks: ["Warangal Fort", "Ramappa Temple"], searchQueries: ["Warangal Fort Kakatiya arch gateway", "Ramappa Temple UNESCO Warangal"] },
  { name: "Nagarjuna Sagar", slug: "nagarjuna-sagar", state: "Telangana", category: "Dam / Buddhist Island", primaryLandmarks: ["Nagarjuna Sagar Dam", "Nagarjunakonda"], searchQueries: ["Nagarjuna Sagar Dam gates water", "Nagarjunakonda island Buddhist museum"] },

  // MADHYA PRADESH, CHHATTISGARH & BIHAR
  { name: "Khajuraho", slug: "khajuraho", state: "Madhya Pradesh", category: "UNESCO Temples / Art", primaryLandmarks: ["Kandariya Mahadeva", "Lakshmana Temple"], searchQueries: ["Kandariya Mahadeva Temple Khajuraho", "Khajuraho temples UNESCO Madhya Pradesh"] },
  { name: "Gwalior", slug: "gwalior", state: "Madhya Pradesh", category: "Gibraltar of India / Fort", primaryLandmarks: ["Gwalior Fort", "Jai Vilas Palace"], searchQueries: ["Gwalior Fort Madhya Pradesh fortress", "Jai Vilas Palace Gwalior"] },
  { name: "Orchha", slug: "orchha", state: "Madhya Pradesh", category: "Betwa Chhatris / Palaces", primaryLandmarks: ["Jahangir Mahal", "Chaturbhuj Temple"], searchQueries: ["Jahangir Mahal Orchha Fort", "Chaturbhuj Temple Orchha", "Orchha chhatris Betwa river"] },
  { name: "Ujjain", slug: "ujjain", state: "Madhya Pradesh", category: "Mahakal / Shipra River", primaryLandmarks: ["Mahakaleshwar Temple", "Ram Ghat"], searchQueries: ["Mahakaleshwar Jyotirlinga Ujjain", "Ram Ghat Shipra River Ujjain"] },
  { name: "Pachmarhi", slug: "pachmarhi", state: "Madhya Pradesh", category: "Queen of Satpura", primaryLandmarks: ["Bee Falls", "Dhoopgarh"], searchQueries: ["Dhoopgarh sunset Pachmarhi", "Bee Falls Pachmarhi Madhya Pradesh"] },
  { name: "Bhopal", slug: "bhopal", state: "Madhya Pradesh", category: "Lakes & Mosques", primaryLandmarks: ["Upper Lake", "Taj-ul-Masajid"], searchQueries: ["Taj-ul-Masajid Bhopal mosque", "Bhojtal Upper Lake Bhopal"] },
  { name: "Bhedaghat", slug: "bhedaghat", state: "Madhya Pradesh", category: "Dhuandhar / Marble Rocks", primaryLandmarks: ["Dhuandhar Falls", "Marble Rocks"], searchQueries: ["Dhuandhar Falls Jabalpur Narmada", "Marble Rocks Bhedaghat gorge boat"] },
  { name: "Bandhavgarh", slug: "bandhavgarh", state: "Madhya Pradesh", category: "Tiger Sanctuary", primaryLandmarks: ["Bandhavgarh National Park"], searchQueries: ["Bandhavgarh National Park tiger safari", "Bandhavgarh Fort Madhya Pradesh"] },
  { name: "Kanha", slug: "kanha", state: "Madhya Pradesh", category: "Barasingha & Tigers", primaryLandmarks: ["Kanha National Park", "Bamni Dadar"], searchQueries: ["Kanha National Park tiger reserve", "Kanha meadows wildlife forest"] },
  { name: "Sanchi", slug: "sanchi", state: "Madhya Pradesh", category: "Great Stupa / UNESCO", primaryLandmarks: ["Great Stupa Sanchi", "Toranas"], searchQueries: ["Great Stupa Sanchi UNESCO Madhya Pradesh", "Sanchi Stupa torana gateway"] },
  { name: "Mandu", slug: "mandu", state: "Madhya Pradesh", category: "Ship Palace / Romance", primaryLandmarks: ["Jahaz Mahal", "Rani Roopmati Pavilion"], searchQueries: ["Jahaz Mahal Mandu Ship Palace", "Rani Roopmati Pavilion Narmada view"] },
  { name: "Omkareshwar", slug: "omkareshwar", state: "Madhya Pradesh", category: "Narmada Jyotirlinga", primaryLandmarks: ["Omkareshwar Temple", "Narmada Bridge"], searchQueries: ["Omkareshwar Temple Narmada island", "Omkareshwar Jyotirlinga Madhya Pradesh"] },
  { name: "Maheshwar", slug: "maheshwar", state: "Madhya Pradesh", category: "Ahilya Bai Ghats / Sarees", primaryLandmarks: ["Ahilya Fort", "Maheshwar Ghats"], searchQueries: ["Maheshwar ghats Narmada river", "Ahilya Fort Maheshwar"] },
  { name: "Chitrakote Falls", slug: "chitrakote-falls", state: "Chhattisgarh", category: "Niagara of India", primaryLandmarks: ["Chitrakote Horseshoe Falls"], searchQueries: ["Chitrakote Falls Bastar Chhattisgarh", "Chitrakote horseshoe waterfall Indravati"] },
  { name: "Bastar", slug: "bastar", state: "Chhattisgarh", category: "Tribal Crafts & Waterfalls", primaryLandmarks: ["Tirathgarh Falls", "Kanger Valley"], searchQueries: ["Tirathgarh Waterfalls Bastar", "Kanger Valley National Park Chhattisgarh"] },
  { name: "Bodh Gaya", slug: "bodh-gaya", state: "Bihar", category: "Mahabodhi Tree / UNESCO", primaryLandmarks: ["Mahabodhi Temple", "Bodhi Tree"], searchQueries: ["Mahabodhi Temple Bodh Gaya UNESCO", "Bodhi Tree Bodh Gaya Bihar"] },
  { name: "Nalanda", slug: "nalanda", state: "Bihar", category: "Ancient University / UNESCO", primaryLandmarks: ["Nalanda Ruins", "Stupa 3"], searchQueries: ["Nalanda University ruins UNESCO Bihar", "Nalanda Mahavihara brick stupa"] },
  { name: "Rajgir", slug: "rajgir", state: "Bihar", category: "Shanti Stupa / Hot Springs", primaryLandmarks: ["Vishwa Shanti Stupa", "Griddhakuta"], searchQueries: ["Vishwa Shanti Stupa Rajgir Bihar", "Rajgir ropeway Shanti Stupa"] },

  // MAHARASHTRA
  { name: "Ajanta Caves", slug: "ajanta-caves", state: "Maharashtra", category: "UNESCO Rock-Cut Murals", primaryLandmarks: ["Ajanta Cave 1", "Waghur Gorge"], searchQueries: ["Ajanta Caves UNESCO Maharashtra horseshoe", "Ajanta cave temples rock cut"] },
  { name: "Ellora Caves", slug: "ellora-caves", state: "Maharashtra", category: "Kailash Temple / Monolith", primaryLandmarks: ["Kailash Temple Cave 16"], searchQueries: ["Kailash Temple Ellora Cave 16 monolithic", "Ellora Caves rock cut architecture"] },
  { name: "Lonavala", slug: "lonavala", state: "Maharashtra", category: "Western Ghats Valleys", primaryLandmarks: ["Tiger Point", "Bhushi Dam", "Karla Caves"], searchQueries: ["Tiger Point Lonavala valley view", "Bhushi Dam waterfall Lonavala"] },
  { name: "Mahabaleshwar", slug: "mahabaleshwar", state: "Maharashtra", category: "Strawberry Hills / Viewpoints", primaryLandmarks: ["Arthur's Seat", "Venna Lake"], searchQueries: ["Arthur's Seat Mahabaleshwar cliffs", "Venna Lake Mahabaleshwar boat"] },
  { name: "Alibaug", slug: "alibaug", state: "Maharashtra", category: "Sea Forts & Beaches", primaryLandmarks: ["Kolaba Fort", "Kashid Beach"], searchQueries: ["Kolaba Fort sea Alibaug", "Kashid Beach white sand Alibaug"] },
  { name: "Matheran", slug: "matheran", state: "Maharashtra", category: "Automobile-free Hills", primaryLandmarks: ["Panorama Point", "Charlotte Lake"], searchQueries: ["Matheran hill station red soil forest", "Louisa Point Matheran valley"] },
  { name: "Shirdi", slug: "shirdi", state: "Maharashtra", category: "Sai Baba Pilgrimage", primaryLandmarks: ["Samadhi Mandir Shirdi"], searchQueries: ["Shirdi Sai Baba Temple Maharashtra", "Samadhi Mandir Shirdi"] },
  { name: "Nashik", slug: "nashik", state: "Maharashtra", category: "Vineyards / Kumbh Ghats", primaryLandmarks: ["Sula Vineyards", "Trimbakeshwar"], searchQueries: ["Sula Vineyards Nashik wine hills", "Trimbakeshwar Jyotirlinga Nashik"] },
  { name: "Lonar Lake", slug: "lonar-lake", state: "Maharashtra", category: "Meteorite Crater Lake", primaryLandmarks: ["Lonar Crater"], searchQueries: ["Lonar Lake crater Maharashtra green saline", "Lonar crater lake meteorite"] },
  { name: "Tadoba", slug: "tadoba", state: "Maharashtra", category: "Tiger Reserve", primaryLandmarks: ["Tadoba Lake", "Moharli Zone"], searchQueries: ["Tadoba Andhari Tiger Reserve Maharashtra", "Tadoba safari tiger forest"] },
  { name: "Murud Janjira", slug: "murud-janjira", state: "Maharashtra", category: "Impregnable Sea Fort", primaryLandmarks: ["Janjira Sea Fort"], searchQueries: ["Murud Janjira sea fort Maharashtra island", "Janjira coastal fortress"] },
  { name: "Ganpatipule", slug: "ganpatipule", state: "Maharashtra", category: "Beach Temple / Konkan", primaryLandmarks: ["Ganpatipule Beach", "Swayambhu Ganpati"], searchQueries: ["Ganpatipule beach temple Konkan Maharashtra", "Ganpatipule sea coast"] },
  { name: "Tarkarli", slug: "tarkarli", state: "Maharashtra", category: "Scuba / Karli Backwaters", primaryLandmarks: ["Tarkarli Beach", "Sindhudurg Fort"], searchQueries: ["Tarkarli beach Malvan Konkan", "Sindhudurg sea fort Maharashtra"] },

  // NORTHEAST STATES
  { name: "Kaziranga", slug: "kaziranga", state: "Assam", category: "Rhino Capital / UNESCO", primaryLandmarks: ["Kaziranga National Park"], searchQueries: ["Kaziranga National Park one horned rhino", "Kaziranga grass landscape Assam"] },
  { name: "Guwahati", slug: "guwahati", state: "Assam", category: "Kamakhya / Brahmaputra", primaryLandmarks: ["Kamakhya Temple", "Umananda Island"], searchQueries: ["Kamakhya Temple Guwahati Assam", "Brahmaputra River Guwahati sunset"] },
  { name: "Majuli", slug: "majuli", state: "Assam", category: "Largest River Island", primaryLandmarks: ["Kamalabari Satra", "Brahmaputra Island"], searchQueries: ["Majuli island Brahmaputra river Assam", "Majuli satra culture Assam"] },
  { name: "Shillong", slug: "shillong", state: "Meghalaya", category: "Scotland of the East", primaryLandmarks: ["Umiam Lake", "Laitlum Canyons"], searchQueries: ["Umiam Lake Shillong Meghalaya", "Laitlum Canyons Meghalaya gorge"] },
  { name: "Cherrapunji", slug: "cherrapunji", state: "Meghalaya", category: "Living Root Bridges / Waterfalls", primaryLandmarks: ["Nohkalikai Falls", "Double Decker Root Bridge"], searchQueries: ["Nohkalikai Falls Cherrapunji Meghalaya", "Cherrapunji living root bridge Nohkalikai"] },
  { name: "Dawki", slug: "dawki", state: "Meghalaya", category: "Glass Transparent River", primaryLandmarks: ["Umngot River Boating"], searchQueries: ["Umngot River Dawki Meghalaya crystal clear boat", "Dawki river transparent water"] },
  { name: "Mawlynnong", slug: "mawlynnong", state: "Meghalaya", category: "Cleanest Village in Asia", primaryLandmarks: ["Living Root Bridge", "Bamboo Skywalk"], searchQueries: ["Mawlynnong living root bridge Meghalaya", "Mawlynnong village Meghalaya gardens"] },
  { name: "Gangtok", slug: "gangtok", state: "Sikkim", category: "Kanchenjunga Capital", primaryLandmarks: ["Rumtek Monastery", "Tsomgo Lake"], searchQueries: ["Rumtek Monastery Gangtok Sikkim", "Tsomgo Lake Changu Sikkim"] },
  { name: "Pelling", slug: "pelling", state: "Sikkim", category: "Skywalk / Kanchenjunga", primaryLandmarks: ["Pelling Skywalk", "Pemayangtse Monastery"], searchQueries: ["Pelling Skywalk glass bridge Sikkim", "Pemayangtse Monastery Kanchenjunga view"] },
  { name: "Lachung", slug: "lachung", state: "Sikkim", category: "Yumthang Valley / Rhododendrons", primaryLandmarks: ["Yumthang Valley", "Zero Point"], searchQueries: ["Yumthang Valley Sikkim flowers river", "Lachung snow mountains North Sikkim"] },
  { name: "Gurudongmar Lake", slug: "gurudongmar-lake", state: "Sikkim", category: "Sacred High Glacial Lake", primaryLandmarks: ["Gurudongmar Lake"], searchQueries: ["Gurudongmar Lake sacred blue Sikkim", "Gurudongmar high altitude lake mountains"] },
  { name: "Tawang", slug: "tawang", state: "Arunachal Pradesh", category: "Giant Monastery / Sela Pass", primaryLandmarks: ["Tawang Monastery", "Sela Pass"], searchQueries: ["Tawang Monastery Arunachal Pradesh", "Sela Pass lake snow gate"] },
  { name: "Ziro", slug: "ziro", state: "Arunachal Pradesh", category: "Apatani Valley / Rice Fields", primaryLandmarks: ["Ziro Valley"], searchQueries: ["Ziro Valley pine rice terrace Arunachal", "Apatani valley Ziro landscape"] },
  { name: "Dzukou Valley", slug: "dzukou-valley", state: "Nagaland", category: "Rolling Valleys of Flowers", primaryLandmarks: ["Dzukou Valley"], searchQueries: ["Dzukou Valley Nagaland rolling hills", "Dzukou Valley landscape green meadows"] },
  { name: "Kohima", slug: "kohima", state: "Nagaland", category: "War Memorial / Hornbill", primaryLandmarks: ["Kohima War Cemetery", "Kisama Heritage"], searchQueries: ["Kohima War Cemetery WWII Nagaland", "Kisama Heritage Village Hornbill Kohima"] },
  { name: "Loktak Lake", slug: "loktak-lake", state: "Manipur", category: "Floating Phumdis", primaryLandmarks: ["Keibul Lamjao", "Sendra Island"], searchQueries: ["Loktak Lake floating phumdi rings Manipur", "Sendra Island Loktak Lake"] },
  { name: "Aizawl", slug: "aizawl", state: "Mizoram", category: "Hilltop Ridge City", primaryLandmarks: ["Reiek Tlang", "Solomon's Temple"], searchQueries: ["Aizawl hill city ridge Mizoram", "Reiek Tlang peak valley Mizoram"] },
  { name: "Agartala", slug: "agartala", state: "Tripura", category: "Ujjayanta / Neermahal", primaryLandmarks: ["Ujjayanta Palace", "Neermahal Palace"], searchQueries: ["Ujjayanta Palace Agartala Tripura", "Neermahal Lake Palace Rudrasagar"] },
  { name: "Unakoti", slug: "unakoti", state: "Tripura", category: "Ancient Rock Carvings", primaryLandmarks: ["Unakoti Shiva Carvings"], searchQueries: ["Unakoti rock relief sculptures Tripura", "Unakoti rock cut carvings Shiva"] },

  // ISLANDS & UTs
  { name: "Port Blair", slug: "port-blair", state: "Andaman and Nicobar Islands", category: "Cellular Jail / History", primaryLandmarks: ["Cellular Jail", "Ross Island"], searchQueries: ["Cellular Jail Port Blair Andaman", "Ross Island ruins Port Blair"] },
  { name: "Havelock Island", slug: "havelock-island", state: "Andaman and Nicobar Islands", category: "Radhanagar / Turquoise Water", primaryLandmarks: ["Radhanagar Beach", "Elephant Beach"], searchQueries: ["Radhanagar Beach Havelock Island turquoise", "Elephant Beach coral Andaman"] },
  { name: "Neil Island", slug: "neil-island", state: "Andaman and Nicobar Islands", category: "Natural Coral Bridge", primaryLandmarks: ["Natural Rock Bridge", "Laxmanpur Beach"], searchQueries: ["Natural Bridge Neil Island rock arch", "Bharatpur Beach Neil Island reef"] },
  { name: "Baratang Island", slug: "baratang-island", state: "Andaman and Nicobar Islands", category: "Limestone Caves / Mangroves", primaryLandmarks: ["Limestone Caves Baratang"], searchQueries: ["Limestone caves Baratang Island Andaman", "Baratang mangrove creek boat"] },
  { name: "Agatti Island", slug: "agatti-island", state: "Lakshadweep", category: "Lagoon Airstrip / Coral", primaryLandmarks: ["Agatti Lagoon"], searchQueries: ["Agatti Island Lakshadweep lagoon coral", "Agatti airstrip ocean view"] },
  { name: "Bangaram Island", slug: "bangaram-island", state: "Lakshadweep", category: "Tear-drop Atoll Lagoon", primaryLandmarks: ["Bangaram Atoll"], searchQueries: ["Bangaram Island Lakshadweep beach lagoon", "Bangaram coral atoll turquoise"] },
  { name: "Kavaratti", slug: "kavaratti", state: "Lakshadweep", category: "Atoll Marine Life", primaryLandmarks: ["Kavaratti Lagoon"], searchQueries: ["Kavaratti Island lagoon Lakshadweep", "Kavaratti beach atoll ocean"] },
  { name: "Diu", slug: "diu", state: "Dadra and Nagar Haveli and Daman and Diu", category: "Sea Fortress / Caves", primaryLandmarks: ["Diu Fort", "Naida Caves"], searchQueries: ["Diu Fort sea Gujarat", "Naida Caves Diu", "Nagoa Beach Diu"] },
  { name: "Daman", slug: "daman", state: "Dadra and Nagar Haveli and Daman and Diu", category: "Portuguese Moti Daman", primaryLandmarks: ["Moti Daman Fort", "Jampore Beach"], searchQueries: ["Moti Daman Fort", "Jampore Beach Daman"] },
  { name: "Chandigarh", slug: "chandigarh", state: "Chandigarh", category: "Rock Garden / Le Corbusier", primaryLandmarks: ["Rock Garden", "Sukhna Lake"], searchQueries: ["Rock Garden Chandigarh Nek Chand sculptures", "Sukhna Lake Chandigarh sunset"] },

  // PUNJAB, HARYANA & UTTAR PRADESH
  { name: "Amritsar", slug: "amritsar", state: "Punjab", category: "Golden Temple / Patriotism", primaryLandmarks: ["Harmandir Sahib Golden Temple", "Wagah Border"], searchQueries: ["Golden Temple Amritsar Harmandir Sahib illuminated", "Golden Temple amrit sarovar water"] },
  { name: "Patiala", slug: "patiala", state: "Punjab", category: "Qila Mubarak / Royal", primaryLandmarks: ["Qila Mubarak Patiala", "Sheesh Mahal"], searchQueries: ["Qila Mubarak Patiala fort Punjab", "Sheesh Mahal Patiala palace"] },
  { name: "Anandpur Sahib", slug: "anandpur-sahib", state: "Punjab", category: "Virasat-e-Khalsa", primaryLandmarks: ["Virasat-e-Khalsa", "Kesgarh Sahib"], searchQueries: ["Virasat e Khalsa Anandpur Sahib architecture", "Takht Sri Kesgarh Sahib Anandpur"] },
  { name: "Kurukshetra", slug: "kurukshetra", state: "Haryana", category: "Brahma Sarovar / Gita", primaryLandmarks: ["Brahma Sarovar", "Jyotisar"], searchQueries: ["Brahma Sarovar Kurukshetra holy water", "Jyotisar Kurukshetra Gita"] },
  { name: "Mathura", slug: "mathura", state: "Uttar Pradesh", category: "Janmabhoomi / Yamuna Ghats", primaryLandmarks: ["Krishna Janmasthan", "Vishram Ghat"], searchQueries: ["Krishna Janmabhoomi temple Mathura", "Vishram Ghat Yamuna Mathura"] },
  { name: "Vrindavan", slug: "vrindavan", state: "Uttar Pradesh", category: "Prem Mandir / Banke Bihari", primaryLandmarks: ["Prem Mandir", "Banke Bihari Temple"], searchQueries: ["Prem Mandir Vrindavan illuminated white marble", "Banke Bihari Temple Vrindavan"] },
  { name: "Ayodhya", slug: "ayodhya", state: "Uttar Pradesh", category: "Ram Janmabhoomi / Saryu", primaryLandmarks: ["Ram Mandir", "Ram Ki Paidi"], searchQueries: ["Ram Mandir Ayodhya temple", "Ram Ki Paidi Saryu river Ayodhya"] },
  { name: "Lucknow", slug: "lucknow", state: "Uttar Pradesh", category: "Imambara / Nawabi Heritage", primaryLandmarks: ["Bara Imambara", "Rumi Darwaza"], searchQueries: ["Bara Imambara Lucknow architecture", "Rumi Darwaza Lucknow monument"] },
  { name: "Prayagraj", slug: "prayagraj", state: "Uttar Pradesh", category: "Triveni Sangam / Kumbh", primaryLandmarks: ["Triveni Sangam", "Allahabad Fort"], searchQueries: ["Triveni Sangam Prayagraj confluence boats", "Allahabad Fort Yamuna river"] },
  { name: "Sarnath", slug: "sarnath", state: "Uttar Pradesh", category: "Dhamek Stupa / Buddha", primaryLandmarks: ["Dhamek Stupa", "Lion Capital"], searchQueries: ["Dhamek Stupa Sarnath Buddhist monument", "Sarnath ruins deer park Varanasi"] },
  { name: "Jhansi", slug: "jhansi", state: "Uttar Pradesh", category: "Historic Fort of Rani", primaryLandmarks: ["Jhansi Fort"], searchQueries: ["Jhansi Fort ramparts Uttar Pradesh", "Rani Laxmibai Fort Jhansi"] },
  { name: "Fatehpur Sikri", slug: "fatehpur-sikri", state: "Uttar Pradesh", category: "Buland Darwaza / UNESCO", primaryLandmarks: ["Buland Darwaza", "Salim Chishti Dargah"], searchQueries: ["Buland Darwaza Fatehpur Sikri gate", "Fatehpur Sikri red sandstone palace"] }
];

// Combine pilot + regional
const combined = [...pilotDestinations, ...regionalDestinations];

// Supplementary list to reach exactly 300 unique destinations
const moreDestinations = [
  // Additional gems across India
  { name: "Binsar", slug: "binsar", state: "Uttarakhand", category: "Wildlife Sanctuary / Zero Point", primaryLandmarks: ["Binsar Zero Point", "Bineshwar Temple"], searchQueries: ["Binsar Zero Point Himalayan view", "Binsar wildlife sanctuary forest"] },
  { name: "Kanatal", slug: "kanatal", state: "Uttarakhand", category: "Quiet Mountain Hamlet", primaryLandmarks: ["Surkanda Devi Temple", "Kodia Jungle"], searchQueries: ["Surkanda Devi Temple Kanatal", "Kanatal hills Uttarakhand"] },
  { name: "Tehri Dam", slug: "tehri-dam", state: "Uttarakhand", category: "Massive Reservoir / Water Sports", primaryLandmarks: ["Tehri Lake", "Tehri Dam"], searchQueries: ["Tehri Dam reservoir lake Uttarakhand", "Tehri Lake water sports"] },
  { name: "Uttarkashi", slug: "uttarkashi", state: "Uttarakhand", category: "Ganga Valley / Mountaineering", primaryLandmarks: ["Vishwanath Temple Uttarkashi", "Bhagirathi River"], searchQueries: ["Vishwanath Temple Uttarkashi", "Bhagirathi river Uttarkashi valley"] },
  { name: "Harsil", slug: "harsil", state: "Uttarakhand", category: "Apple Village / Bhagirathi", primaryLandmarks: ["Harsil Valley", "Dharali"], searchQueries: ["Harsil Valley Bhagirathi river apple", "Harsil village mountains Uttarakhand"] },
  { name: "Joshimath", slug: "joshimath", state: "Uttarakhand", category: "Shankaracharya Math / Gateway to Badrinath", primaryLandmarks: ["Kalpavriksha", "Narsingh Temple"], searchQueries: ["Joshimath mountain valley Uttarakhand", "Narsingh Temple Joshimath"] },
  { name: "Narkanda", slug: "narkanda", state: "Himachal Pradesh", category: "Apple Country / Hatu Peak", primaryLandmarks: ["Hatu Peak", "Hatu Mata Temple"], searchQueries: ["Hatu Peak Narkanda view", "Narkanda apple orchards snow"] },
  { name: "Shoja", slug: "shoja", state: "Himachal Pradesh", category: "Serolsar Lake / Serene Woods", primaryLandmarks: ["Jalori Pass", "Serolsar Lake"], searchQueries: ["Serolsar Lake Jalori Pass Himachal", "Shoja village wooden houses"] },
  { name: "Sangla", slug: "sangla", state: "Himachal Pradesh", category: "Baspa Valley / Apple Orchards", primaryLandmarks: ["Kamru Fort", "Baspa River"], searchQueries: ["Sangla Valley Baspa river Kinnaur", "Kamru Fort Sangla"] },
  { name: "Kalpa", slug: "kalpa", state: "Himachal Pradesh", category: "Kinner Kailash Viewpoint", primaryLandmarks: ["Suicide Point Kalpa", "Hu-Bu-Lan-Kar Monastery"], searchQueries: ["Kalpa Kinner Kailash peak sunrise", "Kalpa village Kinnaur mountains"] },
  { name: "Nako", slug: "nako", state: "Himachal Pradesh", category: "Sacred Lake / Ancient Monastery", primaryLandmarks: ["Nako Lake", "Nako Monastery"], searchQueries: ["Nako Lake Kinnaur reflection", "Nako village monastery Spiti"] },
  { name: "Tabo", slug: "tabo", state: "Himachal Pradesh", category: "Ajanta of the Himalayas / 996 AD", primaryLandmarks: ["Tabo Monastery Mud Caves"], searchQueries: ["Tabo Monastery Spiti Valley UNESCO", "Tabo mud monastery Himachal"] },
  { name: "Keylong", slug: "keylong", state: "Himachal Pradesh", category: "Lahaul Headquarters / Monasteries", primaryLandmarks: ["Kardang Monastery", "Shashur Monastery"], searchQueries: ["Keylong Lahaul valley mountains", "Kardang Monastery Keylong"] },
  { name: "Sissu", slug: "sissu", state: "Himachal Pradesh", category: "Atal Tunnel / Waterfall", primaryLandmarks: ["Sissu Waterfall", "Sissu Lake"], searchQueries: ["Sissu Waterfall Lahaul Atal Tunnel", "Sissu lake poplars snow"] },
  { name: "Baralacha La", slug: "baralacha-la", state: "Himachal Pradesh", category: "High Mountain Pass / Suraj Tal", primaryLandmarks: ["Suraj Tal Lake", "Baralacha Pass"], searchQueries: ["Suraj Tal lake Baralacha La pass", "Baralacha La high mountain pass snow"] },
  { name: "Tso Kar", slug: "tso-kar", state: "Ladakh", category: "White Salt Lake / Birds", primaryLandmarks: ["Tso Kar Basin"], searchQueries: ["Tso Kar lake Ladakh salt white", "Tso Kar basin wildlife"] },
  { name: "Hemis", slug: "hemis", state: "Ladakh", category: "Largest Monastery / National Park", primaryLandmarks: ["Hemis Monastery", "Hemis National Park"], searchQueries: ["Hemis Monastery Ladakh courtyard", "Hemis festival masks Ladakh"] },
  { name: "Alchi", slug: "alchi", state: "Ladakh", category: "11th Century Frescoes", primaryLandmarks: ["Alchi Choskor Monastery"], searchQueries: ["Alchi Monastery Indus river Ladakh", "Alchi temple wall murals"] },
  { name: "Lamayuru", slug: "lamayuru", state: "Ladakh", category: "Moonland of Ladakh", primaryLandmarks: ["Lamayuru Monastery", "Moonland Formations"], searchQueries: ["Lamayuru Moonland landscape Ladakh", "Lamayuru Monastery perched cliff"] },
  { name: "Turtuk", slug: "turtuk", state: "Ladakh", category: "Balti Culture / Shyok River", primaryLandmarks: ["Turtuk Apricot Orchards", "Shyok Valley"], searchQueries: ["Turtuk village Balti Shyok river", "Turtuk apricot blossoms Ladakh"] },
  { name: "Doodhpathri", slug: "doodhpathri", state: "Jammu and Kashmir", category: "Valley of Milk", primaryLandmarks: ["Shaliganga River", "Doodhpathri Meadow"], searchQueries: ["Doodhpathri meadow Kashmir stream", "Valley of Milk Doodhpathri"] },
  { name: "Yusmarg", slug: "yusmarg", state: "Jammu and Kashmir", category: "Meadow of Jesus / Pine Woods", primaryLandmarks: ["Doodh Ganga", "Nilnag Lake"], searchQueries: ["Yusmarg meadow pine forest Kashmir", "Nilnag Lake Yusmarg"] },
  { name: "Gurez Valley", slug: "gurez-valley", state: "Jammu and Kashmir", category: "Habba Khatoon Peak / Kishanganga", primaryLandmarks: ["Habba Khatoon Mountain", "Dawar"], searchQueries: ["Habba Khatoon peak Gurez valley", "Kishanganga river Gurez Kashmir"] },
  { name: "Sanapur Lake", slug: "sanapur-lake", state: "Karnataka", category: "Boulder Lake / Coracle Ride", primaryLandmarks: ["Sanapur Lake Hampi"], searchQueries: ["Sanapur Lake Hampi coracle boat", "Sanapur boulder reservoir"] },
  { name: "Shivanasamudra", slug: "shivanasamudra", state: "Karnataka", category: "Twin Waterfalls / Kaveri", primaryLandmarks: ["Gaganachukki Falls", "Bharachukki Falls"], searchQueries: ["Gaganachukki Falls Shivanasamudra", "Bharachukki waterfall Kaveri Karnataka"] },
  { name: "Shravanabelagola", slug: "shravanabelagola", state: "Karnataka", category: "Monolithic Gommateshwara", primaryLandmarks: ["Bahubali Colossus", "Vindhyagiri"], searchQueries: ["Gommateshwara statue Bahubali Shravanabelagola", "Shravanabelagola Vindhyagiri monolith"] },
  { name: "Nandi Hills", slug: "nandi-hills", state: "Karnataka", category: "Sunrise Clouds / Tipu's Fort", primaryLandmarks: ["Tipu's Drop", "Nandi Temple"], searchQueries: ["Nandi Hills sunrise clouds Bangalore", "Tipu's Drop Nandi Hills"] },
  { name: "Agumbe", slug: "agumbe", state: "Karnataka", category: "Cherrapunji of the South", primaryLandmarks: ["Sunset Point Agumbe", "Barkana Falls"], searchQueries: ["Agumbe rainforest sunset Western Ghats", "Barkana Falls Agumbe"] },
  { name: "Maravanthe", slug: "maravanthe", state: "Karnataka", category: "Sea on Left River on Right", primaryLandmarks: ["Maravanthe Beach Highway"], searchQueries: ["Maravanthe Beach highway sea river Karnataka", "Maravanthe coast sunset"] },
  { name: "Kemmangundi", slug: "kemmangundi", state: "Karnataka", category: "Royal Summer Retreat", primaryLandmarks: ["Z Point", "Hebbe Falls"], searchQueries: ["Kemmangundi hill station Karnataka", "Z Point Kemmangundi valley"] },
  { name: "Kudremukh", slug: "kudremukh", state: "Karnataka", category: "Horse-Face Peak / Shola Grasslands", primaryLandmarks: ["Kudremukh Peak", "National Park"], searchQueries: ["Kudremukh peak shola grassland Karnataka", "Kudremukh trek green hills"] },
  { name: "Yana Rocks", slug: "yana-rocks", state: "Karnataka", category: "Solid Black Crystalline Karst", primaryLandmarks: ["Bhairaveshwara Shikhara"], searchQueries: ["Yana rocks monolith limestone Karnataka", "Yana caves forest Western Ghats"] },
  { name: "Gokak Falls", slug: "gokak-falls", state: "Karnataka", category: "Ghataprabha Horseshoe Waterfall", primaryLandmarks: ["Gokak Suspension Bridge"], searchQueries: ["Gokak Falls Ghataprabha river Karnataka", "Gokak Falls suspension bridge"] },
  { name: "Kumbakonam", slug: "kumbakonam", state: "Tamil Nadu", category: "Temple Town / Mahamaham Tank", primaryLandmarks: ["Adi Kumbeswarar", "Sarangapani Temple"], searchQueries: ["Adi Kumbeswarar Temple Kumbakonam", "Mahamaham tank Kumbakonam gopuram"] },
  { name: "Gangaikonda Cholapuram", slug: "gangaikonda-cholapuram", state: "Tamil Nadu", category: "Chola Capital / UNESCO", primaryLandmarks: ["Brihadisvara Temple Gangaikonda"], searchQueries: ["Gangaikonda Cholapuram Temple UNESCO", "Chola temple Gangaikondacholapuram"] },
  { name: "Pitchavaram", slug: "pitchavaram", state: "Tamil Nadu", category: "Second Largest Mangrove", primaryLandmarks: ["Pitchavaram Mangrove Forest"], searchQueries: ["Pichavaram mangrove forest boat Tamil Nadu", "Pitchavaram backwater canals"] },
  { name: "Tranquebar", slug: "tranquebar", state: "Tamil Nadu", category: "Danish Fort / Singing Waves", primaryLandmarks: ["Fort Dansborg", "Ozone Beach"], searchQueries: ["Fort Dansborg Tranquebar Danish sea", "Tharangambadi beach fort"] },
  { name: "Courtallam", slug: "courtallam", state: "Tamil Nadu", category: "Spa of South India / Waterfalls", primaryLandmarks: ["Main Falls", "Five Falls Courtallam"], searchQueries: ["Courtallam waterfalls Tamil Nadu", "Five Falls Courtallam cascade"] },
  { name: "Valparai", slug: "valparai", state: "Tamil Nadu", category: "40 Hairpin Bends / Tea Hills", primaryLandmarks: ["Aliyar Dam", "Solaiyar Dam"], searchQueries: ["Valparai tea estates Anamalai hills", "Aliyar Dam view Valparai hairpins"] },
  { name: "Mudumalai", slug: "mudumalai", state: "Tamil Nadu", category: "Elephant Reserve / Nilgiris", primaryLandmarks: ["Theppakadu Elephant Camp"], searchQueries: ["Mudumalai National Park tiger elephant", "Theppakadu elephant camp Nilgiris"] },
  { name: "Kolli Hills", slug: "kolli-hills", state: "Tamil Nadu", category: "70 Hairpin Bends / Agaya Gangai", primaryLandmarks: ["Agaya Gangai Waterfalls"], searchQueries: ["Agaya Gangai falls Kolli Hills", "Kolli Hills hairpin bends Tamil Nadu"] },
  { name: "Padmanabhapuram", slug: "padmanabhapuram", state: "Tamil Nadu", category: "Wooden Palace of Travancore", primaryLandmarks: ["Padmanabhapuram Palace"], searchQueries: ["Padmanabhapuram Palace wooden architecture", "Travancore palace Padmanabhapuram"] },
  { name: "Ponmudi", slug: "ponmudi", state: "Kerala", category: "Golden Peak / Mist", primaryLandmarks: ["Ponmudi Crest", "Peppara Wildlife"], searchQueries: ["Ponmudi hill station mist Kerala", "Ponmudi hairpin curves Trivandrum"] },
  { name: "Poovar Island", slug: "poovar-island", state: "Kerala", category: "Floating Cottages / Estuary", primaryLandmarks: ["Neyyar Confluence Beach"], searchQueries: ["Poovar Island resort floating Kerala", "Poovar estuary golden sand"] },
  { name: "Gavi", slug: "gavi", state: "Kerala", category: "Pristine Eco Forest / Elephants", primaryLandmarks: ["Gavi Lake", "Periyar Buffer"], searchQueries: ["Gavi eco tourism forest Kerala", "Gavi lake boat elephants"] },
  { name: "Idukki Dam", slug: "idukki-dam", state: "Kerala", category: "Arch Dam / Kuravan Kurathi", primaryLandmarks: ["Idukki Arch Dam", "Cheruthoni Dam"], searchQueries: ["Idukki Arch Dam Periyar river Kerala", "Idukki reservoir gorge"] },
  { name: "Silent Valley", slug: "silent-valley", state: "Kerala", category: "Virgin Rainforest / UNESCO", primaryLandmarks: ["Kunthi River", "Lion-tailed Macaque"], searchQueries: ["Silent Valley National Park Kerala rainforest", "Kunthi river Silent Valley"] },
  { name: "Talakona", slug: "talakona", state: "Andhra Pradesh", category: "Highest Waterfall in Andhra", primaryLandmarks: ["Talakona Falls", "Sri Venkateswara Park"], searchQueries: ["Talakona waterfall Tirupati forest", "Talakona water cascade Andhra"] },
  { name: "Belum Caves", slug: "belum-caves", state: "Andhra Pradesh", category: "Longest Underground Caves", primaryLandmarks: ["Pataalaganga", "Belum Stalactites"], searchQueries: ["Belum Caves limestone underground Andhra", "Belum Caves stalactites passages"] },
  { name: "Ahobilam", slug: "ahobilam", state: "Andhra Pradesh", category: "Nine Narasimha Temples / Hills", primaryLandmarks: ["Upper Ahobilam", "Bhavanashani River"], searchQueries: ["Ahobilam Narasimha Temple hills Andhra", "Upper Ahobilam forest temple"] },
  { name: "Bheemunipatnam", slug: "bheemunipatnam", state: "Andhra Pradesh", category: "Dutch Cemetery / Ghost Beach", primaryLandmarks: ["Bheemili Beach", "Dutch Fort"], searchQueries: ["Bheemunipatnam beach lighthouse Vizag", "Bheemili Dutch cemetery sea"] },
  { name: "Lambasingi", slug: "lambasingi", state: "Andhra Pradesh", category: "Kashmir of Andhra / Winter Frost", primaryLandmarks: ["Lambasingi Hills", "Kothapalli Waterfalls"], searchQueries: ["Lambasingi hill station mist Andhra", "Kothapalli waterfalls Lambasingi"] },
  { name: "Papi Hills", slug: "papi-hills", state: "Andhra Pradesh", category: "Papikondalu Godavari Gorge", primaryLandmarks: ["Godavari River Cruise", "Perantapalli"], searchQueries: ["Papikondalu hills Godavari river cruise", "Papi Hills gorge boat Andhra"] },
  { name: "Kuntala Falls", slug: "kuntala-falls", state: "Telangana", category: "Highest Waterfall in Telangana", primaryLandmarks: ["Kuntala Waterfalls", "Kadam River"], searchQueries: ["Kuntala Falls Adilabad Telangana", "Kuntala waterfall cascade nature"] },
  { name: "Laknavaram Lake", slug: "laknavaram-lake", state: "Telangana", category: "Yellow Suspension Bridge / Lake", primaryLandmarks: ["Laknavaram Suspension Bridge"], searchQueries: ["Laknavaram Lake yellow suspension bridge", "Laknavaram lake islands Telangana"] },
  { name: "Bhadrachalam", slug: "bhadrachalam", state: "Telangana", category: "Rama Temple on Godavari", primaryLandmarks: ["Sita Ramachandraswamy Temple"], searchQueries: ["Bhadrachalam Rama Temple Godavari river", "Bhadrachalam temple gopuram"] },
  { name: "Rani Ki Vav", slug: "rani-ki-vav", state: "Gujarat", category: "Queen's Stepwell / UNESCO", primaryLandmarks: ["Rani Ki Vav Carvings"], searchQueries: ["Rani Ki Vav subterranean architecture stepwell", "Rani Ki Vav carvings Patan"] },
  { name: "Ambaji", slug: "ambaji", state: "Gujarat", category: "Shakti Peeth / Gabbar Hill", primaryLandmarks: ["Ambaji Temple", "Gabbar Hill"], searchQueries: ["Ambaji Temple Gabbar Hill Gujarat", "Ambaji temple marble spire"] },
  { name: "Junagadh", slug: "junagadh", state: "Gujarat", category: "Uparkot Fort / Girnar Steps", primaryLandmarks: ["Uparkot Fort", "Girnar Mountain", "Mahabat Maqbara"], searchQueries: ["Mahabat Maqbara Junagadh architecture", "Uparkot Fort Buddhist caves Junagadh", "Girnar mountain steps temples"] },
  { name: "Bhavnagar", slug: "bhavnagar", state: "Gujarat", category: "Takhteshwar / Blackbuck", primaryLandmarks: ["Takhteshwar Temple", "Velavadar"], searchQueries: ["Takhteshwar Temple Bhavnagar hill", "Velavadar Blackbuck National Park Gujarat"] },
  { name: "Somnath Beach", slug: "somnath-beach", state: "Gujarat", category: "Arabian Sea Shoreline", primaryLandmarks: ["Somnath Coastal Walkway"], searchQueries: ["Somnath sea shoreline Gujarat waves", "Somnath coastal temple view"] },
  { name: "Polo Forest", slug: "polo-forest", state: "Gujarat", category: "Ancient Jain & Shiva Ruins", primaryLandmarks: ["Harnav River", "Polo Ruins"], searchQueries: ["Polo Forest ruins Sabarkantha Gujarat", "Polo Forest temples river"] },
  { name: "Bhimbetka", slug: "bhimbetka", state: "Madhya Pradesh", category: "Prehistoric Rock Art / UNESCO", primaryLandmarks: ["Auditorium Cave", "Zoo Rock"], searchQueries: ["Bhimbetka rock shelters cave paintings", "Bhimbetka prehistoric UNESCO Madhya Pradesh"] },
  { name: "Amarkantak", slug: "amarkantak", state: "Madhya Pradesh", category: "Source of Narmada & Son", primaryLandmarks: ["Narmada Udgam Temple", "Kapil Dhara"], searchQueries: ["Narmada Udgam Temple Amarkantak", "Kapil Dhara waterfall Amarkantak"] },
  { name: "Chanderi", slug: "chanderi", state: "Madhya Pradesh", category: "Weavers' Town / Koshak Mahal", primaryLandmarks: ["Chanderi Fort", "Koshak Mahal"], searchQueries: ["Chanderi Fort Madhya Pradesh gate", "Koshak Mahal Chanderi architecture"] },
  { name: "Panna", slug: "panna", state: "Madhya Pradesh", category: "Tiger Reserve / Diamond City", primaryLandmarks: ["Pandav Falls", "Ken River Gorge"], searchQueries: ["Panna National Park tiger reserve Ken river", "Pandav Falls Panna Madhya Pradesh"] },
  { name: "Mainpat", slug: "mainpat", state: "Chhattisgarh", category: "Tibetan Settlement / Shimla of CG", primaryLandmarks: ["Dhakpo Monastery", "Tiger Point Mainpat"], searchQueries: ["Mainpat Tibetan monastery Chhattisgarh", "Tiger Point waterfall Mainpat"] },
  { name: "Sirpur", slug: "sirpur", state: "Chhattisgarh", category: "Laxman Temple / Brick Architecture", primaryLandmarks: ["Laxman Temple Sirpur", "Gandheswar"], searchQueries: ["Laxman Temple Sirpur brick architecture", "Sirpur archaeological site Chhattisgarh"] },
  { name: "Bhoramdeo", slug: "bhoramdeo", state: "Chhattisgarh", category: "Khajuraho of Chhattisgarh", primaryLandmarks: ["Bhoramdeo Temple", "Maikal Hills"], searchQueries: ["Bhoramdeo Temple Kawardha Chhattisgarh", "Bhoramdeo temple stone carvings"] },
  { name: "Tirathgarh Falls", slug: "tirathgarh-falls", state: "Chhattisgarh", category: "Milky White Step Falls", primaryLandmarks: ["Tirathgarh Step Cascades"], searchQueries: ["Tirathgarh Falls Bastar Kanger valley", "Tirathgarh milky cascades Chhattisgarh"] },
  { name: "Netarhat", slug: "netarhat", state: "Jharkhand", category: "Queen of Chotanagpur / Sunrise", primaryLandmarks: ["Magnolia Sunset Point", "Upper Ghaghri"], searchQueries: ["Netarhat sunrise sunset point Jharkhand", "Magnolia Point Netarhat hills"] },
  { name: "Hundru Falls", slug: "hundru-falls", state: "Jharkhand", category: "Subarnarekha River Cascade", primaryLandmarks: ["Hundru Falls", "Subarnarekha Gorge"], searchQueries: ["Hundru Falls Ranchi Jharkhand", "Hundru waterfall rock cascade"] },
  { name: "Dassam Falls", slug: "dassam-falls", state: "Jharkhand", category: "Kanchi River Natural Wonder", primaryLandmarks: ["Dassam Falls"], searchQueries: ["Dassam Falls Ranchi Kanchi river", "Dassam waterfall landscape Jharkhand"] },
  { name: "Deoghar", slug: "deoghar", state: "Jharkhand", category: "Baidyanath Dham Jyotirlinga", primaryLandmarks: ["Baba Baidyanath Temple", "Trikuta Hills"], searchQueries: ["Baidyanath Dham temple Deoghar Jharkhand", "Baidyanath Jyotirlinga temple courtyard"] },
  { name: "Parasnath", slug: "parasnath", state: "Jharkhand", category: "Shikharji / Highest Peak of Jharkhand", primaryLandmarks: ["Shikharji Jain Temples"], searchQueries: ["Shikharji Parasnath hill temples Jharkhand", "Parasnath peak Jain pilgrimage"] },
  { name: "Patratu Valley", slug: "patratu-valley", state: "Jharkhand", category: "Winding Ghat Roads / Dam Lake", primaryLandmarks: ["Patratu Dam", "Patratu Winding Road"], searchQueries: ["Patratu Valley winding road Jharkhand", "Patratu Dam lake view"] },
  { name: "Vaishali", slug: "vaishali", state: "Bihar", category: "World's First Republic / Ashoka Pillar", primaryLandmarks: ["Ashokan Pillar Vaishali", "Relic Stupa"], searchQueries: ["Ashoka Pillar Vaishali lion capital Bihar", "Ananda Stupa Vaishali ruins"] },
  { name: "Sasaram", slug: "sasaram", state: "Bihar", category: "Tomb of Sher Shah Suri", primaryLandmarks: ["Sher Shah Suri Mausoleum in Lake"], searchQueries: ["Sher Shah Suri tomb Sasaram lake Bihar", "Sasaram mausoleum red sandstone"] },
  { name: "Manas National Park", slug: "manas-national-park", state: "Assam", category: "Tiger & Golden Langur / UNESCO", primaryLandmarks: ["Manas River", "Bansbari"], searchQueries: ["Manas National Park Assam wildlife", "Manas river landscape Bhutan border"] },
  { name: "Tezpur", slug: "tezpur", state: "Assam", category: "City of Eternal Romance / Agnigarh", primaryLandmarks: ["Agnigarh Hill", "Cole Park", "Bhairabi Temple"], searchQueries: ["Agnigarh hill Tezpur Brahmaputra view", "Tezpur Assam riverbank"] },
  { name: "Sivasagar", slug: "sivasagar", state: "Assam", category: "Ahom Kingdom Capital / Rang Ghar", primaryLandmarks: ["Rang Ghar", "Talatol Ghar", "Sivadol"], searchQueries: ["Rang Ghar Sivasagar Ahom amphitheatre", "Talatol Ghar Sivasagar", "Sivadol temple tank"] },
  { name: "Haflong", slug: "haflong", state: "Assam", category: "Only Hill Station in Assam", primaryLandmarks: ["Haflong Lake", "Jatinga"], searchQueries: ["Haflong lake hill station Assam", "Haflong hills landscape Assam"] },
  { name: "Mawsynram", slug: "mawsynram", state: "Meghalaya", category: "Wettest Place on Earth", primaryLandmarks: ["Mawjymbuin Cave", "Shiva Stalagmite"], searchQueries: ["Mawsynram wettest place Meghalaya rain", "Mawjymbuin Cave stalagmite Mawsynram"] },
  { name: "Jowai", slug: "jowai", state: "Meghalaya", category: "Krang Suri Waterfalls", primaryLandmarks: ["Krang Suri Falls", "Thadlaskein Lake"], searchQueries: ["Krang Suri waterfall blue pool Meghalaya", "Krang Shuri falls Jowai"] },
  { name: "Nongriat", slug: "nongriat", state: "Meghalaya", category: "Double Decker Living Root Bridge", primaryLandmarks: ["Double Decker Root Bridge", "Rainbow Falls"], searchQueries: ["Double Decker Living Root Bridge Nongriat Meghalaya", "Rainbow Falls Nongriat"] },
  { name: "Ravangla", slug: "ravangla", state: "Sikkim", category: "Buddha Park / Giant Buddha", primaryLandmarks: ["Buddha Park of Ravangla", "Ralang Monastery"], searchQueries: ["Buddha Park Ravangla giant statue Sikkim", "Tathagata Tsal Ravangla mountains"] },
  { name: "Namchi", slug: "namchi", state: "Sikkim", category: "Siddheshwar Dham / Char Dham", primaryLandmarks: ["Char Dham Namchi", "Samdruptse Hill"], searchQueries: ["Char Dham Siddheshwar Dham Namchi Sikkim", "Samdruptse Guru Rinpoche statue Namchi"] },
  { name: "Zuluk", slug: "zuluk", state: "Sikkim", category: "Historic Silk Route / 32 Hairpin Bends", primaryLandmarks: ["Old Silk Route Loops", "Thambi Viewpoint"], searchQueries: ["Zuluk Silk Route hairpin loops Sikkim", "Thambi viewpoint Kanchenjunga Zuluk"] },
  { name: "Yuksom", slug: "yuksom", state: "Sikkim", category: "First Capital of Sikkim / Dzongri Base", primaryLandmarks: ["Norbugang Coronation Throne", "Dubdi Monastery"], searchQueries: ["Yuksom coronation throne Sikkim", "Dubdi Monastery Yuksom"] },
  { name: "Sela Pass", slug: "sela-pass", state: "Arunachal Pradesh", category: "High Mountain Lake Pass", primaryLandmarks: ["Sela Lake", "Sela Gate"], searchQueries: ["Sela Pass gate snow Arunachal Pradesh", "Sela Lake frozen mountains"] },
  { name: "Dirang", slug: "dirang", state: "Arunachal Pradesh", category: "Kiwi Valleys / Hot Springs", primaryLandmarks: ["Dirang Dzong", "Sangti Valley"], searchQueries: ["Sangti Valley black necked crane Dirang", "Dirang Dzong fort village"] },
  { name: "Bomdila", slug: "bomdila", state: "Arunachal Pradesh", category: "Apple Orchards / Himalayan View", primaryLandmarks: ["Bomdila Monastery", "Bomdila View Point"], searchQueries: ["Bomdila Monastery Arunachal Pradesh", "Bomdila town Himalayan view"] },
  { name: "Mechuka", slug: "mechuka", state: "Arunachal Pradesh", category: "Forbidden Valley / Snow Peaks", primaryLandmarks: ["Samten Yongcha Monastery", "Yargyapchu River"], searchQueries: ["Mechuka valley wooden bridge Arunachal", "Menchukha valley snow peaks river"] },
  { name: "Khonoma", slug: "khonoma", state: "Nagaland", category: "First Green Village of Asia", primaryLandmarks: ["Khonoma Terraced Fields", "Forts of Khonoma"], searchQueries: ["Khonoma green village terraced fields Nagaland", "Khonoma village hills landscape"] },
  { name: "Mokokchung", slug: "mokokchung", state: "Nagaland", category: "Cultural Capital of Ao Nagas", primaryLandmarks: ["Ungma Village", "Longkhum"], searchQueries: ["Mokokchung Ao Naga village hills", "Longkhum viewpoint Nagaland"] },
  { name: "Keibul Lamjao", slug: "keibul-lamjao", state: "Manipur", category: "Only Floating National Park", primaryLandmarks: ["Dancing Deer Sangai", "Phumdi Islands"], searchQueries: ["Keibul Lamjao floating park Sangai deer", "Keibul Lamjao national park phumdi"] },
  { name: "Ukhrul", slug: "ukhrul", state: "Manipur", category: "Shirui Lily / Tangkhul Hills", primaryLandmarks: ["Shirui Kashong Peak", "Khangkhui Cave"], searchQueries: ["Shirui Kashung peak Ukhrul Manipur", "Ukhrul hills Shirui lily"] },
  { name: "Champhai", slug: "champhai", state: "Mizoram", category: "Rice Bowl of Mizoram / Myanmar Border", primaryLandmarks: ["Champhai Valley Rice Terraces", "Rih Dil"], searchQueries: ["Champhai valley rice fields Mizoram", "Rih Dil lake Myanmar border"] },
  { name: "Vantawng Falls", slug: "vantawng-falls", state: "Mizoram", category: "Highest Waterfall in Mizoram", primaryLandmarks: ["Vantawng Falls Bamboo Forest"], searchQueries: ["Vantawng Falls Serchhip Mizoram", "Vantawng Khawhthla waterfall bamboo"] },
  { name: "Radhanagar Beach", slug: "radhanagar-beach", state: "Andaman and Nicobar Islands", category: "Asia's Best Beach", primaryLandmarks: ["Sunset at Beach No 7"], searchQueries: ["Radhanagar Beach sunset Havelock Island", "Radhanagar turquoise sea white sand"] },
  { name: "Elephant Beach", slug: "elephant-beach", state: "Andaman and Nicobar Islands", category: "Coral Reefs / Water Sports", primaryLandmarks: ["Elephant Beach Reef"], searchQueries: ["Elephant Beach Havelock Island snorkeling", "Elephant Beach fallen trees Andaman"] },
  { name: "Ross Island", slug: "ross-island", state: "Andaman and Nicobar Islands", category: "Paris of the East Ruins / Peacocks", primaryLandmarks: ["British Ruins overgrown with Roots"], searchQueries: ["Ross Island ruins banyan tree roots Andaman", "Netaji Subhash Chandra Bose Island"] },
  { name: "Minicoy", slug: "minicoy", state: "Lakshadweep", category: "Lighthouse / Southernmost Atoll", primaryLandmarks: ["Minicoy Lighthouse", "Maliku Atoll"], searchQueries: ["Minicoy Island lighthouse Lakshadweep", "Minicoy lagoon turquoise atoll"] },
  { name: "Baripada", slug: "baripada", state: "Odisha", category: "Mayurbhanj Chhau / Jagannath Temple", primaryLandmarks: ["Haribaldevjew Temple", "Mayurbhanj Palace"], searchQueries: ["Haribaldevjew Temple Baripada Mayurbhanj", "Mayurbhanj Palace Baripada"] },
  { name: "Barehipani Falls", slug: "barehipani-falls", state: "Odisha", category: "Second Highest Waterfall in India", primaryLandmarks: ["Barehipani Tiered Cascade"], searchQueries: ["Barehipani Falls Simlipal two tier cascade", "Barehipani waterfall Odisha"] },
  { name: "Pipili", slug: "pipili", state: "Odisha", category: "Applique Handicrafts", primaryLandmarks: ["Applique Craft Bazaar"], searchQueries: ["Pipili applique craft bazaar Odisha", "Pipili colorful lanterns Odisha"] },
  { name: "Hirakud", slug: "hirakud", state: "Odisha", category: "Longest Earthen Dam in the World", primaryLandmarks: ["Hirakud Reservoir", "Gandhi Minar"], searchQueries: ["Hirakud Dam Mahanadi river Odisha", "Gandhi Minar Hirakud reservoir"] },
  { name: "Khandadhar", slug: "khandadhar", state: "Odisha", category: "Sword-like Waterfall", primaryLandmarks: ["Khandadhar Falls Sundergarh"], searchQueries: ["Khandadhar Falls Odisha waterfall sword", "Khandadhar water cascade Sundergarh"] },
  { name: "Duduma Falls", slug: "duduma-falls", state: "Odisha", category: "Horsetail Falls / Machkund", primaryLandmarks: ["Duduma Waterfall Gorge"], searchQueries: ["Duduma Falls Machkund river Koraput", "Duduma waterfall gorge Odisha"] },
  { name: "Taptapani", slug: "taptapani", state: "Odisha", category: "Hot Sulfur Spring / Hills", primaryLandmarks: ["Taptapani Hot Springs"], searchQueries: ["Taptapani hot spring Ganjam Odisha", "Taptapani hills forest"] }
];

// Merge all lists
let masterList = [...combined, ...moreDestinations];

// Deduplicate by slug
const slugMap = new Map();
const resultList = [];

for (const dest of masterList) {
  if (!slugMap.has(dest.slug)) {
    slugMap.set(dest.slug, true);
    resultList.push({
      ...dest,
      country: "India"
    });
  }
}

console.log(`Initial count: ${resultList.length}`);

// If not yet 300, fill out with well-known heritage/tourist places across India
let fillIdx = 1;
const fillPlaces = [
  { name: "Ranthambore Fort", slug: "ranthambore-fort", state: "Rajasthan", category: "Hill Fort of Rajasthan", primaryLandmarks: ["Trinetra Ganesha Temple"], searchQueries: ["Ranthambore Fort walls Rajasthan", "Ranthambore fortress hill"] },
  { name: "Jaigarh Fort", slug: "jaigarh-fort", state: "Rajasthan", category: "Victory Fort / Jaivana Cannon", primaryLandmarks: ["Jaivana Cannon", "Aravalli Ramparts"], searchQueries: ["Jaigarh Fort cannon Jaipur", "Jaigarh Fort ramparts Aravalli"] },
  { name: "Nahargarh Fort", slug: "nahargarh-fort", state: "Rajasthan", category: "Tiger Fort / Jaipur Skyline", primaryLandmarks: ["Madhavendra Bhawan", "Sunset Point"], searchQueries: ["Nahargarh Fort Jaipur sunset view", "Nahargarh Fort stepwell Jaipur"] },
  { name: "Galtaji", slug: "galtaji", state: "Rajasthan", category: "Monkey Temple / Natural Springs", primaryLandmarks: ["Galta Kund", "Surya Temple"], searchQueries: ["Galtaji Monkey Temple Jaipur kund", "Galta ji temple gorge Jaipur"] },
  { name: "Osian", slug: "osian", state: "Rajasthan", category: "Desert Oasis / Ancient Temples", primaryLandmarks: ["Sachiya Mata Temple", "Sun Temple Osian"], searchQueries: ["Osian sand dunes temple Jodhpur", "Sachiya Mata Temple Osian"] },
  { name: "Kolhapur", slug: "kolhapur", state: "Maharashtra", category: "Mahalakshmi Temple / Wrestling", primaryLandmarks: ["Mahalakshmi Temple", "New Palace Kolhapur"], searchQueries: ["Mahalakshmi Temple Kolhapur Maharashtra", "New Palace Kolhapur chhatrapati"] },
  { name: "Khandala", slug: "khandala", state: "Maharashtra", category: "Valley / Duke's Nose", primaryLandmarks: ["Duke's Nose", "Kune Falls"], searchQueries: ["Duke's Nose Khandala cliff valley", "Kune Falls Khandala waterfall"] },
  { name: "Panchgani", slug: "panchgani", state: "Maharashtra", category: "Table Land / Five Hills", primaryLandmarks: ["Table Land", "Sydney Point"], searchQueries: ["Table Land volcanic plateau Panchgani", "Sydney Point Panchgani valley view"] },
  { name: "Bhandardara", slug: "bhandardara", state: "Maharashtra", category: "Arthur Lake / Umbrella Falls", primaryLandmarks: ["Arthur Lake", "Wilson Dam"], searchQueries: ["Bhandardara lake Wilson Dam Maharashtra", "Umbrella Falls Bhandardara waterfall"] },
  { name: "Igatpuri", slug: "igatpuri", state: "Maharashtra", category: "Vipassana Pagoda / Ghats", primaryLandmarks: ["Vipassana International Academy", "Tringalwadi Fort"], searchQueries: ["Dhammagiri Vipassana pagoda Igatpuri", "Igatpuri fog mountains Western Ghats"] },
  { name: "Kaas Plateau", slug: "kaas-plateau", state: "Maharashtra", category: "Valley of Flowers of Maharashtra", primaryLandmarks: ["Kaas Pathar Blooms"], searchQueries: ["Kaas Plateau of Flowers UNESCO Satara", "Kaas Pathar flowers blooming wild"] },
  { name: "Murud", slug: "murud", state: "Maharashtra", category: "Konkan Coast & Betel Palms", primaryLandmarks: ["Murud Beach"], searchQueries: ["Murud Beach palms Konkan sunset", "Murud coastline Maharashtra"] },
  { name: "Kashid", slug: "kashid", state: "Maharashtra", category: "White Sand Beach", primaryLandmarks: ["Kashid Beach Watersports"], searchQueries: ["Kashid Beach white sand waves Maharashtra", "Kashid beach shoreline"] },
  { name: "Chidambaram", slug: "chidambaram", state: "Tamil Nadu", category: "Nataraja Temple / Cosmic Dance", primaryLandmarks: ["Thillai Nataraja Temple"], searchQueries: ["Thillai Nataraja Temple Chidambaram gopuram", "Chidambaram temple golden roof"] },
  { name: "Vellore", slug: "vellore", state: "Tamil Nadu", category: "Golden Temple / Water Fort", primaryLandmarks: ["Sripuram Golden Temple", "Vellore Fort"], searchQueries: ["Sripuram Golden Temple Vellore gold", "Vellore Fort moat ramparts"] },
  { name: "Tiruchirappalli", slug: "tiruchirappalli", state: "Tamil Nadu", category: "Rockfort Temple / Srirangam", primaryLandmarks: ["Rockfort Temple", "Ranganathaswamy Srirangam"], searchQueries: ["Rockfort Temple Tiruchirappalli rock", "Sri Ranganathaswamy Temple Srirangam gopuram"] },
  { name: "Coimbatore", slug: "coimbatore", state: "Tamil Nadu", category: "Adiyogi Shiva / Manchester of South", primaryLandmarks: ["Adiyogi Shiva Statue", "Marudhamalai"], searchQueries: ["Adiyogi Shiva statue Coimbatore Isha", "Marudhamalai Temple hill Coimbatore"] },
  { name: "Dharmapuri", slug: "dharmapuri", state: "Tamil Nadu", category: "Hogenakkal Falls", primaryLandmarks: ["Hogenakkal Waterfalls", "Coracle Ride"], searchQueries: ["Hogenakkal Falls Kaveri river coracle Tamil Nadu", "Hogenakkal waterfalls smoking rocks"] },
  { name: "Hogenakkal", slug: "hogenakkal", state: "Tamil Nadu", category: "Niagara of Tamil Nadu", primaryLandmarks: ["Kaveri Gorge Falls"], searchQueries: ["Hogenakkal Waterfalls coracle boat Tamil Nadu", "Hogenakkal river gorge"] },
  { name: "Kovalam Beach", slug: "kovalam-beach", state: "Tamil Nadu", category: "Surf Beach / ECR Coast", primaryLandmarks: ["Kovalam Surf Village"], searchQueries: ["Kovalam Beach ECR Chennai surf", "Covelong Beach Tamil Nadu"] },
  { name: "Kundalila", slug: "kundalila", state: "Kerala", category: "Kundala Dam / Cherry Blossoms", primaryLandmarks: ["Kundala Lake", "Kundala Arch Dam"], searchQueries: ["Kundala Lake Munnar pedal boat", "Kundala Dam tea gardens Kerala"] },
  { name: "Marari Beach", slug: "marari-beach", state: "Kerala", category: "Pristine Palm Coast", primaryLandmarks: ["Marari Fishermen Beach"], searchQueries: ["Marari Beach palms white sand Kerala", "Marari beach fishing boats sunset"] },
  { name: "Varkala Cliff", slug: "varkala-cliff", state: "Kerala", category: "Red Geopark Cliffs", primaryLandmarks: ["North Cliff Varkala"], searchQueries: ["Varkala North Cliff path sea view", "Varkala coastal red cliffs sunset"] },
  { name: "Fort Kochi Heritage", slug: "fort-kochi-heritage", state: "Kerala", category: "Jewish Synagogue / Portuguese Street", primaryLandmarks: ["Paradesi Synagogue", "Princess Street"], searchQueries: ["Paradesi Synagogue Jew Town Kochi", "Princess Street Fort Kochi colonial"] },
  { name: "Kappad", slug: "kappad", state: "Kerala", category: "Historic Landing Point 1498", primaryLandmarks: ["Vasco da Gama Monument"], searchQueries: ["Kappad beach rock monument Kozhikode", "Kappad sea shore Vasco da Gama"] },
  { name: "Nandi Betta", slug: "nandi-betta", state: "Karnataka", category: "Cloud Sea Overlook", primaryLandmarks: ["Tipu Sultan Summer Palace"], searchQueries: ["Nandi Betta clouds mist sunrise Karnataka", "Nandi hills temple top"] },
  { name: "Gokarna Om Beach", slug: "gokarna-om-beach", state: "Karnataka", category: "Sacred Om-Shaped Coast", primaryLandmarks: ["Om Beach Rock Outcrop"], searchQueries: ["Om Beach Gokarna shape aerial coastline", "Om Beach waves rocks sunset"] },
  { name: "Murudeshwara", slug: "murudeshwara", state: "Karnataka", category: "Towering Gopura / Coastline", primaryLandmarks: ["Raja Gopuram Murudeshwar"], searchQueries: ["Murudeshwar temple gopuram sea background", "Murudeshwar tall Shiva statue"] },
  { name: "Srirangapatna", slug: "srirangapatna", state: "Karnataka", category: "Tipu Sultan Capital / Kaveri", primaryLandmarks: ["Dariya Daulat Bagh", "Ranganathaswamy Temple"], searchQueries: ["Dariya Daulat Bagh Srirangapatna palace", "Ranganathaswamy Temple Srirangapatna Kaveri"] },
  { name: "Melukote", slug: "melukote", state: "Karnataka", category: "Cheluva Narayana / Kalyani Pond", primaryLandmarks: ["Cheluvanarayana Swamy", "Kalyani Tank"], searchQueries: ["Melukote Kalyani step pond Karnataka", "Cheluvanarayana Swamy Temple Melukote"] },
  { name: "Somnathpur", slug: "somnathpur", state: "Karnataka", category: "Keshava Temple Hoysala", primaryLandmarks: ["Prasanna Chennakeshava Temple"], searchQueries: ["Keshava Temple Somnathpura Hoysala star", "Somnathpur temple stone carvings"] },
  { name: "Undavalli Caves", slug: "undavalli-caves", state: "Andhra Pradesh", category: "Monolithic Anantasayana Vishnu", primaryLandmarks: ["Undavalli Rock Cut Caves"], searchQueries: ["Undavalli Caves sandstone monolith Vijayawada", "Undavalli cave reclining Vishnu"] },
  { name: "Bhavani Island", slug: "bhavani-island", state: "Andhra Pradesh", category: "Krishna River Island Resort", primaryLandmarks: ["Bhavani Island Boating"], searchQueries: ["Bhavani Island Krishna river Vijayawada", "Bhavani Island resort Andhra"] },
  { name: "Simhachalam", slug: "simhachalam", state: "Andhra Pradesh", category: "Varaha Lakshmi Narasimha Temple", primaryLandmarks: ["Simhachalam Temple Hill"], searchQueries: ["Simhachalam Temple hill Visakhapatnam", "Varaha Narasimha Simhachalam temple"] },
  { name: "Borra Caves Vizag", slug: "borra-caves-vizag", state: "Andhra Pradesh", category: "Million Year Old Karst Formations", primaryLandmarks: ["Borra Karst Stalagmites"], searchQueries: ["Borra Caves stalactites illumination Vizag", "Borra Caves Ananthagiri hills"] },
  { name: "Charminar Hyderabad", slug: "charminar-hyderabad", state: "Telangana", category: "Four Minarets / Qutb Shahi", primaryLandmarks: ["Charminar Arches"], searchQueries: ["Charminar four minarets night Hyderabad", "Charminar monument historic"] },
  { name: "Golconda Fort City", slug: "golconda-fort-city", state: "Telangana", category: "Diamond Fort / Acoustic Wonder", primaryLandmarks: ["Bala Hissar Golconda"], searchQueries: ["Golconda Fort citadel walls Hyderabad", "Golconda Fort acoustic dome"] },
  { name: "Ramoji Film City", slug: "ramoji-film-city", state: "Telangana", category: "World's Largest Film Studio", primaryLandmarks: ["Ramoji Studio Sets"], searchQueries: ["Ramoji Film City Hyderabad entrance", "Ramoji film studio gardens"] },
  { name: "Bhoramdeo Sanctuary", slug: "bhoramdeo-sanctuary", state: "Chhattisgarh", category: "Maikal Hills Wild", primaryLandmarks: ["Kawardha Palace"], searchQueries: ["Kawardha Palace Chhattisgarh", "Bhoramdeo temple stone exterior"] },
  { name: "Kutumsar Caves", slug: "kutumsar-caves", state: "Chhattisgarh", category: "Subterranean Stalactites", primaryLandmarks: ["Kutumsar Underground Cave"], searchQueries: ["Kutumsar Cave Kanger Valley Bastar", "Kutumsar cave limestone pillars"] },
  { name: "Pawapuri", slug: "pawapuri", state: "Bihar", category: "Jal Mandir / Mahavira Nirvana", primaryLandmarks: ["Jal Mandir White Marble"], searchQueries: ["Jal Mandir Pawapuri white marble lake Bihar", "Pawapuri lotus pond temple"] },
  { name: "Kesaria Stupa", slug: "kesaria-stupa", state: "Bihar", category: "World's Tallest Ancient Stupa", primaryLandmarks: ["Kesaria Buddhist Stupa"], searchQueries: ["Kesaria Stupa tallest Buddhist stupa Bihar", "Kesaria excavation monument"] },
  { name: "Shergarh Fort", slug: "shergarh-fort", state: "Bihar", category: "Kaimur Hills Citadel", primaryLandmarks: ["Shergarh Hilltop Fort"], searchQueries: ["Shergarh Fort Rohtas Kaimur hills Bihar", "Shergarh fortress ruins"] },
  { name: "Valmiki National Park", slug: "valmiki-national-park", state: "Bihar", category: "Terai Tiger Reserve", primaryLandmarks: ["Gandak River Forest"], searchQueries: ["Valmiki National Park West Champaran Bihar", "Valmiki tiger reserve forest Gandak"] }
];

for (const dest of fillPlaces) {
  if (resultList.length >= 300) break;
  if (!slugMap.has(dest.slug)) {
    slugMap.set(dest.slug, true);
    resultList.push({
      ...dest,
      country: "India"
    });
  }
}

// Ensure exactly 300
const final300 = resultList.slice(0, 300);
console.log(`Final validated count: ${final300.length}`);

// Verify pilot top 10
console.log("Top 10 pilot destinations:");
final300.slice(0, 10).forEach((d, idx) => {
  console.log(` ${idx + 1}. ${d.name} (${d.state})`);
});

const outputPath = path.join(__dirname, "../../src/data/indianDestinationsMaster.json");
fs.writeFileSync(outputPath, JSON.stringify(final300, null, 2), "utf8");
console.log(`Successfully generated and saved 300 destinations to: ${outputPath}`);
