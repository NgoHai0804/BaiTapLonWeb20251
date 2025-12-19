/**
 * AI Training Script
 * 
 * Script để train AI model với game histories từ database
 * Run: node scripts/trainAI.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Choose AI type
const USE_NEURAL_NETWORK = false; // Set to true to use ML approach

let AI;
if (USE_NEURAL_NETWORK) {
    AI = require('../src/utils/neuralNetworkCaroAI');
} else {
    AI = require('../src/utils/enhancedCaroAI');
}

const GameHistory = require('../src/models/gameHistory.model');
const logger = require('../src/utils/logger');

/**
 * Main training function
 */
async function trainAI() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/caro-online');
        logger.info('Connected to MongoDB');

        // Get game histories
        logger.info('Fetching game histories...');
        const games = await GameHistory.find({
            gameMode: { $in: ['online', '1P'] },
            winner: { $ne: null }, // Exclude unfinished games
            'moves.0': { $exists: true } // Must have at least one move
        })
            .sort({ createdAt: -1 })
            .limit(1000) // Limit to recent 1000 games
            .lean();

        logger.info(`Found ${games.length} games for training`);

        if (games.length === 0) {
            logger.warn('No training data available. Play some games first!');
            process.exit(0);
        }

        if (USE_NEURAL_NETWORK) {
            // Neural Network Training
            logger.info('Initializing Neural Network AI...');
            const ai = new AI(15);

            logger.info('Starting training...');
            await ai.train(games, 100); // 100 epochs

            // Save model
            logger.info('Saving model...');
            await ai.saveModel('./models/caro-ai');

            logger.info('AI training completed successfully!');

            // Test prediction
            logger.info('Testing prediction...');
            await testPrediction(ai);
        } else {
            // Enhanced Minimax doesn't need training
            // But we can use game data to improve heuristics
            logger.info('Enhanced Minimax AI doesn\'t require training');
            logger.info('Using game data to analyze patterns...');

            analyzeGamePatterns(games);
        }

        // Disconnect
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');

    } catch (error) {
        logger.error(`Training error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Test prediction with sample board
 */
async function testPrediction(ai) {
    const testBoard = Array(15).fill(null).map(() => Array(15).fill(null));

    // Add some moves
    testBoard[7][7] = 'X';
    testBoard[7][8] = 'O';
    testBoard[8][7] = 'X';

    const prediction = await ai.getBestMove(testBoard);
    logger.info('Test prediction:', prediction);
}

/**
 * Analyze game patterns for heuristic improvement
 */
function analyzeGamePatterns(games) {
    const stats = {
        totalGames: games.length,
        xWins: 0,
        oWins: 0,
        draws: 0,
        avgMoves: 0,
        winningPatterns: []
    };

    let totalMoves = 0;

    games.forEach(game => {
        if (game.winner === 'X') stats.xWins++;
        else if (game.winner === 'O') stats.oWins++;
        else if (game.winner === 'draw') stats.draws++;

        totalMoves += game.moves.length;
    });

    stats.avgMoves = totalMoves / games.length;

    logger.info('Game Statistics:');
    logger.info(`Total Games: ${stats.totalGames}`);
    logger.info(`X Wins: ${stats.xWins} (${(stats.xWins / stats.totalGames * 100).toFixed(2)}%)`);
    logger.info(`O Wins: ${stats.oWins} (${(stats.oWins / stats.totalGames * 100).toFixed(2)}%)`);
    logger.info(`Draws: ${stats.draws} (${(stats.draws / stats.totalGames * 100).toFixed(2)}%)`);
    logger.info(`Average Moves per Game: ${stats.avgMoves.toFixed(2)}`);
}

/**
 * Self-play training (for reinforcement learning)
 */
async function selfPlayTraining(iterations = 100) {
    logger.info(`Starting self-play training with ${iterations} iterations...`);

    const ai = new AI(15);
    const trainingGames = [];

    for (let i = 0; i < iterations; i++) {
        logger.info(`Self-play game ${i + 1}/${iterations}`);

        const game = await playSelfPlayGame(ai);
        trainingGames.push(game);

        // Train every 10 games
        if ((i + 1) % 10 === 0 && USE_NEURAL_NETWORK) {
            logger.info('Training on recent games...');
            await ai.train(trainingGames, 10);
            trainingGames.length = 0; // Clear
        }
    }

    if (USE_NEURAL_NETWORK) {
        logger.info('Saving final model...');
        await ai.saveModel('./models/caro-ai-selfplay');
    }

    logger.info('Self-play training completed!');
}

/**
 * Play one self-play game
 */
async function playSelfPlayGame(ai) {
    const board = Array(15).fill(null).map(() => Array(15).fill(null));
    const moves = [];
    let currentPlayer = 'X';
    let winner = null;
    let moveCount = 0;
    const maxMoves = 225; // 15x15

    while (!winner && moveCount < maxMoves) {
        // AI makes move
        const move = USE_NEURAL_NETWORK
            ? await ai.getBestMove(board)
            : ai.getBestMove(board);

        if (!move) break;

        // Apply move
        board[move.row][move.col] = currentPlayer;
        moves.push({
            player: currentPlayer,
            position: { row: move.row, col: move.col }
        });

        // Check winner
        winner = ai.checkWinner ? ai.checkWinner(board) : null;

        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        moveCount++;
    }

    return {
        moves,
        winner: winner || 'draw',
        duration: moveCount
    };
}

// Run training
const args = process.argv.slice(2);
const mode = args[0] || 'normal'; // 'normal' or 'selfplay'

if (mode === 'selfplay') {
    selfPlayTraining(100).catch(console.error);
} else {
    trainAI().catch(console.error);
}
