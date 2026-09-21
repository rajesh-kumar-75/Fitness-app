const { Exercise } = require('../models/Exercise');
const Member = require('../models/Member');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let GoogleGenAI = null;
try {
  const genaiPkg = require('@google/genai');
  GoogleGenAI = genaiPkg.GoogleGenAI;
} catch (err) {
  // Gracefully handle if @google/genai is not loaded
}

// Built-in intelligent fitness knowledge base & responder
const generateBuiltInAiResponse = async (userMessage, conversationHistory = [], userProfile = null) => {
  const query = userMessage.toLowerCase().trim();

  // Telugu language detection
  const isTelugu = /[\u0C00-\u0C7F]/.test(userMessage);

  // Check if query is asking for Yoga exercises
  if (query.includes('yoga') || query.includes('యోగా') || query.includes('asanas') || query.includes('flexibility') || query.includes('stretching')) {
    const yogaExercises = await Exercise.find({ muscleGroup: 'Yoga' }).limit(6).lean();
    
    if (isTelugu) {
      let reply = `🧘 **FitPlatform యోగా & ఫ్లెక్సిబిలిటీ గైడ్**:\n\nయోగా మీ శరీరాన్ని ఫ్లెక్సిబుల్‌గా, మైండ్‌ను రిలాక్స్‌గా ఉంచడానికి ఎంతో సహాయపడుతుంది. మీ FitPlatform లైబ్రరీలో ఉన్న కొన్ని ముఖ్యమైన యోగా ఆసనాలు:\n\n`;
      if (yogaExercises.length > 0) {
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
    yogaExercises.forEach((ex, idx) => {
      reply += `${idx + 1}. **${ex.name}** [${ex.difficulty}]\n   - ${ex.description}\n`;
    });
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
    const chestExercises = await Exercise.find({ muscleGroup: 'Chest' }).limit(5).lean();
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

  // Check if query is asking for Diet / Nutrition / Macros / Calories
  if (query.includes('diet') || query.includes('nutrition') || query.includes('macro') || query.includes('calorie') || query.includes('డైట్') || query.includes('ఆహారం') || query.includes('ప్రోటీన్')) {
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

  // Check if query is asking for Fat Loss / Weight Loss
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

  // Check if query is asking for Back / Deadlift / Lats
  if (query.includes('back') || query.includes('deadlift') || query.includes('lats') || query.includes('వీపు')) {
    const backExercises = await Exercise.find({ muscleGroup: 'Back' }).limit(5).lean();
    return {
      reply: `🦅 **V-Taper Back Mastery**:\n\nTo build a wide, dense, injury-resistant back:\n\n1. **Barbell Deadlifts**: The king of posterior chain strength. Brace your core (Valsalva maneuver), pack your lats, and drive the floor away through your heels.\n2. **Wide-Grip Lat Pulldowns**: Pull down smoothly driving your elbows toward your hips. Squeeze your lower lats at the bottom.\n3. **Seated Cable Rows**: Keep your chest tall and avoid excessive torso swinging to keep tension firmly on your rhomboids and mid-traps.\n\nBrowse all back exercises in your [Exercise Library](/exercises?muscleGroup=Back)!`,
      category: 'workout',
      exercises: backExercises,
      suggestions: ['Deadlift form checklist', 'Exercises for lower back health', 'Yoga poses for spine']
    };
  }

  // Check if query is asking for Legs / Squats
  if (query.includes('leg') || query.includes('squat') || query.includes('quad') || query.includes('కాళ్ళు')) {
    const legExercises = await Exercise.find({ muscleGroup: 'Legs' }).limit(5).lean();
    return {
      reply: `🦵 **Leg Power & Quad Dominance**:\n\n1. **Barbell Back Squats**: Place the bar firmly across your upper traps, break at the hips and knees simultaneously, descend to parallel or deeper with knees tracking over toes, then drive up through mid-foot.\n2. **Romanian Deadlifts (RDLs)**: Focus on a controlled hip hinge, pushing your pelvis straight back until you feel a deep hamstring stretch, then snap your glutes forward.\n3. **Walking Lunges & Leg Press**: High-volume hypertrophy finishers for quad definition.\n\nCheck out complete demonstrations in the [Exercise Library](/exercises?muscleGroup=Legs)!`,
      category: 'workout',
      exercises: legExercises,
      suggestions: ['How to fix knee cave in squats', 'Best quad exercises', 'Leg day nutrition']
    };
  }

  // General or greeting response
  if (isTelugu) {
    return {
      reply: `నమస్కారం! 🙏 నేను మీ **FitPlatform AI ఫిట్‌నెస్ అసిస్టెంట్‌ని**.\n\nనేను మీకు ఈ క్రింది విషయాలలో సహాయం చేయగలను:\n- 💪 **వ్యాయామ ప్రణాళికలు (Workout Routines)**: 3-డే, 4-డే లేదా 5-డే అడ్వాన్స్‌డ్ స్ప్లిట్స్.\n- 🧘 **యోగా & స్ట్రెచింగ్ (Yoga & Flexibility)**: ఆసనాలు, సరైన భంగిమలు.\n- 🥗 **డైట్ & న్యూట్రిషన్ (Diet & Macros)**: బరువు తగ్గడానికి లేదా పెరగడానికి క్యాలరీలు, ప్రోటీన్ లెక్కలు.\n- 🎯 **ఎక్సర్‌సైజ్ టెక్నిక్స్**: స్క్వాట్స్, డెడ్‌లిఫ్ట్, బెంచ్ ప్రెస్ ఫారమ్ గైడ్.\n\nమీ ఫిట్‌నెస్ లక్ష్యం ఏమిటి? కింద ఉన్న ప్రశ్నలలో ఒకదానిని ఎంచుకోండి లేదా నేరుగా అడగండి!`,
      category: 'general',
      suggestions: ['నాకు 5-డే వర్కౌట్ ప్లాన్ కావాలి', 'యోగా ఆసనాలు ఏవి మంచివి?', 'బరువు తగ్గడానికి డైట్ ప్లాన్', 'ప్రోటీన్ రిచ్ ఫుడ్స్ ఏవి?']
    };
  }

  return {
    reply: `👋 Hello! I'm your **FitPlatform AI Fitness & Health Coach**.\n\nI can help you achieve peak physical performance, design custom workout splits, optimize your nutrition macros, or guide you through perfect exercise execution.\n\nHere are some things you can ask me:\n- 🏋️ **Workout Programming**: *"Generate a 5-day hypertrophy workout split"* or *"Best routine for building strength"*\n- 🥗 **Nutrition & Macros**: *"Calculate my daily calories and protein for lean bulking"*\n- 🧘 **Yoga & Flexibility**: *"Show me the best yoga poses for posture and mobility"*\n- 💡 **Technique & Form**: *"How to execute a strict barbell squat without knee strain"*\n- 🎯 **Platform Navigation**: *"Where can I find certified trainers or log my daily meals?"*\n\nWhat are you aiming to conquer today?`,
    category: 'general',
    suggestions: [
      'Generate a 5-day workout split',
      'Calculate my daily macros & calories',
      'Recommend yoga poses for flexibility',
      'High protein diet plan for muscle gain',
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
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        authenticatedUser = await User.findById(decoded.id).select('-password');
        if (authenticatedUser) {
          memberProfile = await Member.findOne({ user: authenticatedUser._id }).populate('assignedTrainer');
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
          model: 'gemini-3.8-flash',
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
            provider: 'gemini-3.8-flash',
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
          'Top high-protein vegetarian foods for fitness',
          'What should I eat before and after intense workout sessions?'
        ]
      },
      {
        category: 'తెలుగు ఫిట్‌నెస్ గైడ్',
        icon: '🇮🇳',
        prompts: [
          'బరువు తగ్గడానికి మంచి డైట్ ప్లాన్ చెప్పండి',
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
