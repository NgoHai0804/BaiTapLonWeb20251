/**
 * Advanced Caro AI - Machine Learning Approach
 * 
 * Hướng 1: Thuật toán nâng cao (Minimax + heuristics)
 * Hướng 2: Neural Network (Training & Prediction)
 * 
 * File này cung cấp cả 2 approach để developer lựa chọn
 */

const CaroAI = require('./caroAI'); // Base Minimax AI

/**
 * ============================================
 * HƯỚNG 1: ENHANCED MINIMAX AI
 * ============================================
 * 
 * Cải tiến thuật toán Minimax với:
 * - Pattern recognition (Nhận diện pattern)
 * - Threat detection (Phát hiện mối đe dọa)
 * - Strategic positioning (Vị trí chiến lược)
 * - Opening book (Khai cuộc)
 */

class EnhancedCaroAI extends CaroAI {
    constructor(boardSize = 15, winCondition = 5) {
        super(boardSize, winCondition);

        // Threat levels
        this.THREAT_LEVELS = {
            FIVE: 100000,    // Win instantly
            OPEN_FOUR: 50000, // 4 in a row với 2 đầu trống
            FOUR: 10000,     // 4 in a row 1 đầu bị chặn
            OPEN_THREE: 1000, // 3 in a row 2 đầu trống
            THREE: 100,      // 3 in a row 1 đầu bị chặn
            OPEN_TWO: 10,    // 2 in a row 2 đầu trống
            TWO: 1           // 2 in a row 1 đầu bị chặn
        };

        // Opening book (các nước đầu tốt)
        this.openingMoves = [
            { row: 7, col: 7 },   // Center
            { row: 6, col: 6 },   // Near center
            { row: 6, col: 8 },
            { row: 8, col: 6 },
            { row: 8, col: 8 }
        ];
    }

    /**
     * Override getBestMove với pattern recognition
     */
    getBestMove(board) {
        // Check if it's opening move
        const moveCount = this.countMoves(board);
        if (moveCount === 0) {
            return this.openingMoves[0]; // Center
        }
        if (moveCount === 1) {
            return this.getBestOpeningResponse(board);
        }

        // Check for immediate win
        const winMove = this.findWinningMove(board, 'O');
        if (winMove) return winMove;

        // Check for blocking opponent's win
        const blockMove = this.findWinningMove(board, 'X');
        if (blockMove) return blockMove;

        // Check for creating open-four (4 liên tiếp 2 đầu trống)
        const openFourMove = this.findOpenFourMove(board, 'O');
        if (openFourMove) return openFourMove;

        // Check for blocking opponent's open-three
        const blockOpenThree = this.findOpenThreeMove(board, 'X');
        if (blockOpenThree) return blockOpenThree;

        // Use Minimax with enhanced evaluation
        return super.getBestMove(board);
    }

    /**
     * Count total moves on board
     */
    countMoves(board) {
        let count = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] !== null) count++;
            }
        }
        return count;
    }

    /**
     * Get best opening response
     */
    getBestOpeningResponse(board) {
        // Find opponent's move
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === 'X') {
                    // Play adjacent to opponent
                    const adjacent = [
                        { row: i - 1, col: j - 1 },
                        { row: i - 1, col: j + 1 },
                        { row: i + 1, col: j - 1 },
                        { row: i + 1, col: j + 1 }
                    ];

                    for (const pos of adjacent) {
                        if (pos.row >= 0 && pos.row < this.boardSize &&
                            pos.col >= 0 && pos.col < this.boardSize &&
                            board[pos.row][pos.col] === null) {
                            return pos;
                        }
                    }
                }
            }
        }
        return this.openingMoves[1];
    }

    /**
     * Find winning move (5 in a row)
     */
    findWinningMove(board, player) {
        const possibleMoves = this.getPossibleMoves(board);

        for (const move of possibleMoves) {
            board[move.row][move.col] = player;

            if (this.checkWinner(board) === player) {
                board[move.row][move.col] = null;
                return move;
            }

            board[move.row][move.col] = null;
        }

        return null;
    }

    /**
     * Find move that creates open-four (4 liên tiếp 2 đầu trống)
     */
    findOpenFourMove(board, player) {
        const possibleMoves = this.getPossibleMoves(board);

        for (const move of possibleMoves) {
            board[move.row][move.col] = player;

            if (this.hasOpenFour(board, player)) {
                board[move.row][move.col] = null;
                return move;
            }

            board[move.row][move.col] = null;
        }

        return null;
    }

    /**
     * Find open-three move
     */
    findOpenThreeMove(board, player) {
        const possibleMoves = this.getPossibleMoves(board);

        for (const move of possibleMoves) {
            board[move.row][move.col] = player;

            if (this.hasOpenThree(board, player)) {
                board[move.row][move.col] = null;
                return move;
            }

            board[move.row][move.col] = null;
        }

        return null;
    }

    /**
     * Check if player has open-four (4 liên tiếp 2 đầu trống)
     */
    hasOpenFour(board, player) {
        // Check all directions
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Diagonal \
            { dr: 1, dc: -1 }  // Diagonal /
        ];

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                for (const dir of directions) {
                    if (this.checkOpenPattern(board, i, j, dir.dr, dir.dc, player, 4)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Check if player has open-three
     */
    hasOpenThree(board, player) {
        const directions = [
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: -1 }
        ];

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                for (const dir of directions) {
                    if (this.checkOpenPattern(board, i, j, dir.dr, dir.dc, player, 3)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Check for open pattern (n quân liên tiếp với 2 đầu trống)
     */
    checkOpenPattern(board, row, col, dr, dc, player, length) {
        // Check previous cell is empty
        const prevRow = row - dr;
        const prevCol = col - dc;

        if (prevRow < 0 || prevRow >= this.boardSize ||
            prevCol < 0 || prevCol >= this.boardSize ||
            board[prevRow][prevCol] !== null) {
            return false;
        }

        // Check pattern
        let count = 0;
        for (let i = 0; i < length; i++) {
            const r = row + i * dr;
            const c = col + i * dc;

            if (r < 0 || r >= this.boardSize ||
                c < 0 || c >= this.boardSize ||
                board[r][c] !== player) {
                return false;
            }
            count++;
        }

        // Check next cell is empty
        const nextRow = row + length * dr;
        const nextCol = col + length * dc;

        if (nextRow < 0 || nextRow >= this.boardSize ||
            nextCol < 0 || nextCol >= this.boardSize ||
            board[nextRow][nextCol] !== null) {
            return false;
        }

        return count === length;
    }

    /**
     * Enhanced evaluation với pattern recognition
     */
    evaluateBoard(board) {
        let score = 0;

        // Evaluate patterns
        score += this.evaluatePatterns(board, 'O') * 1;
        score -= this.evaluatePatterns(board, 'X') * 1.1; // Defensive weight

        // Evaluate position control
        score += this.evaluatePositionControl(board);

        return score;
    }

    /**
     * Evaluate patterns for player
     */
    evaluatePatterns(board, player) {
        let score = 0;

        // Count different patterns
        const patterns = this.findPatterns(board, player);

        score += patterns.five * this.THREAT_LEVELS.FIVE;
        score += patterns.openFour * this.THREAT_LEVELS.OPEN_FOUR;
        score += patterns.four * this.THREAT_LEVELS.FOUR;
        score += patterns.openThree * this.THREAT_LEVELS.OPEN_THREE;
        score += patterns.three * this.THREAT_LEVELS.THREE;
        score += patterns.openTwo * this.THREAT_LEVELS.OPEN_TWO;
        score += patterns.two * this.THREAT_LEVELS.TWO;

        return score;
    }

    /**
     * Find all patterns for player
     */
    findPatterns(board, player) {
        const patterns = {
            five: 0,
            openFour: 0,
            four: 0,
            openThree: 0,
            three: 0,
            openTwo: 0,
            two: 0
        };

        const directions = [
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: -1 }
        ];

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                for (const dir of directions) {
                    const pattern = this.getPatternAtPosition(board, i, j, dir.dr, dir.dc, player);

                    if (pattern.length === 5) patterns.five++;
                    else if (pattern.length === 4 && pattern.open === 2) patterns.openFour++;
                    else if (pattern.length === 4) patterns.four++;
                    else if (pattern.length === 3 && pattern.open === 2) patterns.openThree++;
                    else if (pattern.length === 3) patterns.three++;
                    else if (pattern.length === 2 && pattern.open === 2) patterns.openTwo++;
                    else if (pattern.length === 2) patterns.two++;
                }
            }
        }

        return patterns;
    }

    /**
     * Get pattern at specific position and direction
     */
    getPatternAtPosition(board, row, col, dr, dc, player) {
        if (board[row][col] !== player) {
            return { length: 0, open: 0 };
        }

        let length = 0;
        let openEnds = 0;

        // Count consecutive pieces
        let r = row, c = col;
        while (r >= 0 && r < this.boardSize &&
            c >= 0 && c < this.boardSize &&
            board[r][c] === player) {
            length++;
            r += dr;
            c += dc;
        }

        // Check if end is open
        if (r >= 0 && r < this.boardSize &&
            c >= 0 && c < this.boardSize &&
            board[r][c] === null) {
            openEnds++;
        }

        // Check other end
        r = row - dr;
        c = col - dc;
        if (r >= 0 && r < this.boardSize &&
            c >= 0 && c < this.boardSize &&
            board[r][c] === null) {
            openEnds++;
        }

        return { length, open: openEnds };
    }

    /**
     * Evaluate position control (center, corners, edges)
     */
    evaluatePositionControl(board) {
        let score = 0;
        const center = Math.floor(this.boardSize / 2);

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === 'O') {
                    // Distance from center (closer is better)
                    const distFromCenter = Math.abs(i - center) + Math.abs(j - center);
                    score += (this.boardSize - distFromCenter) * 2;
                }
            }
        }

        return score;
    }
}

module.exports = EnhancedCaroAI;

/**
 * ============================================
 * USAGE EXAMPLE
 * ============================================
 */

/*
// Backend - Game controller
const EnhancedCaroAI = require('../utils/enhancedCaroAI');

// Initialize AI với difficulty
const ai = new EnhancedCaroAI(15, 5);

// Get AI move
const board = getCurrentBoardState();
const aiMove = ai.getBestMove(board);

console.log('AI plays:', aiMove); // { row: 7, col: 8 }
*/
