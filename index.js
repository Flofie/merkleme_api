const express = require('express');
const app = express();
const cors = require('cors');
// const limiter = require('./middleware/limiter.js');
require('dotenv').config();

const generateMerkleTree = require('./middleware/generateMerkleTree');
const generateMerkleProof = require('./middleware/generateMerkleProof');

const PORT = process.env.PORT || 4001;

app.use(express.json({ limit: '50mb' }));
app.use(cors());
// Limiter disabled!
// app.use(limiter);

app.use('/merkletree', generateMerkleTree);
app.use('/verify', generateMerkleProof);

app.get('/', (req, res) => {
  res.send('merkleMe API --');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});
