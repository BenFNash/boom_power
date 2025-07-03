import { supabase } from '../supabase';
import { Company, Site, CompanyContact } from '../../types';

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

  async createCompany(company: Omit<Company, 'id' | 'createdAt'>) {
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
    // If we're archiving a company, we need to archive all associated records
    if (company.active === false) {
      // Start a transaction to archive all related records
      const { error: transactionError } = await supabase.rpc('archive_company_cascade', {
        target_company_id: id
      });

      if (transactionError) throw transactionError;
    }

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
    const query = supabase.from('sites').select(`
      *,
      companies!sites_site_owner_company_id_fkey (
        company_name
      )
    `);

    if (!includeInactive) {
      query.eq('active', true);
    }

    const { data, error } = await query.order('site_name');

    if (error) throw error;
    return data.map((site) => ({
      id: site.id,
      siteName: site.site_name,
      siteOwnerCompanyId: site.site_owner_company_id,
      siteOwnerCompanyName: site.companies?.company_name,
      active: site.active,
      createdAt: site.created_at,
    })) as Site[];
  },

  async createSite(site: Omit<Site, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('sites')
      .insert([
        {
          site_name: site.siteName,
          site_owner_company_id: site.siteOwnerCompanyId,
          active: site.active,
        },
      ])
      .select(`
        *,
        companies!sites_site_owner_company_id_fkey (
          company_name
        )
      `)
      .single();

    if (error) throw error;
    return {
      id: data.id,
      siteName: data.site_name,
      siteOwnerCompanyId: data.site_owner_company_id,
      siteOwnerCompanyName: data.companies?.company_name,
      active: data.active,
      createdAt: data.created_at,
    } as Site;
  },

  async updateSite(id: string, site: Partial<Site>) {
    const { data, error } = await supabase
      .from('sites')
      .update({
        site_name: site.siteName,
        site_owner_company_id: site.siteOwnerCompanyId,
        active: site.active,
      })
      .eq('id', id)
      .select(`
        *,
        companies!sites_site_owner_company_id_fkey (
          company_name
        )
      `)
      .single();

    if (error) throw error;
    return {
      id: data.id,
      siteName: data.site_name,
      siteOwnerCompanyId: data.site_owner_company_id,
      siteOwnerCompanyName: data.companies?.company_name,
      active: data.active,
      createdAt: data.created_at,
    } as Site;
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
    contact: Omit<CompanyContact, 'id' | 'createdAt' | 'companyName'>
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
