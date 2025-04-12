const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const sessionRoutes = require('./routes/sessionRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const apiRoutes = require('./routes/apiRoutes');
const { connectToMongoDB } = require('./config');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());

connectToMongoDB();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/', sessionRoutes);
app.use('/', whatsappRoutes);
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

