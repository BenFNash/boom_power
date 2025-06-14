import { supabase } from '../supabase';
import { Company, Site, SiteOwner, CompanyContact } from '../../types';

export const referenceDataService = {
  // Companies
  async getCompanies(includeInactive = false) {
    const query = supabase.from('companies').select('*');

    if (!includeInactive) {
      query.eq('active', true);
    }

    const { data, error } = await query.order('company_name');

    if (error) throw error;
    return data.map((company) => ({
      id: company.id,
      companyName: company.company_name,
      active: company.active,
      createdAt: company.created_at,
    })) as Company[];
  },

  async createCompany(company: Omit<Company, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('companies')
      .insert([
        {
          company_name: company.companyName,
          active: company.active,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      companyName: data.company_name,
      active: data.active,
      createdAt: data.created_at,
    } as Company;
  },

  async updateCompany(id: string, company: Partial<Company>) {
    const { data, error } = await supabase
      .from('companies')
      .update({
        company_name: company.companyName,
        active: company.active,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      companyName: data.company_name,
      active: data.active,
      createdAt: data.created_at,
    } as Company;
  },

  // Sites
  async getSites(includeInactive = false) {
    const query = supabase.from('sites').select('*');

    if (!includeInactive) {
      query.eq('active', true);
    }

    const { data, error } = await query.order('site_name');

    if (error) throw error;
    return data.map((site) => ({
      id: site.id,
      siteName: site.site_name,
      active: site.active,
      createdAt: site.created_at,
    })) as Site[];
  },

  async createSite(site: Omit<Site, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('sites')
      .insert([
        {
          site_name: site.siteName,
          active: site.active,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      siteName: data.site_name,
      active: data.active,
      createdAt: data.created_at,
    } as Site;
  },

  async updateSite(id: string, site: Partial<Site>) {
    const { data, error } = await supabase
      .from('sites')
      .update({
        site_name: site.siteName,
        active: site.active,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      siteName: data.site_name,
      active: data.active,
      createdAt: data.created_at,
    } as Site;
  },

  // Site Owners
  async getSiteOwners(includeInactive = false) {
    const query = supabase.from('site_owners').select('*');

    if (!includeInactive) {
      query.eq('active', true);
    }

    const { data, error } = await query.order('owner_name');

    if (error) throw error;
    return data.map((owner) => ({
      id: owner.id,
      ownerName: owner.owner_name,
      active: owner.active,
      createdAt: owner.created_at,
    })) as SiteOwner[];
  },

  async createSiteOwner(owner: Omit<SiteOwner, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('site_owners')
      .insert([
        {
          owner_name: owner.ownerName,
          active: owner.active,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      ownerName: data.owner_name,
      active: data.active,
      createdAt: data.created_at,
    } as SiteOwner;
  },

  async updateSiteOwner(id: string, owner: Partial<SiteOwner>) {
    const { data, error } = await supabase
      .from('site_owners')
      .update({
        owner_name: owner.owner_name,
        active: owner.active,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      ownerName: data.owner_name,
      active: data.active,
      createdAt: data.created_at,
    } as SiteOwner;
  },

  // Company Contacts
  async getCompanyContacts(includeInactive = false) {
    const query = supabase.from('company_contacts').select(`
        *,
        companies (
          company_name
        )
      `);

    if (!includeInactive) {
      query.eq('active', true);
    }

    const { data, error } = await query.order('contact_name');

    if (error) throw error;
    return data.map((contact) => ({
      id: contact.id,
      companyId: contact.company_id,
      contactName: contact.contact_name,
      contactEmail: contact.contact_email,
      companyName: contact.companies?.company_name || '',
      active: contact.active,
      createdAt: contact.created_at,
    })) as CompanyContact[];
  },

  async createCompanyContact(
    contact: Omit<CompanyContact, 'id' | 'created_at' | 'company_name'>
  ) {
    const { data, error } = await supabase
      .from('company_contacts')
      .insert([
        {
          company_id: contact.companyId,
          contact_name: contact.contactName,
          contact_email: contact.contactEmail,
          active: true,
        },
      ])
      .select(
        `
        *,
        companies (
          company_name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      id: data.id,
      companyId: data.company_id,
      contactName: data.contact_name,
      contactEmail: data.contact_email,
      companyName: data.companies?.company_name || '',
      active: data.active,
      createdAt: data.created_at,
    } as CompanyContact;
  },

  async updateCompanyContact(id: string, contact: Partial<CompanyContact>) {
    const { data, error } = await supabase
      .from('company_contacts')
      .update({
        company_id: contact.companyId,
        contact_name: contact.contactName,
        contact_email: contact.contactEmail,
        active: contact.active,
      })
      .eq('id', id)
      .select(
        `
        *,
        companies (
          company_name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      id: data.id,
      companyId: data.company_id,
      contactName: data.contact_name,
      contactEmail: data.contact_email,
      companyName: data.companies?.company_name || '',
      active: data.active,
      createdAt: data.created_at,
    } as CompanyContact;
  },
};
