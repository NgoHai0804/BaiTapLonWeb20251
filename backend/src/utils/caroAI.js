/**
 * AI Bot cho game Caro sử dụng thuật toán Minimax
 * Hỗ trợ chế độ 1 người chơi (Single Player)
 */

const EMPTY = null;
const HUMAN = 'X';
const AI = 'O';

/**
 * Class AI Bot cho Caro
 */
class CaroAI {
    constructor(boardSize = 15, winCondition = 5) {
        this.boardSize = boardSize;
        this.winCondition = winCondition;
        this.maxDepth = 3; // Giới hạn độ sâu để tránh quá chậm
    }

    /**
     * Hàm chính để AI tìm nước đi tốt nhất
     * @param {Array} board - Bàn cờ hiện tại (2D array)
     * @returns {Object} { row, col } - Vị trí tốt nhất
     */
    getBestMove(board) {
        let bestScore = -Infinity;
        let bestMove = null;

        // Lấy danh sách các nước đi có thể (ô trống gần các quân đã đánh)
        const possibleMoves = this.getPossibleMoves(board);

        if (possibleMoves.length === 0) {
            // Nếu bàn cờ trống, đánh vào giữa
            return {
                row: Math.floor(this.boardSize / 2),
                col: Math.floor(this.boardSize / 2)
            };
        }

        // Thử từng nước đi
        for (const move of possibleMoves) {
            const { row, col } = move;
            board[row][col] = AI;

            // Đánh giá nước đi này
            const score = this.minimax(board, 0, false, -Infinity, Infinity);

            board[row][col] = EMPTY;

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove || possibleMoves[0];
    }

    /**
     * Thuật toán Minimax với Alpha-Beta Pruning
     */
    minimax(board, depth, isMaximizing, alpha, beta) {
        // Kiểm tra điều kiện dừng
        const winner = this.checkWinner(board);

        if (winner === AI) return 1000 - depth;
        if (winner === HUMAN) return -1000 + depth;
        if (depth >= this.maxDepth || this.isBoardFull(board)) {
            return this.evaluateBoard(board);
        }

        const possibleMoves = this.getPossibleMoves(board);

        if (isMaximizing) {
            let maxScore = -Infinity;

            for (const move of possibleMoves) {
                const { row, col } = move;
                board[row][col] = AI;

                const score = this.minimax(board, depth + 1, false, alpha, beta);

                board[row][col] = EMPTY;

                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);

                if (beta <= alpha) break; // Alpha-Beta Pruning
            }

            return maxScore;
        } else {
            let minScore = Infinity;

            for (const move of possibleMoves) {
                const { row, col } = move;
                board[row][col] = HUMAN;

                const score = this.minimax(board, depth + 1, true, alpha, beta);

                board[row][col] = EMPTY;

                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);

                if (beta <= alpha) break; // Alpha-Beta Pruning
            }

            return minScore;
        }
    }

    /**
     * Lấy danh sách các nước đi có thể (ô trống gần các quân đã đánh)
     */
    getPossibleMoves(board) {
        const moves = new Set();
        const range = 2; // Tìm trong bán kính 2 ô xung quanh các quân đã đánh

        // Nếu bàn cờ trống hoàn toàn
        let hasMove = false;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] !== EMPTY) {
                    hasMove = true;
                    break;
                }
            }
            if (hasMove) break;
        }

        if (!hasMove) {
            return [{
                row: Math.floor(this.boardSize / 2),
                col: Math.floor(this.boardSize / 2)
            }];
        }

        // Tìm các ô trống gần các quân đã đánh
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] !== EMPTY) {
                    // Kiểm tra các ô xung quanh
                    for (let di = -range; di <= range; di++) {
                        for (let dj = -range; dj <= range; dj++) {
                            const ni = i + di;
                            const nj = j + dj;

                            if (ni >= 0 && ni < this.boardSize &&
                                nj >= 0 && nj < this.boardSize &&
                                board[ni][nj] === EMPTY) {
                                moves.add(`${ni},${nj}`);
                            }
                        }
                    }
                }
            }
        }

        return Array.from(moves).map(key => {
            const [row, col] = key.split(',').map(Number);
            return { row, col };
        });
    }

    /**
     * Đánh giá bàn cờ (heuristic function)
     */
    evaluateBoard(board) {
        let score = 0;

        // Đánh giá theo hàng
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j <= this.boardSize - this.winCondition; j++) {
                score += this.evaluateLine(board, i, j, 0, 1); // Horizontal
            }
        }

        // Đánh giá theo cột
        for (let i = 0; i <= this.boardSize - this.winCondition; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                score += this.evaluateLine(board, i, j, 1, 0); // Vertical
            }
        }

        // Đánh giá theo đường chéo chính
        for (let i = 0; i <= this.boardSize - this.winCondition; i++) {
            for (let j = 0; j <= this.boardSize - this.winCondition; j++) {
                score += this.evaluateLine(board, i, j, 1, 1); // Diagonal \
            }
        }

        // Đánh giá theo đường chéo phụ
        for (let i = 0; i <= this.boardSize - this.winCondition; i++) {
            for (let j = this.winCondition - 1; j < this.boardSize; j++) {
                score += this.evaluateLine(board, i, j, 1, -1); // Diagonal /
            }
        }

        return score;
    }

    /**
     * Đánh giá một dãy (hàng/cột/đường chéo)
     */
    evaluateLine(board, row, col, deltaRow, deltaCol) {
        let aiCount = 0;
        let humanCount = 0;

        for (let i = 0; i < this.winCondition; i++) {
            const cell = board[row + i * deltaRow][col + i * deltaCol];
            if (cell === AI) aiCount++;
            else if (cell === HUMAN) humanCount++;
        }

        // Nếu có cả AI và Human trong cùng một dãy thì không có giá trị
        if (aiCount > 0 && humanCount > 0) return 0;

        if (aiCount === this.winCondition - 1) return 50;
        if (aiCount === this.winCondition - 2) return 10;
        if (aiCount === this.winCondition - 3) return 5;

        if (humanCount === this.winCondition - 1) return -100; // Chặn người chơi
        if (humanCount === this.winCondition - 2) return -50;
        if (humanCount === this.winCondition - 3) return -10;

        return 0;
    }

    /**
     * Kiểm tra xem có người thắng không
     */
    checkWinner(board) {
        // Kiểm tra hàng
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j <= this.boardSize - this.winCondition; j++) {
                const winner = this.checkLine(board, i, j, 0, 1);
                if (winner) return winner;
            }
        }

        // Kiểm tra cột
        for (let i = 0; i <= this.boardSize - this.winCondition; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const winner = this.checkLine(board, i, j, 1, 0);
                if (winner) return winner;
            }
        }

        // Kiểm tra đường chéo
        for (let i = 0; i <= this.boardSize - this.winCondition; i++) {
            for (let j = 0; j <= this.boardSize - this.winCondition; j++) {
                const winner = this.checkLine(board, i, j, 1, 1);
                if (winner) return winner;
            }
        }

        for (let i = 0; i <= this.boardSize - this.winCondition; i++) {
            for (let j = this.winCondition - 1; j < this.boardSize; j++) {
                const winner = this.checkLine(board, i, j, 1, -1);
                if (winner) return winner;
            }
        }

        return null;
    }

    /**
     * Kiểm tra một dãy có thắng không
     */
    checkLine(board, row, col, deltaRow, deltaCol) {
        const first = board[row][col];
        if (first === EMPTY) return null;

        for (let i = 1; i < this.winCondition; i++) {
            if (board[row + i * deltaRow][col + i * deltaCol] !== first) {
                return null;
            }
        }

        return first;
    }

    /**
     * Kiểm tra bàn cờ đã đầy chưa
     */
    isBoardFull(board) {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === EMPTY) return false;
            }
        }
        return true;
    }
}

module.exports = CaroAI;
