require('dotenv').config();

const app = require('./src/app');

// Start follow-up scheduler
require('./src/jobs/followUpJob');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n  AI Ops Backend running on http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Database:    ${process.env.DATABASE_URL}\n`);
});
