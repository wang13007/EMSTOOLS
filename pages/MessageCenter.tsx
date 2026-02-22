
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { Message } from '../types';
import { messageService } from '../src/services/supabaseService';

export const MessageCenter: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // 从数据库获取消息列表
    // 注意：这里需要传入用户ID，暂时使用一个模拟的用户ID
    const fetchMessages = async () => {
      // 模拟用户ID，实际应用中应该从登录状态获取
      const mockUserId = '1';
      const messageList = await messageService.getMessages(mockUserId);
      // 转换数据格式以匹配前端类型
      const formattedMessages = messageList.map(msg => {
        // 计算相对时间
        const now = new Date();
        const msgTime = new Date(msg.create_time);
        const diffMinutes = Math.floor((now.getTime() - msgTime.getTime()) / (1000 * 60));
        
        let timeText = '';
        if (diffMinutes < 1) {
          timeText = '刚刚';
        } else if (diffMinutes < 60) {
          timeText = `${diffMinutes}分钟前`;
        } else if (diffMinutes < 1440) {
          timeText = `${Math.floor(diffMinutes / 60)}小时前`;
        } else {
          timeText = `${Math.floor(diffMinutes / 1440)}天前`;
        }
        
        return {
          id: msg.id,
          title: msg.title,
          content: msg.content,
          type: msg.type,
          time: timeText,
          read: msg.read
        };
      });
      setMessages(formattedMessages);
    };

    fetchMessages();
  }, []);

  const markAllRead = async () => {
    // 标记所有消息为已读
    for (const msg of messages) {
      if (!msg.read) {
        await messageService.markAsRead(msg.id);
      }
    }
    setMessages(messages.map(m => ({ ...m, read: true })));
  };

  const toggleRead = async (id: string) => {
    const message = messages.find(m => m.id === id);
    if (message) {
      await messageService.markAsRead(id);
      setMessages(messages.map(m => m.id === id ? { ...m, read: !m.read } : m));
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">消息中心</h2>
          <p className="text-slate-500">接收来自系统的报告生成通知、表单填报提醒及平台公告。</p>
        </div>
        <button 
          onClick={markAllRead}
          className="text-sm font-bold text-blue-600 hover:underline"
        >
          全部标记为已读
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {messages.length > 0 ? messages.map(msg => (
          <div 
            key={msg.id} 
            onClick={() => toggleRead(msg.id)}
            className={`p-6 flex gap-4 transition-colors hover:bg-slate-50 cursor-pointer ${!msg.read ? 'bg-blue-50/30' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.type === 'report' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {msg.type === 'report' ? <ICONS.Report className="w-5 h-5" /> : <ICONS.Message className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <h4 className={`font-bold text-slate-900 ${!msg.read ? 'text-blue-700' : ''}`}>{msg.title}</h4>
                <span className="text-xs text-slate-400">{msg.time}</span>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">{msg.content}</p>
            </div>
            {!msg.read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            )}
          </div>
        )) : (
          <div className="p-20 text-center text-slate-400">
            暂无消息
          </div>
        )}
      </div>
    </div>
  );
};
