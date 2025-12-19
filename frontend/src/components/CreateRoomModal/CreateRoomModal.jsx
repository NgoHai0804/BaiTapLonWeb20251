import { useState } from 'prop-types';
import PropTypes from 'prop-types';
import { FaTimes, FaLock, FaGamepad, FaUsers } from 'react-icons/fa';
import './CreateRoomModal.css';

const CreateRoomModal = ({ isOpen, onClose, onCreate, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        maxPlayers: 2,
        isPrivate: false,
        password: '',
        gameMode: 'online' // 'online', '1P', '2P'
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate
        if (!formData.name.trim()) {
            alert('Vui lòng nhập tên phòng');
            return;
        }

        if (formData.isPrivate && !formData.password) {
            alert('Vui lòng nhập mật khẩu cho phòng riêng tư');
            return;
        }

        // Create room
        const roomData = {
            ...formData,
            maxPlayers: parseInt(formData.maxPlayers)
        };

        onCreate(roomData);
    };

    const handleReset = () => {
        setFormData({
            name: '',
            maxPlayers: 2,
            isPrivate: false,
            password: '',
            gameMode: 'online'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tạo phòng mới</h2>
                    <button className="btn-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    {/* Room Name */}
                    <div className="form-group">
                        <label htmlFor="name">
                            <FaGamepad /> Tên phòng
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập tên phòng..."
                            maxLength="50"
                            required
                        />
                    </div>

                    {/* Game Mode */}
                    <div className="form-group">
                        <label htmlFor="gameMode">
                            <FaGamepad /> Chế độ chơi
                        </label>
                        <select
                            id="gameMode"
                            name="gameMode"
                            value={formData.gameMode}
                            onChange={handleChange}
                        >
                            <option value="online">Online (2 người)</option>
                            <option value="1P">Người vs AI</option>
                            <option value="2P">Người vs Người (Local)</option>
                        </select>
                    </div>

                    {/* Max Players */}
                    <div className="form-group">
                        <label htmlFor="maxPlayers">
                            <FaUsers /> Số người chơi tối đa
                        </label>
                        <select
                            id="maxPlayers"
                            name="maxPlayers"
                            value={formData.maxPlayers}
                            onChange={handleChange}
                        >
                            <option value="2">2 người</option>
                            <option value="4">4 người (Spectators)</option>
                            <option value="8">8 người (Spectators)</option>
                        </select>
                    </div>

                    {/* Private Room */}
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="isPrivate"
                                checked={formData.isPrivate}
                                onChange={handleChange}
                            />
                            <FaLock className="lock-icon" />
                            <span>Phòng riêng tư (yêu cầu mật khẩu)</span>
                        </label>
                    </div>

                    {/* Password (if private) */}
                    {formData.isPrivate && (
                        <div className="form-group password-group">
                            <label htmlFor="password">
                                <FaLock /> Mật khẩu
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu..."
                                minLength="4"
                                maxLength="20"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleReset}
                        >
                            Làm mới
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Đang tạo...' : 'Tạo phòng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

CreateRoomModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default CreateRoomModal;
