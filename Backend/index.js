
// server/index.js
const app = require('./server/app');

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
