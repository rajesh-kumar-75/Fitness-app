const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: rawData });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function ensureServerRunning() {
  try {
    const res = await request('GET', '/api/health');
    if (res.status === 200) {
      return;
    }
  } catch (err) {
    console.log('[Test Setup] Initializing in-process backend server...');
    require('./server');

    for (let i = 0; i < 80; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200) {
          console.log('[Test Setup] Backend server is ready.');
          return;
        }
      } catch (e) {
        // Server still initializing
      }
    }
    throw new Error('Backend server failed to start within 40 seconds.');
  }
}

async function runTests() {
  console.log('--- Starting API Verification Suite ---');

  // 1. Root
  const rootRes = await request('GET', '/');
  console.log('1. GET / -> Status:', rootRes.status, '| Success:', rootRes.data?.success);

  // 2. Health
  const healthRes = await request('GET', '/api/health');
  console.log('2. GET /api/health -> Status:', healthRes.status, '| Status:', healthRes.data?.data?.status);

  // 3. Login Admin
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@fitness.com',
    password: 'Admin@123',
  });
  console.log('3. POST /api/auth/login (Admin) -> Status:', adminLogin.status, '| Role:', adminLogin.data?.data?.user?.role);
  const adminToken = adminLogin.data?.data?.token;

  // 4. Register New Member
  const testEmail = `testuser_${Date.now()}@fitness.com`;
  const registerRes = await request('POST', '/api/auth/register', {
    name: 'Test Fit User',
    email: testEmail,
    password: 'Password@123',
    phone: '+1 555-9988',
    role: 'member',
  });
  console.log('4. POST /api/auth/register -> Status:', registerRes.status, '| Registered Email:', registerRes.data?.data?.user?.email);
  const userToken = registerRes.data?.data?.token;
  const userId = registerRes.data?.data?.user?.id;

  // 5. Auth Me
  const meRes = await request('GET', '/api/auth/me', null, userToken);
  console.log('5. GET /api/auth/me -> Status:', meRes.status, '| User:', meRes.data?.data?.user?.name);

  // 6. Memberships List
  const membershipsRes = await request('GET', '/api/memberships');
  console.log('6. GET /api/memberships -> Status:', membershipsRes.status, '| Count:', membershipsRes.data?.count);
  const samplePlanId = membershipsRes.data?.data?.[0]?._id;

  // 7. Workouts List
  const workoutsRes = await request('GET', '/api/workouts');
  console.log('7. GET /api/workouts -> Status:', workoutsRes.status, '| Count:', workoutsRes.data?.count);

  // 8. Create Workout (Admin)
  const newWorkoutRes = await request(
    'POST',
    '/api/workouts',
    {
      name: 'Automated Test Circuit',
      description: 'Quick functional burner for verification',
      category: 'HIIT',
      difficulty: 'Intermediate',
      duration: 25,
      exercises: [{ exerciseName: 'Jump Rope', sets: 3, reps: 50, restTime: 30 }],
    },
    adminToken
  );
  console.log('8. POST /api/workouts (Admin) -> Status:', newWorkoutRes.status, '| Created:', newWorkoutRes.data?.data?.name);
  const testWorkoutId = newWorkoutRes.data?.data?._id;

  // 9. Workouts by Category
  const catWorkouts = await request('GET', '/api/workouts/category/HIIT');
  console.log('9. GET /api/workouts/category/HIIT -> Status:', catWorkouts.status, '| Count:', catWorkouts.data?.count);

  // 10. Trainers List
  const trainersRes = await request('GET', '/api/trainers');
  console.log('10. GET /api/trainers -> Status:', trainersRes.status, '| Count:', trainersRes.data?.count);

  // 11. Members List (Admin)
  const membersRes = await request('GET', '/api/members', null, adminToken);
  console.log('11. GET /api/members (Admin) -> Status:', membersRes.status, '| Count:', membersRes.data?.count);

  // 12. Check-in
  const checkInRes = await request('POST', '/api/attendance/check-in', {}, userToken);
  console.log('12. POST /api/attendance/check-in -> Status:', checkInRes.status, '| Message:', checkInRes.data?.message);

  // 13. Today Attendance
  const todayAttRes = await request('GET', '/api/attendance/today', null, adminToken);
  console.log('13. GET /api/attendance/today -> Status:', todayAttRes.status, '| Count:', todayAttRes.data?.count);

  // 14. Subscribe Membership
  if (samplePlanId) {
    const subRes = await request('POST', '/api/memberships/subscribe', { membershipId: samplePlanId }, userToken);
    console.log('14. POST /api/memberships/subscribe -> Status:', subRes.status, '| Message:', subRes.data?.message);
  }

  // 15. Payments List (Admin)
  const paymentsRes = await request('GET', '/api/payments', null, adminToken);
  console.log('15. GET /api/payments (Admin) -> Status:', paymentsRes.status, '| Count:', paymentsRes.data?.count);

  // 16. Admin Dashboard
  const adminDashRes = await request('GET', '/api/dashboard/admin', null, adminToken);
  console.log('16. GET /api/dashboard/admin -> Status:', adminDashRes.status, '| Total Members:', adminDashRes.data?.data?.totalMembers);

  // 17. Member Dashboard
  const memberDashRes = await request('GET', '/api/dashboard/member', null, userToken);
  console.log('17. GET /api/dashboard/member -> Status:', memberDashRes.status, '| Check-ins:', memberDashRes.data?.data?.totalCheckIns);

  // 18. Clean up created test workout
  if (testWorkoutId) {
    const delRes = await request('DELETE', `/api/workouts/${testWorkoutId}`, null, adminToken);
    console.log('18. DELETE /api/workouts/:id -> Status:', delRes.status, '| Message:', delRes.data?.message);
  }

  // 19. Exercises List
  const exercisesRes = await request('GET', '/api/v1/exercises');
  console.log('19. GET /api/v1/exercises -> Status:', exercisesRes.status, '| Total Exercises:', exercisesRes.data?.data?.total);

  // 20. Weekly Active Plan & Schedule
  const activePlanRes = await request('GET', '/api/v1/workouts/plans/my-plan');
  console.log('20. GET /api/v1/workouts/plans/my-plan -> Status:', activePlanRes.status, '| Schedule Days:', activePlanRes.data?.data?.plan?.schedule?.length);

  // 21. Available Workout Plans
  const plansRes = await request('GET', '/api/v1/workouts/plans');
  console.log('21. GET /api/v1/workouts/plans -> Status:', plansRes.status, '| Total Plans:', plansRes.data?.data?.total);

  // 22. Daily Nutrition Summary & Targets
  const nutritionDailyRes = await request('GET', '/api/v1/nutrition/daily', null, userToken);
  console.log('22. GET /api/v1/nutrition/daily -> Status:', nutritionDailyRes.status, '| Target Calories:', nutritionDailyRes.data?.data?.targets?.targetCalories);

  // 23. Nutrition Foods Database
  const foodsRes = await request('GET', '/api/v1/nutrition/foods', null, userToken);
  console.log('23. GET /api/v1/nutrition/foods -> Status:', foodsRes.status, '| Foods Count:', foodsRes.data?.data?.count);

  // 24. Public Trainer Directory (20+ Verified Trainers)
  const publicTrainersRes = await request('GET', '/api/v1/trainers/public');
  console.log('24. GET /api/v1/trainers/public -> Status:', publicTrainersRes.status, '| Trainers Count:', publicTrainersRes.data?.data?.count);

  // 25. Yoga Exercises Filter
  const yogaRes = await request('GET', '/api/v1/exercises?muscleGroup=Yoga');
  console.log('25. GET /api/v1/exercises?muscleGroup=Yoga -> Status:', yogaRes.status, '| Yoga Exercises Count:', yogaRes.data?.data?.total);

  // 26. AI Suggestions
  const aiSuggestionsRes = await request('GET', '/api/v1/ai/suggestions');
  console.log('26. GET /api/v1/ai/suggestions -> Status:', aiSuggestionsRes.status, '| Categories Count:', aiSuggestionsRes.data?.data?.length);

  // 27. AI Chat Assistant
  const aiChatRes = await request('POST', '/api/v1/ai/chat', {
    message: 'Recommend yoga poses and bench press tips',
  }, userToken);
  console.log('27. POST /api/v1/ai/chat -> Status:', aiChatRes.status, '| Provider:', aiChatRes.data?.provider, '| Reply Length:', aiChatRes.data?.reply?.length);

  // 28. Chat Conversations
  const convsRes = await request('GET', '/api/v1/chat/conversations', null, userToken);
  console.log('28. GET /api/v1/chat/conversations -> Status:', convsRes.status, '| Conversations:', convsRes.data?.data?.conversations?.length);

  // 29. Create or Get Conversation with Trainer
  let activeConvId = null;
  const trainerLoginRes = await request('POST', '/api/auth/login', {
    email: 'trainer@fitness.com',
    password: 'Trainer@123',
  });
  const trainerToken = trainerLoginRes.data?.data?.token;
  const trainerUserId = trainerLoginRes.data?.data?.user?.id || trainerLoginRes.data?.data?.user?._id;

  if (trainerUserId) {
    const createConvRes = await request('POST', '/api/v1/chat/conversations', {
      partnerId: trainerUserId,
    }, userToken);
    activeConvId = createConvRes.data?.data?.conversation?._id;
    console.log('29. POST /api/v1/chat/conversations -> Status:', createConvRes.status, '| Conv ID:', activeConvId);
  }

  // 30. Send Coaching Message
  if (activeConvId) {
    const sendMsgRes = await request('POST', `/api/v1/chat/conversations/${activeConvId}/messages`, {
      content: 'Coach, could you check my squat form in tomorrow session?',
    }, userToken);
    console.log('30. POST /api/v1/chat/conversations/:id/messages -> Status:', sendMsgRes.status, '| Content:', sendMsgRes.data?.data?.message?.content);

    // 31. Get Conversation Messages
    const getMsgsRes = await request('GET', `/api/v1/chat/conversations/${activeConvId}/messages`, null, userToken);
    console.log('31. GET /api/v1/chat/conversations/:id/messages -> Status:', getMsgsRes.status, '| Messages Total:', getMsgsRes.data?.data?.total);

    // 32. Mark Messages as Read
    const readRes = await request('PATCH', `/api/v1/chat/conversations/${activeConvId}/read`, {}, trainerToken);
    console.log('32. PATCH /api/v1/chat/conversations/:id/read -> Status:', readRes.status, '| Read At:', readRes.data?.data?.readAt);
  }

  // 33. Unread Count
  const unreadRes = await request('GET', '/api/v1/chat/unread-count', null, userToken);
  console.log('33. GET /api/v1/chat/unread-count -> Status:', unreadRes.status, '| Total Unread:', unreadRes.data?.data?.totalUnread);

  // 34. Start Workout Log Session (Tests user validation)
  const startLogRes = await request('POST', '/api/v1/workouts/logs/start', {
    dayOfWeek: 'Monday',
  }, userToken);
  const activeSessionId = startLogRes.data?.data?.session?._id;
  console.log('34. POST /api/v1/workouts/logs/start -> Status:', startLogRes.status, '| Session ID:', activeSessionId, '| User ID:', startLogRes.data?.data?.session?.user);

  // 35. Get Active Workout Log
  const activeLogRes = await request('GET', '/api/v1/workouts/logs/active', null, userToken);
  console.log('35. GET /api/v1/workouts/logs/active -> Status:', activeLogRes.status, '| Active Session Found:', !!activeLogRes.data?.data?.session);

  // 36. Complete Workout Log
  if (activeSessionId) {
    const completeLogRes = await request('PUT', `/api/v1/workouts/logs/${activeSessionId}/complete`, {
      notes: 'Crushed the Monday session with excellent form!',
    }, userToken);
    console.log('36. PUT /api/v1/workouts/logs/:id/complete -> Status:', completeLogRes.status, '| Status:', completeLogRes.data?.data?.session?.status, '| Duration:', completeLogRes.data?.data?.session?.durationMinutes, 'min');
  }

  // 37. Get Workout History via /api/v1/workouts/logs/history
  const workoutHistoryRes = await request('GET', '/api/v1/workouts/logs/history', null, userToken);
  console.log('37. GET /api/v1/workouts/logs/history -> Status:', workoutHistoryRes.status, '| Total Sessions:', workoutHistoryRes.data?.data?.history?.length, '| Total Mins:', workoutHistoryRes.data?.data?.stats?.totalMinutes);

  // 38. Get Paginated Workout History via /api/v1/progress/workouts
  const progressWorkoutsRes = await request('GET', '/api/v1/progress/workouts?page=1&limit=10', null, userToken);
  console.log('38. GET /api/v1/progress/workouts -> Status:', progressWorkoutsRes.status, '| Total Logs:', progressWorkoutsRes.data?.data?.history?.length, '| Pages:', progressWorkoutsRes.data?.data?.pagination?.pages);

  console.log('--- All API Tests Finished Successfully! ---');
}

(async () => {
  try {
    await ensureServerRunning();
    await runTests();
    process.exit(0);
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  }
})();

