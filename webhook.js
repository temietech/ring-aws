import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse amplify_outputs.json
let outputs = {};
const outputsPath = path.resolve(__dirname, 'amplify_outputs.json');

if (fs.existsSync(outputsPath)) {
  try {
    const rawContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(rawContent);
  } catch (err) {
    console.warn('[webhook] Warning: could not parse amplify_outputs.json:', err.message);
  }
}

// 1. Extract AWS Region
const region =
  process.env.AWS_REGION ||
  outputs?.data?.aws_region ||
  outputs?.aws_region ||
  'us-east-1';

// 2. Extract DynamoDB Table Name for RingAlert
function extractTableName(cfg) {
  if (process.env.RING_ALERT_TABLE_NAME) {
    return process.env.RING_ALERT_TABLE_NAME;
  }
  if (process.env.DYNAMODB_TABLE) {
    return process.env.DYNAMODB_TABLE;
  }
  // Check outputs.data.tables
  if (cfg?.data?.tables?.RingAlert) {
    return cfg.data.tables.RingAlert;
  }
  if (cfg?.data?.tables) {
    const matchedKey = Object.keys(cfg.data.tables).find((key) =>
      key.toLowerCase().includes('ringalert')
    );
    if (matchedKey) return cfg.data.tables[matchedKey];
  }
  // Check custom output fields
  if (cfg?.custom?.RingAlertTableName) {
    return cfg.custom.RingAlertTableName;
  }
  if (cfg?.custom?.tableName) {
    return cfg.custom.tableName;
  }

  // Scan JSON string for potential generated table name
  const raw = JSON.stringify(cfg || {});
  const match = raw.match(/"([^"]*RingAlert[^"]*)"/i);
  if (match && match[1] && !match[1].startsWith('http')) {
    return match[1];
  }

  return 'RingAlert';
}

const tableName = extractTableName(outputs);

console.log('--------------------------------------------------');
console.log('Perimeter Defense Webhook Configuration:');
console.log(`- AWS Region:   ${region}`);
console.log(`- DynamoDB:     ${tableName}`);
console.log('--------------------------------------------------');

// Initialize DynamoDB Client
const dynamoClient = new DynamoDBClient({ region });

const app = express();
app.use(express.json());

// Health & Info Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Perimeter Defense Ring Webhook',
    region,
    table: tableName,
    instructions: 'Send a POST request to /ring to trigger an alert.',
  });
});

// POST /ring Endpoint
app.post('/ring', async (req, res) => {
  try {
    const id = Date.now().toString();
    const threatType = req.body?.threatType || 'BALACLAVA / FACE COVERING DETECTED';
    const status = req.body?.status || 'ACTIVE';
    const imageUrl =
      req.body?.imageUrl ||
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80';

    const item = {
      id: { S: id },
      threatType: { S: threatType },
      status: { S: status },
      imageUrl: { S: imageUrl },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() },
      __typename: { S: 'RingAlert' },
    };

    const command = new PutItemCommand({
      TableName: tableName,
      Item: item,
    });

    console.log(`[POST /ring] Writing alert (id: ${id}, threat: ${threatType}, status: ${status}) to DynamoDB...`);
    await dynamoClient.send(command);

    return res.status(200).json({
      success: true,
      message: 'Alert published to DynamoDB successfully',
      data: {
        id,
        threatType,
        status,
        imageUrl,
        table: tableName,
        region,
      },
    });
  } catch (error) {
    console.error('[POST /ring] DynamoDB PutItem error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      table: tableName,
      region,
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Perimeter Defense Webhook server listening on http://localhost:${PORT}`);
});
