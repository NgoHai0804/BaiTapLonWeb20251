import React, { useEffect, useState } from 'react';
import { userApi } from '../../services/api/userApi';
import { toast } from 'react-toastify';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await userApi.getLeaderboard('caro');
      // Đảm bảo data luôn là array
      if (Array.isArray(data)) {
        setLeaderboard(data);
      } else if (data && Array.isArray(data.data)) {
        // Nếu data là object có property data là array
        setLeaderboard(data.data);
      } else if (data && typeof data === 'object') {
        // Nếu data là object nhưng không phải array, thử convert
        setLeaderboard([]);
        console.warn('Leaderboard data không phải array:', data);
      } else {
        setLeaderboard([]);
      }
    } catch (error) {
      toast.error('Không thể tải bảng xếp hạng');
      console.error('Lỗi khi tải bảng xếp hạng:', error);
      setLeaderboard([]); // Đảm bảo luôn là array ngay cả khi có lỗi
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Bảng xếp hạng</h1>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người chơi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!Array.isArray(leaderboard) || leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    Chưa có dữ liệu xếp hạng
                  </td>
                </tr>
              ) : (
                leaderboard.map((player, index) => (
                  <tr key={player._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                        {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                        {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                        <span className="text-lg font-semibold">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                          {player.avatarUrl ? (
                            <img src={player.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-400">
                              {player.nickname?.[0]?.toUpperCase() || player.username?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {player.nickname || player.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-blue-600">{player.score || 0}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
