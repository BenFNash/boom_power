import React, { useEffect, useState } from 'react';
import { Plus, Calendar, BookTemplate as Template, Play, Pause, Edit, Trash2, Clock, CheckCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useJobScheduleStore } from '../../lib/stores/jobScheduleStore';
import { useReferenceDataStore } from '../../lib/stores/referenceDataStore';
import { useAuth } from '../../context/AuthContext';
import { JobTemplate, JobSchedule, FrequencyType } from '../../types';
import { format, parseISO, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface TemplateFormData {
  name: string;
  description: string;
  siteId: string;
  siteOwnerId: string;
  priority: string;
  assignedCompanyId: string;
  assignedContactId: string;
  subjectTitle: string;
  descriptionTemplate: string;
  estimatedDurationDays: number;
}

interface ScheduleFormData {
  jobTemplateId: string;
  name: string;
  frequencyType: FrequencyType;
  frequencyValue: number;
  startDate: string;
  endDate: string;
  advanceNoticeDays: number;
}

const JobScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'schedules' | 'instances'>('templates');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JobTemplate | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<JobSchedule | null>(null);
  const [generating, setGenerating] = useState(false);

  const {
    jobTemplates,
    jobSchedules,
    scheduledInstances,
    loading,
    error,
    fetchJobTemplates,
    createJobTemplate,
    updateJobTemplate,
    fetchJobSchedules,
    createJobSchedule,
    updateJobSchedule,
    fetchScheduledInstances,
    generateScheduledTickets
  } = useJobScheduleStore();

  const {
    sites,
    siteOwners,
    companies,
    companyContacts,
    fetchSites,
    fetchSiteOwners,
    fetchCompanies,
    fetchCompanyContacts
  } = useReferenceDataStore();

  const [templateForm, setTemplateForm] = useState<TemplateFormData>({
    name: '',
    description: '',
    siteId: '',
    siteOwnerId: '',
    priority: 'Medium',
    assignedCompanyId: '',
    assignedContactId: '',
    subjectTitle: '',
    descriptionTemplate: '',
    estimatedDurationDays: 7
  });

  const [scheduleForm, setScheduleForm] = useState<ScheduleFormData>({
    jobTemplateId: '',
    name: '',
    frequencyType: 'monthly',
    frequencyValue: 1,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    advanceNoticeDays: 14
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchJobTemplates(),
        fetchJobSchedules(),
        fetchScheduledInstances(),
        fetchSites(),
        fetchSiteOwners(),
        fetchCompanies(),
        fetchCompanyContacts()
      ]);
    };
    loadData();
  }, []);

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      description: '',
      siteId: '',
      siteOwnerId: '',
      priority: 'Medium',
      assignedCompanyId: '',
      assignedContactId: '',
      subjectTitle: '',
      descriptionTemplate: '',
      estimatedDurationDays: 7
    });
    setIsTemplateModalOpen(true);
  };

  const handleEditTemplate = (template: JobTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      siteId: template.siteId,
      siteOwnerId: template.siteOwnerId,
      priority: template.priority,
      assignedCompanyId: template.assignedCompanyId,
      assignedContactId: template.assignedContactId,
      subjectTitle: template.subjectTitle,
      descriptionTemplate: template.descriptionTemplate || '',
      estimatedDurationDays: template.estimatedDurationDays
    });
    setIsTemplateModalOpen(true);
  };

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const templateData = {
        ...templateForm,
        ticketType: 'Job' as const, // Always set to 'Job'
        createdBy: user.id,
        active: true
      };

      if (editingTemplate) {
        await updateJobTemplate(editingTemplate.id, templateData);
        toast.success('Template updated successfully');
      } else {
        await createJobTemplate(templateData);
        toast.success('Template created successfully');
      }
      setIsTemplateModalOpen(false);
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({
      jobTemplateId: '',
      name: '',
      frequencyType: 'monthly',
      frequencyValue: 1,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      advanceNoticeDays: 14
    });
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (schedule: JobSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      jobTemplateId: schedule.jobTemplateId,
      name: schedule.name,
      frequencyType: schedule.frequencyType,
      frequencyValue: schedule.frequencyValue || 1,
      startDate: schedule.startDate,
      endDate: schedule.endDate || '',
      advanceNoticeDays: schedule.advanceNoticeDays
    });
    setIsScheduleModalOpen(true);
  };

  const calculateNextDueDate = (startDate: string, frequencyType: FrequencyType, frequencyValue?: number) => {
    const start = parseISO(startDate);
    switch (frequencyType) {
      case 'monthly':
        return addDays(start, 30);
      case 'quarterly':
        return addDays(start, 90);
      case 'semi_annually':
        return addDays(start, 180);
      case 'annually':
        return addDays(start, 365);
      case 'custom':
        return addDays(start, (frequencyValue || 1) * 30);
      default:
        return addDays(start, 30);
    }
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const nextDueDate = calculateNextDueDate(scheduleForm.startDate, scheduleForm.frequencyType, scheduleForm.frequencyValue);
      
      // Convert empty string to null for endDate to prevent database error
      const scheduleData = {
        ...scheduleForm,
        endDate: scheduleForm.endDate === '' ? null : scheduleForm.endDate,
        nextDueDate: format(nextDueDate, 'yyyy-MM-dd'),
        createdBy: user.id,
        active: true
      };
      
      if (editingSchedule) {
        await updateJobSchedule(editingSchedule.id, scheduleData);
        toast.success('Schedule updated successfully');
      } else {
        await createJobSchedule(scheduleData);
        toast.success('Schedule created successfully');
      }
      setIsScheduleModalOpen(false);
    } catch (error) {
      toast.error('Failed to save schedule');
    }
  };

  const handleGenerateTickets = async () => {
    try {
      setGenerating(true);
      const ticketsCreated = await generateScheduledTickets();
      toast.success(`Generated ${ticketsCreated} scheduled tickets`);
      await fetchScheduledInstances();
    } catch (error) {
      toast.error('Failed to generate tickets');
    } finally {
      setGenerating(false);
    }
  };

  const filteredContacts = companyContacts.filter(
    contact => contact.company_id === templateForm.assignedCompanyId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Job Schedule Management</h3>
          <p className="text-gray-500 dark:text-gray-400">Create templates and schedules for recurring job tickets</p>
        </div>
        <div className="mt-4 flex space-x-2 sm:mt-0">
          <Button
            variant="outline"
            onClick={handleGenerateTickets}
            loading={generating}
            leftIcon={<Play className="h-4 w-4" />}
          >
            Generate Due Tickets
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeSubTab === 'templates' ? 'primary' : 'outline'}
          onClick={() => setActiveSubTab('templates')}
          leftIcon={<Template className="h-4 w-4" />}
        >
          Templates
        </Button>
        <Button
          variant={activeSubTab === 'schedules' ? 'primary' : 'outline'}
          onClick={() => setActiveSubTab('schedules')}
          leftIcon={<Calendar className="h-4 w-4" />}
        >
          Schedules
        </Button>
        <Button
          variant={activeSubTab === 'instances' ? 'primary' : 'outline'}
          onClick={() => setActiveSubTab('instances')}
          leftIcon={<Clock className="h-4 w-4" />}
        >
          Generated Tickets
        </Button>
      </div>

      {activeSubTab === 'templates' && (
        <Card>
          <Card.Header className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <Card.Title>Job Templates</Card.Title>
            <Button onClick={handleCreateTemplate} leftIcon={<Plus className="h-4 w-4" />}>
              Create Template
            </Button>
          </Card.Header>
          <Card.Content>
            {jobTemplates.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                No job templates created yet. Create your first template to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {jobTemplates.map((template) => (
                  <div key={template.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{template.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="font-medium">Site:</span> {template.siteName}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> Job
                          </div>
                          <div>
                            <span className="font-medium">Priority:</span> {template.priority}
                          </div>
                          <div>
                            <span className="font-medium">Company:</span> {template.assignedCompanyName}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" onClick={() => handleEditTemplate(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {activeSubTab === 'schedules' && (
        <Card>
          <Card.Header className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <Card.Title>Job Schedules</Card.Title>
            <Button onClick={handleCreateSchedule} leftIcon={<Plus className="h-4 w-4" />}>
              Create Schedule
            </Button>
          </Card.Header>
          <Card.Content>
            {jobSchedules.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                No job schedules created yet. Create your first schedule to automate ticket generation.
              </div>
            ) : (
              <div className="space-y-4">
                {jobSchedules.map((schedule) => (
                  <div key={schedule.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{schedule.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Template: {schedule.templateName}</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="font-medium">Frequency:</span> {schedule.frequencyType}
                            {schedule.frequencyValue && schedule.frequencyType === 'custom' && ` (${schedule.frequencyValue} months)`}
                          </div>
                          <div>
                            <span className="font-medium">Next Due:</span> {format(parseISO(schedule.nextDueDate), 'PP')}
                          </div>
                          <div>
                            <span className="font-medium">Advance Notice:</span> {schedule.advanceNoticeDays} days
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 ${schedule.active ? 'text-green-600' : 'text-red-600'}`}>
                              {schedule.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" onClick={() => handleEditSchedule(schedule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" className="text-gray-600">
                          {schedule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {activeSubTab === 'instances' && (
        <Card>
          <Card.Header>
            <Card.Title>Generated Tickets</Card.Title>
          </Card.Header>
          <Card.Content>
            {scheduledInstances.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                No scheduled tickets generated yet.
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledInstances.map((instance) => (
                  <div key={instance.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {instance.schedule?.name}
                        </h4>
                        {instance.ticket && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ticket: {instance.ticket.ticketNumber} - {instance.ticket.subject}
                          </p>
                        )}
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <span className="font-medium">Due Date:</span> {format(parseISO(instance.dueDate), 'PP')}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {format(parseISO(instance.createdDate), 'PP')}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 ${
                              instance.status === 'completed' ? 'text-green-600' : 
                              instance.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {instance.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {instance.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={editingTemplate ? 'Edit Job Template' : 'Create Job Template'}
        size="lg"
      >
        <form onSubmit={handleSubmitTemplate} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Template Name</label>
              <input
                type="text"
                className="input"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Site</label>
              <select
                className="input"
                value={templateForm.siteId}
                onChange={(e) => setTemplateForm({ ...templateForm, siteId: e.target.value })}
                required
              >
                <option value="">Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.site_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Site Owner</label>
              <select
                className="input"
                value={templateForm.siteOwnerId}
                onChange={(e) => setTemplateForm({ ...templateForm, siteOwnerId: e.target.value })}
                required
              >
                <option value="">Select Site Owner</option>
                {siteOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.owner_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Ticket Type</label>
              <div className="input bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                Job (Fixed)
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Job schedule templates always generate job tickets
              </p>
            </div>
            <div>
              <label className="label">Priority</label>
              <input
                type="text"
                className="input"
                value={templateForm.priority}
                onChange={(e) => setTemplateForm({ ...templateForm, priority: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Assigned Company</label>
              <select
                className="input"
                value={templateForm.assignedCompanyId}
                onChange={(e) => {
                  setTemplateForm({ 
                    ...templateForm, 
                    assignedCompanyId: e.target.value,
                    assignedContactId: '' // Reset contact when company changes
                  });
                }}
                required
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Company Contact</label>
              <select
                className="input"
                value={templateForm.assignedContactId}
                onChange={(e) => setTemplateForm({ ...templateForm, assignedContactId: e.target.value })}
                required
                disabled={!templateForm.assignedCompanyId}
              >
                <option value="">Select Contact</option>
                {filteredContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.contact_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Subject Title</label>
              <input
                type="text"
                className="input"
                value={templateForm.subjectTitle}
                onChange={(e) => setTemplateForm({ ...templateForm, subjectTitle: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description Template</label>
              <textarea
                className="input"
                rows={3}
                value={templateForm.descriptionTemplate}
                onChange={(e) => setTemplateForm({ ...templateForm, descriptionTemplate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Estimated Duration (Days)</label>
              <input
                type="number"
                className="input"
                value={templateForm.estimatedDurationDays}
                onChange={(e) => setTemplateForm({ ...templateForm, estimatedDurationDays: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>
          </div>
          <div className="flex flex-col space-y-3 pt-4 sm:flex-row sm:justify-end sm:space-x-3 sm:space-y-0">
            <Button variant="outline" type="button" onClick={() => setIsTemplateModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={editingSchedule ? 'Edit Job Schedule' : 'Create Job Schedule'}
        size="lg"
      >
        <form onSubmit={handleSubmitSchedule} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Schedule Name</label>
              <input
                type="text"
                className="input"
                value={scheduleForm.name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Job Template</label>
              <select
                className="input"
                value={scheduleForm.jobTemplateId}
                onChange={(e) => setScheduleForm({ ...scheduleForm, jobTemplateId: e.target.value })}
                required
              >
                <option value="">Select Template</option>
                {jobTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Frequency</label>
              <select
                className="input"
                value={scheduleForm.frequencyType}
                onChange={(e) => setScheduleForm({ ...scheduleForm, frequencyType: e.target.value as FrequencyType })}
                required
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi_annually">Semi-Annually</option>
                <option value="annually">Annually</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {scheduleForm.frequencyType === 'custom' && (
              <div>
                <label className="label">Custom Frequency (Months)</label>
                <input
                  type="number"
                  className="input"
                  value={scheduleForm.frequencyValue}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, frequencyValue: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={scheduleForm.startDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">End Date (Optional)</label>
              <input
                type="date"
                className="input"
                value={scheduleForm.endDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Advance Notice (Days)</label>
              <input
                type="number"
                className="input"
                value={scheduleForm.advanceNoticeDays}
                onChange={(e) => setScheduleForm({ ...scheduleForm, advanceNoticeDays: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>
          </div>
          <div className="flex flex-col space-y-3 pt-4 sm:flex-row sm:justify-end sm:space-x-3 sm:space-y-0">
            <Button variant="outline" type="button" onClick={() => setIsScheduleModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JobScheduleManagement;