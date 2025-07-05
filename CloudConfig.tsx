import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  FolderIcon, 
  FileIcon, 
  CheckCircleIcon, 
  SearchIcon,
  FilterIcon,
  UploadIcon,
  RefreshCwIcon
} from 'lucide-react';
import { fetchAwsFiles, uploadAwsSelectedFiles, fetchAzureFiles, uploadAzureSelectedFiles, connectGoogleDrive } from '@/api/api';

const cloudFields: Record<string, { name: string; label: string; placeholder: string }[]> = {
  aws: [
    { name: 'accessKey', label: 'Access Key', placeholder: 'Enter your access key' },
    { name: 'secretKey', label: 'Secret Key', placeholder: 'Enter your secret key' },
    { name: 'bucketName', label: 'S3 Bucket Name', placeholder: 'Enter bucket name' },
  ],
  azure: [
    { name: 'accountName', label: 'Account Name', placeholder: 'Enter your account name' },
    { name: 'accountKey', label: 'Account Key', placeholder: 'Enter your account key' },
    { name: 'container', label: 'Container Name', placeholder: 'Enter container name' },
  ],
  google: [
    { name: 'authCode', label: 'Authorization Code', placeholder: 'Paste the Google authorization code' },
  ],
};

interface LocationState {
  processType?: string;
  processingLocation?: string;
  files?: File[];
  cloudPlatform?: string;
  selectedAttributes?: Record<string, boolean>;
  cloudConfig?: CloudConfigData;
  cloudFiles?: Array<{ name: string; id: string } | string>;
  selectedCountry?: string;
  selectedTab?: string;
}

interface FileItem {
  name: string;
  id: string;
}

interface CloudConfigData {
  [key: string]: string | undefined;
}

export default function CloudConfig() {
  const location = useLocation();
  const navigate = useNavigate();
  const { processType, processingLocation, files, cloudPlatform = 'aws', selectedAttributes, cloudConfig: initialCloudConfig, cloudFiles: initialCloudFiles, selectedCountry, selectedTab } = (location.state as LocationState) || {};

  const [configData, setConfigData] = useState<CloudConfigData>(initialCloudConfig || (() => {
    const initialData: CloudConfigData = {};
    const fields = cloudFields[cloudPlatform];
    fields.forEach(field => {
      initialData[field.name] = '';
    });
    return initialData;
  })());
  
  const [availableFiles, setAvailableFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>(initialCloudFiles?.map(item => typeof item === 'string' ? { name: item, id: item } : item) || []);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<'all' | 'selected' | 'unselected'>('all');

  useEffect(() => {
    setAvailableFiles([]);
    setSelectedFiles(initialCloudFiles?.map(item => typeof item === 'string' ? { name: item, id: item } : item) || []);
    setConfigData(() => {
      const initialData: CloudConfigData = {};
      const fields = cloudFields[cloudPlatform];
      fields.forEach(field => {
        initialData[field.name] = initialCloudConfig?.[field.name] || '';
      });
      return initialData;
    });
    console.log('CloudConfig.tsx: Initialized configData:', configData);
  }, [cloudPlatform, initialCloudConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfigData(prev => {
      const newConfig = { ...prev, [name]: value };
      console.log('CloudConfig.tsx: Updated configData:', newConfig);
      return newConfig;
    });
    setError(null);
  };

  const validateCredentials = (config: CloudConfigData): boolean => {
    const requiredFields = cloudFields[cloudPlatform].map(field => field.name);
    const isValid = requiredFields.every(field => config[field]?.trim());

    if (cloudPlatform === 'aws') {
      if (!config.accessKey?.match(/^[A-Z0-9]{20}$/)) {
        toast.error('Invalid AWS Access Key format. Must be 20 uppercase alphanumeric characters.', { duration: 3000 });
        return false;
      }
      if (!config.secretKey?.match(/^[A-Za-z0-9/+=]{40}$/)) {
        toast.error('Invalid AWS Secret Key format. Must be 40 alphanumeric characters with /+=.', { duration: 3000 });
        return false;
      }
      if (!config.bucketName?.match(/^[a-z0-9.-]{3,63}$/)) {
        toast.error('Invalid S3 Bucket Name. Must be 3-63 characters, lowercase letters, numbers, dots, or hyphens.', { duration: 3000 });
        return false;
      }
    } else if (cloudPlatform === 'azure') {
      if (!config.accountName?.match(/^[a-z0-9]{3,24}$/)) {
        toast.error('Invalid Azure Account Name. Must be 3-24 lowercase letters or numbers.', { duration: 3000 });
        return false;
      }
      if (!config.accountKey?.match(/^[A-Za-z0-9+/=]{88}$/)) {
        toast.error('Invalid Azure Account Key. Must be 88 base64 characters.', { duration: 3000 });
        return false;
      }
      if (!config.container?.match(/^[a-z0-9-]{3,63}$/)) {
        toast.error('Invalid Azure Container Name. Must be 3-63 lowercase letters, numbers, or hyphens.', { duration: 3000 });
        return false;
      }
    }
    return isValid;
  };

  const handleFetchFiles = async () => {
    if (!validateCredentials(configData)) {
      return;
    }
    setIsFetching(true);
    try {
      let response: any;
      if (cloudPlatform === 'azure') {
        console.log('CloudConfig.tsx: Fetching Azure files with config:', configData);
        response = await fetchAzureFiles(configData);
        console.log('CloudConfig.tsx: Fetch files response:', response);
        if (response.status === 'success') {
          setAvailableFiles((response.files || []) as FileItem[]);
          toast.success('Files fetched successfully', { duration: 2000 });
        } else {
          toast.error(response.message || 'Failed to fetch files. Please check your credentials.', { duration: 2000 });
        }
      } else {
        console.log('CloudConfig.tsx: Fetching AWS files with config:', configData);
        response = await fetchAwsFiles(configData);
        if (response.status === 'success') {
          setAvailableFiles((response.files || []) as FileItem[]);
          toast.success('Files fetched successfully', { duration: 2000 });
        } else {
          toast.error(response.message || 'Failed to fetch files. Please check your credentials.', { duration: 2000 });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('CloudConfig.tsx: Error fetching files:', error);
      toast.error('Error fetching files: ' + errorMessage, { duration: 2000 });
      setError(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cloudPlatform === 'google') {
      if (!configData.authCode) {
        toast.error('Please paste the Google authorization code', { duration: 2000 });
        return;
      }
      setIsFetching(true);
      try {
        const response = await connectGoogleDrive();
        console.log('CloudConfig.tsx: Google auth response:', response);
        if (response.status === 'success' || response.status === 'configured') {
          toast.success('Google Drive authenticated successfully', { duration: 2000 });
          navigate('/dashboard', {
            state: {
              processType,
              processingLocation,
              files,
              cloudPlatform,
              cloudConfig: { ...configData, authCode: undefined },
              cloudFiles: selectedFiles,
              selectedAttributes,
              selectedCountry,
              selectedTab: 'upload',
            },
          });
        } else {
          toast.error(response.message || 'Failed to authenticate Google Drive', { duration: 2000 });
          setError(response.message || 'Authentication failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('CloudConfig.tsx: Google auth error:', error);
        toast.error('Error authenticating Google Drive: ' + errorMessage, { duration: 2000 });
        setError(errorMessage);
      } finally {
        setIsFetching(false);
      }
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file', { duration: 2000 });
      return;
    }
    if (!validateCredentials(configData)) {
      return;
    }
    setIsFetching(true);
    try {
      let response: any;
      if (cloudPlatform === 'azure') {
        console.log('CloudConfig.tsx: Submitting Azure selected files:', selectedFiles);
        response = await uploadAzureSelectedFiles(selectedFiles.map(f => f.name));
      } else {
        console.log('CloudConfig.tsx: Submitting AWS selected files:', selectedFiles);
        response = await uploadAwsSelectedFiles(selectedFiles.map(f => f.name));
      }
      console.log('CloudConfig.tsx: Submit response:', response);
      if (response.status === 'success') {
        toast.success(response.message || 'Files processed successfully', { duration: 2000 });
        console.log('CloudConfig.tsx: Navigating to /dashboard with configData:', configData);
        navigate('/dashboard', {
          state: {
            processType,
            processingLocation,
            files,
            cloudPlatform,
            cloudConfig: configData,
            cloudFiles: selectedFiles,
            selectedAttributes,
            selectedCountry,
            selectedTab: 'process',
          },
        });
      } else {
        toast.error(response.message || 'Failed to process files. Please check your credentials.', { duration: 2000 });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('CloudConfig.tsx: Error processing files:', error);
      toast.error('Error processing files: ' + errorMessage, { duration: 2000 });
      setError(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSelectAll = () => {
    const filteredFiles = getFilteredFiles();
    setSelectedFiles(prev => {
      const newSelected = [...prev];
      filteredFiles.forEach(file => {
        if (!newSelected.some(f => f.id === file.id)) {
          newSelected.push(file);
        }
      });
      return newSelected;
    });
  };

  const handleDeselectAll = () => {
    const filteredFiles = getFilteredFiles();
    setSelectedFiles(prev => 
      prev.filter(selected => !filteredFiles.some(filtered => filtered.id === selected.id))
    );
  };

  const getFilteredFiles = () => {
    let filtered = availableFiles;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply selection filter
    if (fileFilter === 'selected') {
      filtered = filtered.filter(file => selectedFiles.some(f => f.id === file.id));
    } else if (fileFilter === 'unselected') {
      filtered = filtered.filter(file => !selectedFiles.some(f => f.id === file.id));
    }
    
    return filtered;
  };

  const platformName = cloudPlatform === 'aws' ? 'AWS' : cloudPlatform === 'azure' ? 'Azure' : 'Google Drive';

  return (
    <PageContainer>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
          <Button onClick={() => setError(null)} className="mt-2">Clear Error</Button>
        </div>
      )}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{platformName} Configuration</h1>
        <p className="text-muted-foreground">Configure your cloud provider settings and select files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="bg-accent rounded-t-lg border-b">
              <CardTitle className="text-qclassify-primary">{platformName} Configuration</CardTitle>
              <CardDescription>Enter your cloud credentials</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {cloudFields[cloudPlatform].map((field) => (
                    <div key={field.name}>
                      <Label htmlFor={field.name}>{field.label}</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={configData[field.name] || ''}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        required
                        type={field.name.includes('Key') || field.name.includes('Secret') ? 'password' : 'text'}
                      />
                    </div>
                  ))}
                </div>

                {cloudPlatform !== 'google' && (
                  <Button
                    type="button"
                    onClick={handleFetchFiles}
                    disabled={isFetching}
                    className="w-full"
                  >
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    {isFetching ? 'Fetching...' : 'Fetch Files'}
                  </Button>
                )}

                <Separator />

                <div className="space-y-2">
                  <Button
                    type="submit"
                    disabled={isFetching || (cloudPlatform !== 'google' && selectedFiles.length === 0)}
                    className="w-full"
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Save and Proceed
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard', { state: location.state })}
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* File Browser Panel */}
        {availableFiles.length > 0 && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-accent rounded-t-lg border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-qclassify-primary">File Browser</CardTitle>
                    <CardDescription>
                      {availableFiles.length} files available • {selectedFiles.length} selected
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {selectedFiles.length}/{availableFiles.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* File Browser Controls */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search files..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFileFilter(fileFilter === 'all' ? 'selected' : fileFilter === 'selected' ? 'unselected' : 'all')}
                      >
                        <FilterIcon className="w-4 h-4 mr-2" />
                        {fileFilter === 'all' ? 'All' : fileFilter === 'selected' ? 'Selected' : 'Unselected'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={getFilteredFiles().length === 0}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAll}
                        disabled={selectedFiles.length === 0}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                </div>

                {/* File List */}
                <div className="max-h-96 overflow-y-auto">
                  {getFilteredFiles().length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <FolderIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No files found matching your criteria</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {getFilteredFiles().map((file) => {
                        const isSelected = selectedFiles.some(f => f.id === file.id);
                        return (
                          <div
                            key={file.id}
                            className={`flex items-center p-4 hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                          >
                            <Checkbox
                              id={file.id}
                              checked={isSelected}
                              onCheckedChange={() => {
                                setSelectedFiles(prev =>
                                  prev.some(f => f.id === file.id)
                                    ? prev.filter(f => f.id !== file.id)
                                    : [...prev, file]
                                );
                              }}
                              className="mr-3"
                            />
                            <div className="flex items-center flex-1 min-w-0">
                              <FileIcon className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <label
                                  htmlFor={file.id}
                                  className="text-sm font-medium text-gray-900 cursor-pointer truncate block"
                                >
                                  {file.name}
                                </label>
                                <p className="text-xs text-gray-500 truncate">
                                  {file.id !== file.name ? file.id : 'Cloud file'}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}