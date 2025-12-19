/**
 * ============================================
 * CARO AI - MACHINE LEARNING APPROACH
 * ============================================
 * 
 * Hướng dẫn triển khai AI sử dụng Neural Network
 * để train model chơi Caro thông minh hơn theo thời gian
 * 
 * Technology Stack:
 * - TensorFlow.js (Node.js) hoặc Python (TensorFlow/PyTorch)
 * - Self-play training
 * - Reinforcement Learning (Q-Learning hoặc Policy Gradient)
 */

/**
 * ============================================
 * OPTION 1: TensorFlow.js (Node.js)
 * ============================================
 * 
 * Installation:
 * npm install @tensorflow/tfjs-node
 * 
 * Advantages:
 * - Same language as backend (JavaScript)
 * - Easy integration
 * - Real-time prediction
 * 
 * Disadvantages:
 * - Slower training than Python
 * - Less ML libraries
 */

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

class NeuralNetworkCaroAI {
    constructor(boardSize = 15) {
        this.boardSize = boardSize;
        this.inputSize = boardSize * boardSize * 2; // 2 channels: player, opponent
        this.outputSize = boardSize * boardSize;    // All possible moves

        this.model = this.buildModel();
        this.trainingData = [];
    }

    /**
     * Build Neural Network Model
     */
    buildModel() {
        const model = tf.sequential();

        // Input layer
        model.add(tf.layers.dense({
            inputShape: [this.inputSize],
            units: 256,
            activation: 'relu'
        }));

        // Hidden layers
        model.add(tf.layers.dropout({ rate: 0.3 }));

        model.add(tf.layers.dense({
            units: 512,
            activation: 'relu'
        }));

        model.add(tf.layers.dropout({ rate: 0.3 }));

        model.add(tf.layers.dense({
            units: 256,
            activation: 'relu'
        }));

        // Output layer (probability for each move)
        model.add(tf.layers.dense({
            units: this.outputSize,
            activation: 'softmax'
        }));

        // Compile model
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    /**
     * Convert board state to input tensor
     */
    boardToTensor(board, currentPlayer = 'O') {
        const input = [];

        // Channel 1: Current player positions
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                input.push(board[i][j] === currentPlayer ? 1 : 0);
            }
        }

        // Channel 2: Opponent positions
        const opponent = currentPlayer === 'O' ? 'X' : 'O';
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                input.push(board[i][j] === opponent ? 1 : 0);
            }
        }

        return tf.tensor2d([input]);
    }

    /**
     * Get best move using trained model
     */
    async getBestMove(board) {
        const inputTensor = this.boardToTensor(board);

        // Predict probabilities
        const prediction = await this.model.predict(inputTensor);
        const probabilities = await prediction.array();

        // Get valid moves
        const validMoves = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === null) {
                    const index = i * this.boardSize + j;
                    validMoves.push({ row: i, col: j, prob: probabilities[0][index] });
                }
            }
        }

        // Sort by probability
        validMoves.sort((a, b) => b.prob - a.prob);

        // Cleanup
        inputTensor.dispose();
        prediction.dispose();

        // Return best valid move
        return validMoves.length > 0 ? validMoves[0] : null;
    }

    /**
     * Train model with game data
     */
    async train(gameHistories, epochs = 50) {
        console.log(`Training with ${gameHistories.length} games...`);

        const trainData = this.prepareTrainingData(gameHistories);

        if (trainData.inputs.length === 0) {
            console.log('No training data available');
            return;
        }

        const xs = tf.tensor2d(trainData.inputs);
        const ys = tf.tensor2d(trainData.outputs);

        await this.model.fit(xs, ys, {
            epochs: epochs,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}/${epochs} - loss: ${logs.loss.toFixed(4)} - acc: ${logs.acc.toFixed(4)}`);
                }
            }
        });

        // Cleanup
        xs.dispose();
        ys.dispose();

        console.log('Training completed!');
    }

    /**
     * Prepare training data from game histories
     */
    prepareTrainingData(gameHistories) {
        const inputs = [];
        const outputs = [];

        for (const game of gameHistories) {
            const board = Array(this.boardSize).fill(null).map(() =>
                Array(this.boardSize).fill(null)
            );

            // Replay game
            for (let i = 0; i < game.moves.length; i++) {
                const move = game.moves[i];

                // Current board state as input
                const inputTensor = this.boardToTensor(board, move.player);
                inputs.push(await inputTensor.array().then(arr => arr[0]));
                inputTensor.dispose();

                // Move as output (one-hot encoded)
                const output = new Array(this.outputSize).fill(0);
                const moveIndex = move.position.row * this.boardSize + move.position.col;
                output[moveIndex] = 1;
                outputs.push(output);

                // Apply move to board
                board[move.position.row][move.position.col] = move.player;
            }
        }

        return { inputs, outputs };
    }

    /**
     * Save model to file
     */
    async saveModel(filepath = './models/caro-ai') {
        await this.model.save(`file://${filepath}`);
        console.log(`Model saved to ${filepath}`);
    }

    /**
     * Load model from file
     */
    async loadModel(filepath = './models/caro-ai/model.json') {
        this.model = await tf.loadLayersModel(`file://${filepath}`);
        console.log(`Model loaded from ${filepath}`);
    }
}

module.exports = NeuralNetworkCaroAI;

/**
 * ============================================
 * USAGE EXAMPLE - Training
 * ============================================
 */

/*
const NeuralNetworkCaroAI = require('../utils/neuralNetworkCaroAI');
const GameHistory = require('../models/gameHistory.model');

async function trainAI() {
  // Initialize AI
  const ai = new NeuralNetworkCaroAI(15);

  // Get game histories from database
  const games = await GameHistory.find({
    gameMode: 'online',
    winner: { $ne: 'draw' }
  }).limit(100);

  // Train model
  await ai.train(games, 100);

  // Save trained model
  await ai.saveModel('./models/caro-ai');

  console.log('AI training completed!');
}

// Run training
trainAI().catch(console.error);
*/

/**
 * ============================================
 * USAGE EXAMPLE - Prediction
 * ============================================
 */

/*
const NeuralNetworkCaroAI = require('../utils/neuralNetworkCaroAI');

async function playWithAI() {
  // Initialize and load trained model
  const ai = new NeuralNetworkCaroAI(15);
  await ai.loadModel('./models/caro-ai/model.json');

  // Get current board state
  const board = getCurrentBoard();

  // Get AI move
  const aiMove = await ai.getBestMove(board);
  
  console.log('AI plays:', aiMove);
  // { row: 7, col: 8, prob: 0.87 }
}
*/

/**
 * ============================================
 * REINFORCEMENT LEARNING APPROACH
 * ============================================
 * 
 * For advanced AI, use Reinforcement Learning:
 * 
 * 1. Self-play training
 * 2. Reward system (+1 win, -1 lose, 0 draw)
 * 3. Q-Learning or Policy Gradient
 * 4. Experience replay
 * 
 * This requires more complex implementation.
 * Consider using Python with TensorFlow/PyTorch
 * and expose API endpoint for predictions.
 */

/**
 * ============================================
 * OPTION 2: Python Backend (Recommended)
 * ============================================
 * 
 * For production-grade ML AI, use Python:
 * 
 * 1. Create Python service với Flask/FastAPI
 * 2. Train model với TensorFlow/PyTorch
 * 3. Expose REST API cho predictions
 * 4. Node.js backend gọi Python API
 * 
 * Architecture:
 * 
 * [Node.js Game Server] <--HTTP--> [Python ML Service]
 *       |                               |
 *       |                          [Trained Model]
 *       |                               |
 *   [Database]                    [Training Data]
 * 
 * Example Python API:
 * 
 * # ml_service.py
 * from flask import Flask, request, jsonify
 * import tensorflow as tf
 * 
 * app = Flask(__name__)
 * model = tf.keras.models.load_model('caro_model.h5')
 * 
 * @app.route('/predict', methods=['POST'])
 * def predict():
 *     board = request.json['board']
 *     prediction = model.predict([board])
 *     return jsonify({'move': prediction.tolist()})
 * 
 * # Node.js calling Python API:
 * const response = await axios.post('http://localhost:5000/predict', {
 *   board: currentBoardState
 * });
 * const aiMove = response.data.move;
 */

/**
 * ============================================
 * CONTINUOUS LEARNING
 * ============================================
 * 
 * Setup cron job để train model định kỳ:
 * 
 * 1. Mỗi ngày/tuần, lấy games mới từ DB
 * 2. Re-train model với data mới
 * 3. Evaluate performance
 * 4. Deploy new model nếu better
 * 
 * Metrics to track:
 * - Win rate vs random player
 * - Win rate vs Minimax AI
 * - Average game length
 * - Model accuracy
 */
