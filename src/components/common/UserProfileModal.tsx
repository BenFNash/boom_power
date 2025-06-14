import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { User } from '../../types';
import { format } from 'date-fns';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Profile">
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <p className="text-gray-900 dark:text-gray-100">{user.name || 'Not set'}</p>
        </div>

        <div>
          <label className="label">Email</label>
          <p className="text-gray-900 dark:text-gray-100">{user.email}</p>
        </div>

        <div>
          <label className="label">Company</label>
          <p className="text-gray-900 dark:text-gray-100">{user.company || 'Not assigned'}</p>
        </div>

        <div>
          <label className="label">Roles</label>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium capitalize text-primary dark:bg-primary/20 dark:text-primary-light"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Member Since</label>
          <p className="text-gray-900 dark:text-gray-100">
            {format(new Date(user.createdAt), 'PP')}
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserProfileModal;