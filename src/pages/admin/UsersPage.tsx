import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  PencilLine, 
  UserPlus, 
  Search,
  X,
  AlertCircle,
  Loader2,
  Building,
  Mail,
  KeyRound
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useUserStore } from '../../lib/stores/userStore';
import { useReferenceDataStore } from '../../lib/stores/referenceDataStore';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { User } from '../../types';
import { Role } from '@boom-power/types'
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSendPasswordReset: (user: User) => Promise<void>;
  sendingPasswordReset: boolean;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
  onSendPasswordReset,
  sendingPasswordReset
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Details">
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

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            className="text-warning hover:text-warning/80"
            onClick={() => onSendPasswordReset(user)}
            disabled={sendingPasswordReset}
            loading={sendingPasswordReset}
            leftIcon={<KeyRound className="h-4 w-4" />}
          >
            Reset Password
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { users, loading, error, fetchUsers, updateUser, deleteUser, sendPasswordResetEmail } = useUserStore();
  const { companies, loading: companiesLoading, fetchCompanies } = useReferenceDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    roles: ['read'] as Role[]
  });
  const [inviting, setInviting] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    companyId: '',
    roles: [] as Role[]
  });

  useEffect(() => {
    if (!currentUser?.roles?.includes('admin')) {
      navigate('/');
      return;
    }
    fetchUsers();
    fetchCompanies();
  }, [currentUser, navigate, fetchUsers, fetchCompanies]);

  useEffect(() => {
    if (editingUser) {
      const company = companies.find(c => c.companyName === editingUser.company);
      setEditForm({
        name: editingUser.name || '',
        companyId: company?.id || '',
        roles: editingUser.roles || []
      });
    }
  }, [editingUser, companies]);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleToggle = async (user: User, role: Role) => {
    const newRoles = user.roles.includes(role)
      ? user.roles.filter(r => r !== role)
      : [...user.roles, role];
    
    try {
      await updateUser(user.id, { ...user, roles: newRoles });
      toast.success('User roles updated successfully');
    } catch (error) {
      toast.error('Failed to update user roles');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete ${user.email}?`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, {
        ...editingUser,
        name: editForm.name,
        company: editForm.companyId || '',
        roles: editForm.roles
      });
      toast.success('User profile updated successfully');
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast.error('Failed to update user profile');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteForm.email || inviteForm.roles.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setInviting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: inviteForm.email,
            roles: inviteForm.roles,
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      toast.success(`Invitation sent to ${inviteForm.email}`);
      setIsInviteModalOpen(false);
      setInviteForm({ email: '', roles: ['read'] });
      
      // Refresh user list
      await fetchUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleSendPasswordReset = async (user: User) => {
    try {
      setSendingPasswordReset(true);
      await sendPasswordResetEmail(user.email);
      toast.success('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setSendingPasswordReset(false);
    }
  };

  if (!currentUser?.roles?.includes('admin')) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage user access and permissions</p>
        </div>
        
        <Button
          leftIcon={<UserPlus size={16} />}
          className="mt-4 sm:mt-0"
          onClick={() => setIsInviteModalOpen(true)}
        >
          Invite User
        </Button>
      </div>

      <Card>
        <Card.Header>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <Card.Title>Users</Card.Title>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="input pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </Card.Header>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Roles</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <div className="flex items-center justify-center text-error">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      <span>{error}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{user.name || 'No name'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(['admin', 'edit', 'read'] as Role[]).map((role) => (
                          <button
                            key={role}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRoleToggle(user, role);
                            }}
                            className={`rounded-full px-2 py-1 text-xs font-medium capitalize transition-colors ${
                              user.roles.includes(role)
                                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-900 dark:text-gray-100">
                      {user.company || 'No company'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                      {format(new Date(user.createdAt), 'PP')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        className="mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(user);
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-error hover:text-error/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(user);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        title="Edit User Profile"
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="input"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Enter user's name"
            />
          </div>

          <div>
            <label className="label" htmlFor="company">
              Company
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                id="company"
                className="input pl-9"
                value={editForm.companyId}
                onChange={(e) => setEditForm({ ...editForm, companyId: e.target.value })}
              >
                <option value="">No Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Roles</label>
            <div className="flex flex-wrap gap-2">
              {(['admin', 'edit', 'read'] as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    const newRoles = editForm.roles.includes(role)
                      ? editForm.roles.filter((r) => r !== role)
                      : [...editForm.roles, role];
                    setEditForm({ ...editForm, roles: newRoles });
                  }}
                  className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors ${
                    editForm.roles.includes(role)
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteForm({ email: '', roles: ['read'] });
        }}
        title="Invite New User"
      >
        <form onSubmit={handleInviteUser} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                className="input pl-9"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Roles</label>
            <div className="flex flex-wrap gap-2">
              {(['admin', 'edit', 'read'] as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    const newRoles = inviteForm.roles.includes(role)
                      ? inviteForm.roles.filter((r) => r !== role)
                      : [...inviteForm.roles, role];
                    setInviteForm({ ...inviteForm, roles: newRoles });
                  }}
                  className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors ${
                    inviteForm.roles.includes(role)
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteForm({ email: '', roles: ['read'] });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={inviting} disabled={inviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedUser(null);
          }}
          onSendPasswordReset={handleSendPasswordReset}
          sendingPasswordReset={sendingPasswordReset}
        />
      )}
    </div>
  );
};

export default UsersPage;
