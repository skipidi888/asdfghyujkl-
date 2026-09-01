/* === Disaster Prep Hub — Data === */
window.DPH_DATA = (function(){
  // Coordinates of countries for label rendering
  const COUNTRY_LABELS = [
    {country:'USA', lat:39.5, lon:-98.5},
    {country:'Japan', lat:36.2, lon:138.3},
    {country:'Indonesia', lat:-0.8, lon:113.9},
    {country:'Philippines', lat:12.9, lon:121.8},
    {country:'India', lat:20.6, lon:78.9},
    {country:'China', lat:35.9, lon:104.2},
    {country:'Australia', lat:-25.3, lon:133.8},
    {country:'Brazil', lat:-14.2, lon:-51.9},
    {country:'Mexico', lat:23.6, lon:-102.5},
    {country:'Turkey', lat:38.9, lon:35.2},
    {country:'Iran', lat:32.4, lon:53.7},
    {country:'Pakistan', lat:30.4, lon:69.3},
    {country:'Nepal', lat:28.4, lon:84.1},
    {country:'Chile', lat:-35.7, lon:-71.5},
    {country:'Italy', lat:41.9, lon:12.6},
    {country:'Iceland', lat:64.9, lon:-19.0},
    {country:'New Zealand', lat:-40.9, lon:174.9},
    {country:'Russia', lat:61.5, lon:105.3},
    {country:'Somalia', lat:5.2, lon:46.2},
    {country:'Ukraine', lat:48.4, lon:31.2},
    {country:'Puerto Rico', lat:18.2, lon:-66.6},
    {country:'Germany', lat:51.2, lon:10.5},
    {country:'Haiti', lat:18.9, lon:-72.3},
    {country:'Bangladesh', lat:23.7, lon:90.4},
    {country:'Vietnam', lat:14.1, lon:108.3},
    {country:'Argentina', lat:-38.4, lon:-63.6},
    {country:'Colombia', lat:4.6, lon:-74.3},
    {country:'Peru', lat:-9.2, lon:-75.0},
    {country:'South Africa', lat:-30.6, lon:22.9},
    {country:'Algeria', lat:28.0, lon:1.7},
    {country:'Mozambique', lat:-18.7, lon:35.5},
    {country:'Libya', lat:26.3, lon:17.2},
    {country:'Taiwan', lat:23.7, lon:121.0},
    {country:'Tonga', lat:-21.2, lon:-175.2}
  ];

  const CONTINENT_LABELS = [
    {continent:'North America', lat:48, lon:-100},
    {continent:'South America', lat:-15, lon:-60},
    {continent:'Europe', lat:54, lon:15},
    {continent:'Africa', lat:0, lon:20},
    {continent:'Asia', lat:42, lon:90},
    {continent:'Australia/Oceania', lat:-25, lon:140}
  ];

  const HAZARDS = {
    earthquake: {
      id:'earthquake', name:'Earthquake', icon:'🌋',
      type:'Geological', baseSeverity:3,
      color:'#FF4757',
      events: [
        { id:'eq-japan', country:'Japan', region:'Honshu', lat:38.3, lon:142.4, year:2011, magnitude:9.1,
          history:'2011 Tōhoku Earthquake triggered massive tsunami and Fukushima nuclear disaster.',
          profile:{severity:3,population:'20M affected',cascading:'Tsunami + Nuclear'}
        },
        { id:'eq-nepal', country:'Nepal', region:'Kathmandu Valley', lat:28.1, lon:84.7, year:2015, magnitude:7.8,
          history:'2015 Gorkha earthquake caused 8,000+ deaths and widespread avalanches on Everest.',
          profile:{severity:3,population:'8M affected',cascading:'Avalanche + Landslide'}
        },
        { id:'eq-turkey', country:'Turkey', region:'Kahramanmaraş', lat:37.2, lon:37.0, year:2023, magnitude:7.8,
          history:'2023 Turkey–Syria earthquake: 59,000 deaths, multi-building collapses.',
          profile:{severity:3,population:'9M displaced',cascading:'Building failure'}
        },
        { id:'eq-haiti', country:'Haiti', region:'Port-au-Prince', lat:18.5, lon:-72.4, year:2010, magnitude:7.0,
          history:'2010 Haiti earthquake killed 200,000+; 1.5M displaced.',
          profile:{severity:3,population:'3M displaced',cascading:'Building collapse'}
        },
        { id:'eq-chile', country:'Chile', region:'Valdivia', lat:-39.8, lon:-73.2, year:1960, magnitude:9.5,
          history:'Largest earthquake ever recorded. Triggered Pacific-wide tsunami.',
          profile:{severity:3,population:'2M affected',cascading:'Mega-tsunami'}
        },
        { id:'eq-italy', country:'Italy', region:'L\'Aquila', lat:42.4, lon:13.4, year:2009, magnitude:6.3,
          history:'2009 L\'Aquila earthquake destroyed medieval city center.',
          profile:{severity:2,population:'65k displaced',cascading:'Heritage loss'}
        }
      ]
    },
    tsunami: {
      id:'tsunami', name:'Tsunami / Tidal Wave', icon:'🌊',
      type:'Hydrological', baseSeverity:3,
      color:'#00E5FF',
      events:[
        { id:'ts-japan', country:'Japan', region:'Tōhoku Coast', lat:38.0, lon:142.5, year:2011,
          history:'40m wave run-up after 9.1 quake; 18,000 deaths.',
          profile:{severity:3,population:'500k evacuated',cascading:'Nuclear meltdown'}
        },
        { id:'ts-indonesia', country:'Indonesia', region:'Sumatra', lat:3.3, lon:95.8, year:2004,
          history:'Indian Ocean tsunami — 230,000 deaths across 14 countries.',
          profile:{severity:3,population:'1.7M displaced',cascading:'Multi-national'}
        },
        { id:'ts-chile', country:'Chile', region:'Valparaíso', lat:-33.0, lon:-71.6, year:2010,
          history:'8.8 quake triggered tsunami across Pacific; reached Japan 22 hours later.',
          profile:{severity:2,population:'900k evacuated',cascading:'Pacific-wide'}
        }
      ]
    },
    typhoon: {
      id:'typhoon', name:'Typhoon', icon:'🌀',
      type:'Meteorological', baseSeverity:3,
      color:'#FFB300',
      events:[
        { id:'tp-philippines', country:'Philippines', region:'Visayas', lat:11.0, lon:125.0, year:2013,
          history:'Haiyan — 195mph sustained winds, 6,300 deaths.',
          profile:{severity:3,population:'14M affected',cascading:'Storm surge'}
        },
        { id:'tp-japan', country:'Japan', region:'Okinawa', lat:26.3, lon:127.7, year:2018,
          history:'Jebi — strongest typhoon to hit Japan in 25 years.',
          profile:{severity:2,population:'3M evacuated',cascading:'Flood + Wind'}
        },
        { id:'tp-vietnam', country:'Vietnam', region:'Central Coast', lat:15.0, lon:108.5, year:2020,
          history:'Molave + Goni back-to-back — worst typhoon season in decades.',
          profile:{severity:3,population:'7M evacuated',cascading:'Landslide'}
        },
        { id:'tp-taiwan', country:'Taiwan', region:'Kaohsiung', lat:22.6, lon:120.3, year:2009,
          history:'Typhoon Morakot dropped 3m of rain in days — worst flooding in 50 years.',
          profile:{severity:3,population:'700 deaths',cascading:'Mountain village burial'}
        }
      ]
    },
    fire: {
      id:'fire', name:'Wildfire', icon:'🔥',
      type:'Climatological', baseSeverity:2,
      color:'#FF6B35',
      events:[
        { id:'wf-usa', country:'USA', region:'California', lat:38.6, lon:-121.5, year:2020,
          history:'2020 wildfire season — 4M acres burned, 10,000 structures destroyed.',
          profile:{severity:3,population:'100k evacuated',cascading:'Air quality crisis'}
        },
        { id:'wf-aus', country:'Australia', region:'NSW', lat:-33.0, lon:150.0, year:2019,
          history:'Black Summer fires — 18.6M hectares, 3 billion animals affected.',
          profile:{severity:3,population:'50k displaced',cascading:'Smoke haze'}
        },
        { id:'wf-greece', country:'Greece', region:'Attica', lat:38.0, lon:23.7, year:2021,
          history:'Worst fires in 30 years — 100,000 hectares burned.',
          profile:{severity:2,population:'20k evacuated',cascading:'Heatwave'}
        },
        { id:'wf-algeria', country:'Algeria', region:'Kabylie', lat:36.7, lon:4.3, year:2021,
          history:'Kabylie wildfires — 90+ deaths in a single week amid record heat.',
          profile:{severity:3,population:'100k affected',cascading:'Heatwave + Power loss'}
        }
      ]
    },
    hurricane: {
      id:'hurricane', name:'Hurricane', icon:'🌀',
      type:'Meteorological', baseSeverity:3,
      color:'#C77DFF',
      events:[
        { id:'hu-usa', country:'USA', region:'Gulf Coast', lat:29.7, lon:-94.0, year:2017,
          history:'Harvey — 60 inches of rain, $125B damage.',
          profile:{severity:3,population:'6M displaced',cascading:'Catastrophic flooding'}
        },
        { id:'hu-puerto', country:'Puerto Rico', region:'San Juan', lat:18.4, lon:-66.1, year:2017,
          history:'Maria — island-wide blackout for months, 3,000 deaths.',
          profile:{severity:3,population:'3.4M affected',cascading:'Infrastructure collapse'}
        },
        { id:'hu-mexico', country:'Mexico', region:'Yucatán', lat:21.0, lon:-86.0, year:2020,
          history:'Delta — rapid intensification to Cat 4 before landfall.',
          profile:{severity:2,population:'300k evacuated',cascading:'Storm surge'}
        },
        { id:'hu-mozambique', country:'Mozambique', region:'Beira', lat:-19.8, lon:34.8, year:2019,
          history:'Cyclone Idai — one of the worst storms on record to hit Africa; whole city flattened.',
          profile:{severity:3,population:'3M affected',cascading:'Cholera outbreak'}
        }
      ]
    },
    flashflood: {
      id:'flashflood', name:'Flood', icon:'⛈',
      type:'Hydrological', baseSeverity:2,
      color:'#00B4D8',
      events:[
        { id:'ff-germany', country:'Germany', region:'Ahr Valley', lat:50.5, lon:7.1, year:2021,
          history:'2021 European floods — 200+ deaths, villages destroyed.',
          profile:{severity:3,population:'200k affected',cascading:'Mudslides'}
        },
        { id:'ff-pakistan', country:'Pakistan', region:'Sindh', lat:25.0, lon:68.0, year:2022,
          history:'Monsoon floods — 1,700 deaths, 33M displaced.',
          profile:{severity:3,population:'33M affected',cascading:'Disease outbreak'}
        },
        { id:'ff-bangladesh', country:'Bangladesh', region:'Dhaka', lat:23.8, lon:90.4, year:2020,
          history:'Half of Dhaka flooded; 1/3 of country underwater.',
          profile:{severity:3,population:'4M displaced',cascading:'Waterborne disease'}
        },
        { id:'ff-libya', country:'Libya', region:'Derna', lat:32.77, lon:22.64, year:2023,
          history:'Storm Daniel burst two dams; a quarter of the city was swept into the sea overnight.',
          profile:{severity:3,population:'11k+ deaths',cascading:'Dam failure'}
        }
      ]
    },
    volcano: {
      id:'volcano', name:'Volcanic Eruption', icon:'🌋',
      type:'Geological', baseSeverity:3,
      color:'#FF2E9A',
      events:[
        { id:'vo-iceland', country:'Iceland', region:'Reykjanes', lat:63.9, lon:-22.4, year:2010,
          history:'Eyjafjallajökull — ash cloud grounded European flights for weeks.',
          profile:{severity:2,population:'500k stranded',cascading:'Aviation shutdown'}
        },
        { id:'vo-indonesia', country:'Indonesia', region:'Java', lat:-7.5, lon:110.4, year:2010,
          history:'Merapi — pyroclastic flows killed 350+.',
          profile:{severity:3,population:'400k evacuated',cascading:'Lahars'}
        },
        { id:'vo-philippines', country:'Philippines', region:'Luzon', lat:14.0, lon:120.9, year:1991,
          history:'Pinatubo — second-largest eruption in 20th century.',
          profile:{severity:3,population:'2M evacuated',cascading:'Global cooling'}
        },
        { id:'vo-tonga', country:'Tonga', region:'Hunga Tonga', lat:-20.5, lon:-175.4, year:2022,
          history:'Underwater eruption sent a shockwave around the planet and triggered tsunamis across the Pacific.',
          profile:{severity:3,population:'84k affected',cascading:'Pacific-wide tsunami'}
        }
      ]
    },
    lightning: {
      id:'lightning', name:'Lightning Storm', icon:'⚡',
      type:'Meteorological', baseSeverity:1,
      color:'#FFD60A',
      events:[
        { id:'li-india', country:'India', region:'Bihar', lat:25.6, lon:85.1, year:2021,
          history:'Single day — 36 deaths from lightning strikes.',
          profile:{severity:1,population:'rural villages',cascading:'Power outage'}
        },
        { id:'li-usa', country:'USA', region:'Florida', lat:28.5, lon:-82.0, year:2022,
          history:'Lightning capital of N. America — 100+ strikes/sq mi annually.',
          profile:{severity:1,population:'seasonal',cascading:'Wildfire ignition'}
        }
      ]
    },
    tornado: {
      id:'tornado', name:'Tornado', icon:'🌪',
      type:'Meteorological', baseSeverity:3,
      color:'#7209B7',
      events:[
        { id:'to-usa', country:'USA', region:'Oklahoma', lat:35.5, lon:-97.5, year:2013,
          history:'Moore EF5 — 24 deaths, winds 210mph.',
          profile:{severity:3,population:'13k displaced',cascading:'Hail damage'}
        },
        { id:'to-usa2', country:'USA', region:'Joplin, MO', lat:37.0, lon:-94.5, year:2011,
          history:'Joplin EF5 — 158 deaths, $2.8B damage.',
          profile:{severity:3,population:'50% city destroyed',cascading:'Storm surge'}
        },
        { id:'to-bangladesh', country:'Bangladesh', region:'Daulatpur', lat:25.0, lon:88.5, year:1989,
          history:'Deadliest tornado in history — 1,300 deaths.',
          profile:{severity:3,population:'12k injured',cascading:'Mass casualty'}
        }
      ]
    },
    nuclear: {
      id:'nuclear', name:'Nuclear Incident', icon:'☢',
      type:'Technological', baseSeverity:3,
      color:'#39FF14',
      events:[
        { id:'nu-japan', country:'Japan', region:'Fukushima', lat:37.5, lon:141.0, year:2011,
          history:'Reactor meltdown after tsunami — 154,000 evacuated.',
          profile:{severity:3,population:'154k evacuated',cascading:'Radiation exposure'}
        },
        { id:'nu-ukraine', country:'Ukraine', region:'Chernobyl', lat:51.4, lon:30.1, year:1986,
          history:'Reactor explosion — 31 immediate deaths, long-term cancer spike.',
          profile:{severity:3,population:'350k evacuated',cascading:'Long-term contamination'}
        }
      ]
    },
    chemical: {
      id:'chemical', name:'Chemical Spill / Hazmat', icon:'🧪',
      type:'Technological', baseSeverity:2,
      color:'#9D4EDD',
      events:[
        { id:'ch-india', country:'India', region:'Bhopal', lat:23.3, lon:77.4, year:1984,
          history:'Union Carbide — 3,800 immediate deaths, 500k+ exposed.',
          profile:{severity:3,population:'500k exposed',cascading:'Long-term illness'}
        },
        { id:'ch-usa', country:'USA', region:'West Virginia', lat:38.4, lon:-81.6, year:2014,
          history:'Coal slurry spill — 300,000 residents without water.',
          profile:{severity:2,population:'300k affected',cascading:'Water crisis'}
        }
      ]
    },
    landslide: {
      id:'landslide', name:'Landslide', icon:'⛰',
      type:'Geological', baseSeverity:2,
      color:'#A0522D',
      events:[
        { id:'ls-brazil', country:'Brazil', region:'Petrópolis', lat:-22.5, lon:-43.2, year:2022,
          history:'Record rainfall — 200+ deaths, hundreds buried.',
          profile:{severity:3,population:'5k displaced',cascading:'Flash flood'}
        },
        { id:'ls-usa', country:'USA', region:'Washington', lat:48.0, lon:-122.0, year:2014,
          history:'Oso slide — 43 deaths, hillside collapsed.',
          profile:{severity:3,population:'30 homes lost',cascading:'River blockage'}
        },
        { id:'ls-colombia', country:'Colombia', region:'Mocoa', lat:1.2, lon:-76.6, year:2017,
          history:'Flash flood + landslide — 250+ deaths overnight.',
          profile:{severity:3,population:'50k affected',cascading:'Mass burial'}
        }
      ]
    },
    heatwave: {
      id:'heatwave', name:'Heatwave', icon:'🌡',
      type:'Climatological', baseSeverity:2,
      color:'#FF4500',
      events:[
        { id:'hw-europe', country:'Europe', region:'Western EU', lat:48.0, lon:7.0, year:2003,
          history:'70,000 deaths across Europe, hottest summer on record.',
          profile:{severity:3,population:'70k deaths',cascading:'Wildfires + Drought'}
        },
        { id:'hw-india', country:'India', region:'North', lat:28.6, lon:77.2, year:2015,
          history:'2,500 deaths, roads melted in 47°C heat.',
          profile:{severity:3,population:'2.5k deaths',cascading:'Power grid failure'}
        },
        { id:'hw-canada', country:'Canada', region:'BC', lat:49.3, lon:-123.1, year:2021,
          history:'Lytton broke 49.6°C record then burned day later.',
          profile:{severity:3,population:'500 evacuated',cascading:'Wildfire'}
        }
      ]
    },
    drought: {
      id:'drought', name:'Drought', icon:'🏜',
      type:'Climatological', baseSeverity:2,
      color:'#CD853F',
      events:[
        { id:'dr-horn', country:'Somalia', region:'Horn of Africa', lat:2.0, lon:45.0, year:2022,
          history:'Five failed rainy seasons — 20M facing hunger.',
          profile:{severity:3,population:'20M at risk',cascading:'Famine'}
        },
        { id:'dr-usa', country:'USA', region:'Southwest', lat:34.0, lon:-110.0, year:2021,
          history:'Lake Mead hits record low — 25M rely on its water.',
          profile:{severity:3,population:'25M affected',cascading:'Water rationing'}
        },
        { id:'dr-safrica', country:'South Africa', region:'Cape Town', lat:-33.9, lon:18.4, year:2018,
          history:'"Day Zero" crisis — city came within weeks of shutting off municipal taps entirely.',
          profile:{severity:2,population:'4M residents',cascading:'Agricultural collapse'}
        }
      ]
    },
    cyclone: {
      id:'cyclone', name:'Cyclone', icon:'🌀',
      type:'Meteorological', baseSeverity:3,
      color:'#48CAE4',
      events:[
        { id:'cy-mozambique', country:'Mozambique', region:'Beira Coast', lat:-19.8, lon:34.8, year:2019,
          history:'Cyclone Idai brought destructive winds, storm surge and catastrophic flooding to southeast Africa.',
          profile:{severity:3,population:'3M affected',cascading:'Storm surge + Flood'}
        }
      ]
    },
    blizzard: {
      id:'blizzard', name:'Blizzard', icon:'❄',
      type:'Meteorological', baseSeverity:2,
      color:'#90E0EF',
      events:[
        { id:'bz-usa', country:'USA', region:'Great Lakes', lat:43.0, lon:-84.0, year:2022,
          history:'A major lake-effect blizzard stranded travelers, closed roads and caused widespread power loss.',
          profile:{severity:2,population:'1M affected',cascading:'Power outage + Cold exposure'}
        }
      ]
    },
    geomagnetic: {
      id:'geomagnetic', name:'Geomagnetic Storm', icon:'✦',
      type:'Space Weather', baseSeverity:2,
      color:'#72EFDD',
      events:[
        { id:'gm-norway', country:'Norway', region:'Tromsø', lat:69.6, lon:18.9, year:2024,
          history:'A severe solar storm expanded aurora activity and threatened satellite, radio and grid systems.',
          profile:{severity:2,population:'Global infrastructure',cascading:'GPS + Grid disruption'}
        }
      ]
    },
    glacial: {
      id:'glacial', name:'Glacial Collapse', icon:'🧊',
      type:'Cryospheric', baseSeverity:3,
      color:'#ADE8F4',
      events:[
        { id:'gc-iceland', country:'Iceland', region:'Vatnajökull', lat:64.4, lon:-16.8, year:2024,
          history:'Rapid ice and slope failure can release destructive debris and floodwater with little warning.',
          profile:{severity:3,population:'Downstream settlements',cascading:'Flash flood + Debris flow'}
        }
      ]
    },
    sandstorm: {
      id:'sandstorm', name:'Sandstorm', icon:'🌫',
      type:'Climatological', baseSeverity:2,
      color:'#F4A261',
      events:[
        { id:'ss-algeria', country:'Algeria', region:'Sahara', lat:27.0, lon:2.0, year:2023,
          history:'A dense Saharan dust storm cut visibility, disrupted aviation and degraded air quality across the region.',
          profile:{severity:2,population:'Regional exposure',cascading:'Transport + Air quality'}
        }
      ]
    }
  };

  // 3-Phase action plans per hazard (expanded with timing + tips)
  const PLANS = {
    earthquake:{
      pre:['Secure heavy furniture to walls','Stock 3-day water+food kit','Identify safe spots (under table, against bearing wall)','Practice drop-cover-hold drills','Know utility shutoff locations'],
      during:['DROP to hands and knees','COVER head + neck under sturdy desk','HOLD ON until shaking stops','Stay inside — most injuries from falling debris outside','Stay away from windows + mirrors'],
      post:['Expect aftershocks for hours/days','Check for gas leaks + structural damage','Use stairs, never elevators','Tune to emergency broadcasts','Help neighbors with mobility issues']
    },
    tsunami:{
      pre:['Know evacuation routes + high ground','Pack go-bag near front door','Sign up for local tsunami alerts','Plan reunion spot inland','Map multiple inland routes'],
      during:['Move to high ground immediately — 100ft+ elevation or 1mi inland','NO coastal evacuation by car if traffic heavy','Grab go-bag only','Stay away until official all-clear','Help children + elderly first'],
      post:['Avoid floodwater — contamination risk','Check structural damage before re-entering','Document damage for insurance','Help neighbors, especially elderly','Watch for disease outbreaks']
    },
    typhoon:{
      pre:['Board up windows','Fill bathtubs + containers with water','Charge devices + fill gas tank','Trim loose tree branches','Stock 7-day non-perishable food'],
      during:['Stay indoors, away from windows','Go to interior room on lowest floor','Do NOT go outside during eye — winds return','Monitor radio for updates','Keep phone charged for emergency calls'],
      post:['Watch for downed power lines + flooding','Avoid damaged buildings','Document damage before cleanup','Boil water until safe','Check roof + structure before re-entry']
    },
    fire:{
      pre:['Create 30ft defensible space','Clear roof + gutters of debris','Pack evacuation go-bag','Plan multiple escape routes','Set up N95 masks ready'],
      during:['Evacuate early — don\'t wait for official order','Close all doors + windows','Wear mask + long sleeves','Drive with headlights on','Don\'t return for belongings'],
      post:['Don\'t return until fire dept clears','Watch for hotspots','Document damage','Watch for air quality issues','Help displaced neighbors']
    },
    hurricane:{
      pre:['Hurricane shutters or plywood over windows','Stock 7-day supplies','Fill gas + cash ATMs','Move valuables to higher floor','Review insurance coverage'],
      during:['Shelter in interior room','Stay in strongest part of structure','Avoid windows','Monitor NOAA weather radio','Stay in place during eye — winds return'],
      post:['Don\'t go outside during eye','Avoid floodwater — contains snakes + debris','Check for gas leaks','Document everything','Watch for mold in walls']
    },
    flashflood:{
      pre:['Know flood-prone areas','Move valuables + electronics up','Sandbag doorways','Plan evacuation route','Get flood insurance — 30-day wait'],
      during:['Get to high ground immediately','Never walk or drive through moving water','6 inches of water can knock you down','12 inches sweeps vehicle away','Turn around, don\'t drown'],
      post:['Avoid floodwater — it\'s contaminated','Check structural integrity','Clean + disinfect everything','Watch for mold','Document damage for FEMA']
    },
    volcano:{
      pre:['Know evacuation routes + shelters','Stock N95 masks + goggles','Seal windows/doors','Plan for ashfall','Keep vehicles fueled'],
      during:['Evacuate if ordered','Shelter indoors from ash','Avoid low areas (lahars)','Wear mask + long sleeves outside','Close all ventilation'],
      post:['Stay indoors until ash clears','Clean roof of ash — heavy load collapses','Avoid contaminated water','Don\'t return until cleared','Watch for lahars after rain']
    },
    lightning:{
      pre:['Check weather forecast','Cancel outdoor activities if storms predicted','Install lightning rods','Identify safe shelters','Have surge protectors on electronics'],
      during:['Seek substantial shelter (building/hard-top car)','Avoid open fields + tall objects','Crouch low if caught outside','Stay away from metal','Wait 30min after last thunder'],
      post:['Call 911 for strikes on/near people','Treat burns + check for cardiac arrest','Wait 30min after last thunder','Document damage','Check electrical systems']
    },
    tornado:{
      pre:['Identify storm shelter or interior room','Practice drills','Trim trees near home','Stock emergency supplies','Helmet ready for shelter'],
      during:['Go to basement or interior room on lowest floor','Cover head with arms + mattress','Don\'t try to outrun in car','Stay away from windows','Shoes on for debris'],
      post:['Watch for damaged power lines','Avoid broken glass + debris','Check gas leaks','Help injured neighbors','Document damage']
    },
    nuclear:{
      pre:['Know evacuation routes','Stock KI (potassium iodide)','Seal windows/doors with plastic','Plan family communication','Practice shelter-in-place'],
      during:['Shelter in place or evacuate as ordered','Close all vents','Seal gaps with wet towels','Take KI if ordered','Stay tuned to official channels'],
      post:['Decontaminate before entering shelter','Discard outside clothing','Shower thoroughly','Wait for official all-clear','Long-term: monitor health']
    },
    chemical:{
      pre:['Know hazmat locations nearby','Seal windows/doors with plastic','Stock N95 + goggles','Plan evacuation route upwind','Identify shelter-in-place room'],
      during:['Shelter in place with sealed room','Turn off HVAC','Move to highest floor (most chemicals sink)','Listen to emergency broadcasts','Avoid contaminated areas'],
      post:['Decontaminate before re-entering building','Discard exposed clothing','Seek medical attention','Document exposure','Watch for delayed symptoms']
    },
    landslide:{
      pre:['Don\'t build on slopes','Plant ground cover','Build retaining walls','Know warning signs (cracks, leaning trees)','Plan evacuation route'],
      during:['Evacuate if you hear rumbling or see cracks','Move to high ground','Stay alert for falling debris','Take go-bag','Don\'t cross unstable ground'],
      post:['Avoid slide area','Watch for flooding','Check structural damage','Report new cracks/movement','Replant vegetation to stabilize']
    },
    heatwave:{
      pre:['Service AC units','Stock electrolyte drinks','Identify cooling centers','Check on elderly neighbors','Install blackout curtains'],
      during:['Stay in AC as much as possible','Drink water — don\'t wait for thirst','Wear light clothing','Limit outdoor activity to early AM/late PM','Never leave kids/pets in car'],
      post:['Continue hydration 24-48h','Watch for heat illness symptoms','Check on vulnerable neighbors','Service AC if it failed','Watch pets for overheating']
    },
    drought:{
      pre:['Install water-saving fixtures','Plan graywater reuse','Diversify crops','Identify alternative water sources','Stock bottled water'],
      during:['Reduce water use 30-50%','Follow local restrictions','Capture rainwater','Prioritize drinking water','Don\'t waste on lawns'],
      post:['Gradually restore normal use','Inspect wells + pumps','Replant with drought-resistant species','Watch for water-borne illness','Document losses for aid']
    },
    cyclone:{
      pre:['Track official cyclone warnings','Secure loose outdoor items','Stock water, food and medicines','Plan for storm surge','Know evacuation routes'],
      during:['Shelter away from windows','Move to higher ground if ordered','Do not cross floodwater','Keep devices charged','Wait for the all-clear'],
      post:['Avoid downed power lines','Use safe water only','Check for structural damage','Watch for renewed flooding','Report urgent hazards']
    },
    blizzard:{
      pre:['Stock food, water and medication','Insulate pipes and protect heat sources','Charge devices and backup batteries','Tell someone your travel plan','Keep an emergency kit in the car'],
      during:['Stay indoors if possible','Layer clothing and conserve heat','Avoid unnecessary travel','Vent generators outdoors only','Check on vulnerable neighbors safely'],
      post:['Clear vents before using heaters','Avoid weakened roofs and ice','Drive only when authorities reopen roads','Treat frostbite gradually','Check power restoration updates']
    },
    geomagnetic:{
      pre:['Keep backup power for essential devices','Save offline maps and contacts','Protect sensitive equipment','Monitor space-weather alerts','Plan for communications outages'],
      during:['Limit nonessential grid use','Use battery devices sparingly','Expect GPS and radio disruption','Follow utility instructions','Keep emergency lighting ready'],
      post:['Check devices for damage','Reset clocks and navigation systems','Report extended outages','Restock backup power','Review alert sources']
    },
    glacial:{
      pre:['Learn downstream hazard zones','Monitor official ice and flood alerts','Map high-ground routes','Keep a ready evacuation kit','Avoid unstable ice and slopes'],
      during:['Evacuate to high ground immediately','Move away from valleys and channels','Do not approach the collapse','Follow emergency route closures','Account for everyone in your group'],
      post:['Avoid contaminated floodwater','Stay clear of unstable slopes','Wait for geotechnical clearance','Report blocked roads','Prepare for secondary floods']
    },
    sandstorm:{
      pre:['Check air-quality and travel alerts','Keep windows and vents sealed','Stock masks and clean water','Protect outdoor equipment','Plan an indoor shelter room'],
      during:['Stay indoors and close vents','Wear a well-fitting mask outside','Drive only if unavoidable','Use headlights and reduce speed','Protect eyes from blowing grit'],
      post:['Replace dirty air filters','Clean dust from electronics','Check roads before traveling','Seek help for breathing trouble','Follow local air-quality guidance']
    }
  };

  // Emergency contacts by region (expanded)
  const SOS_CONTACTS = {
    'Japan':[
      {name:'Police',num:'110'},{name:'Fire/Ambulance',num:'119'},
      {name:'Disaster Info',num:'+81-3-3501-1111'},{name:'Japan Meteorological Agency',num:'+81-3-3212-8341'}
    ],
    'USA':[
      {name:'Emergency',num:'911'},{name:'FEMA',num:'1-800-621-3362'},
      {name:'Poison Control',num:'1-800-222-1222'},{name:'NOAA Weather',num:'+1-202-482-6090'}
    ],
    'Philippines':[
      {name:'National Emergency',num:'911'},{name:'NDRRMC',num:'+63-2-8911-1406'},
      {name:'Red Cross',num:'143'},{name:'PAGASA',num:'+63-2-927-1541'}
    ],
    'Indonesia':[
      {name:'Police',num:'110'},{name:'Ambulance',num:'118'},
      {name:'BNPB',num:'+62-21-2982-7293'},{name:'BMKG Weather',num:'+62-21-6546315'}
    ],
    'Australia':[
      {name:'Emergency',num:'000'},{name:'SES',num:'132-500'},
      {name:'Bushfire Info',num:'1800-679-737'},{name:'Bureau of Meteorology',num:'+61-3-9669-4000'}
    ],
    'Europe':[
      {name:'European Emergency',num:'112'},{name:'Germany Police',num:'110'},
      {name:'France SAMU',num:'15'},{name:'Italy Carabinieri',num:'112'}
    ],
    'India':[
      {name:'Police',num:'100'},{name:'Fire',num:'101'},{name:'Ambulance',num:'102'},
      {name:'NDMA',num:'1078'},{name:'IMD Weather',num:'+91-11-24631913'}
    ],
    'Mexico':[
      {name:'Emergency',num:'911'},{name:'Civil Protection',num:'+52-55-5128-0000'},
      {name:'Red Cross',num:'+52-55-5557-1555'}
    ],
    'Brazil':[
      {name:'Police',num:'190'},{name:'Ambulance',num:'192'},
      {name:'Fire',num:'193'},{name:'Civil Defense',num:'199'}
    ],
    'Turkey':[
      {name:'Police',num:'155'},{name:'Ambulance',num:'112'},
      {name:'AFAD',num:'+90-312-287-2525'},{name:'Disaster Hotline',num:'122'}
    ],
    'Pakistan':[
      {name:'Police',num:'15'},{name:'Ambulance',num:'115'},
      {name:'NDMA',num:'+92-51-920-8243'}
    ],
    'Chile':[
      {name:'Police',num:'133'},{name:'Ambulance',num:'131'},
      {name:'Fire',num:'132'},{name:'ONEMI',num:'+56-2-2522-4200'}
    ],
    'Italy':[
      {name:'Police',num:'113'},{name:'Fire',num:'115'},
      {name:'Ambulance',num:'118'},{name:'Civil Protection',num:'+39-06-68201'}
    ],
    'Iceland':[
      {name:'Emergency',num:'112'},{name:'Police',num:'+354-444-1000'},
      {name:'Civil Protection',num:'+354-570-5900'}
    ],
    'New Zealand':[
      {name:'Police/Ambulance',num:'111'},{name:'Fire',num:'999'},
      {name:'Civil Defense',num:'+64-4-817-8555'}
    ],
    'Russia':[
      {name:'Police',num:'102'},{name:'Ambulance',num:'103'},
      {name:'Fire',num:'101'},{name:'EMERCOM',num:'+7-495-606-3886'}
    ],
    'Somalia':[
      {name:'Police',num:'888'},{name:'Ambulance',num:'999'},
      {name:'Red Crescent',num:'+252-90-587-0000'}
    ],
    'Ukraine':[
      {name:'Police',num:'102'},{name:'Fire',num:'101'},
      {name:'Ambulance',num:'103'},{name:'SES',num:'+380-44-202-3001'}
    ],
    'Puerto Rico':[
      {name:'Emergency',num:'911'},{name:'NMEAD',num:'+1-787-724-0124'},
      {name:'Red Cross',num:'+1-787-729-6200'}
    ],
    'Germany':[
      {name:'Police',num:'110'},{name:'Fire/Ambulance',num:'112'},
      {name:'BBK Civil Protection',num:'+49-228-99550-0'}
    ],
    'Haiti':[
      {name:'Police',num:'114'},{name:'Ambulance',num:'116'},
      {name:'Civil Protection',num:'+509-2244-1010'}
    ],
    'Bangladesh':[
      {name:'Police',num:'999'},{name:'Fire',num:'+880-2-9555555'},
      {name:'Disaster Mgmt',num:'+880-2-9558888'}
    ],
    'Vietnam':[
      {name:'Police',num:'113'},{name:'Fire',num:'114'},
      {name:'Ambulance',num:'115'},{name:'DMC',num:'+84-24-3733-4988'}
    ],
    'Colombia':[
      {name:'Police',num:'123'},{name:'Ambulance',num:'125'},
      {name:'UNGRD',num:'+57-1-552-9696'}
    ],
    'Canada':[
      {name:'Emergency',num:'911'},{name:'Public Safety',num:'+1-866-226-6362'},
      {name:'Red Cross',num:'+1-800-418-1111'}
    ],
    'Nepal':[
      {name:'Police',num:'100'},{name:'Fire',num:'101'},
      {name:'Ambulance',num:'102'},{name:'NDRRMA',num:'+977-1-552-7700'}
    ]
  };

  const SIMULATORS = {
    'eq-survival':{
      id:'eq-survival',hazard:'earthquake',title:'Earthquake Survival — In Office',
      difficulty:'Medium',estTime:3,
      steps:[
        {q:'You feel shaking in a 3rd-floor office. What first?',
         opts:[
           {t:'Run to elevator',ok:false,fb:'NEVER use elevators during quake. You may be trapped.'},
           {t:'Drop under desk, hold on',ok:true,fb:'Correct. Drop-Cover-Hold is the international standard.'},
           {t:'Stand in doorway',ok:false,fb:'Outdated advice. Doors aren\'t stronger than modern buildings.'},
           {t:'Head to window to look outside',ok:false,fb:'Glass may shatter. Falling debris is primary injury cause.'}
         ]},
        {q:'Shaking has lasted 30 seconds. What now?',
         opts:[
           {t:'Resume work',ok:false,fb:'Aftershocks imminent. Most injuries happen after main shock.'},
           {t:'Evacuate via stairs immediately',ok:true,fb:'Correct. Aftershocks can collapse stairs later.'},
           {t:'Call loved ones',ok:false,fb:'Phone lines congested. Use text or social.'},
           {t:'Wait for official all-clear',ok:false,fb:'Be proactive — use stairs now.'}
         ]},
        {q:'Outside, you smell gas. What next?',
         opts:[
           {t:'Light a match to test',ok:false,fb:'Extremely dangerous. Any spark can ignite gas.'},
           {t:'Move 300ft away, then call 911',ok:true,fb:'Correct. Distance protects you from blast radius.'},
           {t:'Go back inside to shut valve',ok:false,fb:'Only shut off if you know location AND can exit safely.'},
           {t:'Ignore — probably nothing',ok:false,fb:'Gas leaks cause post-quake fires and explosions.'}
         ]},
        {q:'You\'re trapped under debris with daylight visible. Best action?',
         opts:[
           {t:'Shout loudly for help',ok:false,fb:'Conserve energy + oxygen. Use whistle or tap rhythmically.'},
           {t:'Tap pipe/wall rhythmically, conserve energy',ok:true,fb:'Correct. Rescuers listen for sounds. Saves oxygen.'},
           {t:'Try to push debris away',ok:false,fb:'May cause collapse. Wait for rescue unless clearly safe.'},
           {t:'Drink any liquid available',ok:false,fb:'Sewage contamination risk. Use only sealed water.'}
         ]}
      ]
    },
    'ts-coast':{
      id:'ts-coast',hazard:'tsunami',title:'Tsunami — Beach Scenario',
      difficulty:'Easy',estTime:3,
      steps:[
        {q:'You notice ocean water rapidly receding 500m. What first?',
         opts:[
           {t:'Walk out to explore',ok:false,fb:'Receding water IS the tsunami — water returns fast.'},
           {t:'Warn others + head to high ground',ok:true,fb:'Correct. Receding water = imminent wave arrival.'},
           {t:'Take photos for social media',ok:false,fb:'Wastes precious seconds. May die.'},
           {t:'Wait for official alert',ok:false,fb:'Natural warning beats official alerts.'}
         ]},
        {q:'You\'re at 50ft elevation, wave ETA 8 min. Now what?',
         opts:[
           {t:'Stay put — 50ft is enough',ok:true,fb:'Generally yes. Most tsunamis <50ft, but move higher if wave history shows bigger.'},
           {t:'Run to 200ft hill',ok:false,fb:'Over-cautious but safe. 50ft adequate unless mega-wave.'},
           {t:'Go back for belongings',ok:false,fb:'NEVER. Tsunami waves come in series — first may not be biggest.'},
           {t:'Drive parallel to coast for better view',ok:false,fb:'Traffic may trap you. Stay on high ground.'}
         ]},
        {q:'First wave passed, water receding. Stay or move higher?',
         opts:[
           {t:'Return to lower ground',ok:false,fb:'Largest wave often comes 3rd-7th in series. Stay high for hours.'},
           {t:'Stay at elevation for 3+ hours',ok:true,fb:'Correct. Tsunami series lasts hours.'},
           {t:'Stay 30min then return',ok:false,fb:'Too early. Series can last 12+ hours.'},
           {t:'Watch ocean to judge',ok:false,fb:'Wave timing unpredictable. Time-based safety only.'}
         ]}
      ]
    },
    'to-shelter':{
      id:'to-shelter',hazard:'tornado',title:'Tornado Warning — At Home',
      difficulty:'Medium',estTime:3,
      steps:[
        {q:'Sirens blare. Tornado warned in your area. What room?',
         opts:[
           {t:'Largest open room — living room',ok:false,fb:'Open rooms offer no protection from debris.'},
           {t:'Interior bathroom, lowest floor',ok:true,fb:'Correct. Plumbing + walls provide extra protection.'},
           {t:'Near window to watch',ok:false,fb:'Glass + projectile risk is severe.'},
           {t:'In car in garage',ok:false,fb:'Cars get tossed. Get out and shelter inside.'}
         ]},
        {q:'Storm intensifies, debris hitting house. Action?',
         opts:[
           {t:'Helmet + mattress over head',ok:true,fb:'Correct. Head/neck protection critical.'},
           {t:'Hide in closet under clothes',ok:false,fb:'Better than nothing but closet may collapse.'},
           {t:'Run to neighbor\'s house',ok:false,fb:'Outside exposure extreme.'},
           {t:'Record video from interior room',ok:false,fb:'Wastes time + reduces focus on safety.'}
         ]},
        {q:'Tornado passed, neighbors trapped. What now?',
         opts:[
           {t:'Rush to dig them out',ok:false,fb:'Check for hazards first — gas, fire, structural collapse.'},
           {t:'Call 911, survey safely, avoid down wires',ok:true,fb:'Correct. Professional rescue + safety first.'},
           {t:'Wait for family reunion first',ok:false,fb:'Family OK if sheltered. Help others.'},
           {t:'Take photos for insurance',ok:false,fb:'After everyone is safe.'}
         ]}
      ]
    },
    'ff-stranded':{
      id:'ff-stranded',hazard:'flashflood',title:'Flash Flood — Stranded in Car',
      difficulty:'Hard',estTime:2,
      steps:[
        {q:'Water rising fast around car. Engine stalls. Now?',
         opts:[
           {t:'Restart engine repeatedly',ok:false,fb:'Engine intake may ingest water. Flooded engines die.'},
           {t:'Abandon car, climb to high ground',ok:true,fb:'Correct. Vehicles get swept easily.'},
           {t:'Stay in car and call for help',ok:false,fb:'Car may roll or submerge. Get out now.'},
           {t:'Wait for water to recede',ok:false,fb:'Water rises faster than expected.'}
         ]},
        {q:'On foot, water 1ft deep moving fast. How cross?',
         opts:[
           {t:'Find alternate route',ok:true,fb:'Correct. 6" of moving water can knock you down.'},
           {t:'Hold stick, cross carefully',ok:false,fb:'Debris + unknown depth make this dangerous.'},
           {t:'Swim across',ok:false,fb:'Current may be stronger than you can swim.'},
           {t:'Wait for someone to help',ok:false,fb:'Help may not come in time.'}
         ]}
      ]
    },
    'hw-public':{
      id:'hw-public',hazard:'heatwave',title:'Heatwave — Outdoors',
      difficulty:'Easy',estTime:2,
      steps:[
        {q:'It\'s 42°C. You must be outside for 2 hours. Best prep?',
         opts:[
           {t:'Drink sports drink + electrolytes',ok:true,fb:'Correct. Sodium + fluids prevent heat cramps.'},
           {t:'Drink only water',ok:false,fb:'Water alone may dilute electrolytes.'},
           {t:'Coffee for energy',ok:false,fb:'Caffeine dehydrates you.'},
           {t:'Energy drink',ok:false,fb:'High sugar + caffeine accelerate dehydration.'}
         ]},
        {q:'You feel dizzy, headache, no sweat. Now?',
         opts:[
           {t:'Push through — mind over matter',ok:false,fb:'These are heatstroke signs. Stop immediately.'},
           {t:'Get to shade, cool water on neck, call help',ok:true,fb:'Correct. Heatstroke can kill in 15min.'},
           {t:'Sit in sun but rest',ok:false,fb:'More sun = worse. Get shade now.'},
           {t:'Take aspirin for headache',ok:false,fb:'Aspirin in heatstroke worsens bleeding risk.'}
         ]}
      ]
    },
    'wf-evac':{
      id:'wf-evac',hazard:'fire',title:'Wildfire Evacuation',
      difficulty:'Medium',estTime:3,
      steps:[
        {q:'Red flag warning. Wind shifting. You see fire 2mi away. Action?',
         opts:[
           {t:'Wait for evacuation order',ok:false,fb:'Red flag + wind shift = leave NOW. Orders take time.'},
           {t:'Pre-pack + fuel car + monitor news',ok:true,fb:'Correct. Prepare to leave at moment\'s notice.'},
           {t:'Set up sprinklers to defend home',ok:false,fb:'Don\'t defend unless trained. Most who die defend.'},
           {t:'Drive to fire to take photos',ok:false,fb:'Stupid. Smoke + flames = trapped.'}
         ]},
        {q:'Order issued. Fire 1mi away, wind-driven. Time to leave?',
         opts:[
           {t:'Take 30min to gather valuables',ok:false,fb:'30min = trapped. Leave now.'},
           {t:'Grab go-bag, leave lights on, close all',ok:true,fb:'Correct. Lights on = visible to rescuers. Doors closed = embers out.'},
           {t:'Hose down house before leaving',ok:false,fb:'Wastes time. May delay escape.'},
           {t:'Wait for wife from work',ok:false,fb:'Have reunion plan. She should also leave now.'}
         ]},
        {q:'Driving, smoke thickens, road ahead unclear. Best?',
         opts:[
           {t:'Speed up to outrun',ok:false,fb:'Hidden obstacles + crashes. Slow down.'},
           {t:'Turn on headlights, low beams, slow',ok:true,fb:'Correct. See road + be seen. Don\'t rush.'},
           {t:'Pull over and wait',ok:false,fb:'May catch fire. Keep moving.'},
           {t:'Use GPS shortcut',ok:false,fb:'Unverified routes may be closed/blocked.'}
         ]}
      ]
    },
    'vo-ash':{
      id:'vo-ash',hazard:'volcano',title:'Volcanic Ash Crisis',
      difficulty:'Medium',estTime:3,
      steps:[
        {q:'Ash starting to fall. You\'re outdoors. First action?',
         opts:[
           {t:'Cover mouth with shirt + get inside',ok:true,fb:'Correct. Ash = glass-like lung damage.'},
           {t:'Run to high ground',ok:false,fb:'Ash falls uniformly. Shelter is key.'},
           {t:'Drive to outrun ash',ok:false,fb:'Ash destroys engines. Stay put.'},
           {t:'Take photos for memory',ok:false,fb:'Exposure risk too high.'}
         ]},
        {q:'Inside, ash 1cm on roof. Do?',
         opts:[
           {t:'Clean it now',ok:false,fb:'Wait until fall stops. Cleaning mid-fall = exposure.'},
           {t:'Seal doors/windows, N95 ready',ok:true,fb:'Correct. Wait for all-clear before roof work.'},
           {t:'Open windows for ventilation',ok:false,fb:'Ash gets inside. Seal everything.'},
           {t:'Go to roof to see volcano',ok:false,fb:'Roof may collapse under ash weight.'}
         ]},
        {q:'Ash 5cm now. Time to clean?',
         opts:[
           {t:'Sweep from below upward',ok:false,fb:'Wrong direction. Top-down only.'},
           {t:'Wet down + clean top-down, N95 on',ok:true,fb:'Correct. Wet ash is less airborne. Top-down prevents overload.'},
           {t:'Hire roofers now',ok:false,fb:'Still falling. Wait until official stop.'},
           {t:'Leave it — won\'t matter',ok:false,fb:'Heavy ash = roof collapse. Critical to remove.'}
         ]}
      ]
    }
  };

  // Multi-hazard combo events
  const COMBOS = [
    {name:'EQ + Tsunami + Nuclear',hazards:['earthquake','tsunami','nuclear'],example:'2011 Japan'},
    {name:'Hurricane + Flood + Landslide',hazards:['hurricane','flashflood','landslide'],example:'2017 Puerto Rico'},
    {name:'Heatwave + Wildfire + Drought',hazards:['heatwave','fire','drought'],example:'2019 Australia'},
    {name:'Volcano + Landslide + Ashfall',hazards:['volcano','landslide'],example:'2010 Indonesia'}
  ];

  return { HAZARDS, PLANS, SOS_CONTACTS, SIMULATORS, COUNTRY_LABELS, CONTINENT_LABELS, COMBOS };
})();