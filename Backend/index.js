
const express = require('express');
const app = require('./server/app');

const PORT = process.env.PORT || 5000;

if (!module.parent) {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
}
