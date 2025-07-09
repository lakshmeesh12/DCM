import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

const BASE_URL = 'http://localhost:8001';

export interface ApiResponse {
  status: 'success' | 'error' | 'configured' | 'needs_auth';
  message?: string;
  visibility?: string;
  filenames?: string[];
  data?: any;
  table?: any;
  files?: Array<{ name: string; id: string } | string>;
  folders?: Array<{ name: string; id: string }>;
  auth_url?: string;
  country?: string;
  entities_used?: string[];
  styles?: { primary_color: string; secondary_color: string };
  file_bytes?: string;
  file_name?: string;
  header_path?: string;
  watermark_path?: string;
  csv_file_paths?: string[];
}

export interface CloudConfigData {
  accessKey?: string;
  secretKey?: string;
  bucketName?: string;
  accountName?: string;
  accountKey?: string;
  container?: string;
  connectionString?: string;
  containerName?: string;
  resourceGroup?: string;
  apiKey?: string;
  projectId?: string;
  folderName?: string;
  folderId?: string;
  authCode?: string;
  [key: string]: string | undefined;
}

export const initializeUpload = async (): Promise<ApiResponse> => {
  console.log('Attempting to call /upload at', `${BASE_URL}/upload`);
  try {
    const response = await axios.post(`${BASE_URL}/upload`, {}, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    const data: ApiResponse = response.data;
    if (data.status === 'success') {
      toast.success(data.message, { duration: 1000 });
    } else {
      toast.error('Failed to initialize upload: ' + data.message, { duration: 2000 });
    }
    return data;
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.response?.data.detail || error.message : (error as Error).message;
    console.error('Upload error:', error);
    toast.error('Error initializing upload: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};

export const uploadFiles = async (files: File[]): Promise<ApiResponse> => {
  console.log('Calling /file_handler with files:', files.map(f => f.name));
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  try {
    const response = await axios.post(`${BASE_URL}/file_handler`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    const data: ApiResponse = response.data;
    if (data.status === 'success') {
      toast.success(data.message, { duration: 1000 });
    } else {
      toast.error('File upload failed: ' + data.message, { duration: 2000 });
    }
    return data;
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.response?.data.detail || error.message : (error as Error).message;
    console.error('File upload error:', error);
    toast.error('Error uploading files: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};

export const analyzeContent = async (
  formData: FormData,
  options?: { signal?: AbortSignal }
): Promise<ApiResponse> => {
  console.log('api.tsx: analyzeContent called with FormData');
  const formDataEntries: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    formDataEntries[key] = typeof value === 'string' ? value : '[File/Blob]';
  }
  console.log('api.tsx: FormData contents:', JSON.stringify(formDataEntries, null, 2));
  console.log('api.tsx: user_prompt:', formDataEntries['user_prompt'] || 'none');
  console.log('api.tsx: Raw FormData keys:', Array.from(formData.keys()));

  try {
    const response = await axios.post(`${BASE_URL}/success`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
      signal: options?.signal,
    });

    const data = response.data;
    console.log('api.tsx: analyzeContent response:', JSON.stringify(data, null, 2));
    console.log('api.tsx: csv_file_paths in response:', data.csv_file_paths || 'undefined');
    console.log('api.tsx: entities_used in response:', data.entities_used || 'undefined');

    return {
      status: data.status,
      message: data.message,
      data: data.data,
      table: data.table,
      country: data.country,
      entities_used: data.entities_used,
      styles: data.styles,
      csv_file_paths: data.csv_file_paths,
    };
  } catch (error) {
    const errorMessage = error instanceof AxiosError
      ? error.response?.data.detail?.message || error.response?.data.message || error.message
      : (error as Error).message;
    console.error('api.tsx: analyzeContent error:', error);
    toast.error('Analysis error: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};
 
export const fetchAwsFiles = async (config: CloudConfigData): Promise<ApiResponse> => {
  console.log('Calling /getting_files_from_aws_s3 with:', config);
  const formData = new FormData();
  formData.append('accessKey', config.accessKey || '');
  formData.append('secretKey', config.secretKey || '');
  formData.append('bucket', config.bucketName || '');
 
  try {
    const response = await axios.post(`${BASE_URL}/getting_files_from_aws_s3`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    const data: ApiResponse = response.data;
    console.log('fetchAwsFiles: Raw response:', data);
    if (data.status === 'success') {
      const normalizedFiles = (data.files || []).map((file, index) =>
        typeof file === 'string' ? { name: file, id: file || `file-${index}` } : { name: file.name, id: file.id || file.name }
      );
      toast.success('Files fetched successfully', { duration: 1000 });
      return { ...data, files: normalizedFiles };
    } else {
      toast.error('Failed to fetch files: ' + data.message, { duration: 2000 });
      return data;
    }
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.response?.data.detail || error.message : (error as Error).message;
    console.error('AWS files fetch error:', error);
    toast.error('Error fetching AWS files: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};
 
export const uploadAwsSelectedFiles = async (files: string[]): Promise<ApiResponse> => {
  console.log('Calling /aws_selected_files with files:', files);
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
 
  try {
    const response = await axios.post(`${BASE_URL}/aws_selected_files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    const data: ApiResponse = response.data;
    if (data.status === 'success') {
      toast.success(data.message, { duration: 1000 });
    } else {
      toast.error('Failed to process files: ' + data.message, { duration: 2000 });
    }
    return data;
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.response?.data.detail || error.message : (error as Error).message;
    console.error('AWS selected files error:', error);
    toast.error('Error processing AWS files: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};
 
export const fetchAzureFiles = async (config: CloudConfigData): Promise<ApiResponse> => {
  console.log('Calling /getting_files_from_azure with:', config);
  const formData = new FormData();
  formData.append('accountName', config.accountName || '');
  formData.append('accountKey', config.accountKey || '');
  formData.append('container', config.container || '');
 
  try {
    const response = await axios.post(`${BASE_URL}/getting_files_from_azure`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    const data: ApiResponse = response.data;
    console.log('fetchAzureFiles: Raw response:', data);
    if (data.status === 'success') {
      const normalizedFiles = (data.files || []).map((file, index) =>
        typeof file === 'string' ? { name: file, id: file || `file-${index}` } : { name: file.name, id: file.id || file.name }
      );
      toast.success('Files fetched successfully', { duration: 1000 });
      return { ...data, files: normalizedFiles };
    } else {
      toast.error('Failed to fetch files: ' + data.message, { duration: 2000 });
      return data;
    }
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.response?.data.detail || error.message : (error as Error).message;
    console.error('Azure files fetch error:', error);
    toast.error('Error fetching Azure files: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};
 
export const uploadAzureSelectedFiles = async (files: string[]): Promise<ApiResponse> => {
  console.log('Calling /azure_selected_files with files:', files);
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
 
  try {
    const response = await axios.post(`${BASE_URL}/azure_selected_files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    const data: ApiResponse = response.data;
    if (data.status === 'success') {
      toast.success(data.message, { duration: 1000 });
    } else {
      toast.error('Failed to process files: ' + data.message, { duration: 2000 });
    }
    return data;
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.response?.data.detail || error.message : (error as Error).message;
    console.error('Azure selected files error:', error);
    toast.error('Error processing Azure files: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};
export const connectGoogleDrive = async (): Promise<ApiResponse> => {
  console.log('Calling /connect_google_drive');
  try {
    const response = await axios.get(`${BASE_URL}/connect_google_drive/`, {
      withCredentials: true,
    });
    const data = response.data;
    return {
      status: data.status || (data.message.includes('Successfully') ? 'configured' : 'not_configured'),
      message: data.message,
      folders: data.folders || [],
      auth_url: data.auth_url,
    };
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.response?.data.detail || error.message : (error as Error).message;
    console.error('Google Drive connect error:', error);
    toast.error('Error connecting to Google Drive: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};
 
export const fetchGoogleDriveFiles = async (folder: { name: string; id: string | null }): Promise<ApiResponse> => {
  console.log('Calling /getting_files_from_google_drive with folder:', folder);
  try {
    const response = await axios.post(`${BASE_URL}/getting_files_from_google_drive/`, {
      folder_name: { name: folder.name, id: folder.id },
    }, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    const data = response.data;
    return {
      status: data.message.includes('Successfully') ? 'success' : 'error',
      message: data.message,
      files: data.files || [],
    };
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.response?.data.detail || error.message : (error as Error).message;
    console.error('Google Drive files fetch error:', error);
    toast.error('Error fetching Google Drive files: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};
 
export const streamGoogleDriveFiles = async (files: { name: string; id: string }[]): Promise<ApiResponse> => {
  console.log('Calling /streaming_files_from_google_drive with files:', files);
  try {
    const response = await axios.post(`${BASE_URL}/streaming_files_from_google_drive/`, { files }, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    const data = response.data;
    return {
      status: data.message.includes('downloaded successfully') ? 'success' : 'error',
      message: data.message,
      files: data.files || [],
    };
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.response?.data.detail || error.message : (error as Error).message;
    console.error('Google Drive stream files error:', error);
    toast.error('Error streaming Google Drive files: ' + errorMessage, { duration: 2000 });
    return { status: 'error', message: errorMessage };
  }
};
 
export async function markDocument(fileName: string): Promise<ApiResponse> {
  console.log('Calling /mark_document with file:', fileName);
  try {
    const formData = new FormData();
    formData.append('file_name', fileName);
    const response = await axios.post(`${BASE_URL}/mark_document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
 
    const data = response.data;
    console.log('markDocument: Response:', JSON.stringify(data, null, 2));
 
    if (!data.header_path || !data.message) {
      throw new Error('Invalid response structure from mark_document: missing header_path or message');
    }
 
    const markedFileName = data.header_path.split(/[\\/]/).pop() || fileName;
 
    toast.success(`Document ${fileName} marked successfully`, { duration: 1000 });
 
    return {
      status: 'success',
      message: data.message,
      header_path: data.header_path,
      watermark_path: data.watermark_path,
      file_name: markedFileName,
    };
  } catch (error) {
    const errorMessage = error instanceof AxiosError
      ? error.response?.data?.error || error.message
      : (error as Error).message;
    console.error('Mark document error:', errorMessage, error);
    toast.error(`Error processing ${fileName}: ${errorMessage}`, { duration: 2000 });
    return {
      status: 'error',
      message: errorMessage || 'Unknown error',
    };
  }
}
 