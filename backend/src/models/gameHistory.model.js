const mongoose = require('mongoose');
const { Schema } = mongoose;

const GameHistorySchema = new Schema({
    roomId: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },

    players: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
        symbol: { type: String, enum: ['X', 'O'], required: true },
        isWinner: { type: Boolean, default: false }
    }],

    moves: [{
        player: { type: String, required: true }, // 'X' or 'O'
        position: {
            row: { type: Number, required: true },
            col: { type: Number, required: true }
        },
        timestamp: { type: Date, default: Date.now }
    }],

    winner: {
        type: String,
        enum: ['X', 'O', 'draw', null],
        default: null
    },

    winnerUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    boardSize: {
        type: Number,
        default: 15
    },

    gameMode: {
        type: String,
        enum: ['1P', '2P', 'online'],
        default: 'online'
    },

    duration: {
        type: Number, // seconds
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index để tìm kiếm nhanh game history của user
GameHistorySchema.index({ 'players.userId': 1, createdAt: -1 });

module.exports = mongoose.model('GameHistory', GameHistorySchema);
