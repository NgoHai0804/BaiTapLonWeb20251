import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useAudio } from '../../hooks/useAudio';
import { FaTrophy, FaHandshake, FaTimes } from 'react-icons/fa';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import './GameResultModal.css';

const GameResultModal = ({ isOpen, result, onClose, onRematch, onExit }) => {
    const { playWin, playLose, playDraw } = useAudio();
    const { width, height } = useWindowSize();

    useEffect(() => {
        if (isOpen) {
            // Play sound based on result
            if (result === 'win') playWin();
            else if (result === 'lose') playLose();
            else if (result === 'draw') playDraw();
        }
    }, [isOpen, result, playWin, playLose, playDraw]);

    const getResultConfig = () => {
        switch (result) {
            case 'win':
                return {
                    title: 'Chiến thắng!',
                    icon: <FaTrophy />,
                    className: 'result-win',
                    confetti: true,
                    message: 'Chúc mừng! Bạn đã thắng!'
                };
            case 'lose':
                return {
                    title: 'Thất bại',
                    icon: <FaTimes />,
                    className: 'result-lose',
                    confetti: false,
                    message: 'Cố gắng thêm lần sau nhé!'
                };
            case 'draw':
                return {
                    title: 'Hòa',
                    icon: <FaHandshake />,
                    className: 'result-draw',
                    confetti: false,
                    message: 'Trận đấu hòa!'
                };
            default:
                return {};
        }
    };

    const config = getResultConfig();

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.3 }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.2 }
        }
    };

    const modalVariants = {
        hidden: {
            scale: 0,
            rotate: -180,
            opacity: 0
        },
        visible: {
            scale: 1,
            rotate: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                damping: 15,
                stiffness: 200,
                duration: 0.6
            }
        },
        exit: {
            scale: 0,
            rotate: 180,
            opacity: 0,
            transition: { duration: 0.3 }
        }
    };

    const iconVariants = {
        hidden: { scale: 0, rotate: -360 },
        visible: {
            scale: 1,
            rotate: 0,
            transition: {
                delay: 0.3,
                type: 'spring',
                damping: 10,
                stiffness: 200
            }
        }
    };

    const buttonVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: (i) => ({
            y: 0,
            opacity: 1,
            transition: { delay: 0.5 + i * 0.1 }
        }),
        hover: {
            scale: 1.05,
            transition: { duration: 0.2 }
        },
        tap: { scale: 0.95 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Confetti for win */}
                    {config.confetti && (
                        <Confetti
                            width={width}
                            height={height}
                            recycle={false}
                            numberOfPieces={500}
                            gravity={0.3}
                        />
                    )}

                    {/* Overlay */}
                    <motion.div
                        className="game-result-overlay"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    >
                        {/* Modal */}
                        <motion.div
                            className={`game-result-modal ${config.className}`}
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Icon */}
                            <motion.div
                                className="result-icon"
                                variants={iconVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {config.icon}
                            </motion.div>

                            {/* Title with text animation */}
                            <motion.h1
                                className="result-title"
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                {config.title}
                            </motion.h1>

                            {/* Message */}
                            <motion.p
                                className="result-message"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                {config.message}
                            </motion.p>

                            {/* Buttons */}
                            <div className="result-buttons">
                                <motion.button
                                    className="btn-rematch"
                                    variants={buttonVariants}
                                    custom={0}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={onRematch}
                                >
                                    Chơi lại
                                </motion.button>

                                <motion.button
                                    className="btn-exit"
                                    variants={buttonVariants}
                                    custom={1}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={onExit}
                                >
                                    Thoát
                                </motion.button>
                            </div>

                            {/* Decorative elements */}
                            {result === 'win' && (
                                <>
                                    <motion.div
                                        className="star star-1"
                                        animate={{
                                            rotate: 360,
                                            scale: [1, 1.2, 1],
                                        }}
                                        transition={{
                                            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                                            scale: { duration: 2, repeat: Infinity }
                                        }}
                                    >
                                        ⭐
                                    </motion.div>
                                    <motion.div
                                        className="star star-2"
                                        animate={{
                                            rotate: -360,
                                            scale: [1, 1.3, 1],
                                        }}
                                        transition={{
                                            rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                                            scale: { duration: 2.5, repeat: Infinity, delay: 0.5 }
                                        }}
                                    >
                                        ⭐
                                    </motion.div>
                                    <motion.div
                                        className="star star-3"
                                        animate={{
                                            rotate: 360,
                                            scale: [1, 1.4, 1],
                                        }}
                                        transition={{
                                            rotate: { duration: 18, repeat: Infinity, ease: "linear" },
                                            scale: { duration: 3, repeat: Infinity, delay: 1 }
                                        }}
                                    >
                                        ⭐
                                    </motion.div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

GameResultModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    result: PropTypes.oneOf(['win', 'lose', 'draw']).isRequired,
    onClose: PropTypes.func.isRequired,
    onRematch: PropTypes.func.isRequired,
    onExit: PropTypes.func.isRequired
};

export default GameResultModal;
