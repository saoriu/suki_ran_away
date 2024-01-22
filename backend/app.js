const AWS = require('aws-sdk');
const express = require('express');
const serverless = require('aws-serverless-express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');


AWS.config.update({
  region: 'us-east-2',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const app = express();
app.use(cors());
const server = serverless.createServer(app);

app.use(express.json()); // for parsing application/jsonn

app.post('/register', async (req, res) => {
  const { userid, password } = req.body;
  try {
    const existingUser = await getItem({ userid });
    if (existingUser.Item) {
      res.header('Access-Control-Allow-Origin', '*');
      return res.status(400).json({ error: 'That username already exists' });
    }
  } catch (error) {
    res.header('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: error.toString() });
  }
  if (password.length < 6) {
    res.header('Access-Control-Allow-Origin', '*');
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const playerState = {
    userid: userid,
    days: 0,
    energy: 100,
    speed: 3,
    skills: {
      dancing: { level: 1, xp: 0, totalXP: 0 },
      gathering: { level: 1, xp: 0, totalXP: 0 },
      crafting: { level: 1, xp: 0, totalXP: 0 },
    },
    lastDamageTime: Date.now(),
    isDead: false,
    isUnderAttack: false,
    isEating: false,
    isHurt: false,
    JustAte: false,
    isAttacking: false,
    attackBonus: 0, //rare attack moves boost
    luckBonus: 0, //chance to get a rare item from a monster
    fireBonus: 0, //chance to get an event
    defenceBonus: 0, //chance to lower monster damage
    treesBonus: 0, //chance to get more wood
    fishBonus: 0, //chance to get more fish
    bushBonus: 0, //chance to get more berries
    foodBonus: 0, //food extra heal rate
    lastEnergyUpdate: Date.now(),
    selectedAttacks: ['scratch'],
    inventory: [],
    gameTime: 12,
  };

  const user = { userid, password: hashedPassword, playerState };
  try {
    const result = await createItem(user);
    res.header('Access-Control-Allow-Origin', '*');
    res.status(201).json(result);
  } catch (error) {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: error.toString() });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { userid, password } = req.body;
  try {
    const user = await getItem({ userid });
    if (!user) {
      res.header('Access-Control-Allow-Origin', '*');
      res.status(404).json({ error: 'That account does not exist' });
    } else if (user && await bcrypt.compare(password, user.Item.password)) {
      const token = jwt.sign({ userid }, process.env.JWT_SECRET_KEY, { expiresIn: '6h' });
      res.header('Access-Control-Allow-Origin', '*');
      res.json({ token, playerState: user.Item.playerState });
    } else {
      res.header('Access-Control-Allow-Origin', '*');
      res.status(401).json({ error: 'Invalid userid or password' });
    }
  } catch (error) {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: error.toString() });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// POST endpoint to create an item
app.post('/item', authenticateToken, async (req, res) => {
  try {
    const result = await createItem(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.get('/item/:userid', authenticateToken, async (req, res) => {
  try {
    const key = { userid: req.params.userid };
    const result = await getItem(key);
    res.json(result.Item.playerState);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// GET endpoint to read all userids
app.get('/userids', async (req, res) => {
  try {
    const result = await getAllUserIds();
    const userIds = result.Items.map(item => item.userid);
    res.json(userIds);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

// PUT endpoint to update an item
app.put('/playerstate/:userid', authenticateToken, async (req, res) => {
  const key = { userid: req.params.userid };
  const updateExpression = 'set playerState = :playerState';
  const expressionAttributeValues = { ':playerState': req.body };
  try {
    const result = await updateItem(key, updateExpression, expressionAttributeValues);
    res.header('Access-Control-Allow-Origin', '*');
    res.json(result);
  } catch (error) {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: error.toString() });
  }
});

// DELETE endpoint to delete an item
app.delete('/item/:id', authenticateToken, async (req, res) => {
  try {
    const key = { id: req.params.id };
    const result = await deleteItem(key);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});


// Create
function createItem(item) {
  const params = {
    TableName: "GameDataTable",
    Item: item
  };

  return dynamodb.put(params).promise();
}

// Read
function getItem(key) {
  const params = {
    TableName: "GameDataTable",
    Key: key
  };
  return dynamodb.get(params).promise();
}


// Update
function updateItem(key, updateExpression, expressionAttributeValues) {
  const params = {
    TableName: "GameDataTable",
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "UPDATED_NEW"
  };

  return dynamodb.update(params).promise();
}

// Delete
function deleteItem(key) {
  const params = {
    TableName: "GameDataTable",
    Key: key
  };

  return dynamodb.delete(params).promise();
}

// Scan
function getAllUserIds() {
  const params = {
    TableName: "GameDataTable",
    ProjectionExpression: "userid"
  };

  return dynamodb.scan(params).promise();
}

exports.handler = (event, context) => {
  return serverless.proxy(server, event, context, 'PROMISE').promise;
};