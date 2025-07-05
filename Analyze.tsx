import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { analyzeContent, CloudConfigData } from '@/api/api';

interface FileItem {
  name: string;
  id: string;
}

interface LocationState {
  processType?: string;
  processingLocation?: string;
  files?: File[];
  cloudPlatform?: string;
  cloudConfig?: CloudConfigData;
  cloudFiles?: Array<FileItem | string>;
  selectedAttributes?: Record<string, boolean>;
  selectedCountry?: string;
  entities?: string[];
}

export function Analyze() {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Starting analysis...');
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelled, setIsCancelled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const estimatedDuration = 15000;

  useEffect(() => {
    console.log('Analyze.tsx: Received state:', JSON.stringify({
      ...state,
      files: state?.files?.map(f => f.name),
      cloudFiles: state?.cloudFiles,
    }, null, 2));

    const {
      processType,
      files,
      cloudFiles,
      processingLocation,
      cloudConfig,
      cloudPlatform,
      selectedCountry,
      entities: stateEntities,
      selectedAttributes, // Add this
    } = state || {};

    if (!processType || (!files && !cloudFiles)) {
      console.error('Analyze.tsx: Missing required state');
      toast.error('Invalid analysis configuration', { duration: 3000 });
      navigate('/dashboard', { state });
      return;
    }

    if (processingLocation === 'local' && (!files || files.length === 0)) {
      console.error('Analyze.tsx: No local files provided');
      toast.error('No files selected for analysis', { duration: 3000 });
      navigate('/dashboard', { state });
      return;
    }

    if (processingLocation === 'cloud' && (!cloudFiles || cloudFiles.length === 0)) {
      console.error('Analyze.tsx: No cloud files provided');
      toast.error('No cloud files selected for analysis', { duration: 3000 });
      navigate('/dashboard', { state });
      return;
    }

    if (processingLocation === 'cloud' && !cloudConfig) {
      console.error('Analyze.tsx: Missing cloudConfig for cloud processing');
      toast.error('Cloud configuration missing', { duration: 3000 });
      navigate('/dashboard', { state });
      return;
    }

    const selectedOption = processType === 'classification' ? 'Classification' : 'PanicsTablesExtraction';

    // Use stateEntities if available, else compute from selectedAttributes
    const entities = stateEntities || (processType === 'classification' && selectedAttributes
      ? Object.entries(selectedAttributes)
          .filter(([key, value]) => value && entityMap[key])
          .map(([key]) => entityMap[key])
      : []);

    console.log('Analyze.tsx: Entities sent to backend:', entities);

    if (!entities.length && selectedOption === 'Classification') {
      console.error('Analyze.tsx: No entities selected for classification');
      toast.error('No entities selected for analysis', { duration: 3000 });
      navigate('/dashboard', { state });
      return;
    }

    const entityMap: Record<string, string> = {
      creditCard: 'CREDIT_CARD',
      crypto: 'CRYPTO',
      dateTime: 'DATE_TIME',
      email: 'EMAIL_ADDRESS',
      iban: 'IBAN_CODE',
      ipAddress: 'IP_ADDRESS',
      nrp: 'NRP',
      location: 'LOCATION',
      person: 'PERSON',
      phone: 'PHONE_NUMBER',
      medicalLicense: 'MEDICAL_LICENSE',
      url: 'URL',
      usBankNumber: 'US_BANK_NUMBER',
      usDriverLicense: 'US_DRIVER_LICENSE',
      usItin: 'US_ITIN',
      usPassport: 'US_PASSPORT',
      usSsn: 'US_SSN',
      ukNhs: 'UK_NHS',
      ukNino: 'UK_NINO',
      esNif: 'ES_NIF',
      esNie: 'ES_NIE',
      itFiscalCode: 'IT_FISCAL_CODE',
      itDriverLicense: 'IT_DRIVER_LICENSE',
      itVatCode: 'IT_VAT_CODE',
      itPassport: 'IT_PASSPORT',
      itIdentityCard: 'IT_IDENTITY_CARD',
      plPesel: 'PL_PESEL',
      sgNricFin: 'SG_NRIC_FIN',
      sgUen: 'SG_UEN',
      auAbn: 'AU_ABN',
      auAcn: 'AU_ACN',
      auTfn: 'AU_TFN',
      auMedicare: 'AU_MEDICARE',
      inPan: 'IN_PAN',
      inAadhar: 'IN_AADHAR',
      inVehicleRegistration: 'IN_VEHICLE_REGISTRATION',
      inVoter: 'IN_VOTER',
      inPassport: 'IN_PASSPORT',
      inPhoneNumber: 'IN_PHONE_NUMBER',
      inCreditCard: 'IN_CREDIT_CARD',
      inGstNumber: 'IN_GST_NUMBER',
      inUpiId: 'IN_UPI_ID',
      inBankAccount: 'IN_BANK_ACCOUNT',
      inIfscCode: 'IN_IFSC_CODE',
      inDrivingLicense: 'IN_DRIVING_LICENSE',
      fiPersonalIdentityCode: 'FI_PERSONAL_IDENTITY_CODE',
    };

    const analyze = async (signal: AbortSignal) => {
      try {
        setTimeout(() => !signal.aborted && setStatusMessage('Uploading files...'), 1000);
        setTimeout(() => !signal.aborted && setStatusMessage('Analyzing content...'), 5000);
        setTimeout(() => !signal.aborted && setStatusMessage('Finalizing results...'), 10000);

        const formData = new FormData();
        formData.append('selectedOption', selectedOption);
        if (selectedCountry) formData.append('country', selectedCountry);
        entities.forEach(entity => formData.append('multiple', entity));

        if (processingLocation === 'local' && files) {
          files.forEach(file => formData.append('files', file));
        } else if (processingLocation === 'cloud' && cloudFiles && cloudConfig) {
          const cloudFilesJson = JSON.stringify(cloudFiles.map(f => typeof f === 'string' ? { name: f } : f));
          formData.append('cloudFiles', cloudFilesJson);
          formData.append('cloudConfig', JSON.stringify(cloudConfig));
          if (cloudPlatform) formData.append('cloudPlatform', cloudPlatform.toLowerCase());
        }

        const result = await analyzeContent(formData, { signal });
        console.log('Analyze.tsx: API response:', JSON.stringify(result, null, 2));
        console.log('Analyze.tsx: csv_file_paths in response:', result.csv_file_paths || 'undefined');

        if (signal.aborted) {
          console.log('Analyze.tsx: Analysis cancelled');
          return;
        }

        if (result.status === 'success') {
          if (selectedOption === 'TablesExtraction' && (!result.csv_file_paths || !Array.isArray(result.csv_file_paths) || result.csv_file_paths.length === 0)) {
            throw new Error('No Excel files generated for table extraction');
          }
          setProgress(100);
          setStatusMessage('Analysis complete!');
          const navigateState = {
            analysisResult: result,
            processType,
            processingLocation,
            files: files ? files.map(f => ({ name: f.name })) : [],
            cloudFiles,
            selectedAttributes, // Now defined
            cloudConfig,
            cloudPlatform,
            selectedCountry,
          };
          console.log('Analyze.tsx: Navigating to /results with state:', JSON.stringify({
            ...navigateState,
            files: navigateState.files.map(f => f.name),
            analysisResult: {
              ...navigateState.analysisResult,
              csv_file_paths: navigateState.analysisResult.csv_file_paths || 'undefined',
            },
          }, null, 2));
          toast.success('Analysis complete!', { duration: 2000 });
          setTimeout(() => navigate('/results', { state: navigateState }), 500);
        } else {
          throw new Error(result.message || 'Invalid analysis result');
        }
      } catch (error) {
        if (signal.aborted) {
          console.log('Analyze.tsx: Analysis aborted');
          return;
        }
        console.error('Analyze.tsx: Analysis error:', error);
        const errorMessage = error instanceof Error
          ? error.message.includes('Failed to fetch')
            ? 'Network error: Check backend URL or CORS'
            : error.message
          : 'Network error occurred';
        setStatusMessage('Analysis failed');
        toast.error(`Analysis failed: ${errorMessage}`, { duration: 4000 });
        navigate('/dashboard', { state });
      } finally {
        setIsLoading(false);
      }
    };

    const controller = new AbortController();
    analyze(controller.signal);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90 || controller.signal.aborted) {
          clearInterval(interval);
          return prev;
        }
        return prev + 90 / (estimatedDuration / 100);
      });
    }, 100);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [navigate, state]);

  const handleCancel = () => {
    setIsCancelled(true);
    setIsLoading(false);
    setStatusMessage('Analysis cancelled');
    toast.info('Analysis cancelled', { duration: 2000 });
    navigate('/dashboard', { state });
  };

  const { files, cloudFiles, processingLocation } = state || {};
  const displayFiles = processingLocation === 'cloud' ? cloudFiles : files;

  if (!displayFiles) {
    console.error('Analyze.tsx: No display files available');
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-blue-600">Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Analysis Progress</h3>
            <p className="text-sm text-gray-500">
              Processing {displayFiles.length} file{displayFiles.length === 1 ? '' : 's'}: {statusMessage}
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm">
              {displayFiles.map((file: File | FileItem | string, index: number) => (
                <li key={index}>{typeof file === 'string' ? file : (file as FileItem | File).name}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-right font-medium">{Math.round(progress)}%</p>
          </div>

          <div className="flex items-center justify-between">
            {isLoading && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm">{statusMessage}</span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isCancelled || !isLoading}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}