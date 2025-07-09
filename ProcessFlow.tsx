import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileUploader } from './FileUploader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { initializeUpload, uploadFiles, connectGoogleDrive, fetchGoogleDriveFiles, streamGoogleDriveFiles, CloudConfigData } from '@/api/api';

interface FileItem {
  name: string;
  id: string;
}

interface FolderItem {
  name: string;
  id: string;
}

const globalEntities = [
  { id: 'creditCard', label: 'Credit Card', value: 'CREDIT_CARD' },
  { id: 'crypto', label: 'Cryptocurrency', value: 'CRYPTO' },
  { id: 'dateTime', label: 'Date & Time', value: 'DATE_TIME' },
  { id: 'email', label: 'Email Addresses', value: 'EMAIL_ADDRESS' },
  { id: 'iban', label: 'IBAN Code', value: 'IBAN_CODE' },
  { id: 'ipAddress', label: 'IP Addresses', value: 'IP_ADDRESS' },
  { id: 'nrp', label: 'NRP', value: 'NRP' },
  { id: 'location', label: 'Locations', value: 'LOCATION' },
  { id: 'person', label: 'Person Names', value: 'PERSON' },
  { id: 'phone', label: 'Phone Numbers', value: 'PHONE_NUMBER' },
  { id: 'medicalLicense', label: 'Medical License', value: 'MEDICAL_LICENSE' },
  { id: 'url', label: 'URLs', value: 'URL' },
  { id: 'all', label: 'All' },
];

const countryEntities: Record<string, { id: string; label: string; value: string }[]> = {
  USA: [
    { id: 'usBankNumber', label: 'US Bank Numbers', value: 'US_BANK_NUMBER' },
    { id: 'usDriverLicense', label: 'US Driver License', value: 'US_DRIVER_LICENSE' },
    { id: 'usItin', label: 'US ITIN', value: 'US_ITIN' },
    { id: 'usPassport', label: 'US Passport', value: 'US_PASSPORT' },
    { id: 'usSsn', label: 'US SSN', value: 'US_SSN' },
  ],
  UK: [
    { id: 'ukNhs', label: 'UK NHS Number', value: 'UK_NHS' },
    { id: 'ukNino', label: 'UK National Insurance Number', value: 'UK_NINO' },
  ],
  Spain: [
    { id: 'esNif', label: 'Spanish NIF', value: 'ES_NIF' },
    { id: 'esNie', label: 'Spanish NIE', value: 'ES_NIE' },
  ],
  Italy: [
    { id: 'itFiscalCode', label: 'Italian Fiscal Code', value: 'IT_FISCAL_CODE' },
    { id: 'itDriverLicense', label: 'Italian Driver License', value: 'IT_DRIVER_LICENSE' },
    { id: 'itVatCode', label: 'Italian VAT Code', value: 'IT_VAT_CODE' },
    { id: 'itPassport', label: 'Italian Passport', value: 'IT_PASSPORT' },
    { id: 'itIdentityCard', label: 'Italian Identity Card', value: 'IT_IDENTITY_CARD' },
  ],
  Poland: [
    { id: 'plPesel', label: 'Polish PESEL', value: 'PL_PESEL' },
  ],
  Singapore: [
    { id: 'sgNricFin', label: 'Singapore NRIC/FIN', value: 'SG_NRIC_FIN' },
    { id: 'sgUen', label: 'Singapore UEN', value: 'SG_UEN' },
  ],
  Australia: [
    { id: 'auAbn', label: 'Australian ABN', value: 'AU_ABN' },
    { id: 'auAcn', label: 'Australian ACN', value: 'AU_ACN' },
    { id: 'auTfn', label: 'Australian TFN', value: 'AU_TFN' },
    { id: 'auMedicare', label: 'Australian Medicare', value: 'AU_MEDICARE' },
  ],
  India: [
    { id: 'inPan', label: 'Indian PAN', value: 'IN_PAN' },
    { id: 'inAadhar', label: 'Indian Aadhaar', value: 'IN_AADHAR' },
    { id: 'inVehicleRegistration', label: 'Indian Vehicle Registration', value: 'IN_VEHICLE_REGISTRATION' },
    { id: 'inVoter', label: 'Indian Voter ID', value: 'IN_VOTER' },
    { id: 'inPassport', label: 'Indian Passport', value: 'IN_PASSPORT' },
    { id: 'inPhoneNumber', label: 'Indian Phone Number', value: 'IN_PHONE_NUMBER' },
    { id: 'inCreditCard', label: 'Indian Credit Card', value: 'IN_CREDIT_CARD' },
    { id: 'inGstNumber', label: 'Indian GST Number', value: 'IN_GST_NUMBER' },
    { id: 'inUpiId', label: 'Indian UPI ID', value: 'IN_UPI_ID' },
    { id: 'inBankAccount', label: 'Indian Bank Account Number', value: 'IN_BANK_ACCOUNT' },
    { id: 'inIfscCode', label: 'Indian IFSC Code', value: 'IN_IFSC_CODE' },
    { id: 'inDrivingLicense', label: 'Indian Driving License', value: 'IN_DRIVING_LICENSE' },
  ],
  Finland: [
    { id: 'fiPersonalIdentityCode', label: 'Finnish Personal Identity Code', value: 'FI_PERSONAL_IDENTITY_CODE' },
  ],
};

const cloudInfo: Record<string, { name: string; fields: string[]; logo: string; fallbackLogo: string }> = {
  aws: {
    name: 'AWS',
    fields: ['Access Key', 'Secret Key', 'S3 Bucket Name'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    fallbackLogo: 'https://via.placeholder.com/24?text=AWS',
  },
  azure: {
    name: 'Azure',
    fields: ['Account Name', 'Account Key', 'Container Name'],
    logo: 'https://learn.microsoft.com/en-us/azure/media/index/azure.svg',
    fallbackLogo: 'https://via.placeholder.com/24?text=Azure',
  },
  google: {
    name: 'Google Drive',
    fields: ['Folder'],
    logo: 'https://www.google.com/drive/static/images/drive/logo-drive.png',
    fallbackLogo: 'https://via.placeholder.com/24?text=GDrive',
  },
};

// Define categorized entities (default mapping)
const categorizedEntities = {
  CONFIDENTIAL: [
    'CREDIT_CARD', 'CRYPTO', 'IBAN_CODE', 'MEDICAL_LICENSE',
    'US_BANK_NUMBER', 'US_DRIVER_LICENSE', 'US_ITIN', 'US_PASSPORT', 'US_SSN',
    'UK_NHS', 'UK_NINO', 'ES_NIF', 'ES_NIE', 'IT_FISCAL_CODE', 'IT_DRIVER_LICENSE',
    'IT_VAT_CODE', 'IT_PASSPORT', 'IT_IDENTITY_CARD', 'PL_PESEL', 'SG_NRIC_FIN',
    'SG_UEN', 'AU_ABN', 'AU_ACN', 'AU_TFN', 'AU_MEDICARE', 'IN_PAN', 'IN_AADHAR',
    'IN_VEHICLE_REGISTRATION', 'IN_VOTER', 'IN_PASSPORT', 'IN_CREDIT_CARD',
    'IN_GST_NUMBER', 'IN_UPI_ID', 'IN_BANK_ACCOUNT', 'IN_IFSC_CODE', 'IN_DRIVING_LICENSE',
    'FI_PERSONAL_IDENTITY_CODE'
  ],
  PRIVATE: ['DATE_TIME', 'LOCATION', 'PERSON', 'PHONE_NUMBER', 'IN_PHONE_NUMBER'],
  RESTRICTED: ['EMAIL_ADDRESS', 'NRP', 'URL', 'IP_ADDRESS'],
  OTHER: []
};

interface LocationState {
  processType?: string;
  processingLocation?: string;
  files?: File[];
  cloudPlatform?: string;
  cloudConfig?: CloudConfigData;
  cloudFiles?: Array<FileItem | string>;
  selectedAttributes?: Record<string, boolean>;
  analysisResult?: any;
  selectedTab?: string;
  selectedCountry?: string;
}

export function ProcessFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  console.log('ProcessFlow.tsx: Initial location.state:', JSON.stringify(state, null, 2));

  const [selectedTab, setSelectedTab] = useState(state?.selectedTab || 'upload');
  const [processType] = useState('classification');
  const [processingLocation, setProcessingLocation] = useState(state?.processingLocation || 'local');
  const [files, setFiles] = useState<File[]>(state?.files || []);
  const [cloudPlatform, setCloudPlatform] = useState(state?.cloudPlatform || 'aws');
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, boolean>>(state?.selectedAttributes || {});
  const [cloudConfig, setCloudConfig] = useState<CloudConfigData>(state?.cloudConfig || {});
  const [cloudFiles, setCloudFiles] = useState<Array<FileItem | string>>(state?.cloudFiles || []);
  const [showBuffering, setShowBuffering] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(state?.selectedCountry || '');
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<FolderItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [availableFiles, setAvailableFiles] = useState<FileItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({
    aws: false,
    azure: false,
    google: false,
  });
  const [userPrompt, setUserPrompt] = useState<string>('');

  // Initialize displayed categorized entities and category mapping
  const [displayedCategorizedEntities, setDisplayedCategorizedEntities] = useState({
    CONFIDENTIAL: [] as string[],
    PRIVATE: [] as string[],
    RESTRICTED: [] as string[],
    OTHER: [] as string[]
  });
  const [customCategoryMapping, setCustomCategoryMapping] = useState<Record<string, string>>({});

  // Initialize category mapping and displayed entities
  useEffect(() => {
    const initialSelectedAttributes: Record<string, boolean> = {};
    if (Object.keys(selectedAttributes).length === 0) {
      globalEntities.forEach(attr => {
        if (attr.id !== 'all') {
          initialSelectedAttributes[attr.id] = false;
        }
      });
      Object.values(countryEntities).flat().forEach(attr => {
        initialSelectedAttributes[attr.id] = false;
      });
      initialSelectedAttributes.creditCard = true;
      console.log('ProcessFlow.tsx: Initialized selectedAttributes:', initialSelectedAttributes);
      setSelectedAttributes(initialSelectedAttributes);
    }

    // Initialize customCategoryMapping and displayedCategorizedEntities based on selectedAttributes
    const newDisplayed = {
      CONFIDENTIAL: [] as string[],
      PRIVATE: [] as string[],
      RESTRICTED: [] as string[],
      OTHER: [] as string[]
    };
    const newCategoryMapping: Record<string, string> = {};

    // Map selected entities to their default categories
    const allEntities = [...globalEntities.filter(attr => attr.id !== 'all'), ...Object.values(countryEntities).flat()];
    allEntities.forEach(attr => {
      const entity = attr.value;
      if (selectedAttributes[attr.id]) {
        const category = 
          categorizedEntities.CONFIDENTIAL.includes(entity) ? 'CONFIDENTIAL' :
          categorizedEntities.PRIVATE.includes(entity) ? 'PRIVATE' :
          categorizedEntities.RESTRICTED.includes(entity) ? 'RESTRICTED' : 'OTHER';
        newCategoryMapping[entity] = category;
        newDisplayed[category].push(entity);
      }
    });

    setDisplayedCategorizedEntities(newDisplayed);
    setCustomCategoryMapping(newCategoryMapping);
    console.log('ProcessFlow.tsx: Initial customCategoryMapping:', JSON.stringify(newCategoryMapping, null, 2));
    console.log('ProcessFlow.tsx: Initial displayedCategorizedEntities:', JSON.stringify(newDisplayed, null, 2));
  }, [selectedAttributes]);

  // Handle drag-and-drop
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCategory = source.droppableId as keyof typeof displayedCategorizedEntities;
    const destCategory = destination.droppableId as keyof typeof displayedCategorizedEntities;
    if (sourceCategory === destCategory) return;

    const entity = displayedCategorizedEntities[sourceCategory][source.index];

    // Only allow dragging if the entity is selected
    const isSelected = Object.keys(selectedAttributes).some(
      attrId => selectedAttributes[attrId] && [...globalEntities, ...Object.values(countryEntities).flat()].find(
        attr => attr.id === attrId
      )?.value === entity
    );

    if (!isSelected) {
      toast.error('Cannot move unselected entity', { duration: 2000 });
      return;
    }

    setDisplayedCategorizedEntities(prev => {
      const newDisplayed = { ...prev };
      newDisplayed[sourceCategory] = prev[sourceCategory].filter((_, i) => i !== source.index);
      newDisplayed[destCategory] = [...prev[destCategory], entity];
      return newDisplayed;
    });

    setCustomCategoryMapping(prev => ({
      ...prev,
      [entity]: destCategory
    }));

    console.log(`ProcessFlow.tsx: Moved ${entity} to ${destCategory}`);
    console.log('ProcessFlow.tsx: Updated customCategoryMapping:', JSON.stringify({ ...customCategoryMapping, [entity]: destCategory }, null, 2));
    console.log('ProcessFlow.tsx: Updated displayedCategorizedEntities:', JSON.stringify(displayedCategorizedEntities, null, 2));
    toast.success(`Moved ${getEntityLabel(entity)} to ${destCategory}`, { duration: 2000 });
  };

  const checkGoogleDriveAuth = async () => {
    setIsFetching(true);
    try {
      const response = await connectGoogleDrive();
      console.log('ProcessFlow.tsx: Check Google Drive response:', response);
      if (response.status === 'configured') {
        setIsGoogleConfigured(true);
        toast.success('Google Drive is connected', { duration: 2000 });
      } else {
        setIsGoogleConfigured(false);
        setAvailableFolders([]);
        setAvailableFiles([]);
        setSelectedFolder(null);
        toast.info('Google Drive authentication required. Configure in Cloud Settings.', { duration: 2000 });
      }
    } catch (error) {
      console.error('ProcessFlow.tsx: Check Google Drive status error:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to check Google Drive status'}`, { duration: 2000 });
      setIsGoogleConfigured(false);
      setAvailableFolders([]);
      setAvailableFiles([]);
      setSelectedFolder(null);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (processingLocation === 'cloud' && cloudPlatform === 'google') {
      checkGoogleDriveAuth();
    } else {
      setIsGoogleConfigured(false);
      setAvailableFolders([]);
      setAvailableFiles([]);
      setSelectedFolder(null);
    }
  }, [processingLocation, cloudPlatform]);

  useEffect(() => {
    if (state?.selectedCountry) {
      console.log('ProcessFlow.tsx: Restoring selectedCountry from state:', state.selectedCountry);
      setSelectedCountry(state.selectedCountry);
    }
  }, [state]);

  useEffect(() => {
    if (processingLocation === 'local' && selectedTab === 'upload') {
      initializeUpload();
    }
  }, [processingLocation, selectedTab]);

  useEffect(() => {
    if (selectedTab === 'process') {
      console.log('ProcessFlow.tsx: cloudFiles received:', cloudFiles);
      if (processingLocation === 'cloud' && (!cloudFiles || cloudFiles.length === 0)) {
        toast.error('No cloud files selected. Please select files first.', { duration: 2000 });
        setSelectedTab('upload');
      } else if (processingLocation === 'local' && (!files || files.length === 0)) {
        toast.error('No local files uploaded. Please upload files first.', { duration: 2000 });
        setSelectedTab('upload');
      }
    }
  }, [selectedTab, processingLocation, cloudFiles, files]);

  const handleFilesSelected = async (newFiles: File[]) => {
    setFiles(newFiles);
    setCloudFiles([]);
    toast.success(`${newFiles.length} files selected`, { duration: 1000 });

    const result = await uploadFiles(newFiles);
    if (result.status !== 'success') {
      setFiles([]);
      toast.error('File upload failed', { duration: 2000 });
    }
  };

  const handleLocationChange = (value: string) => {
    setProcessingLocation(value);
    setCloudFiles([]);
    setCloudConfig({});
    setFiles([]);
    setAvailableFolders([]);
    setAvailableFiles([]);
    setSelectedFolder(null);
    setIsGoogleConfigured(false);
  };

  const handleCloudPlatformChange = (value: string) => {
    setCloudPlatform(value);
    setCloudFiles([]);
    setCloudConfig({});
    setAvailableFolders([]);
    setAvailableFiles([]);
    setSelectedFolder(null);
    setIsGoogleConfigured(false);
  };

  const handleShowFolders = async () => {
    if (!isGoogleConfigured) {
      toast.error('Google Drive is not authenticated. Please configure first.', { duration: 2000 });
      return;
    }
    setIsFetching(true);
    try {
      const response = await connectGoogleDrive();
      console.log('ProcessFlow.tsx: Show Folders response:', response);
      if (response.status === 'configured') {
        setAvailableFolders(response.folders as FolderItem[]);
        toast.success('Folders fetched successfully', { duration: 2000 });
      } else {
        setAvailableFolders([]);
        setAvailableFiles([]);
        setSelectedFolder(null);
        toast.error('Google Drive authentication required. Configure in Cloud Settings.', { duration: 2000 });
      }
    } catch (error) {
      console.error('ProcessFlow.tsx: Show Folders error:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to fetch folders'}`, { duration: 2000 });
    } finally {
      setIsFetching(false);
    }
  };

  const handleFolderClick = async (folder: FolderItem) => {
    setSelectedFolder(folder);
    setCloudConfig(prev => ({
      ...prev,
      folderName: folder.name,
      folderId: folder.id,
    }));
    setAvailableFiles([]);
    setCloudFiles([]);
    setIsFetching(true);
    try {
      const response = await fetchGoogleDriveFiles({ name: folder.name, id: folder.id });
      console.log('ProcessFlow.tsx: Fetch files response:', response);
      if (response.status === 'success' && response.files) {
        setAvailableFiles(response.files as FileItem[]);
        toast.success('Files fetched successfully', { duration: 2000 });
      } else {
        toast.error(response.message || 'Failed to fetch files', { duration: 2000 });
      }
    } catch (error) {
      console.error('ProcessFlow.tsx: Fetch files error:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to fetch files'}`, { duration: 2000 });
    } finally {
      setIsFetching(false);
    }
  };

  const handleFileSelection = (file: FileItem) => {
    setCloudFiles(prev =>
      prev.some(f => (typeof f === 'string' ? f : f.id) === file.id)
        ? prev.filter(f => (typeof f === 'string' ? f : f.id) !== file.id)
        : [...prev, file]
    );
    console.log('ProcessFlow.tsx: Selected files:', cloudFiles);
  };

  const handleCloudConfig = () => {
    if (cloudPlatform === 'google' && !isGoogleConfigured) {
      connectGoogleDrive().then(response => {
        if (response.auth_url) {
          window.open(response.auth_url, '_blank');
          toast.info('Please authenticate in the opened browser window and paste the code in Cloud Config.', { duration: 3000 });
        }
      });
    }
    navigate('/cloud-config', {
      state: {
        processType,
        processingLocation,
        files,
        cloudPlatform,
        cloudConfig,
        cloudFiles,
        selectedAttributes,
        selectedCountry,
        selectedTab: 'upload',
      },
    });
  };

  const handleAttributeChange = (attributeId: string, checked: boolean) => {
    console.log(`ProcessFlow.tsx: Changing ${attributeId} to ${checked}`);
    if (attributeId === 'all') {
      const newSelectedState = { ...selectedAttributes };
      const newAllState = !(
        globalEntities
          .filter(attr => attr.id !== 'all')
          .every(attr => selectedAttributes[attr.id] === true) &&
        (!selectedCountry ||
          countryEntities[selectedCountry]?.every(attr => selectedAttributes[attr.id] === true))
      );

      globalEntities.forEach(attr => {
        if (attr.id !== 'all') {
          newSelectedState[attr.id] = newAllState;
        }
      });

      if (selectedCountry && countryEntities[selectedCountry]) {
        countryEntities[selectedCountry].forEach(attr => {
          newSelectedState[attr.id] = newAllState;
        });
      }

      setSelectedAttributes(newSelectedState);
    } else {
      setSelectedAttributes(prev => ({
        ...prev,
        [attributeId]: checked,
      }));
    }
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    console.log(`ProcessFlow.tsx: Changing country to ${value}, retaining selectedAttributes:`, selectedAttributes);
  };

  const handleNext = async () => {
    if (processingLocation === 'local' && files.length === 0) {
      toast.error('Please upload at least one file', { duration: 2000 });
      return;
    }

    if (processingLocation === 'cloud' && cloudFiles.length === 0) {
      toast.error('Please select at least one cloud file', { duration: 2000 });
      return;
    }

    if (processingLocation === 'cloud' && cloudPlatform === 'google' && cloudFiles.length > 0) {
      setIsFetching(true);
      try {
        const response = await streamGoogleDriveFiles(cloudFiles as FileItem[]);
        console.log('ProcessFlow.tsx: Stream files response:', response);
        if (response.status === 'success') {
          toast.success(response.message, { duration: 2000 });
          setSelectedTab('process');
        } else {
          toast.error(response.message || 'Failed to process files', { duration: 2000 });
        }
      } catch (error) {
        console.error('ProcessFlow.tsx: Stream files error:', error);
        toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to process files'}`, { duration: 2000 });
      } finally {
        setIsFetching(false);
      }
    } else {
      setSelectedTab('process');
    }
  };

  const handleAnalyze = async () => {
  const entities = [
    ...globalEntities.filter(attr => attr.id !== 'all' && selectedAttributes[attr.id]).map(attr => attr.value),
    ...(selectedCountry ? countryEntities[selectedCountry]?.filter(attr => selectedAttributes[attr.id]).map(attr => attr.value) || [] : []),
  ];

  console.log('ProcessFlow.tsx: selectedAttributes before analyze:', selectedAttributes);
  console.log('ProcessFlow.tsx: Entities computed:', entities);
  console.log('ProcessFlow.tsx: selectedCountry:', selectedCountry);
  console.log('ProcessFlow.tsx: Category mapping:', JSON.stringify(customCategoryMapping, null, 2));
  console.log('ProcessFlow.tsx: User prompt:', userPrompt);

  if (entities.length === 0 && !userPrompt.trim()) {
    toast.error('Please select at least one attribute or provide a user prompt for classification', { duration: 2000 });
    return;
  }

  // Validate categoryMapping
  if (entities.length > 0 && Object.keys(customCategoryMapping).length === 0) {
    console.error('ProcessFlow.tsx: categoryMapping is empty for selected entities');
    toast.error('Category mapping is missing for selected entities', { duration: 2000 });
    return;
  }

  // Ensure all selected entities have a category mapping
  const missingEntities = entities.filter(entity => !customCategoryMapping[entity]);
  if (missingEntities.length > 0) {
    console.error('ProcessFlow.tsx: Missing category mappings for entities:', missingEntities);
    toast.error(`Missing category mappings for: ${missingEntities.map(getEntityLabel).join(', ')}`, { duration: 2000 });
    return;
  }

  setShowBuffering(true);

  try {
    // Prepare form data for backend
    const formData = new FormData();
    formData.append('selectedOption', processType);
    if (selectedCountry) formData.append('country', selectedCountry);
    formData.append('multiple', JSON.stringify(entities)); // Use JSON string for multiple
    formData.append('categoryMapping', JSON.stringify(customCategoryMapping));
    if (userPrompt.trim()) formData.append('user_prompt', userPrompt.trim());

    if (processingLocation === 'local') {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('cloudFiles', JSON.stringify(cloudFiles));
      formData.append('cloudConfig', JSON.stringify(cloudConfig));
      formData.append('cloudPlatform', cloudPlatform.toLowerCase());
    }

    // Log form data for debugging
    const formDataEntries: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      formDataEntries[key] = typeof value === 'string' ? value : '[File/Blob]';
    }
    console.log('ProcessFlow.tsx: FormData being sent:', JSON.stringify(formDataEntries, null, 2));

    const result = await initializeUpload(formData);
    console.log('ProcessFlow.tsx: Initialize upload response:', result);

    if (result.status === 'success') {
      const navigationState = {
        processType,
        processingLocation,
        files,
        cloudPlatform,
        cloudConfig,
        cloudFiles,
        selectedAttributes,
        selectedCountry,
        entities,
        categoryMapping: customCategoryMapping,
        userPrompt
      };
      console.log('ProcessFlow.tsx: Navigation state for classification:', JSON.stringify(navigationState, null, 2));
      toast.success('Content analysis started', { duration: 2000 });
      navigate('/analyze', { state: navigationState });
    } else {
      toast.error(result.message || 'Failed to initialize upload', { duration: 2000 });
    }
  } catch (error) {
    console.error('ProcessFlow.tsx: Analyze error:', error);
    toast.error('Error navigating to analysis: ' + ((error as Error).message || 'Unknown error'), { duration: 2000 });
  } finally {
    setShowBuffering(false);
  }
};

// No changes needed for onDragEnd, as it correctly updates customCategoryMapping

  const handleLogoError = (platform: string) => {
    console.error(`Failed to load logo for ${cloudInfo[platform].name}`);
    setLogoErrors(prev => ({ ...prev, [platform]: true }));
  };

  // Map entity values to labels for display
  const getEntityLabel = (value: string) => {
    const globalEntity = globalEntities.find(attr => attr.value === value);
    if (globalEntity) return globalEntity.label;
    for (const country of Object.values(countryEntities)) {
      const countryEntity = country.find(attr => attr.value === value);
      if (countryEntity) return countryEntity.label;
    }
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); // Fallback: format value as readable label
  };

  // Render categorized entities with drag-and-drop
  const renderCategorizedEntities = (category: string, entities: string[]) => (
    <Droppable droppableId={category}>
      {(provided) => (
        <div
          className={`border rounded-lg p-3 bg-${category.toLowerCase()}-50 transition-all duration-200 ${
            category === 'CONFIDENTIAL' ? 'bg-red-50' : category === 'PRIVATE' ? 'bg-yellow-50' : category === 'RESTRICTED' ? 'bg-blue-50' : 'bg-gray-50'
          }`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <h4 className="text-sm font-semibold mb-2">{category}</h4>
          <div className="flex flex-wrap gap-2">
            {entities.length > 0 ? (
              entities.map((entity, index) => (
                <Draggable key={entity} draggableId={entity} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="px-2 py-1 bg-accent/20 border rounded-full text-xs font-medium cursor-move shadow-sm hover:bg-accent/30 transition-colors"
                    >
                      {getEntityLabel(entity)}
                    </div>
                  )}
                </Draggable>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No entities selected</p>
            )}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="w-full">
        <CardHeader className="bg-accent rounded-t-lg border-b">
          <CardTitle className="text-qclassify-primary">Configure & Process</CardTitle>
          <CardDescription>
            Set parameters and process your data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs defaultValue="upload" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="upload">1. Configure</TabsTrigger>
              <TabsTrigger
                value="process"
                disabled={processingLocation === 'local' ? !files.length : !cloudFiles.length}
              >
                2. Process
              </TabsTrigger>
              <TabsTrigger value="results" disabled>3. Results</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="pt-3 border-t">
                    <h3 className="text-lg font-medium mb-2">Location</h3>
                    <RadioGroup
                      defaultValue="local"
                      value={processingLocation}
                      onValueChange={handleLocationChange}
                      className="flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="local" id="local" />
                        <Label htmlFor="local">Local</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="cloud" id="cloud" />
                        <Label htmlFor="cloud">Cloud</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {processingLocation === 'local' && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Upload Files</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supported formats: TXT, DOCX, PDF, JPG/JPEG/PNG/TIF
                    </p>
                    <FileUploader onFilesSelected={handleFilesSelected} />

                    {files.length > 0 && (
                      <div className="mt-4 p-3 bg-accent rounded-md">
                        <p className="font-medium">{files.length} file(s) selected</p>
                        <ul className="text-sm mt-2">
                          {files.slice(0, 3).map((file, index) => (
                            <li key={index}>{file.name}</li>
                          ))}
                          {files.length > 3 && <li>...and {files.length - 3} more</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {processingLocation === 'cloud' && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Cloud Platform</h3>
                    <RadioGroup
                      defaultValue="aws"
                      value={cloudPlatform}
                      onValueChange={handleCloudPlatformChange}
                      className="grid grid-cols-2 gap-2 mb-4"
                    >
                      {Object.keys(cloudInfo).map((platform) => (
                        <div key={platform} className="flex items-center space-x-3 border rounded-md p-2">
                          <RadioGroupItem value={platform} id={platform} />
                          <Label htmlFor={platform} className="flex items-center space-x-2">
                            <img
                              src={logoErrors[platform] ? cloudInfo[platform].fallbackLogo : cloudInfo[platform].logo}
                              alt={`${cloudInfo[platform].name} logo`}
                              className="w-6 h-6 object-contain"
                              onError={() => handleLogoError(platform)}
                            />
                            <span>{cloudInfo[platform].name}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    <div className="mt-4 p-3 bg-accent/50 rounded-md">
                      <h4 className="font-medium mb-2">
                        {cloudInfo[cloudPlatform].name} Configuration
                      </h4>
                      {cloudPlatform === 'google' ? (
                        <div className="space-y-4">
                          {isGoogleConfigured ? (
                            <>
                              <p className="text-sm text-green-600">Google Drive is connected</p>
                              <Button
                                type="button"
                                onClick={handleShowFolders}
                                disabled={isFetching}
                                className="w-full"
                              >
                                {isFetching ? 'Fetching...' : 'Show Folders'}
                              </Button>
                              {availableFolders.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Available Folders</h5>
                                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                                    {availableFolders.map(folder => (
                                      <div
                                        key={folder.id}
                                        className={`p-2 cursor-pointer hover:bg-accent ${selectedFolder?.id === folder.id ? 'bg-accent' : ''}`}
                                        onClick={() => handleFolderClick(folder)}
                                      >
                                        {folder.name}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {availableFiles.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Available Files</h5>
                                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                                    {availableFiles.map(file => (
                                      <div key={file.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={file.id}
                                          checked={cloudFiles.some(f => (typeof f === 'string' ? f : f.id) === file.id)}
                                          onCheckedChange={() => handleFileSelection(file)}
                                        />
                                        <Label htmlFor={file.id} className="text-sm">{file.name}</Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={handleCloudConfig}
                              className="w-full"
                            >
                              Configure Google Drive
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          <ul className="text-sm space-y-1">
                            {cloudInfo[cloudPlatform].fields.map((field) => {
                              const fieldKey = field.toLowerCase().replace(/\s+/g, '');
                              return (
                                <li key={fieldKey} className="flex justify-between">
                                  <span>• {field}:</span>
                                  <span className="capitalize">
                                    {cloudConfig[fieldKey] ? (cloudPlatform === 'google' ? cloudConfig[fieldKey] : '••••••••') : 'Not set'}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                          <Button
                            variant="outline"
                            onClick={handleCloudConfig}
                            className="w-full mt-3"
                          >
                            Configure {cloudInfo[cloudPlatform].name}
                          </Button>
                        </>
                      )}
                    </div>

                    {cloudFiles.length > 0 && (
                      <div className="mt-4 p-3 bg-accent rounded-md">
                        <p className="font-medium">{cloudFiles.length} file(s) selected</p>
                        <ul className="text-sm mt-2">
                          {cloudFiles.slice(0, 3).map((file, index) => (
                            <li key={index}>{typeof file === 'string' ? file : file.name}</li>
                          ))}
                          {cloudFiles.length > 3 && <li>...and {cloudFiles.length - 3} more</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleNext}
                  disabled={processingLocation === 'local' ? !files.length : !cloudFiles.length}
                >
                  Next
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="process" className="space-y-6">
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-accent/50 p-3 rounded-md">
                      <h3 className="text-sm font-semibold mb-2">Processing Configuration</h3>
                      <dl className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <dt>Process Type:</dt>
                          <dd>Data Classification + Chatbot</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Location:</dt>
                          <dd className="capitalize">{processingLocation}</dd>
                        </div>
                        {processingLocation === 'cloud' && (
                          <div className="flex justify-between">
                            <dt>Platform:</dt>
                            <dd>{cloudInfo[cloudPlatform].name}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt>Files:</dt>
                          <dd>{processingLocation === 'local' ? files.length : cloudFiles.length}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-accent/50 p-3 rounded-md">
                      <h3 className="text-sm font-semibold mb-2">Custom Query</h3>
                      <Label htmlFor="userPrompt" className="text-sm font-medium">
                        Enter your query (e.g., "find all vehicle related information")
                      </Label>
                      <textarea
                        id="userPrompt"
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="Type your query here..."
                        className="mt-2 w-full border rounded-md p-2 text-sm resize-none overflow-hidden"
                        style={{ minHeight: '40px', maxHeight: '200px' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto'; // Reset height to recalculate
                          target.style.height = `${Math.min(target.scrollHeight, 200)}px`; // Set height to content or max 200px
                        }}
                        aria-describedby="userPromptDescription"
                      />
                      <p id="userPromptDescription" className="text-xs text-muted-foreground mt-1">
                        Specify what information to extract from the files, or leave blank to detect selected entities.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Categorized Entities</h3>
                      <div className="space-y-3">
                        {renderCategorizedEntities('CONFIDENTIAL', displayedCategorizedEntities.CONFIDENTIAL)}
                        {renderCategorizedEntities('PRIVATE', displayedCategorizedEntities.PRIVATE)}
                        {renderCategorizedEntities('RESTRICTED', displayedCategorizedEntities.RESTRICTED)}
                        {renderCategorizedEntities('OTHER', displayedCategorizedEntities.OTHER)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3">Select Attributes to Detect</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-md font-medium mb-2">Global Entities</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 pb-2 border-b">
                            <Checkbox
                              id="all"
                              checked={
                                globalEntities
                                  .filter(attr => attr.id !== 'all')
                                  .every(attr => selectedAttributes[attr.id] === true) &&
                                (!selectedCountry ||
                                  countryEntities[selectedCountry]?.every(attr => selectedAttributes[attr.id] === true))
                              }
                              onCheckedChange={(checked) => handleAttributeChange('all', checked === true)}
                            />
                            <Label htmlFor="all" className="text-sm font-medium">All</Label>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {globalEntities.filter(attr => attr.id !== 'all').map((attribute) => (
                              <div key={attribute.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={attribute.id}
                                  checked={selectedAttributes[attribute.id] || false}
                                  onCheckedChange={(checked) => handleAttributeChange(attribute.id, checked === true)}
                                />
                                <Label htmlFor={attribute.id} className="text-sm font-medium">{attribute.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-medium mb-2">Country-Specific Entities</h4>
                        <Select onValueChange={handleCountryChange} value={selectedCountry}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(countryEntities).map((country) => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedCountry && (
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {countryEntities[selectedCountry].map((attribute) => (
                              <div key={attribute.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={attribute.id}
                                  checked={selectedAttributes[attribute.id] || false}
                                  onCheckedChange={(checked) => handleAttributeChange(attribute.id, checked === true)}
                                />
                                <Label htmlFor={attribute.id} className="text-sm font-medium">{attribute.label}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DragDropContext>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedTab('upload')}>
                  Back
                </Button>
                <Button onClick={handleAnalyze}>
                  Analyze Content
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showBuffering || isFetching}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isFetching ? 'Fetching Data' : 'Analyzing Content'}</DialogTitle>
            <DialogDescription>
              {isFetching ? 'Please wait while we fetch your data...' : 'Please wait while we process your files...'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Progress value={null} className="w-full h-2" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}