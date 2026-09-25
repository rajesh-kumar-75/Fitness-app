const { Exercise } = require('../models/Exercise');
const Member = require('../models/Member');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const mongoose = require('mongoose');

let GoogleGenAI = null;
try {
  const genaiPkg = require('@google/genai');
  GoogleGenAI = genaiPkg.GoogleGenAI;
} catch (err) {
  // Gracefully handle if @google/genai is not loaded
}

// Resilient helper to query exercises without crashing if database is buffering or disconnected
const safeFindExercises = async (filter, limit = 5) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return [];
    }
    return await Exercise.find(filter).limit(limit).lean();
  } catch (err) {
    console.warn('[AI Controller] Exercise query skipped:', err.message);
    return [];
  }
};

// Built-in intelligent fitness knowledge base & responder
const generateBuiltInAiResponse = async (userMessage, conversationHistory = [], userProfile = null) => {
  const query = userMessage.toLowerCase().trim();

  // Telugu language detection
  const isTelugu = /[\u0C00-\u0C7F]/.test(userMessage);

  // Check if query is asking for Yoga exercises
  if (query.includes('yoga') || query.includes('యోగా') || query.includes('asanas') || query.includes('flexibility') || query.includes('stretching')) {
    const yogaExercises = await safeFindExercises({ muscleGroup: 'Yoga' }, 6);
    
    if (isTelugu) {
      let reply = `🧘 **FitPlatform యోగా & ఫ్లెక్సిబిలిటీ గైడ్**:\n\nయోగా మీ శరీరాన్ని ఫ్లెక్సిబుల్‌గా, మైండ్‌ను రిలాక్స్‌గా ఉంచడానికి ఎంతో సహాయపడుతుంది. మీ FitPlatform లైబ్రరీలో ఉన్న కొన్ని ముఖ్యమైన యోగా ఆసనాలు:\n\n`;
      if (yogaExercises && yogaExercises.length > 0) {
        yogaExercises.forEach((ex, idx) => {
          reply += `${idx + 1}. **${ex.name}** (${ex.difficulty})\n   - ${ex.description}\n`;
        });
      } else {
        reply += `1. **Downward-Facing Dog (Adho Mukha Svanasana)** - వెన్నెముక మరియు భుజాలకు బలాన్ని ఇస్తుంది.\n2. **Warrior II (Virabhadrasana II)** - కాళ్ళు మరియు కోర్ స్ట్రెంగ్త్ మెరుగుపరుస్తుంది.\n3. **Cobra Pose (Bhujangasana)** - వీపు నొప్పిని తగ్గించి ఛాతీని విస్తరిస్తుంది.\n4. **Child's Pose (Balasana)** - మానసిక ప్రశాంతతకు ఉత్తమ ఆసనం.\n`;
      }
      reply += `\n💡 **చిట్కా**: ప్రతిరోజూ ఉదయం 15-20 నిమిషాలు యోగా చేయడం వల్ల ఒత్తిడి తగ్గి శక్తి పెరుగుతుంది. మరిన్ని ఆసనాల కోసం "Exercises" పేజీలో "Yoga" ఫిల్టర్‌ని ఎంచుకోండి!`;
      return {
        reply,
        category: 'yoga',
        exercises: yogaExercises,
        suggestions: ['యోగా చేయడం వల్ల లాభాలు ఏమిటి?', 'వెన్ను నొప్పికి మంచి ఆసనాలు ఏవి?', '4-Day Workout Split కావాలి']
      };
    }

    let reply = `🧘 **FitPlatform Yoga & Flexibility Guide**:\n\nYoga is fantastic for mobility, core stability, and mental clarity. Here are premier yoga poses available directly in your FitPlatform library:\n\n`;
    if (yogaExercises && yogaExercises.length > 0) {
      yogaExercises.forEach((ex, idx) => {
        reply += `${idx + 1}. **${ex.name}** [${ex.difficulty}]\n   - ${ex.description}\n`;
      });
    } else {
      reply += `1. **Downward-Facing Dog (Adho Mukha Svanasana)** [Beginner]\n   - Lengthens the spine, opens the hamstrings, and strengthens shoulder stabilizers.\n2. **Warrior II (Virabhadrasana II)** [Intermediate]\n   - Builds lower body endurance, hip mobility, and core strength.\n3. **Cobra Pose (Bhujangasana)** [Beginner]\n   - Alleviates spinal stiffness and counteracts prolonged sitting.\n4. **Child's Pose (Balasana)** [Beginner]\n   - Restores diaphragmatic breathing and calms the nervous system.\n`;
    }
    reply += `\n💡 **Coach Tip**: Hold each static pose for 5 slow, diaphragmatic breaths (approx. 30-45 seconds). Focus on alignment rather than depth. You can explore all 10 poses on the [Exercises](/exercises) page under the **Yoga** filter!`;
    return {
      reply,
      category: 'yoga',
      exercises: yogaExercises,
      suggestions: ['Show me beginner yoga routine', 'Yoga for back pain relief', 'Post-workout cooldown stretches']
    };
  }

  // Check if query is asking for Chest / Bench Press
  if (query.includes('bench press') || query.includes('chest') || query.includes('ఛాతీ') || query.includes('పుషప్స్')) {
    const chestExercises = await safeFindExercises({ muscleGroup: 'Chest' }, 5);
    if (isTelugu) {
      return {
        reply: `💪 **ఛాతీ (Chest) వ్యాయామ మార్గదర్శకాలు**:\n\nమంచి ఛాతీ కండరాల పెరుగుదల కోసం ఈ నియమాలు పాటించండి:\n1. **Barbell Bench Press**: భుజాలు వెనక్కి లాగి, భుజాల బ్లేడ్లను స్థిరంగా ఉంచండి (Retract scapula). బార్‌ను ఛాతీ మధ్య భాగానికి నెమ్మదిగా దించండి.\n2. **Incline Dumbbell Press**: ఛాతీ పైభాగానికి (Upper Chest) ఇది అద్భుతమైన వ్యాయామం.\n3. **Cable Flyes**: పీక్ కాంట్రాక్షన్ (Peak Contraction) కోసం 12-15 రెప్స్ చేయండి.\n\n⚡ **ప్రో-టిప్**: వారానికి 2 సార్లు చెస్ట్ వర్కౌట్ చేయడం వల్ల గరిష్ట ఫలితాలు వస్తాయి!`,
        category: 'workout',
        exercises: chestExercises,
        suggestions: ['Bench press form tips', 'Back exercises list', 'High protein diet']
      };
    }
    return {
      reply: `💪 **Chest Hypertrophy & Bench Press Mastery**:\n\nTo build a powerful, sculpted chest while protecting your shoulders:\n\n1. **Barbell Bench Press**: Retract and depress your scapulae into the bench, maintain a slight arch in your lower back, and lower the bar with control to your sternum. Drive up through your heels.\n2. **Incline Dumbbell Press (30° Angle)**: Emphasizes the clavicular head (upper chest) with a deeper stretch at the bottom.\n3. **Cable Chest Flyes**: Focus on continuous tension and peak adduction at the center of the movement (3 sets of 12-15 reps).\n\n💡 **Form Check**: Never bounce the barbell off your chest. Maintain a 3-second eccentric (lowering) tempo for explosive hypertrophy!`,
      category: 'workout',
      exercises: chestExercises,
      suggestions: ['How to prevent shoulder pain in bench press', 'Create a 4-Day Workout Split', 'Calculate my macros']
    };
  }

  // Check if query is asking for Workout Splits / Routine
  if (query.includes('split') || query.includes('workout plan') || query.includes('routine') || query.includes('ప్లాన్') || query.includes('వర్కౌట్')) {
    if (isTelugu) {
      return {
        reply: `🏋️ **FitPlatform ఉత్తమ వర్కౌట్ ప్లాన్స్**:\n\nమీ ఫిట్‌నెస్ లక్ష్యం ఆధారంగా ఈ ప్లాన్స్ ఎంచుకోవచ్చు:\n\n1. **5-Day Advanced Hypertrophy Split** (Muscle Gain):\n   - Day 1: Chest & Core\n   - Day 2: Back & Lats\n   - Day 3: Shoulders & Traps\n   - Day 4: Quads, Hamstrings & Calves\n   - Day 5: Biceps, Triceps & Forearms\n   - Day 6 & 7: Active Recovery & Rest\n\n2. **3-Day Full Body Circuit** (Beginners / Fat Loss):\n   - సోమవారం, బుధవారం, శుక్రవారం పూర్తి శరీర వ్యాయామాలు.\n\n💡 "Workouts" విభాగంలో ఈ ప్లాన్స్‌ని ఒక్క క్లిక్‌తో మీ యాక్టివ్ షెడ్యూల్‌గా సెట్ చేసుకోవచ్చు!`,
        category: 'workout_plan',
        suggestions: ['Show 5-day hypertrophy plan', 'Diet for muscle gain', 'Fat loss workout routine']
      };
    }
    return {
      reply: `🏋️ **Recommended FitPlatform Workout Splits**:\n\nDepending on your weekly availability and training experience, here are the top splits:\n\n1. **5-Day Advanced Hypertrophy Split** (Gold Standard for Muscle Growth):\n   - **Mon**: Chest & Abdominals (Incline Press, Bench Press, Cable Flyes)\n   - **Tue**: Back & Lats (Deadlifts, Lat Pulldowns, Seated Rows)\n   - **Wed**: Shoulders (Overhead Press, Lateral Raises, Rear Delt Flyes)\n   - **Thu**: Legs & Calves (Barbell Squats, Romanian Deadlifts, Leg Press)\n   - **Fri**: Arms & Forearms (Bicep Curls, Tricep Pushdowns, Skull Crushers)\n   - **Sat & Sun**: Rest / Yoga & Active Recovery\n\n2. **4-Day Upper / Lower Split**:\n   - Ideal for balancing intense strength gains with 3 complete recovery days.\n\n3. **3-Day Full Body Power Routine**:\n   - High frequency, time-efficient for busy schedules.\n\n👉 You can activate the **5-Day Advanced Hypertrophy Split** directly in your [Workouts](/workouts) tab!`,
      category: 'workout_plan',
      suggestions: ['Calculate my daily calories & macros', 'Best exercises for back', 'High protein meal plan']
    };
  }

  // 1. Check if query is asking for Non-Veg Foods & Animal Protein (Checked FIRST to avoid substring collision with 'veg')
  const isNonVeg = query.includes('non-veg') || query.includes('non veg') || query.includes('nonveg') || query.includes('chicken') || query.includes('fish') || query.includes('salmon') || query.includes('eggs') || query.includes('meat') || query.includes('మాంసాహార') || query.includes('beef') || query.includes('steak') || query.includes('tuna') || query.includes('turkey');
  if (isNonVeg) {
    if (isTelugu) {
      return {
        reply: `🍗 **FitPlatform మాంసాహార (Non-Veg Foods) ప్రోటీన్ గైడ్**:\n\nలీన్ ప్రోటీన్ మరియు వేగవంతమైన రికవరీ కోసం ముఖ్య ఆహారాలు:\n\n1. **చికెన్ బ్రెస్ట్ (Chicken Breast)**: తక్కువ కొవ్వుతో 100 గ్రాములలో ~31గ్రా ప్యూర్ ప్రోటీన్.\n2. **వైల్డ్ సాల్మన్ / చేపలు (Salmon & Fish)**: హృదయ ఆరోగ్యానికి ఒమేగా-3 ఫ్యాటీ యాసిడ్స్ మరియు హై ప్రోటీన్.\n3. **గుడ్లు (Boiled Whole Eggs & Whites)**: అద్భుతమైన బయో-అవైలబిలిటీ మరియు విటమిన్ B12.\n4. **లీన్ స్టీక్ & టర్కీ**: ఐరన్, జింక్ మరియు సహజ క్రియాటిన్ కంటెంట్.\n\n💡 మా "Nutrition" పేజీలో కొత్తగా చేర్చబడిన **"Non-Veg Foods"** విభాగంలో వీటిని సులభంగా లాగ్ చేయండి!`,
        category: 'nutrition_nonveg',
        suggestions: ['Chicken breast meal prep tips', 'Daily protein requirements', 'Best post-workout non-veg meal']
      };
    }
    return {
      reply: `🍗 **FitPlatform High-Protein Non-Veg Foods Blueprint**:\n\nAnimal proteins offer complete amino acid profiles with maximum bioavailability (DIAAS score > 1.0):\n\n1. **Grilled Herb Chicken Breast**: The lean physique staple (~48g protein per 200g serving with near-zero fat).\n2. **Wild Seared Salmon Fillet**: Loaded with EPA/DHA Omega-3s (~38g protein) to combat systemic exercise inflammation.\n3. **Whole Organic Eggs**: Complete protein matrix with choline, lutein, and vitamin D for hormone optimization.\n4. **Lean Sirloin Steak & Turkey Breast**: Rich in bioavailable heme iron, zinc, and natural intramuscular creatine.\n5. **Tuna Poke Bowls**: Ultra-lean, high-satiety protein for rapid cutting phases.\n\n👉 Log your favorites directly under our new **"Non-Veg Foods"** section on the [Nutrition Tracker](/nutrition) page!`,
      category: 'nutrition_nonveg',
      suggestions: ['Calculate my bulking calories', 'How much protein per meal is optimal?', 'Best post-workout non-veg meals']
    };
  }

  // 2. Check if query is asking for Vegetarian / Plant-Based ("Veg Foods")
  const isVeg = query.includes('veg') || query.includes('vegetarian') || query.includes('paneer') || query.includes('tofu') || query.includes('శాకాహార') || query.includes('plant-based') || query.includes('dal') || query.includes('chickpea') || query.includes('soya');
  if (isVeg) {
    if (isTelugu) {
      return {
        reply: `🥦 **FitPlatform శాకాహార (Veg Foods) ప్రోటీన్ & డైట్ గైడ్**:\n\nశాకాహారులకు కండరాల పెరుగుదల మరియు శక్తి కోసం ఉత్తమ ఆహారాలు:\n\n1. **పన్నీర్ (Paneer)**: 100గ్రా పన్నీర్‌లో ~18గ్రా అధిక నాణ్యత ప్రోటీన్ మరియు ఆరోగ్యకరమైన కొవ్వులు ఉంటాయి.\n2. **టోఫు (Tofu) & సోయా చంక్స్**: 100గ్రా సోయా చంక్స్‌లో ~52గ్రా అత్యధిక ప్రోటీన్ ఉంటుంది.\n3. **చిక్‌పీస్ (సెనగలు) & పప్పులు (Dal)**: కాంప్లెక్స్ కార్బ్స్ మరియు ఫైబర్‌తో కూడిన ప్రోటీన్.\n4. **చియా సీడ్స్ & గ్రీక్ యోగర్ట్**: జీర్ణక్రియను మెరుగుపరుస్తూ అవసరమైన అమైనో ఆమ్లాలను అందిస్తాయి.\n\n💡 మా "Nutrition" పేజీలో కొత్తగా చేర్చబడిన **"Veg Foods"** విభాగంలో ఈ ఆహారాలను 1-క్లిక్‌తో లాగ్ చేసుకోవచ్చు!`,
        category: 'nutrition_veg',
        suggestions: ['Show high protein veg foods', 'Calculate my macros', 'Paneer vs Chicken protein comparison']
      };
    }
    return {
      reply: `🥦 **FitPlatform Vegetarian & Plant-Based ("Veg Foods") Blueprint**:\n\nBuilding lean muscle on a vegetarian or plant-based diet is entirely achievable with strategic protein pairing:\n\n1. **Paneer & Greek Yogurt**: Slow-digesting casein protein (~18–22g per serving) ideal for overnight muscle protein synthesis.\n2. **Tofu Buddha Bowls & Tempeh**: Complete plant proteins containing all 9 essential amino acids.\n3. **Chickpeas, Lentils & Edamame**: High in dietary fiber and clean complex carbs (~14–18g protein per cup).\n4. **Chia Seed Pudding with Almond Milk**: Packed with ALA Omega-3 fatty acids, magnesium, and antioxidant micronutrients.\n5. **Soya Chunks**: Exceptionally dense protein source (~52g protein per 100g dry weight).\n\n👉 You can track these directly under our dedicated **"Veg Foods"** category on the [Nutrition Tracker](/nutrition) page with 1-click quick add!`,
      category: 'nutrition_veg',
      suggestions: ['Calculate my daily protein target', 'High protein vegetarian meal plan', 'Best pre-workout plant foods']
    };
  }

  // 3. Check if query is asking for Diet / Nutrition / Macros / Calories
  if (query.includes('diet') || query.includes('nutrition') || query.includes('macro') || query.includes('calorie') || query.includes('డైట్') || query.includes('ఆహార') || query.includes('ప్రోటీన్')) {
    if (isTelugu) {
      return {
        reply: `🥗 **ఫిట్‌నెస్ న్యూట్రిషన్ & డైట్ గైడ్**:\n\nమంచి ఫలితాల కోసం 70% న్యూట్రిషన్, 30% వర్కౌట్ ముఖ్యం:\n\n1. **ప్రోటీన్ (Protein)**: మీ శరీర బరువులో ప్రతి కేజీకి 1.6 నుండి 2 గ్రాముల ప్రోటీన్ అవసరం (ఉదాహరణకు 70kg వ్యక్తికి ~120-140g ప్రోటీన్).\n   - మంచి ఆహారాలు: గుడ్లు (Eggs), చికెన్ బ్రెస్ట్, పన్నీర్ (Paneer), సోయా చంక్స్, పప్పులు (Dal), ఓట్స్, వే ప్రోటీన్.\n2. **కాంప్లెక్స్ కార్బోహైడ్రేట్లు**: బ్రౌన్ రైస్, ఓట్స్, స్వీట్ పొటాటో వ్యాయామ సమయంలో శక్తిని ఇస్తాయి.\n3. **నీరు (Hydration)**: ప్రతిరోజూ 3 నుండి 4 లీటర్ల నీరు తప్పనిసరిగా తాగండి.\n\n💡 మీ రోజువారీ ఆహారాన్ని మా "Nutrition" పేజీలో ట్రాక్ చేయండి!`,
        category: 'nutrition',
        suggestions: ['High protein vegetarian diet', 'Daily calorie calculator', 'Best pre-workout snacks']
      };
    }
    return {
      reply: `🥗 **FitPlatform Nutrition & Macro Blueprint**:\n\nNutrition dictates 70% of your body composition results. Here is the optimal framework:\n\n1. **Protein Intake**: Aim for **1.6 – 2.2g per kg of bodyweight** daily to repair and build muscle tissue.\n   - *Top Sources*: Chicken breast, eggs, wild salmon, whey protein isolate, Greek yogurt, paneer, tofu, lentils, and edamame.\n2. **Caloric Balance**:\n   - **Lean Muscle Building (Bulking)**: Maintenance calories + 250 to 400 kcal surplus.\n   - **Fat Loss (Cutting)**: Maintenance calories - 400 to 500 kcal deficit (aim for 0.5-0.7kg fat loss/week).\n3. **Hydration & Recovery**: Drink 3.5–4.5 liters of clean water daily. Supplement with sodium, potassium, and magnesium around intense training sessions.\n\n👉 Track and log all your daily meals with automated macro breakdowns on the [Nutrition Tracker](/nutrition) page!`,
      category: 'nutrition',
      suggestions: ['Calculate my personalized calorie target', 'What are good pre-workout foods?', 'Vegetarian protein sources']
    };
  }

  // 4. Check if query is asking for Cardio / Running / HIIT / Stamina
  if (query.includes('cardio') || query.includes('running') || query.includes('treadmill') || query.includes('hiit') || query.includes('endurance') || query.includes('కార్డియో') || query.includes('stamina') || query.includes('cycling')) {
    const cardioExercises = await safeFindExercises({ muscleGroup: 'Cardio' }, 5);
    if (isTelugu) {
      return {
        reply: `🏃 **కార్డియో, రన్నింగ్ & స్టామినా గైడ్**:\n\nగుండె ఆరోగ్యం, స్టామినా మరియు కొవ్వు కరిగించడానికి కార్డియో చాలా ముఖ్యం:\n\n1. **HIIT (హై ఇంటెన్సిటీ ఇంటర్వెల్ ట్రైనింగ్)**: 20-30 సెకన్లు స్ప్రింట్ చేసి, 40 సెకన్లు రెస్ట్ తీసుకోవడం. ఇది తక్కువ సమయంలో ఎక్కువ కొవ్వును కరిగిస్తుంది.\n2. **LISS (లో ఇంటెన్సిటీ స్టెడీ స్టేట్)**: వాకింగ్ లేదా తేలికపాటి సైక్లింగ్ రికవరీకి మంచిది.\n3. **రోయింగ్ & త్రెడ్‌మిల్ ఇన్‌క్లైన్ వాకింగ్**: మోకాళ్లపై ఒత్తిడి లేకుండా అత్యధిక క్యాలరీలు బర్న్ చేస్తుంది.\n\n💡 వెయిట్ ట్రైనింగ్ తర్వాత 15-20 నిమిషాలు కార్డియో చేయడం ఉత్తమమైన పద్ధతి!`,
        category: 'cardio',
        exercises: cardioExercises,
        suggestions: ['Best cardio for fat loss without muscle loss', 'HIIT vs steady-state cardio', 'Treadmill incline walking routine']
      };
    }
    return {
      reply: `🏃 **Cardiovascular Conditioning & High-Intensity Interval Protocol**:\n\nCardio optimizes VO2 max, mitochondrial density, and resting heart rate:\n\n1. **HIIT (High-Intensity Interval Training)**: 20-30 seconds maximal effort followed by 40-60 seconds active recovery for 15-20 minutes. Creates prolonged excess post-exercise oxygen consumption (EPOC).\n2. **Incline Treadmill Rucking / Walking**: 12% incline at 3.0 mph burns substantial calories with zero joint impact and zero muscle breakdown.\n3. **Rowing Machine / Concept2**: Full-body conditioning engaging 86% of skeletal musculature.\n\n👉 Discover all dynamic cardio drills under the **Cardio** section in your [Exercise Library](/exercises?muscleGroup=Cardio)!`,
      category: 'cardio',
      exercises: cardioExercises,
      suggestions: ['Cardio before or after lifting?', 'Zone 2 cardio for longevity', 'Calculate calories burned in cardio']
    };
  }

  // 5. Check if query is asking for Fat Loss / Weight Loss
  if (query.includes('fat loss') || query.includes('weight loss') || query.includes('బరువు') || query.includes('lose weight')) {
    if (isTelugu) {
      return {
        reply: `🔥 **బరువు / కొవ్వు తగ్గడానికి ఉత్తమ పద్ధతులు**:\n\n1. **క్యాలరీ డెఫిసిట్ (Caloric Deficit)**: మీ శరీరం ఖర్చు చేసే క్యాలరీల కంటే 400-500 క్యాలరీలు తక్కువగా ఆహారం తీసుకోవాలి.\n2. **వెయిట్ ట్రైనింగ్ (Strength Training)**: కేవలం కార్డియో మాత్రమే కాకుండా బరువులు ఎత్తడం వల్ల కండరాలు కరగకుండా కేవలం కొవ్వు మాత్రమే కరుగుతుంది.\n3. **హై ప్రోటీన్**: ఎక్కువ ప్రోటీన్ తీసుకోవడం వల్ల ఆకలి తక్కువగా వేస్తుంది మరియు మెటబాలిజం పెరుగుతుంది.\n4. **రోజువారీ నడక**: రోజుకు 8,000 - 10,000 అడుగులు నడవండి.\n5. **నిద్ర**: రోజుకు 7-8 గంటలు నాణ్యమైన నిద్ర చాలా అవసరం.`,
        category: 'weight_loss',
        suggestions: ['Daily calorie calculator', 'Yoga for fat loss', 'High protein meal plan']
      };
    }
    return {
      reply: `🔥 **Science-Backed Fat Loss Blueprint**:\n\n1. **Sustainable Calorie Deficit**: Target a moderate deficit of 400–500 kcal below your Total Daily Energy Expenditure (TDEE). This burns pure fat while preserving hard-earned lean muscle.\n2. **Prioritize Resistance Training**: Lift weights 3–5 days per week to signal your body to retain muscle mass.\n3. **High Protein Target**: Consume 2.0g of protein per kg of bodyweight to maximize satiety and thermic effect of feeding (TEF).\n4. **NEAT (Daily Steps)**: Aim for 8,000–10,000 steps daily. Consistent low-impact movement accelerates fat loss without fatiguing your central nervous system.\n5. **Sleep & Stress**: Cortisol from chronic sleep deprivation promotes visceral fat storage. Target 7.5–8 hours of restful sleep every night.`,
      category: 'weight_loss',
      suggestions: ['Calculate my TDEE and deficit', 'Best HIIT workouts', 'Healthy snack ideas']
    };
  }

  // 6. Check if query is asking for Back / Lats / Pull movements
  if (query.includes('back') || query.includes('lat') || query.includes('deadlift') || query.includes('pull-up') || query.includes('pull up') || query.includes('row') || query.includes('వీపు')) {
    const backExercises = await safeFindExercises({ muscleGroup: 'Back' }, 5);
    if (isTelugu) {
      return {
        reply: `🏋️ **వీపు & లాట్స్ (Back & Lats) వ్యాయామాలు**:\n\nV-టేపర్ లుక్ మరియు బలమైన వెన్నెముక కోసం ముఖ్యమైన వ్యాయామాలు:\n\n1. **డెడ్‌లిఫ్ట్ (Deadlift)**: వెనుక భాగం మరియు మొత్తం శరీర బలానికి రాజు వంటి వ్యాయామం.\n2. **లాట్ పుల్‌డౌన్ (Lat Pulldown)** & పుల్-అప్స్: లాట్స్ వెడల్పును పెంచడానికి ఉత్తమమైనవి.\n3. **బార్‌బెల్ రోస్ (Barbell Rows)**: వీపు మందాన్ని (Thickness) పెంచుతాయి.\n\n💡 మా "Exercises" పేజీలో "Back" ఫిల్టర్ ద్వారా పూర్తి వీడియో డెమోలను చూడవచ్చు!`,
        category: 'workout',
        exercises: backExercises,
        suggestions: ['Deadlift form cues', 'Pull-up progression tips', '5-day workout split']
      };
    }
    return {
      reply: `🏋️ **Back & Lat Hypertrophy Blueprint (V-Taper Aesthetics)**:\n\nA wide, thick back creates the coveted V-taper silhouette while fortifying postural health:\n\n1. **Conventional / Romanian Deadlifts**: Posterior chain compound foundation that stresses the erector spinae, lats, and traps.\n2. **Pull-Ups & Wide-Grip Lat Pulldowns**: Prime drivers for upper lat width and teres major development. Pull elbows down and slightly back into your hip pockets.\n3. **Barbell / Chest-Supported Rows**: Maximizes rhomboid and mid-trap thickness with reduced lumbar shear.\n4. **Seated Cable Rows**: Squeeze scapulae together at full retraction and hold the peak contraction for 1 second.\n\n👉 Discover all guided demonstrations under the **Back** category in your [Exercise Library](/exercises?muscleGroup=Back)!`,
      category: 'workout',
      exercises: backExercises,
      suggestions: ['How to do more pull-ups', 'Lower back safety in deadlifts', 'Weekly workout schedule']
    };
  }

  // 7. Check if query is asking for Legs / Quads / Hamstrings / Glutes / Squats
  if (query.includes('leg') || query.includes('squat') || query.includes('quad') || query.includes('hamstring') || query.includes('glute') || query.includes('calf') || query.includes('కాళ్ళు') || query.includes('తొడ') || query.includes('లంగ్స్') || query.includes('lunge')) {
    const legExercises = await safeFindExercises({ muscleGroup: 'Legs' }, 5);
    if (isTelugu) {
      return {
        reply: `🦵 **కాళ్ళు & తొడలు (Legs & Quads) వ్యాయామ మార్గదర్శకాలు**:\n\nశరీరంలో 50% పైగా కండరాలు కాళ్ళలోనే ఉంటాయి. కాళ్ళ వ్యాయామాలు టెస్టోస్టెరాన్ మరియు గ్రోత్ హార్మోన్‌ను పెంచుతాయి:\n\n1. **బార్‌బెల్ స్క్వాట్ (Barbell Squat)**: క్వాడ్స్, గ్లూట్స్ మరియు మొత్తం శరీర బలాన్ని పెంచుతుంది.\n2. **రొమేనియన్ డెడ్‌లిఫ్ట్ (RDL)**: హామ్‌స్ట్రింగ్స్ మరియు గ్లూట్స్‌ను బలంగా చేస్తుంది.\n3. **లెగ్ ప్రెస్ & వాకింగ్ లంజెస్**: కండరాల పరిమాణాన్ని పెంచడానికి సూపర్ వ్యాయామాలు.\n\n💡 "Exercises" పేజీలో "Legs" ఫిల్టర్‌ని ఎంచుకుని సరైన భంగిమలను వీడియోలలో చూడండి!`,
        category: 'workout',
        exercises: legExercises,
        suggestions: ['Squat depth and knee safety', 'Build bigger calves and quads', 'Leg day recovery tips']
      };
    }
    return {
      reply: `🦵 **Leg Day Mastery & Lower Body Power**:\n\nLower body training drives systemic growth hormone and metabolic conditioning:\n\n1. **Barbell Back Squats**: The undisputed king of leg exercises. Break at the hips and knees simultaneously, driving your knees outward over your toes with chest upright.\n2. **Romanian Deadlifts (RDLs)**: Supreme hamstring and glute hypertrophy through deep hip hinging.\n3. **Bulgarian Split Squats / Walking Lunges**: Unilateral training that balances strength disparities and targets the gluteus medius.\n4. **Leg Press & Standing Calf Raises**: Safe mechanical overload to train quads and soleus/gastrocnemius to failure.\n\n👉 Check out high-definition video loops under the **Legs** section in your [Exercise Library](/exercises?muscleGroup=Legs)!`,
      category: 'workout',
      exercises: legExercises,
      suggestions: ['How to squat deeper without knee pain', 'Hamstring vs quad focus exercises', 'Full leg day workout routine']
    };
  }

  // Check if query is asking for Shoulders & Delts
  if (query.includes('shoulder') || query.includes('overhead press') || query.includes('military press') || query.includes('lateral raise') || query.includes('భుజాలు') || query.includes('delts') || query.includes('face pull')) {
    const shoulderExercises = await safeFindExercises({ muscleGroup: 'Shoulders' }, 5);
    return {
      reply: `🛡️ **3D Boulder Shoulders Mastery**:\n\nTo build broad, spherical deltoids while protecting your rotator cuff:\n\n1. **Standing Overhead Press (OHP)**: The foundation of shoulder power. Squeeze your glutes and core, press directly overhead, and push your head slightly forward at lockout.\n2. **Dumbbell / Cable Lateral Raises**: Target the lateral head for width. Lead with your elbows and maintain a slight forward lean (15°).\n3. **Face Pulls & Rear Delt Flyes**: Essential for shoulder longevity, external rotation, and rear deltoid balance (3 sets of 15-20 reps).\n\nBrowse full video demonstrations in your [Exercise Library](/exercises?muscleGroup=Shoulders)!`,
      category: 'workout',
      exercises: shoulderExercises,
      suggestions: ['Prevent rotator cuff pain', 'Lateral raises form cues', '5-day workout split']
    };
  }

  // Check if query is asking for Arms (Biceps / Triceps)
  if (query.includes('bicep') || query.includes('tricep') || query.includes('arm') || query.includes('చేతులు') || query.includes('curl') || query.includes('skull crusher')) {
    const armExercises = await safeFindExercises({ muscleGroup: { $in: ['Biceps', 'Triceps'] } }, 5);
    return {
      reply: `💪 **Arm Hypertrophy & Peak Definition**:\n\n1. **Triceps (65% of upper arm size)**:\n   - *Tricep Rope Pushdowns*: Flare wrists outward at full extension for lateral head isolation.\n   - *Overhead Tricep Extensions*: Maximizes stretch on the long head for maximum mass.\n2. **Biceps**:\n   - *Incline Dumbbell Curls*: Stretches the long head across the shoulder joint.\n   - *Barbell Preacher Curls*: Eliminates momentum and emphasizes the short head peak.\n\n⚡ **Pro Tip**: Train arms at the end of upper body sessions or on a dedicated arm day with 10-15 controlled sets per week!`,
      category: 'workout',
      exercises: armExercises,
      suggestions: ['Bicep peak exercises', 'Tricep long head workouts', 'Calculate arm training volume']
    };
  }

  // Check if query is asking for Core & Abs
  if (query.includes('abs') || query.includes('core') || query.includes('six pack') || query.includes('plank') || query.includes('పొట్ట') || query.includes('oblique')) {
    const coreExercises = await safeFindExercises({ muscleGroup: 'Core' }, 5);
    return {
      reply: `🧱 **Chiseled Core & Rotational Stability**:\n\nAbs are built in the gym and revealed in the kitchen:\n\n1. **Hanging Leg Raises**: Spinal flexion from the bottom up to activate lower rectus abdominis.\n2. **Cable Woodchoppers & Russian Twists**: Build powerful obliques and rotational athletic power.\n3. **Ab Wheel Rollouts / Weighted Planks**: Elite anti-extension exercises that shield your spine.\n\n💡 Remember: Visible abs require a body fat percentage of ~10-12% for men and ~18-20% for women. Combine progressive core training with a moderate caloric deficit!`,
      category: 'workout',
      exercises: coreExercises,
      suggestions: ['How to lose lower belly fat', 'Core exercises for back support', 'Daily calorie calculator']
    };
  }

  // Check if query is asking for Exercise Videos or Motion Theater
  if (query.includes('video') || query.includes('motion') || query.includes('demonstration') || query.includes('వీడియో') || query.includes('animation') || query.includes('form')) {
    return {
      reply: `🎬 **FitPlatform On-Page Video & Motion Theater**:\n\nOur [Exercise Library](/exercises) features an interactive, embedded **Video & Motion Theater** directly on the same page:\n\n1. **Interactive Cards**: Simply click any exercise card or its **"Watch Video & Form"** button to open the theater without losing your browsing position.\n2. **Dynamic Playback**: Watch full-motion exercise video loops alongside step-by-step form execution cues.\n3. **Muscle Focus HUD**: View live telemetry tags for target muscle group, equipment requirements, and difficulty ratings.\n\n👉 Head over to the [Exercise Library](/exercises) now to explore all exercises in high-definition video!`,
      category: 'features',
      suggestions: ['Browse chest exercises with video', 'Explore yoga pose motions', 'Show 5-day workout plan']
    };
  }

  // General or greeting response
  const userName = userProfile?.name && userProfile.name !== 'Athlete' ? `, ${userProfile.name}` : '';
  if (isTelugu) {
    return {
      reply: `నమస్కారం${userName}! 🙏 నేను మీ **FitPlatform AI ఫిట్‌నెస్ అసిస్టెంట్‌ని**.\n\nనేను మీకు ఈ క్రింది విషయాలలో సహాయం చేయగలను:\n- 💪 **వర్కౌట్ ప్రోగ్రామింగ్**: 3-డే, 4-డే లేదా 5-డే అడ్వాన్స్‌డ్ స్ప్లిట్స్ (Chest, Back, Legs, Shoulders, Arms).\n- 🥦 **న్యూట్రిషన్ & ఆహారం**: కొత్త **Veg Foods** (పన్నీర్, టోఫు, చిక్‌పీస్) & **Non-Veg Foods** (చికెన్, సాల్మన్, గుడ్లు) డైట్ ప్లాన్స్.\n- 🧘 **యోగా & స్ట్రెచింగ్**: వెన్ను నొప్పి నివారణ, ఫ్లెక్సిబిలిటీ మరియు మానసిక ప్రశాంతత కోసం ఆసనాలు.\n- 🎬 **ఎక్సర్‌సైజ్ వీడియోస్**: వ్యాయామాల సరైన భంగిమలను నేరుగా వీడియోలలో వీక్షించండి.\n\nమీ ఫిట్‌నెస్ లక్ష్యం ఏమిటి? కింద ఉన్న ప్రశ్నలలో ఒకదానిని ఎంచుకోండి లేదా నేరుగా అడగండి!`,
      category: 'general',
      suggestions: [
        'నాకు 5-డే వర్కౌట్ ప్లాన్ కావాలి',
        'శాకాహార హై ప్రోటీన్ డైట్ ప్లాన్',
        'యోగా ఆసనాలు ఏవి మంచివి?',
        'బరువు తగ్గడానికి క్యాలరీ లెక్కలు'
      ]
    };
  }

  return {
    reply: `👋 Hello${userName}! I'm your **FitPlatform AI Fitness & Health Coach**.\n\nI can help you achieve peak physical performance, design custom workout splits, optimize your nutrition macros, or guide you through perfect exercise execution.\n\nHere are some things you can ask me:\n- 🏋️ **Workout Programming**: *"Generate a 5-day hypertrophy workout split"* or *"Best routine for building strength"*\n- 🥦 **Nutrition & Macros**: *"Show me high-protein Veg Foods"* or *"What are good lean Non-Veg protein sources?"*\n- 🧘 **Yoga & Flexibility**: *"Show me the best yoga poses for posture and mobility"*\n- 🎬 **Form & Motion Videos**: *"How can I watch exercise video demonstrations?"*\n- 🎯 **Platform Navigation**: *"Where can I find certified trainers or log my daily meals?"*\n\nWhat are you aiming to conquer today?`,
    category: 'general',
    suggestions: [
      'Generate a 5-day workout split',
      'Show high-protein Veg Foods & options',
      'Calculate my daily macros & calories',
      'Recommend yoga poses for flexibility',
      'Tips for perfect bench press form'
    ]
  };
};

/**
 * Handle AI Chat Message
 * Route: POST /api/v1/ai/chat
 */
exports.chat = async (req, res) => {
  try {
    const { message, history = [], userContext = {} } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and cannot be empty'
      });
    }

    // Try optional user extraction from auth token if present
    let authenticatedUser = null;
    let memberProfile = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        if (mongoose.connection.readyState === 1) {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fitness_jwt_secret_dev_key'
          );
          authenticatedUser = await User.findById(decoded.id).select('-password');
          if (authenticatedUser) {
            memberProfile = await Member.findOne({ user: authenticatedUser._id }).populate('assignedTrainer');
          }
        }
      } catch (e) {
        // Token invalid or expired; proceed gracefully as guest
      }
    }

    const effectiveUserContext = {
      name: authenticatedUser?.name || userContext?.name || 'Athlete',
      goal: memberProfile?.fitnessGoal || userContext?.goal || 'General Fitness',
      weight: memberProfile?.weight || userContext?.weight || null,
      height: memberProfile?.height || userContext?.height || null,
      activityLevel: memberProfile?.activityLevel || userContext?.activityLevel || null
    };

    // If GEMINI_API_KEY is configured and GoogleGenAI is available, use Gemini 3.8 Flash!
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && GoogleGenAI) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const systemInstruction = `You are FitPlatform AI, an elite certified fitness coach, sports nutritionist, and biomechanics expert.
You help users with workout routines, exercise technique, sets/reps, yoga poses (asanas), diet plans, calorie & macro calculations, and injury prevention.
FitPlatform features:
- 40+ Exercise Library with muscle group filters (Chest, Back, Legs, Shoulders, Arms, Core, Cardio, Yoga).
- 5-Day Advanced Hypertrophy Split, 4-Day Upper/Lower, 3-Day Full Body workouts.
- Nutrition & Meal Tracker for tracking breakfast, lunch, dinner, snacks.
- Personal Trainer Directory with certified coaches.
User context: Name: ${effectiveUserContext.name}, Goal: ${effectiveUserContext.goal}, Weight: ${effectiveUserContext.weight || 'N/A'}, Height: ${effectiveUserContext.height || 'N/A'}.
Format responses using clear markdown with emojis, bullet points, and bold section headings. If user communicates in Telugu, respond in helpful, professional, polite Telugu.`;

        // Format history for Gemini API
        const contents = [];
        if (Array.isArray(history) && history.length > 0) {
          history.slice(-6).forEach(h => {
            contents.push({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: h.text || h.content || '' }]
            });
          });
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        });

        const aiText = response.text ? response.text.trim() : '';
        if (aiText) {
          return res.status(200).json({
            success: true,
            provider: 'gemini-2.5-flash',
            reply: aiText,
            timestamp: new Date().toISOString(),
            suggestions: [
              'Show me yoga poses for recovery',
              'Calculate my protein needs',
              'How to perform Romanian Deadlifts'
            ]
          });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed or not configured, utilizing built-in FitPlatform AI Engine:', geminiError.message);
      }
    }

    // Built-in FitPlatform AI Engine fallback (instant, comprehensive, zero latency)
    const builtInResult = await generateBuiltInAiResponse(message, history, effectiveUserContext);

    return res.status(200).json({
      success: true,
      provider: 'fitplatform-ai-engine',
      reply: builtInResult.reply,
      category: builtInResult.category,
      exercises: builtInResult.exercises || [],
      suggestions: builtInResult.suggestions || [
        'Generate a 5-day workout split',
        'Calculate my daily macros',
        'Yoga poses for beginners'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Controller Chat Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI response',
      error: error.message
    });
  }
};

/**
 * Get dynamic prompt suggestions
 * Route: GET /api/v1/ai/suggestions
 */
exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = [
      {
        category: 'Workouts',
        icon: '🏋️',
        prompts: [
          'Generate a personalized 5-day hypertrophy workout routine',
          'What is the best 3-day full body workout split for beginners?',
          'How to progress weight on Bench Press and Squats?'
        ]
      },
      {
        category: 'Yoga & Flexibility',
        icon: '🧘',
        prompts: [
          'Recommend top yoga poses for lower back pain and posture',
          'What are the best yoga asanas for beginners?',
          'How often should I practice yoga along with gym workouts?'
        ]
      },
      {
        category: 'Nutrition & Macros',
        icon: '🥗',
        prompts: [
          'Calculate my daily calories and protein for muscle building',
          'What are the best high-protein Veg Foods in FitPlatform?',
          'Compare protein quality between Paneer, Tofu, and Chicken',
          'What should I eat before and after intense workout sessions?'
        ]
      },
      {
        category: 'Exercise Videos & Form',
        icon: '🎬',
        prompts: [
          'How do I watch on-page exercise video demonstrations?',
          'Show proper form cues for Romanian Deadlifts',
          'Tips to bench press without shoulder impingement'
        ]
      },
      {
        category: 'తెలుగు ఫిట్‌నెస్ గైడ్',
        icon: '🇮🇳',
        prompts: [
          'బరువు తగ్గడానికి మంచి డైట్ ప్లాన్ చెప్పండి',
          'శాకాహారంలో ఎక్కువ ప్రోటీన్ ఇచ్చే ఆహారాలు ఏవి?',
          'యోగా ఆసనాలు చేయడం వల్ల ఉపయోగాలు ఏమిటి?',
          'కండరాల పెరుగుదలకు ఏ ఆహారాలు తీసుకోవాలి?'
        ]
      }
    ];

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI suggestions',
      error: error.message
    });
  }
};
