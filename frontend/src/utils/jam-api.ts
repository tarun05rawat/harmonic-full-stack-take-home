import axios from "axios";
import { buildApiUrl } from "../config/api";

export interface ICompany {
  id: number;
  company_name: string;
  liked: boolean;
}

export interface ICollection {
  id: string;
  collection_name: string;
  companies: ICompany[];
  total: number;
}

export interface ICompanyBatchResponse {
  companies: ICompany[];
}

export async function getCompanies(
  offset?: number,
  limit?: number
): Promise<ICompanyBatchResponse> {
  try {
    const response = await axios.get(buildApiUrl("/companies"), {
      params: {
        offset,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

export async function getCollectionsById(
  id: string,
  offset?: number,
  limit?: number
): Promise<ICollection> {
  try {
    const response = await axios.get(buildApiUrl(`/collections/${id}`), {
      params: {
        offset,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

export async function getCollectionsMetadata(): Promise<ICollection[]> {
  try {
    const response = await axios.get(buildApiUrl("/collections"));
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

export async function createCollection(collectionName: string): Promise<{
  id: string;
  collection_name: string;
  message: string;
}> {
  try {
    const response = await axios.post(buildApiUrl("/collections"), {
      collection_name: collectionName,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating collection:", error);
    throw error;
  }
}

export async function removeCompaniesFromCollection(
  collectionId: string,
  companyIds: number[]
): Promise<{
  collection_id: string;
  removed_count: number;
  message: string;
}> {
  try {
    const response = await axios.delete(
      buildApiUrl(`/collections/${collectionId}/companies`),
      {
        data: {
          company_ids: companyIds,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error removing companies from collection:", error);
    throw error;
  }
}

export async function deleteCollection(collectionId: string): Promise<{
  id: string;
  collection_name: string;
  message: string;
}> {
  try {
    const response = await axios.delete(
      buildApiUrl(`/collections/${collectionId}`)
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }
}
