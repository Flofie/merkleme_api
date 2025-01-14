const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');
const pinataSDK = require('@pinata/sdk');

const express = require('express');
const router = express.Router();

const pinata = pinataSDK(
  process.env['PINATA_API_KEY'],
  process.env['PINATA_API_SECRET']
);

const generate = async ({ userEmail, collectionName, data }) => {
  let tree;
  let root;
  const leafValues = [];

  const generateMerkleTree = (data) => {
    try {
      tree = new MerkleTree(data, keccak256, {
        sortPairs: true,
        sortLeaves: true,
        sort: true,
        hashLeaves: true,
      });
      root = tree.getHexRoot();

      console.log(`Merkle tree generated.
    \nRoot hash is ${root}
    \nTree Summary:
    \n     Leaf Count: ${tree.getLeafCount()}
    \n     Layer Count: ${tree.getLayerCount()}
    \n     Tree Depth: ${tree.getDepth()}
    `);
    } catch (e) {
      console.log(e);
    }
  };

  /*
   * Save merkle root as Object to publish to IPFS
   */
  const saveMerkleRoot = () => {
    const rootObj = { rootHash: root };
    return rootObj;
  };

  try {
    for (let i = 0; i < data.length; i++) {
      let currentHash;
      let currentValue;
      currentValue = data[i];
      currentHash = `0x${keccak256(data[i]).toString('hex')}`;

      /*
       * Create an object for each address containing the
       * address value and address hash
       */
      leafValues.push({ Leaf: currentValue, Hash: currentHash });
    }

    /*
     * Generate an instance of the Merkle Tree for the given whitelist
     */
    generateMerkleTree(data);
    const rootObj = saveMerkleRoot();

    /*
     * Publish data to IPFS via Pinata API and send JSON to client
     */
    const pinOptions = {
      pinataMetadata: {
        name: `Collection Name: ${collectionName}`,
        contact: `Collection Contact: ${userEmail}`,
      },
    };

    // Publish White List
    const pinResponseWhitelist = await pinata.pinJSONToIPFS(data, pinOptions);
    const ipfsURIWhitelist =
      'https://degensweepers.mypinata.cloud/ipfs/' +
      pinResponseWhitelist.IpfsHash;

    // Publish Merkle Root
    const pinResponseRootHash = await pinata.pinJSONToIPFS(rootObj, pinOptions);
    const ipfsURIRootHash =
      'https://degensweepers.mypinata.cloud/ipfs/' +
      pinResponseRootHash.IpfsHash;

    // Publish Merkle Tree Summary
    // to show a mapping of each leaf value to its corresponding hash
    const pinResponseTreeSummary = await pinata.pinJSONToIPFS(
      leafValues,
      pinOptions
    );
    const ipfsURITreeSummary =
      'https://degensweepers.mypinata.cloud/ipfs/' +
      pinResponseTreeSummary.IpfsHash;

    return {
      whitelist: `${ipfsURIWhitelist}`,
      rootHash: `${ipfsURIRootHash}`,
      treeSummary: `${ipfsURITreeSummary}`,
    };
  } catch (e) {
    console.log(e);
  }
};

router.use((req, res, next) => {
  console.log('Test Router Hit at: ', Date.now());
  next();
});

router.post('/generate', async (req, res) => {
  console.log(req.body);
  const sentData = req.body;
  const jsonValues = await generate(sentData);
  res.send(jsonValues);
});

module.exports = router;
