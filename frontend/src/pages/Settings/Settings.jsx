import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../services/api/userApi';
import { toast } from 'react-toastify';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState({
    soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
    notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
    theme: localStorage.getItem('theme') || 'light',
  });

  const handleSoundToggle = (enabled) => {
    setSettings(prev => ({ ...prev, soundEnabled: enabled }));
    localStorage.setItem('soundEnabled', enabled.toString());
    toast.success(enabled ? 'Đã bật âm thanh' : 'Đã tắt âm thanh');
  };

  const handleNotificationsToggle = (enabled) => {
    setSettings(prev => ({ ...prev, notificationsEnabled: enabled }));
    localStorage.setItem('notificationsEnabled', enabled.toString());
    toast.success(enabled ? 'Đã bật thông báo' : 'Đã tắt thông báo');
  };

  // Áp dụng theme khi component mount
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleThemeChange = (theme) => {
    setSettings(prev => ({ ...prev, theme }));
    localStorage.setItem('theme', theme);
    // Áp dụng theme ngay lập tức
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success(`Đã chuyển sang giao diện ${theme === 'dark' ? 'tối' : 'sáng'}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cài đặt</h1>

      <div className="space-y-6">
        {/* Sound Settings */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Âm thanh</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Bật âm thanh</p>
              <p className="text-sm text-gray-500">Phát âm thanh khi có nước đi hoặc kết thúc game</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleSoundToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Thông báo</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Bật thông báo</p>
              <p className="text-sm text-gray-500">Nhận thông báo khi có lời mời kết bạn, mời vào phòng</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleNotificationsToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Giao diện</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Chế độ giao diện</p>
              <p className="text-sm text-gray-500">Chọn giao diện sáng hoặc tối</p>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
