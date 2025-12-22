import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import './Loading.css';

const Loading = ({
    size = 'medium', // 'small', 'medium', 'large'
    fullScreen = false,
    text = 'Đang tải...',
    variant = 'spin' // 'spin', 'dots', 'pulse', 'bars'
}) => {
    const renderLoader = () => {
        switch (variant) {
            case 'spin':
                return (
                    <motion.div
                        className={`loader-spin ${size}`}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                );

            case 'dots':
                return (
                    <div className={`loader-dots ${size}`}>
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="dot"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [1, 0.5, 1]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                            />
                        ))}
                    </div>
                );

            case 'pulse':
                return (
                    <motion.div
                        className={`loader-pulse ${size}`}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity
                        }}
                    />
                );

            case 'bars':
                return (
                    <div className={`loader-bars ${size}`}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                className="bar"
                                animate={{
                                    scaleY: [1, 2, 1]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.1
                                }}
                            />
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    const content = (
        <div className={`loading-content ${size}`}>
            {renderLoader()}
            {text && (
                <motion.p
                    className="loading-text"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <motion.div
                className="loading-fullscreen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {content}
            </motion.div>
        );
    }

    return content;
};

Loading.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    fullScreen: PropTypes.bool,
    text: PropTypes.string,
    variant: PropTypes.oneOf(['spin', 'dots', 'pulse', 'bars'])
};

export default Loading;
