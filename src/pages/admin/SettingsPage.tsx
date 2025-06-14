import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Calendar, BookTemplate as Template, Clock, Play } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import JobScheduleManagement from '../../components/admin/JobScheduleManagement';
import { useAuth } from '../../context/AuthContext';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'schedules' | 'notifications'>('schedules');

  React.useEffect(() => {
    if (!user?.roles?.includes('admin')) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  if (!user?.roles?.includes('admin')) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure system-wide settings and automation</p>
        </div>
      </div>

      <Card>
        <Card.Header>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'general' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('general')}
              leftIcon={<Settings className="h-4 w-4" />}
            >
              General
            </Button>
            <Button
              variant={activeTab === 'schedules' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('schedules')}
              leftIcon={<Calendar className="h-4 w-4" />}
            >
              Job Schedules
            </Button>
            <Button
              variant={activeTab === 'notifications' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('notifications')}
              leftIcon={<Clock className="h-4 w-4" />}
            >
              Notifications
            </Button>
          </div>
        </Card.Header>

        <Card.Content>
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">General Settings</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">System Email</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="admin@company.com"
                      defaultValue="admin@boompower.com"
                    />
                  </div>
                  <div>
                    <label className="label">Default Ticket Priority</label>
                    <select className="input">
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Max File Upload Size (MB)</label>
                    <input
                      type="number"
                      className="input"
                      defaultValue="10"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="label">Ticket Auto-Close Days</label>
                    <input
                      type="number"
                      className="input"
                      defaultValue="30"
                      min="1"
                      max="365"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button>Save General Settings</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedules' && <JobScheduleManagement />}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Send email notifications for ticket updates</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-primary" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Overdue Ticket Alerts</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Daily alerts for overdue tickets</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-primary" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Schedule Notifications</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Notifications when scheduled tickets are created</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-primary" defaultChecked />
                  </div>
                </div>
                <div className="mt-6">
                  <Button>Save Notification Settings</Button>
                </div>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default SettingsPage;