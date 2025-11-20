const config = {
  baseURL: 'https://recall-backend-tau.vercel.app',
  api: {
    students: '/students',
    importStudents: '/students/import',
    scoreRanking: '/students/ranking',
    randomRollcall: '/rollcall/random',
    orderRollcall: '/rollcall/order',
    updateScore: '/rollcall/update-score',
    rollcallHistory: '/rollcall/history',
    debugCount: '/students/debug/simple-count',
    resetData: '/students/reset'
  }
};

export default config;