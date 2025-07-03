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
  siteOwnerCompanyId?: string;
  contactName?: string;
  contactEmail?: string;
  companyId?: string;
}

const ReferenceDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'companies' | 'sites' | 'contacts'>('companies');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [companyToArchive, setCompanyToArchive] = useState<string | null>(null);

  const {
    companies,
    sites,
    companyContacts,
    loading,
    error,
    fetchCompanies,
    fetchSites,
    fetchCompanyContacts,
    createCompany,
    createSite,
    createCompanyContact,
    updateCompany,
    updateSite,
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
          await fetchCompanies(); // Need companies for the dropdown
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
        const site = sites.find((s) => s.id === id);
        data = { 
          siteName: site?.siteName,
          siteOwnerCompanyId: site?.siteOwnerCompanyId
        };
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
    if (activeTab === 'companies') {
      setCompanyToArchive(id);
      setIsWarningModalOpen(true);
      return;
    }

    if (!window.confirm('Are you sure you want to archive this item?')) {
      return;
    }

    try {
      switch (activeTab) {
        case 'sites':
          await updateSite(id, { active: false });
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

  const handleConfirmCompanyArchive = async () => {
    if (!companyToArchive) return;

    try {
      await updateCompany(companyToArchive, { active: false });
      toast.success('Company and all associated records archived successfully');
      setIsWarningModalOpen(false);
      setCompanyToArchive(null);
      
      // Refresh the current data to reflect the changes
      switch (activeTab) {
        case 'companies':
          await fetchCompanies(showInactive);
          break;
        case 'sites':
          await fetchSites(showInactive);
          break;
        case 'contacts':
          await fetchCompanyContacts(showInactive);
          break;
      }
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive company');
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
            await updateSite(editingId, { 
              siteName: formData.siteName!,
              siteOwnerCompanyId: formData.siteOwnerCompanyId!
            });
          } else {
            await createSite({ 
              siteName: formData.siteName!,
              siteOwnerCompanyId: formData.siteOwnerCompanyId!
            });
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
              active: true,
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
          <div className="space-y-4">
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
            <div>
              <label className="label">Site Owner Company</label>
              <select
                className="input"
                value={formData.siteOwnerCompanyId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, siteOwnerCompanyId: e.target.value })
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
                    Owner Company
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
                      {site.siteOwnerCompanyName || 'Unknown'}
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

      <Modal
        isOpen={isWarningModalOpen}
        onClose={() => {
          setIsWarningModalOpen(false);
          setCompanyToArchive(null);
        }}
        title="Archive Company Warning"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Warning: This action will affect multiple records
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                When you archive a company, the following associated records will also be archived:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                <li>All sites owned by this company will be archived</li>
                <li>All company contacts associated with this company will be archived</li>
                <li>All open/assigned tickets where this company is the site owner or assigned company will be cancelled</li>
                <li>All pending/in-progress jobs assigned to this company will be put on hold</li>
                <li>All job templates where this company is the site owner or assigned company will be archived</li>
                <li>All related job schedules and scheduled instances will be archived/cancelled</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-3">
                This action cannot be easily undone. Are you sure you want to proceed?
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsWarningModalOpen(false);
                setCompanyToArchive(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmCompanyArchive}
            >
              Archive Company
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReferenceDataPage;
