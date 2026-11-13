/**
 * Song database for "Guess the Telugu Song": Telugu film songs, 2000 – 2025.
 *
 * Teams uncover the song TITLE letter by letter; the movie, year and composer
 * are shown as clues. No lyric text is stored.
 *
 * Metadata was compiled from general knowledge — spot-check composers/years.
 *
 * Row format: [title, movie, year, composer, aliases?]
 *   - title    what teams must guess (English transliteration, letters A–Z are hidden)
 *   - aliases  other accepted answers for the typed song guess
 *
 * Ids are derived from title + movie, so renaming either one changes the id
 * (only matters for "don't repeat a song" history in saved games).
 *
 * Answers are matched case-insensitively, ignoring punctuation and extra spaces,
 * so aliases are only needed for genuinely different spellings or names.
 *
 * @typedef {Object} Song
 * @property {string} id
 * @property {string} title
 * @property {string} movie
 * @property {number} year
 * @property {string} composer
 * @property {string[]} aliases
 */

const RAW = [
  // 2000 – 2004
  ["Anaganaga Aakasam Undi", "Nuvve Kavali", 2000, "Koti"],
  ["Okkasari Cheppaleva", "Nuvvu Naaku Nachav", 2001, "Koti"],
  ["Gaajuvaka Pilla", "Nuvvu Nenu", 2001, "R. P. Patnaik"],
  ["Ye Mera Jaha", "Kushi", 2001, "Mani Sharma"],
  ["Aaduvari Matalaku", "Kushi", 2001, "Mani Sharma"],
  ["Manohara", "Cheli", 2001, "Harris Jayaraj"],
  ["Nenu Nenuga Lene", "Manmadhudu", 2002, "Devi Sri Prasad"],
  ["Radhe Govinda", "Indra", 2002, "Mani Sharma"],
  ["Nuvvu Nuvvu", "Khadgam", 2002, "Devi Sri Prasad"],
  ["Cheppave Chirugali", "Okkadu", 2003, "Mani Sharma"],
  ["Ye Chota Nuvvunna", "Johnny", 2003, "Ramana Gogula"],
  ["Aa Ante Amalapuram", "Arya", 2004, "Devi Sri Prasad"],
  ["Feel My Love", "Arya", 2004, "Devi Sri Prasad"],
  ["Nuvvosthanante Nenoddantana", "Varsham", 2004, "Devi Sri Prasad", ["Nuvvosthanante"]],
  ["Mellaga Karagani", "Varsham", 2004, "Devi Sri Prasad"],
  ["Kopama Napaina", "Varsham", 2004, "Devi Sri Prasad"],
  ["Yedalo Ganam", "Anand", 2004, "K. M. Radha Krishnan"],
 
  // 2005 – 2009
  ["Chandrullo Unde Kundelu", "Nuvvostanante Nenoddantana", 2005, "Devi Sri Prasad"],
  ["Something Something", "Nuvvostanante Nenoddantana", 2005, "Devi Sri Prasad"],
  ["Pilichina Raanantava", "Athadu", 2005, "Mani Sharma"],
  ["Bommani Geesthe", "Bommarillu", 2006, "Devi Sri Prasad"],
  ["Appudo Ippudo", "Bommarillu", 2006, "Devi Sri Prasad"],
  ["Dole Dole", "Pokiri", 2006, "Mani Sharma"],
  ["Ippatikinka Naa Vayasu", "Pokiri", 2006, "Mani Sharma"],
  ["Jagadame", "Pokiri", 2006, "Mani Sharma"],
  ["Gala Gala", "Pokiri", 2006, "Mani Sharma"],
  ["Manasa Vaacha", "Godavari", 2006, "K. M. Radha Krishnan"],
  ["Uppongele Godavari", "Godavari", 2006, "K. M. Radha Krishnan"],
  ["Oh My Friend", "Happy Days", 2007, "Mickey J. Meyer"],
  ["Arey Rey", "Happy Days", 2007, "Mickey J. Meyer"],
  ["Gallo Thelinattunde", "Jalsa", 2008, "Devi Sri Prasad"],
  ["My Heart Is Beating", "Jalsa", 2008, "Devi Sri Prasad"],
  ["Chalore Chalore", "Jalsa", 2008, "Devi Sri Prasad"],
  ["Nijanga Nenena", "Kotha Bangaru Lokam", 2008, "Mickey J. Meyer"],
  ["Nee Prashnalu", "Kotha Bangaru Lokam", 2008, "Mickey J. Meyer"],
  ["Dheera Dheera", "Magadheera", 2009, "M. M. Keeravani"],
  ["Panchadara Bomma", "Magadheera", 2009, "M. M. Keeravani"],
  ["Bangaru Kodipetta", "Magadheera", 2009, "M. M. Keeravani"],
  ["Uppenantha", "Arya 2", 2009, "Devi Sri Prasad"],
  ["Ringa Ringa", "Arya 2", 2009, "Devi Sri Prasad"],
  ["My Love Is Gone", "Arya 2", 2009, "Devi Sri Prasad"],
 
  // 2010 – 2014
  ["Ee Hridayam", "Ye Maaya Chesave", 2010, "A. R. Rahman"],
  ["Hosanna", "Ye Maaya Chesave", 2010, "A. R. Rahman"],
  ["Kundanapu Bomma", "Ye Maaya Chesave", 2010, "A. R. Rahman"],
  ["Vintunnavaa", "Ye Maaya Chesave", 2010, "A. R. Rahman"],
  ["Chilipiga", "Orange", 2010, "Harris Jayaraj"],
  ["Ola Olaala Ala", "Orange", 2010, "Harris Jayaraj"],
  ["Rooba Rooba", "Orange", 2010, "Harris Jayaraj"],
  ["Nenu Nuvvantu", "Orange", 2010, "Harris Jayaraj"],
  ["Inka Edho", "Darling", 2010, "G. V. Prakash Kumar"],
  ["Ahaa Allari", "100% Love", 2011, "Devi Sri Prasad"],
  ["Poovai Poovai", "Dookudu", 2011, "S. Thaman"],
  ["Nee Dookudu", "Dookudu", 2011, "S. Thaman"],
  ["Chali Chaliga", "Mr. Perfect", 2011, "Devi Sri Prasad"],
  ["Badhulu Thochani", "Mr. Perfect", 2011, "Devi Sri Prasad"],
  ["Kevvu Keka", "Gabbar Singh", 2012, "Devi Sri Prasad"],
  ["Dil Se", "Gabbar Singh", 2012, "Devi Sri Prasad"],
  ["Akasam Ammayaithe", "Gabbar Singh", 2012, "Devi Sri Prasad"],
  ["O Madhu", "Julayi", 2012, "Devi Sri Prasad"],
  ["Pakado Pakado", "Julayi", 2012, "Devi Sri Prasad"],
  ["O Priya Priya", "Ishq", 2012, "Anup Rubens"],
  ["Mari Anthaga", "Seethamma Vakitlo Sirimalle Chettu", 2013, "Mickey J. Meyer"],
  ["Aaradugula Bullet", "Attarintiki Daredi", 2013, "Devi Sri Prasad"],
  ["Ninnu Chudagane", "Attarintiki Daredi", 2013, "Devi Sri Prasad"],
  ["Bapu Gari Bomma", "Attarintiki Daredi", 2013, "Devi Sri Prasad"],
  ["Pandagala Digivachavu", "Mirchi", 2013, "Devi Sri Prasad"],
  ["Darlingey", "Mirchi", 2013, "Devi Sri Prasad"],
  ["Idedo Bagundi", "Mirchi", 2013, "Devi Sri Prasad"],
  ["Kanulanu Thaake", "Manam", 2014, "Anup Rubens"],
  ["Kani Penchina Maa Ammake", "Manam", 2014, "Anup Rubens"],
  ["Cinema Chupistha Mava", "Race Gurram", 2014, "S. Thaman"],
  ["Down Down Duppa", "Race Gurram", 2014, "S. Thaman"],
 
  // 2015 – 2019
  ["Charuseela", "Srimanthudu", 2015, "Devi Sri Prasad"],
  ["Jatha Kalise", "Srimanthudu", 2015, "Devi Sri Prasad"],
  ["Dheevara", "Baahubali: The Beginning", 2015, "M. M. Keeravani"],
  ["Pacha Bottasi", "Baahubali: The Beginning", 2015, "M. M. Keeravani"],
  ["Manohari", "Baahubali: The Beginning", 2015, "M. M. Keeravani"],
  ["Motta Modatisari", "Bhale Bhale Magadivoy", 2015, "Gopi Sundar"],
  ["Yellipoke Shyamala", "A Aa", 2016, "Mickey J. Meyer"],
  ["Blockbuster", "Sarrainodu", 2016, "S. Thaman"],
  ["Pakka Local", "Janatha Garage", 2016, "Devi Sri Prasad"],
  ["Pranaamam", "Janatha Garage", 2016, "Devi Sri Prasad"],
  ["Apple Beauty", "Janatha Garage", 2016, "Devi Sri Prasad"],
  ["Crazy Feeling", "Nenu Sailaja", 2016, "Devi Sri Prasad"],
  ["Em Cheppanu", "Nenu Sailaja", 2016, "Devi Sri Prasad"],
  ["Oosupodu", "Fidaa", 2017, "Shakthikanth Karthick"],
  ["Vachinde", "Fidaa", 2017, "Shakthikanth Karthick"],
  ["Hey Pillagada", "Fidaa", 2017, "Shakthikanth Karthick"],
  ["Madhurame", "Arjun Reddy", 2017, "Radhan"],
  ["Emitemitemo", "Arjun Reddy", 2017, "Radhan"],
  ["Saahore Baahubali", "Baahubali 2: The Conclusion", 2017, "M. M. Keeravani"],
  ["Kanna Nidurinchara", "Baahubali 2: The Conclusion", 2017, "M. M. Keeravani"],
  ["Hamsa Naava", "Baahubali 2: The Conclusion", 2017, "M. M. Keeravani", ["Sundari"]],
  ["Dandaalayyaa", "Baahubali 2: The Conclusion", 2017, "M. M. Keeravani"],
  ["Adiga Adiga", "Ninnu Kori", 2017, "Gopi Sundar"],
  ["Mellaga Tellarindoi", "Shatamanam Bhavati", 2017, "Mickey J. Meyer"],
  ["Ammadu Let's Do Kummudu", "Khaidi No. 150", 2017, "Devi Sri Prasad"],
  ["Seeti Maar", "Duvvada Jagannadham", 2017, "Devi Sri Prasad", ["DJ Seeti Maar"]],
  ["Gudilo Badilo Madilo", "Duvvada Jagannadham", 2017, "Devi Sri Prasad"],
  ["Rangamma Mangamma", "Rangasthalam", 2018, "Devi Sri Prasad"],
  ["Yentha Sakkagunnave", "Rangasthalam", 2018, "Devi Sri Prasad", ["Entha Sakkagunnave"]],
  ["Jigelu Rani", "Rangasthalam", 2018, "Devi Sri Prasad"],
  ["Ranga Ranga Rangasthalaana", "Rangasthalam", 2018, "Devi Sri Prasad"],
  ["Inkem Inkem Inkem Kaavaale", "Geetha Govindam", 2018, "Gopi Sundar", ["Inkem Inkem", "Inkem Inkem Inkem Kavale"]],
  ["Vachindamma", "Geetha Govindam", 2018, "Gopi Sundar"],
  ["Yenti Yenti", "Geetha Govindam", 2018, "Gopi Sundar"],
  ["Pilla Raa", "RX 100", 2018, "Chaitan Bharadwaj"],
  ["Ninnila", "Tholi Prema", 2018, "S. Thaman"],
  ["Maate Vinadhuga", "Taxiwaala", 2018, "Jakes Bejoy"],
  ["Mooga Manasulu", "Mahanati", 2018, "Mickey J. Meyer"],
  ["Vachaadayyo Saami", "Bharat Ane Nenu", 2018, "Devi Sri Prasad"],
  ["Peniviti", "Aravinda Sametha Veera Raghava", 2018, "S. Thaman"],
  ["Anaganaganaga", "Aravinda Sametha Veera Raghava", 2018, "S. Thaman"],
  ["Priyathama Priyathama", "Majili", 2019, "Gopi Sundar"],
  ["Kadalalle", "Dear Comrade", 2019, "Justin Prabhakaran"],
  ["Adhento Gaani Vunnapaatuga", "Jersey", 2019, "Anirudh Ravichander"],
  ["Padara Padara", "Maharshi", 2019, "Devi Sri Prasad"],
  ["Everest Anchuna", "Maharshi", 2019, "Devi Sri Prasad"],
  ["Dimaak Kharaab", "iSmart Shankar", 2019, "Mani Sharma"],
  ["Psycho Saiyaan", "Saaho", 2019, "Tanishk Bagchi"],
 
  // 2020 – 2022
  ["Butta Bomma", "Ala Vaikunthapurramuloo", 2020, "S. Thaman"],
  ["Samajavaragamana", "Ala Vaikunthapurramuloo", 2020, "S. Thaman", ["Samajavaragamana Male"]],
  ["Ramuloo Ramulaa", "Ala Vaikunthapurramuloo", 2020, "S. Thaman"],
  ["OMG Daddy", "Ala Vaikunthapurramuloo", 2020, "S. Thaman"],
  ["Sittharala Sirapadu", "Ala Vaikunthapurramuloo", 2020, "S. Thaman"],
  ["Mind Block", "Sarileru Neekevvaru", 2020, "Devi Sri Prasad"],
  ["He's So Cute", "Sarileru Neekevvaru", 2020, "Devi Sri Prasad"],
  ["Whattey Beauty", "Bheeshma", 2020, "Mahati Swara Sagar"],
  ["The Life of Ram", "Jaanu", 2020, "Govind Vasantha", ["Life of Ram"]],
  ["Nee Kannu Neeli Samudram", "Uppena", 2021, "Devi Sri Prasad"],
  ["Jala Jala Jalapaatham", "Uppena", 2021, "Devi Sri Prasad"],
  ["Saranga Dariya", "Love Story", 2021, "Pawan Ch"],
  ["Ay Pilla", "Love Story", 2021, "Pawan Ch"],
  ["Neeli Neeli Aakasam", "30 Rojullo Preminchadam Ela", 2021, "Anup Rubens"],
  ["Oo Antava Oo Oo Antava", "Pushpa: The Rise", 2021, "Devi Sri Prasad", ["Oo Antava", "Oo Antava Mawa"]],
  ["Srivalli", "Pushpa: The Rise", 2021, "Devi Sri Prasad"],
  ["Saami Saami", "Pushpa: The Rise", 2021, "Devi Sri Prasad"],
  ["Eyy Bidda Idhi Naa Adda", "Pushpa: The Rise", 2021, "Devi Sri Prasad"],
  ["Jai Balayya", "Akhanda", 2021, "S. Thaman"],
  ["Bhoom Bhaddhal", "Krack", 2021, "S. Thaman"],
  ["Chitti", "Jathi Ratnalu", 2021, "Radhan"],
  ["Maguva Maguva", "Vakeel Saab", 2021, "S. Thaman"],
  ["Naatu Naatu", "RRR", 2022, "M. M. Keeravani"],
  ["Dosti", "RRR", 2022, "M. M. Keeravani"],
  ["Komuram Bheemudo", "RRR", 2022, "M. M. Keeravani"],
  ["Lala Bheemla", "Bheemla Nayak", 2022, "S. Thaman"],
  ["Kalaavathi", "Sarkaru Vaari Paata", 2022, "S. Thaman"],
  ["Penny", "Sarkaru Vaari Paata", 2022, "S. Thaman"],
  ["Oh Sita Hey Rama", "Sita Ramam", 2022, "Vishal Chandrashekhar"],
  ["Inthandham", "Sita Ramam", 2022, "Vishal Chandrashekhar"],
  ["DJ Tillu", "DJ Tillu", 2022, "Ram Miriyala"],
 
  // 2023 – 2025
  ["Boss Party", "Waltair Veerayya", 2023, "Devi Sri Prasad"],
  ["Poonakaalu Loading", "Waltair Veerayya", 2023, "Devi Sri Prasad"],
  ["Dhoom Dhaam Dhosthaan", "Dasara", 2023, "Santhosh Narayanan"],
  ["Chamkeela Angeelesi", "Dasara", 2023, "Santhosh Narayanan"],
  ["O Rendu Prema Meghaalila", "Baby", 2023, "Vijai Bulganin"],
  ["Samayama", "Hi Nanna", 2023, "Hesham Abdul Wahab"],
  ["Odiyamma", "Hi Nanna", 2023, "Hesham Abdul Wahab"],
  ["Na Roja Nuvve", "Kushi", 2023, "Hesham Abdul Wahab"],
  ["Aradhya", "Kushi", 2023, "Hesham Abdul Wahab"],
  ["Sooreede", "Salaar: Part 1 – Ceasefire", 2023, "Ravi Basrur"],
  ["Kurchi Madathapetti", "Guntur Kaaram", 2024, "S. Thaman"],
  ["Dum Masala", "Guntur Kaaram", 2024, "S. Thaman"],
  ["Ticket Eh Konakunda", "Tillu Square", 2024, "Ram Miriyala"],
  ["Bhairava Anthem", "Kalki 2898 AD", 2024, "Santhosh Narayanan"],
  ["Chuttamalle", "Devara: Part 1", 2024, "Anirudh Ravichander"],
  ["Fear Song", "Devara: Part 1", 2024, "Anirudh Ravichander"],
  ["Srimathi Garu", "Lucky Baskhar", 2024, "G. V. Prakash Kumar"],
  ["Pushpa Pushpa", "Pushpa 2: The Rule", 2024, "Devi Sri Prasad"],
  ["Sooseki", "Pushpa 2: The Rule", 2024, "Devi Sri Prasad", ["The Couple Song"]],
  ["Kissik", "Pushpa 2: The Rule", 2024, "Devi Sri Prasad"],
  ["Peelings", "Pushpa 2: The Rule", 2024, "Devi Sri Prasad"],
  ["Jaragandi", "Game Changer", 2025, "S. Thaman"],
  ["Naanaa Hyraanaa", "Game Changer", 2025, "S. Thaman"],
  ["Dabidi Dibidi", "Daaku Maharaaj", 2025, "S. Thaman"],
  ["Godari Gattu", "Sankranthiki Vasthunam", 2025, "Bheems Ceciroleo"],
  ["Bujji Thalli", "Thandel", 2025, "Devi Sri Prasad"],
  ["Namo Namah Shivaya", "Thandel", 2025, "Devi Sri Prasad"],
  ["Swathi Reddy", "Mad Square", 2025, "Bheems Ceciroleo"],
  ["Firestorm", "They Call Him OG", 2025, "S. Thaman"],
 
  // ---- Expansion set ----
  // 2000 – 2004
  ["Pachchadanamey", "Sakhi", 2000, "A. R. Rahman"],
  ["Manasantha Nuvve", "Manasantha Nuvve", 2001, "R. P. Patnaik"],
  ["Thuneega Thuneega", "Manasantha Nuvve", 2001, "R. P. Patnaik"],
  ["Cheppave Prema", "Manasantha Nuvve", 2001, "R. P. Patnaik"],
  ["Don't Marry Be Happy", "Manmadhudu", 2002, "Devi Sri Prasad"],
  ["Nee Navvula Thellaadhanaanni", "Aadi", 2002, "Mani Sharma"],
  ["Nuvvante Pranamani", "Santosham", 2002, "R. P. Patnaik"],
  ["Ranu Ranu Antune", "Jayam", 2002, "R. P. Patnaik"],
  ["Priyatama Telusuna", "Jayam", 2002, "R. P. Patnaik"],
  ["Chupultho Guchi Guchi", "Idiot", 2002, "Chakri"],
  ["Cheliya Cheliya", "Idiot", 2002, "Chakri"],
  ["Paadana Theeyaga", "Vasu", 2002, "Harris Jayaraj"],
  ["Ghallu Ghallu", "Indra", 2002, "Mani Sharma"],
  ["Bham Bham Bhole", "Indra", 2002, "Mani Sharma"],
  ["Nuvvem Maya Chesavo", "Okkadu", 2003, "Mani Sharma"],
  ["Sahasam Swasaga", "Okkadu", 2003, "Mani Sharma"],
  ["Neeve Neeve", "Amma Nanna O Tamila Ammayi", 2003, "Chakri"],
  ["Ammaina Nannaina", "Simhadri", 2003, "M. M. Keeravani"],
  ["Cheema Cheema", "Simhadri", 2003, "M. M. Keeravani"],
  ["Valliddari Madhya", "Gangotri", 2003, "M. M. Keeravani"],
  ["Nuvvunte Naa Jathagaa", "Arya", 2004, "Devi Sri Prasad"],
  ["Thakadimitaka", "Arya", 2004, "Devi Sri Prasad"],
  ["Gongura Thotakada", "Venky", 2004, "Devi Sri Prasad"],
  ["Shankar Dada MBBS", "Shankar Dada M.B.B.S.", 2004, "Devi Sri Prasad"],
  ["Kalalu Kane Kalalu", "7G Brindavan Colony", 2004, "Yuvan Shankar Raja"],
  ["Thalachi Thalachi", "7G Brindavan Colony", 2004, "Yuvan Shankar Raja"],
  ["Cheliya Cheliya", "Gharshana", 2004, "Harris Jayaraj"],
 
  // 2005 – 2009
  ["Neetho Cheppana", "Athadu", 2005, "Mani Sharma"],
  ["Pilla Gaali Allari", "Athadu", 2005, "Mani Sharma"],
  ["Niluvaddham Ninu Epudaina", "Nuvvostanante Nenoddantana", 2005, "Devi Sri Prasad"],
  ["Jagamanta Kutumbam Naadi", "Chakram", 2005, "Chakri"],
  ["Muvvala Navvakalaa", "Pournami", 2006, "Devi Sri Prasad"],
  ["Laloo Darwaja", "Bommarillu", 2006, "Devi Sri Prasad"],
  ["We Have a Romeo", "Bommarillu", 2006, "Devi Sri Prasad"],
  ["Nammaka Thappani", "Bommarillu", 2006, "Devi Sri Prasad"],
  ["Orugalluke Pilla", "Sainikudu", 2006, "Harris Jayaraj"],
  ["Andamaina Manasulo", "Godavari", 2006, "K. M. Radha Krishnan"],
  ["Rama Chakkani Seethaki", "Godavari", 2006, "K. M. Radha Krishnan"],
  ["Choododdhantunna", "Pokiri", 2006, "Mani Sharma"],
  ["Devudaa Devudaa", "Pokiri", 2006, "Mani Sharma"],
  ["Padhe Padhe", "Happy Days", 2007, "Mickey J. Meyer"],
  ["Ninne Ninne", "Desamuduru", 2007, "Chakri"],
  ["Nachore Nachore", "Yamadonga", 2007, "M. M. Keeravani"],
  ["Rubber Gajulu", "Yamadonga", 2007, "M. M. Keeravani"],
  ["Olammi Tikkareginda", "Yamadonga", 2007, "M. M. Keeravani"],
  ["Oka Chinni Navve", "Aadavari Matalaku Ardhalu Verule", 2007, "Yuvan Shankar Raja"],
  ["Enthavaraku", "Gamyam", 2008, "E. S. Murthy"],
  ["Hrudayam Ekkadunnadi", "Parugu", 2008, "Mani Sharma"],
  ["Nammavemo", "Parugu", 2008, "Mani Sharma"],
  ["Dil Kalaase", "Kick", 2009, "S. Thaman"],
  ["Gore Gore", "Kick", 2009, "S. Thaman"],
  ["Jorsey", "Magadheera", 2009, "M. M. Keeravani"],
  ["Anaganaga", "Magadheera", 2009, "M. M. Keeravani"],
  ["Baby He Loves You", "Arya 2", 2009, "Devi Sri Prasad"],
  ["Karige Loga", "Arya 2", 2009, "Devi Sri Prasad"],
 
  // 2010 – 2014
  ["Egiripothe Entha Baguntundi", "Vedam", 2010, "M. M. Keeravani"],
  ["Sada Siva Sanyasi", "Khaleja", 2010, "Mani Sharma"],
  ["Aaromale", "Ye Maaya Chesave", 2010, "A. R. Rahman"],
  ["Manasaa", "Ye Maaya Chesave", 2010, "A. R. Rahman"],
  ["Hello Rammante", "Orange", 2010, "Harris Jayaraj"],
  ["Guruvaram March Okati", "Dookudu", 2011, "S. Thaman"],
  ["Chulbuli", "Dookudu", 2011, "S. Thaman"],
  ["Niharika", "Oosaravelli", 2011, "Devi Sri Prasad"],
  ["Jagadananda Karaka", "Sri Rama Rajyam", 2011, "Ilaiyaraaja"],
  ["Sir Osthara", "Businessman", 2012, "S. Thaman"],
  ["Pilla Chao", "Businessman", 2012, "S. Thaman"],
  ["Pilla", "Gabbar Singh", 2012, "Devi Sri Prasad"],
  ["Mandu Babulam", "Gabbar Singh", 2012, "Devi Sri Prasad"],
  ["Vaana Vaana Velluvaye", "Racha", 2012, "Mani Sharma"],
  ["Chakkani Bike Undi", "Julayi", 2012, "Devi Sri Prasad"],
  ["Sutiga Choodaku", "Ishq", 2012, "Anup Rubens"],
  ["Melikalu Thirige", "Cameraman Gangatho Rambabu", 2012, "Mani Sharma"],
  ["Laila O Laila", "Naayak", 2013, "S. Thaman"],
  ["Inka Cheppale", "Seethamma Vakitlo Sirimalle Chettu", 2013, "Mickey J. Meyer"],
  ["It's Time to Party", "Attarintiki Daredi", 2013, "Devi Sri Prasad"],
  ["Kirraaku", "Attarintiki Daredi", 2013, "Devi Sri Prasad"],
  ["Jabilli Nuvve Cheppamma", "Ramayya Vasthavayya", 2013, "S. Thaman"],
  ["Banthi Poola Janaki", "Baadshah", 2013, "S. Thaman"],
  ["Diamond Girl", "Baadshah", 2013, "S. Thaman"],
  ["Top Lesi Poddi", "Iddarammayilatho", 2013, "Devi Sri Prasad"],
  ["Violin Song", "Iddarammayilatho", 2013, "Devi Sri Prasad"],
  ["Boochade Boochade", "Race Gurram", 2014, "S. Thaman"],
  ["Piyo Piyo Re", "Manam", 2014, "Anup Rubens"],
  ["Chinni Chinni Aasalu", "Manam", 2014, "Anup Rubens"],
 
  // 2015 – 2019
  ["Super Machi", "S/O Satyamurthy", 2015, "Devi Sri Prasad"],
  ["Seethakalam", "S/O Satyamurthy", 2015, "Devi Sri Prasad"],
  ["Jaago", "Srimanthudu", 2015, "Devi Sri Prasad"],
  ["Ramma Ramma", "Srimanthudu", 2015, "Devi Sri Prasad"],
  ["Mamatala Talli", "Baahubali: The Beginning", 2015, "M. M. Keeravani"],
  ["Bhale Bhale Magadivoy", "Bhale Bhale Magadivoy", 2015, "Gopi Sundar"],
  ["Ra Mundadugeddam", "Kanche", 2015, "Chirrantan Bhatt"],
  ["Dikka Dikka Dum Dum", "Soggade Chinni Nayana", 2016, "Anup Rubens"],
  ["Follow Follow", "Nannaku Prematho", 2016, "Devi Sri Prasad"],
  ["Love Me Again", "Nannaku Prematho", 2016, "Devi Sri Prasad"],
  ["Athiloka Sundari", "Sarrainodu", 2016, "S. Thaman"],
  ["Telusa Telusa", "Sarrainodu", 2016, "S. Thaman"],
  ["Rang De", "A Aa", 2016, "Mickey J. Meyer"],
  ["Anasuya Kosam", "A Aa", 2016, "Mickey J. Meyer"],
  ["Rock On Bro", "Janatha Garage", 2016, "Devi Sri Prasad"],
  ["Evare", "Premam", 2016, "Rajesh Murugesan"],
  ["Pareshanura", "Dhruva", 2016, "Hiphop Tamizha"],
  ["Ratthaalu", "Khaidi No. 150", 2017, "Devi Sri Prasad"],
  ["Unnattundi Gundey", "Ninnu Kori", 2017, "Gopi Sundar"],
  ["Telisiney Na Nuvvey", "Arjun Reddy", 2017, "Radhan"],
  ["Swing Zara", "Jai Lava Kusa", 2017, "Devi Sri Prasad"],
  ["Raavana", "Jai Lava Kusa", 2017, "Devi Sri Prasad"],
  ["Boom Boom", "Spyder", 2017, "Harris Jayaraj"],
  ["Merise Merise", "Hello", 2017, "Anup Rubens"],
  ["Gaali Vaaluga", "Agnyaathavaasi", 2018, "Anirudh Ravichander"],
  ["Baitikochi Chooste", "Agnyaathavaasi", 2018, "Anirudh Ravichander"],
  ["Allasani Vaari", "Tholi Prema", 2018, "S. Thaman"],
  ["Choosi Choodangaane", "Chalo", 2018, "Mahati Swara Sagar"],
  ["Aa Gattununtaava", "Rangasthalam", 2018, "Devi Sri Prasad"],
  ["Vasumathi", "Bharat Ane Nenu", 2018, "Devi Sri Prasad"],
  ["Sada Nannu", "Mahanati", 2018, "Mickey J. Meyer"],
  ["What the Life", "Geetha Govindam", 2018, "Gopi Sundar"],
  ["Reddy Ikkada Soodu", "Aravinda Sametha Veera Raghava", 2018, "S. Thaman"],
  ["Padi Padi Leche Manasu", "Padi Padi Leche Manasu", 2018, "Vishal Chandrashekhar"],
  ["Yedetthu Mallele", "Majili", 2019, "Gopi Sundar"],
  ["Choti Choti Baatein", "Maharshi", 2019, "Devi Sri Prasad"],
  ["Nuvve Samastham", "Maharshi", 2019, "Devi Sri Prasad"],
  ["Giraa Giraa", "Dear Comrade", 2019, "Justin Prabhakaran"],
  ["Elluvochi Godaramma", "Gaddalakonda Ganesh", 2019, "Mickey J. Meyer"],
  ["Sye Raa Title Song", "Sye Raa Narasimha Reddy", 2019, "Amit Trivedi", ["Sye Raa"]],
  ["O Bava", "Prati Roju Pandage", 2019, "S. Thaman"],
 
  // 2020 – 2022
  ["Ala Vaikunthapurramuloo", "Ala Vaikunthapurramuloo", 2020, "S. Thaman"],
  ["Suryudivo Chandrudivo", "Sarileru Neekevvaru", 2020, "Devi Sri Prasad"],
  ["Daang Daang", "Sarileru Neekevvaru", 2020, "Devi Sri Prasad"],
  ["Singles Anthem", "Bheeshma", 2020, "Mahati Swara Sagar"],
  ["Ranguladdhukunna", "Uppena", 2021, "Devi Sri Prasad"],
  ["Nee Chitram Choosi", "Love Story", 2021, "Pawan Ch"],
  ["Daakko Daakko Meka", "Pushpa: The Rise", 2021, "Devi Sri Prasad"],
  ["Kanti Papa", "Vakeel Saab", 2021, "S. Thaman"],
  ["Satyameva Jayathe", "Vakeel Saab", 2021, "S. Thaman"],
  ["Pranavalaya", "Shyam Singha Roy", 2021, "Mickey J. Meyer"],
  ["Sirivennela", "Shyam Singha Roy", 2021, "Mickey J. Meyer"],
  ["Leharaayi", "Most Eligible Bachelor", 2021, "Gopi Sundar"],
  ["Etthara Jenda", "RRR", 2022, "M. M. Keeravani"],
  ["Janani", "RRR", 2022, "M. M. Keeravani"],
  ["Adavi Thalli Maata", "Bheemla Nayak", 2022, "S. Thaman"],
  ["Antha Ishtam", "Bheemla Nayak", 2022, "S. Thaman"],
  ["Ee Raathale", "Radhe Shyam", 2022, "Justin Prabhakaran"],
  ["Ma Ma Mahesha", "Sarkaru Vaari Paata", 2022, "S. Thaman"],
  ["Kaanunna Kalyanam", "Sita Ramam", 2022, "Vishal Chandrashekhar"],
  ["Hrudayama", "Major", 2022, "Sricharan Pakala"],
  ["Thaar Maar Thakkar Maar", "Godfather", 2022, "S. Thaman"],
  ["Laahe Laahe", "Acharya", 2022, "Mani Sharma"],
  ["Neelambari", "Acharya", 2022, "Mani Sharma"],
  ["Time Ivvu Pilla", "18 Pages", 2022, "Gopi Sundar"],
 
  // 2023 – 2025
  ["Suguna Sundari", "Veera Simha Reddy", 2023, "S. Thaman"],
  ["Maa Bava Manobhavalu", "Veera Simha Reddy", 2023, "S. Thaman"],
  ["Ori Vaari", "Dasara", 2023, "Santhosh Narayanan"],
  ["Kushi Title Song", "Kushi", 2023, "Hesham Abdul Wahab"],
  ["Premisthunna", "Baby", 2023, "Vijai Bulganin"],
  ["Jai Shri Ram", "Adipurush", 2023, "Ajay–Atul"],
  ["Ram Sita Ram", "Adipurush", 2023, "Sachet–Parampara"],
  ["Gaaju Bomma", "Hi Nanna", 2023, "Hesham Abdul Wahab"],
  ["Oh My Baby", "Guntur Kaaram", 2024, "S. Thaman"],
  ["Radhika", "Tillu Square", 2024, "Ram Miriyala"],
  ["Nandanandanaa", "Family Star", 2024, "Gopi Sundar"],
  ["Daavudi", "Devara: Part 1", 2024, "Anirudh Ravichander"],
  ["Ayudha Pooja", "Devara: Part 1", 2024, "Anirudh Ravichander"],
  ["Dhop", "Game Changer", 2025, "S. Thaman"],
  ["Raa Macha Macha", "Game Changer", 2025, "S. Thaman"],
  ["Meenu", "Sankranthiki Vasthunam", 2025, "Bheems Ceciroleo"],
  ["Blockbuster Pongal", "Sankranthiki Vasthunam", 2025, "Bheems Ceciroleo"],
  ["Hilesso Hilessa", "Thandel", 2025, "Devi Sri Prasad"],
  ["Maata Vinaali", "Hari Hara Veera Mallu", 2025, "M. M. Keeravani"],
  ["Suvvi Suvvi", "They Call Him OG", 2025, "S. Thaman"],
];

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function defineSongs(rows) {
  const list = rows.map(([title, movie, year, composer, aliases = []]) => ({
    id: slug(`${title}-${movie}`),
    title,
    movie,
    year,
    composer,
    aliases,
  }));
  if (process.env.NODE_ENV !== "production") {
    const seen = new Set();
    for (const song of list) {
      if (!song.title || !song.movie) console.warn(`[songs] Song "${song.id}" is missing a title or movie.`);
      if (seen.has(song.id)) console.warn(`[songs] Duplicate song id "${song.id}".`);
      seen.add(song.id);
    }
  }
  return Object.freeze(list.map((song) => Object.freeze(song)));
}

export const SONGS = defineSongs(RAW);

const SONGS_BY_ID = new Map(SONGS.map((song) => [song.id, song]));

export const SONG_IDS = SONGS.map((song) => song.id);

export function getSongById(id) {
  return SONGS_BY_ID.get(id) ?? null;
}

/** The hidden text teams uncover letter by letter: the song title. */
export function getPuzzleLines(song) {
  return song ? [song.title] : [];
}

const words = (text) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/**
 * Clues shown while the title is hidden. The movie is left out when it shares
 * a word with the title (e.g. "Nee Dookudu" from "Dookudu"), since it would give
 * that word away.
 *
 * @returns {{ movie: string | null, year: number | null, composer: string | null }}
 */
export function getClues(song) {
  if (!song) return { movie: null, year: null, composer: null };
  const titleWords = new Set(words(song.title).filter((w) => w.length >= 3));
  const givesAway = words(song.movie).some((w) => titleWords.has(w));
  return { movie: givesAway ? null : song.movie, year: song.year ?? null, composer: song.composer ?? null };
}
