import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Card from '../common/Card';
import { useAuth } from '../../context/AuthContext';
import { Ticket, TicketType, Attachment } from '../../types';
import { formatISO } from 'date-fns';
import { Loader2, Upload, X } from 'lucide-react';
import { useReferenceDataStore } from '../../lib/stores/referenceDataStore';
import { attachmentService } from '../../lib/services/attachmentService';
import toast from 'react-hot-toast';

interface TicketFormProps {
  initialData?: Partial<Ticket>;
  onSubmit: (data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Ticket>;
  isLoading?: boolean;
}

const TicketForm: React.FC<TicketFormProps> = ({ 
  initialData = {}, 
  onSubmit,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(initialData.id);
  
  const {
    sites,
    companies,
    companyContacts,
    loading: referenceDataLoading,
    fetchSites,
    fetchCompanies,
    fetchCompanyContacts
  } = useReferenceDataStore();

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        await Promise.all([
          fetchSites(),
          fetchCompanies(),
          fetchCompanyContacts()
        ]);
      } catch (error) {
        console.error('Error loading reference data:', error);
      }
    };

    loadReferenceData();
  }, [fetchSites, fetchCompanies, fetchCompanyContacts]);

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const [formData, setFormData] = useState<Partial<Ticket>>({
    site: initialData.site || '',
    siteOwnerCompany: initialData.siteOwnerCompany || '',
    type: 'fault',
    priority: initialData.priority || '',
    companyToAssign: initialData.companyToAssign || '',
    companyContact: initialData.companyContact || '',
    subject: initialData.subject || '',
    description: initialData.description || '',
    status: initialData.status || 'open',
    ...initialData,
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedSiteOwnerCompanyId, setSelectedSiteOwnerCompanyId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Set initial company IDs and contact ID if editing
  useEffect(() => {
    if (formData.companyToAssign) {
      const company = companies.find(c => c.companyName === formData.companyToAssign);
      if (company) {
        setSelectedCompanyId(company.id);
      }
    }
    if (formData.siteOwnerCompany) {
      const company = companies.find(c => c.companyName === formData.siteOwnerCompany);
      if (company) {
        setSelectedSiteOwnerCompanyId(company.id);
      }
    }
    if (formData.companyContact) {
      const contact = companyContacts.find(c => c.contactName === formData.companyContact);
      if (contact) {
        setSelectedContactId(contact.id);
      }
    }
  }, [companies, companyContacts, formData.companyToAssign, formData.siteOwnerCompany, formData.companyContact]);

  // Filter company contacts based on selected company
  const filteredContacts = companyContacts.filter(
    contact => contact.companyId === selectedCompanyId
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Update selected company ID when company changes
    if (name === 'companyToAssign') {
      const company = companies.find(c => c.companyName === value);
      setSelectedCompanyId(company?.id || '');
      // Clear selected contact when company changes
      setFormData(prev => ({ ...prev, companyContact: '' }));
      setSelectedContactId('');
    }

    // Update selected contact ID when contact changes
    if (name === 'companyContact') {
      const contact = companyContacts.find(c => c.contactName === value);
      setSelectedContactId(contact?.id || '');
    }

    // Auto-populate site owner company when site changes
    if (name === 'site') {
      const selectedSite = sites.find(s => s.siteName === value);
      if (selectedSite?.siteOwnerCompanyName) {
        setFormData(prev => ({ ...prev, siteOwnerCompany: selectedSite.siteOwnerCompanyName }));
        // Set the site owner company ID
        const company = companies.find(c => c.companyName === selectedSite.siteOwnerCompanyName);
        if (company) {
          setSelectedSiteOwnerCompanyId(company.id);
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async (ticketId: string) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setFileUploadProgress(0);
    
    try {
      // Upload files in batches to show progress
      const batchSize = 1;
      const totalFiles = files.length;
      let uploadedCount = 0;
      
      for (let i = 0; i < totalFiles; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await attachmentService.uploadTicketAttachments(batch, ticketId, user!.id);
        uploadedCount += batch.length;
        setFileUploadProgress((uploadedCount / totalFiles) * 100);
      }
      
      // Clear files after successful upload
      setFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setFileUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      throw new Error('User ID is required to create a ticket');
    }

    try {
      const now = formatISO(new Date());
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
      
      const completeFormData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
        ticketNumber: '', // Auto-generated by the database
        site: formData.site || '',
        siteOwnerCompany: formData.siteOwnerCompany || '',
        siteOwnerCompanyId: selectedSiteOwnerCompanyId || undefined,
        type: 'fault',
        priority: formData.priority || '',
        dateRaised: initialData.dateRaised || now,
        whoRaised: initialData.whoRaised || `${user.email}`,
        whoRaisedId: user.id,
        targetCompletionDate: initialData.targetCompletionDate || formatISO(targetDate),
        companyToAssign: formData.companyToAssign || '',
        companyToAssignId: selectedCompanyId || undefined,
        companyContact: formData.companyContact || '',
        companyContactId: selectedContactId || undefined,
        subject: formData.subject || '',
        description: formData.description || '',
        status: initialData.status || 'open',
      };
      
      // Submit the ticket first to get the ticket ID
      const newTicket = await onSubmit(completeFormData);
      
      // Upload files if any
      if (files.length > 0) {
        try {
          await uploadFiles(newTicket.id);
          toast.success('Files uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          toast.error('Ticket created but file upload failed. Please try uploading files again.');
        }
      }
      
      navigate('/tickets');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      throw error;
    }
  };

  if (referenceDataLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-primary-light" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <Card.Header>
            <Card.Title>{isEditing ? 'Edit Ticket' : 'Create New Ticket'}</Card.Title>
          </Card.Header>
          
          <Card.Content>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="site" className="label">Site</label>
                <select
                  id="site"
                  name="site"
                  value={formData.site}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select Site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.siteName}>
                      {site.siteName}
                    </option>
                  ))}
                </select>
                {formData.siteOwnerCompany && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Site Owner: {formData.siteOwnerCompany}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="priority" className="label">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select Priority</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="companyToAssign" className="label">Company to Assign</label>
                <select
                  id="companyToAssign"
                  name="companyToAssign"
                  value={formData.companyToAssign}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.companyName}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="companyContact" className="label">Company Contact</label>
                <select
                  id="companyContact"
                  name="companyContact"
                  value={formData.companyContact}
                  onChange={handleInputChange}
                  className="input"
                  required
                  disabled={!selectedCompanyId}
                >
                  <option value="">Select Contact</option>
                  {filteredContacts.map((contact) => (
                    <option key={contact.id} value={contact.contactName}>
                      {contact.contactName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <label htmlFor="subject" className="label">Subject Title</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="input"
                placeholder="Brief description of the issue or job"
                required
              />
            </div>
            
            <div className="mt-4">
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className="input"
                placeholder="Detailed description of the job or fault..."
                required
              />
            </div>
            
            <div className="mt-6">
              <label className="label">Attachments</label>
              <div className="flex items-center space-x-2">
                <label className="btn btn-outline cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.csv,.xls,.xlsx"
                  />
                </label>
                <span className="text-sm text-gray-500">
                  Max 5MB (PDF, DOC, DOCX, JPG, JPEG, CSV, XLS, XLSX)
                </span>
              </div>
              
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-2 text-sm">
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFiles(files.filter((_, i) => i !== index));
                        }}
                        className="ml-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {isUploading && (
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>Uploading...</span>
                        <span>{fileUploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${fileUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card.Content>
          
          <Card.Footer className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/tickets')}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              loading={isLoading}
            >
              {isEditing ? 'Update Ticket' : 'Create Ticket'}
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </form>
  );
};

export default TicketForm;
