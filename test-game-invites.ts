/**
 * Test Script for Game Invite Feature
 * 
 * This script demonstrates how to test the game invite functionality
 * using WebSocket connections.
 * 
 * To run this test:
 * 1. Start the Chat-Service backend: npm run dev
 * 2. Run this script with two different user IDs
 */

import WebSocket from 'ws';

const CHAT_SERVICE_URL = 'ws://localhost:3002'; // Adjust port as needed

interface GameInviteMessage {
  kind: 'notification/new';
  type: 'GAME_INVITE' | 'GAME_INVITE_ACCEPTED' | 'GAME_INVITE_DECLINED';
  recipientId: string;
  senderId: string;
  content: string;
  ts: number;
}

/**
 * Create a WebSocket connection for a user
 */
function connectUser(userId: string): WebSocket {
  const ws = new WebSocket(`${CHAT_SERVICE_URL}?userId=${userId}`);
  
  ws.on('open', () => {
    console.log(`[${userId}] Connected to chat service`);
  });
  
  ws.on('message', (data: Buffer) => {
    const message = JSON.parse(data.toString());
    console.log(`[${userId}] Received:`, JSON.stringify(message, null, 2));
  });
  
  ws.on('error', (error) => {
    console.error(`[${userId}] WebSocket error:`, error);
  });
  
  ws.on('close', () => {
    console.log(`[${userId}] Disconnected`);
  });
  
  return ws;
}

/**
 * Send a game invite from one user to another
 */
function sendGameInvite(ws: WebSocket, senderId: string, recipientId: string): void {
  const message: GameInviteMessage = {
    kind: 'notification/new',
    type: 'GAME_INVITE',
    recipientId,
    senderId,
    content: `${senderId} invited you to play a game!`,
    ts: Date.now()
  };
  
  console.log(`[${senderId}] Sending game invite to ${recipientId}`);
  ws.send(JSON.stringify(message));
}

/**
 * Respond to a game invite
 */
function respondToGameInvite(
  ws: WebSocket,
  senderId: string,
  recipientId: string,
  accepted: boolean
): void {
  const message: GameInviteMessage = {
    kind: 'notification/new',
    type: accepted ? 'GAME_INVITE_ACCEPTED' : 'GAME_INVITE_DECLINED',
    recipientId,
    senderId,
    content: accepted 
      ? `${senderId} accepted your game invite!`
      : `${senderId} declined your game invite.`,
    ts: Date.now()
  };
  
  console.log(`[${senderId}] ${accepted ? 'Accepting' : 'Declining'} game invite from ${recipientId}`);
  ws.send(JSON.stringify(message));
}

/**
 * Test scenario: User A invites User B, User B accepts
 */
async function testGameInviteFlow() {
  console.log('=== Starting Game Invite Test ===\n');
  
  const userA = 'testUserA';
  const userB = 'testUserB';
  
  // Connect both users
  const wsA = connectUser(userA);
  const wsB = connectUser(userB);
  
  // Wait for connections to establish
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // User A sends game invite to User B
  sendGameInvite(wsA, userA, userB);
  
  // Wait for message to be delivered
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // User B accepts the game invite
  respondToGameInvite(wsB, userB, userA, true);
  
  // Wait for response to be delivered
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Close connections
  wsA.close();
  wsB.close();
  
  console.log('\n=== Test Complete ===');
}

/**
 * Test scenario: User A invites User B, User B declines
 */
async function testGameInviteDecline() {
  console.log('=== Starting Game Invite Decline Test ===\n');
  
  const userA = 'testUserC';
  const userB = 'testUserD';
  
  // Connect both users
  const wsA = connectUser(userA);
  const wsB = connectUser(userB);
  
  // Wait for connections to establish
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // User A sends game invite to User B
  sendGameInvite(wsA, userA, userB);
  
  // Wait for message to be delivered
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // User B declines the game invite
  respondToGameInvite(wsB, userB, userA, false);
  
  // Wait for response to be delivered
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Close connections
  wsA.close();
  wsB.close();
  
  console.log('\n=== Test Complete ===');
}

// Run the tests
if (require.main === module) {
  (async () => {
    try {
      await testGameInviteFlow();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await testGameInviteDecline();
      process.exit(0);
    } catch (error) {
      console.error('Test failed:', error);
      process.exit(1);
    }
  })();
}

export { connectUser, sendGameInvite, respondToGameInvite };
