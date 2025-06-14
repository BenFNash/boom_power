import { create } from 'zustand';
import { Company, Site, SiteOwner, CompanyContact } from '../../types';
import { referenceDataService } from '../services/referenceDataService';

interface ReferenceDataState {
  companies: Company[];
  sites: Site[];
  siteOwners: SiteOwner[];
  companyContacts: CompanyContact[];
  loading: boolean;
  error: string | null;
  
  // Companies
  fetchCompanies: (includeInactive?: boolean) => Promise<void>;
  createCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Promise<void>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  
  // Sites
  fetchSites: (includeInactive?: boolean) => Promise<void>;
  createSite: (site: Omit<Site, 'id' | 'createdAt'>) => Promise<void>;
  updateSite: (id: string, site: Partial<Site>) => Promise<void>;
  
  // Site Owners
  fetchSiteOwners: (includeInactive?: boolean) => Promise<void>;
  createSiteOwner: (owner: Omit<SiteOwner, 'id' | 'createdAt'>) => Promise<void>;
  updateSiteOwner: (id: string, owner: Partial<SiteOwner>) => Promise<void>;
  
  // Company Contacts
  fetchCompanyContacts: (includeInactive?: boolean) => Promise<void>;
  createCompanyContact: (contact: Omit<CompanyContact, 'id' | 'createdAt'>) => Promise<void>;
  updateCompanyContact: (id: string, contact: Partial<CompanyContact>) => Promise<void>;
}

export const useReferenceDataStore = create<ReferenceDataState>((set) => ({
  companies: [],
  sites: [],
  siteOwners: [],
  companyContacts: [],
  loading: false,
  error: null,

  // Companies
  fetchCompanies: async (includeInactive = false) => {
    try {
      set({ loading: true, error: null });
      const companies = await referenceDataService.getCompanies(includeInactive);
      set({ companies, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createCompany: async (company) => {
    try {
      set({ loading: true, error: null });
      const newCompany = await referenceDataService.createCompany(company);
      set(state => ({
        companies: [...state.companies, newCompany],
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateCompany: async (id, company) => {
    try {
      set({ loading: true, error: null });
      const updatedCompany = await referenceDataService.updateCompany(id, company);
      set(state => ({
        companies: state.companies.map(c => c.id === id ? updatedCompany : c),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Sites
  fetchSites: async (includeInactive = false) => {
    try {
      set({ loading: true, error: null });
      const sites = await referenceDataService.getSites(includeInactive);
      set({ sites, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createSite: async (site) => {
    try {
      set({ loading: true, error: null });
      const newSite = await referenceDataService.createSite(site);
      set(state => ({
        sites: [...state.sites, newSite],
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateSite: async (id, site) => {
    try {
      set({ loading: true, error: null });
      const updatedSite = await referenceDataService.updateSite(id, site);
      set(state => ({
        sites: state.sites.map(s => s.id === id ? updatedSite : s),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Site Owners
  fetchSiteOwners: async (includeInactive = false) => {
    try {
      set({ loading: true, error: null });
      const siteOwners = await referenceDataService.getSiteOwners(includeInactive);
      set({ siteOwners, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createSiteOwner: async (owner) => {
    try {
      set({ loading: true, error: null });
      const newOwner = await referenceDataService.createSiteOwner(owner);
      set(state => ({
        siteOwners: [...state.siteOwners, newOwner],
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateSiteOwner: async (id, owner) => {
    try {
      set({ loading: true, error: null });
      const updatedOwner = await referenceDataService.updateSiteOwner(id, owner);
      set(state => ({
        siteOwners: state.siteOwners.map(o => o.id === id ? updatedOwner : o),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Company Contacts
  fetchCompanyContacts: async (includeInactive = false) => {
    try {
      set({ loading: true, error: null });
      const companyContacts = await referenceDataService.getCompanyContacts(includeInactive);
      set({ companyContacts, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createCompanyContact: async (contact) => {
    try {
      set({ loading: true, error: null });
      const newContact = await referenceDataService.createCompanyContact(contact);
      set(state => ({
        companyContacts: [...state.companyContacts, newContact],
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateCompanyContact: async (id, contact) => {
    try {
      set({ loading: true, error: null });
      const updatedContact = await referenceDataService.updateCompanyContact(id, contact);
      set(state => ({
        companyContacts: state.companyContacts.map(c => c.id === id ? updatedContact : c),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  }
}));