import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Archive,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useReferenceDataStore } from '../../lib/stores/referenceDataStore';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO, isValid } from 'date-fns';
import toast from 'react-hot-toast';

interface FormData {
  companyName?: string;
  siteName?: string;
  ownerName?: string;
  contactName?: string;
  contactEmail?: string;
  companyId?: string;
}

const ReferenceDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'companies' | 'sites' | 'owners' | 'contacts'
  >('companies');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const {
    companies,
    sites,
    siteOwners,
    companyContacts,
    loading,
    error,
    fetchCompanies,
    fetchSites,
    fetchSiteOwners,
    fetchCompanyContacts,
    createCompany,
    createSite,
    createSiteOwner,
    createCompanyContact,
    updateCompany,
    updateSite,
    updateSiteOwner,
    updateCompanyContact,
  } = useReferenceDataStore();

  useEffect(() => {
    if (!user?.roles?.includes('admin')) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      switch (activeTab) {
        case 'companies':
          await fetchCompanies(showInactive);
          break;
        case 'sites':
          await fetchSites(showInactive);
          break;
        case 'owners':
          await fetchSiteOwners(showInactive);
          break;
        case 'contacts':
          await fetchCompanyContacts(showInactive);
          await fetchCompanies(); // Need companies for the dropdown
          break;
      }
    };
    loadData();
  }, [
    activeTab,
    showInactive,
    fetchCompanies,
    fetchSites,
    fetchSiteOwners,
    fetchCompanyContacts,
    user,
    navigate,
  ]);

  const handleCreate = () => {
    setFormData({});
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    let data: FormData = {};
    switch (activeTab) {
      case 'companies':
        data = { companyName: companies.find((c) => c.id === id)?.companyName };
        break;
      case 'sites':
        data = { siteName: sites.find((s) => s.id === id)?.siteName };
        break;
      case 'owners':
        data = { ownerName: siteOwners.find((o) => o.id === id)?.ownerName };
        break;
      case 'contacts':
        const contact = companyContacts.find((c) => c.id === id);
        data = {
          contactName: contact?.contactName,
          contactEmail: contact?.contactEmail,
          companyId: contact?.companyId,
        };
        break;
    }
    setFormData(data);
    setEditingId(id);
    setIsModalOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this item?')) {
      return;
    }

    try {
      switch (activeTab) {
        case 'companies':
          await updateCompany(id, { active: false });
          break;
        case 'sites':
          await updateSite(id, { active: false });
          break;
        case 'owners':
          await updateSiteOwner(id, { active: false });
          break;
        case 'contacts':
          await updateCompanyContact(id, { active: false });
          break;
      }
      toast.success('Item archived successfully');
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive item');
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      switch (activeTab) {
        case 'companies':
          await updateCompany(id, { active: true });
          break;
        case 'sites':
          await updateSite(id, { active: true });
          break;
        case 'owners':
          await updateSiteOwner(id, { active: true });
          break;
        case 'contacts':
          await updateCompanyContact(id, { active: true });
          break;
      }
      toast.success('Item unarchived successfully');
    } catch (error) {
      console.error('Unarchive error:', error);
      toast.error('Failed to unarchive item');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      switch (activeTab) {
        case 'companies':
          if (editingId) {
            await updateCompany(editingId, {
              companyName: formData.companyName!,
            });
          } else {
            await createCompany({ companyName: formData.companyName! });
          }
          break;
        case 'sites':
          if (editingId) {
            await updateSite(editingId, { siteName: formData.siteName! });
          } else {
            await createSite({ siteName: formData.siteName! });
          }
          break;
        case 'owners':
          if (editingId) {
            await updateSiteOwner(editingId, {
              ownerName: formData.ownerName!,
            });
          } else {
            await createSiteOwner({ ownerName: formData.ownerName! });
          }
          break;
        case 'contacts':
          if (editingId) {
            await updateCompanyContact(editingId, {
              companyId: formData.companyId!,
              contactName: formData.contactName!,
              contactEmail: formData.contactEmail!,
            });
          } else {
            await createCompanyContact({
              companyId: formData.companyId!,
              contactName: formData.contactName!,
              contactEmail: formData.contactEmail!,
            });
          }
          break;
      }
      toast.success(`${editingId ? 'Updated' : 'Created'} successfully`);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(`Failed to ${editingId ? 'update' : 'create'} item`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'PP') : '-';
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'companies':
        return (
          <div>
            <label className="label">Company Name</label>
            <input
              type="text"
              className="input"
              value={formData.companyName || ''}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              required
            />
          </div>
        );
      case 'sites':
        return (
          <div>
            <label className="label">Site Name</label>
            <input
              type="text"
              className="input"
              value={formData.siteName || ''}
              onChange={(e) =>
                setFormData({ ...formData, siteName: e.target.value })
              }
              required
            />
          </div>
        );
      case 'owners':
        return (
          <div>
            <label className="label">Owner Name</label>
            <input
              type="text"
              className="input"
              value={formData.ownerName || ''}
              onChange={(e) =>
                setFormData({ ...formData, ownerName: e.target.value })
              }
              required
            />
          </div>
        );
      case 'contacts':
        return (
          <div className="space-y-4">
            <div>
              <label className="label">Company</label>
              <select
                className="input"
                value={formData.companyId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, companyId: e.target.value })
                }
                required
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Contact Name</label>
              <input
                type="text"
                className="input"
                value={formData.contactName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Contact Email</label>
              <input
                type="email"
                className="input"
                value={formData.contactEmail || ''}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                required
              />
            </div>
          </div>
        );
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-64 items-center justify-center text-error">
          <AlertCircle className="mr-2 h-5 w-5" />
          <span>{error}</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'companies':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className={
                      company.active === false
                        ? 'bg-gray-50 dark:bg-gray-800/50'
                        : ''
                    }
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      {company.companyName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatDate(company.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          company.active === false
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {company.active === false ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {company.active === false ? (
                        <Button
                          variant="ghost"
                          className="text-primary dark:text-primary-light"
                          onClick={() => handleUnarchive(company.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className="mr-2"
                            onClick={() => handleEdit(company.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-gray-600"
                            onClick={() => handleArchive(company.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'sites':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Site Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sites.map((site) => (
                  <tr
                    key={site.id}
                    className={
                      site.active === false
                        ? 'bg-gray-50 dark:bg-gray-800/50'
                        : ''
                    }
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      {site.siteName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatDate(site.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          site.active === false
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {site.active === false ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {site.active === false ? (
                        <Button
                          variant="ghost"
                          className="text-primary dark:text-primary-light"
                          onClick={() => handleUnarchive(site.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className="mr-2"
                            onClick={() => handleEdit(site.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-gray-600"
                            onClick={() => handleArchive(site.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'owners':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Owner Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {siteOwners.map((owner) => (
                  <tr
                    key={owner.id}
                    className={
                      owner.active === false
                        ? 'bg-gray-50 dark:bg-gray-800/50'
                        : ''
                    }
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      {owner.ownerName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatDate(owner.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          owner.active === false
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {owner.active === false ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {owner.active === false ? (
                        <Button
                          variant="ghost"
                          className="text-primary dark:text-primary-light"
                          onClick={() => handleUnarchive(owner.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className="mr-2"
                            onClick={() => handleEdit(owner.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-gray-600"
                            onClick={() => handleArchive(owner.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'contacts':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Contact Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {companyContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={
                      contact.active === false
                        ? 'bg-gray-50 dark:bg-gray-800/50'
                        : ''
                    }
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      {contact.contactName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {contact.companyName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {contact.contactEmail}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                          contact.active === false
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {contact.active === false ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {contact.active === false ? (
                        <Button
                          variant="ghost"
                          className="text-primary dark:text-primary-light"
                          onClick={() => handleUnarchive(contact.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className="mr-2"
                            onClick={() => handleEdit(contact.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-gray-600"
                            onClick={() => handleArchive(contact.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Reference Data
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage companies, sites, and other reference data
          </p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          className="mt-4 sm:mt-0"
          onClick={handleCreate}
        >
          Add New
        </Button>
      </div>

      <Card>
        <Card.Header>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'companies' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('companies')}
              >
                Companies
              </Button>
              <Button
                variant={activeTab === 'sites' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('sites')}
              >
                Sites
              </Button>
              <Button
                variant={activeTab === 'owners' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('owners')}
              >
                Site Owners
              </Button>
              <Button
                variant={activeTab === 'contacts' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('contacts')}
              >
                Contacts
              </Button>
            </div>

            <Button
              variant="outline"
              className={showInactive ? 'bg-gray-100 dark:bg-gray-700' : ''}
              onClick={() => setShowInactive(!showInactive)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              {showInactive ? 'Show Active Only' : 'Show All'}
            </Button>
          </div>
        </Card.Header>

        <Card.Content>{renderContent()}</Card.Content>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingId ? 'Edit' : 'Add'} ${activeTab.slice(0, -1)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderForm()}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReferenceDataPage;
