import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Download, ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { markDocument } from '@/api/api';
import * as XLSX from 'xlsx';

const BASE_URL = 'http://localhost:8001';

const categories = ["Confidential", "Private", "Restricted", "Other"];

interface CategoryEntity {
  count: number;
  entity_type: string;
  values: string[];
}

interface Categories {
  Confidential: CategoryEntity[];
  Private: CategoryEntity[];
  Restricted: CategoryEntity[];
  Other: CategoryEntity[];
}

interface ClassificationResult {
  id: number;
  fileName: string;
  hasPii: boolean;
  category: string;
  categoriesData: Categories;
  // Add a flat structure for all entities regardless of category
  allEntities: CategoryEntity[];
}

interface AnalysisResult {
  status: 'success' | 'error';
  message?: string;
  data?: any[];
  country?: string;
  entities_used?: string[];
  styles?: { primary_color: string; secondary_color: string };
  csv_file_paths?: string[];
}

interface LocationState {
  analysisResult?: AnalysisResult;
  processType?: string;
  processingLocation?: string;
  files?: Array<{ name: string }>;
  cloudFiles?: Array<{ name: string; id: string } | string>;
  selectedCountry?: string;
  categoryMapping?: Record<string, string>;
  userPrompt?: string;
}

const VIEWABLE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt'];
const DOWNLOAD_ONLY_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState;
  const analysisResult: AnalysisResult = state?.analysisResult || { status: 'error', message: 'No analysis results available' };
  const processType = state?.processType || 'classification';
  const processingLocation = state?.processingLocation || 'local';
  const files = state?.files || [];
  const cloudFiles = state?.cloudFiles || [];
  const selectedCountry = state?.selectedCountry || '';
  const categoryMapping = state?.categoryMapping || {};
  const userPrompt = state?.userPrompt || '';

  const [classificationResults, setClassificationResults] = useState<ClassificationResult[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExcelData, setSelectedExcelData] = useState<string[][] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Entity mapping for user-friendly display names
const entityDisplayNames: Record<string, string> = {
  // Global entities
  CREDIT_CARD: 'Credit Card Number',
  CRYPTO: 'Cryptocurrency Address',
  DATE_TIME: 'Date and Time',
  EMAIL_ADDRESS: 'Email Address',
  IBAN_CODE: 'IBAN Code',
  IP_ADDRESS: 'IP Address',
  NRP: 'National Registration Number',
  LOCATION: 'Location',
  PERSON: 'Person Name',
  PHONE_NUMBER: 'Phone Number',
  MEDICAL_LICENSE: 'Medical License Number',
  URL: 'Website URL',
  US_BANK_NUMBER: 'US Bank Number',
  US_DRIVER_LICENSE: 'US Driver License',
  US_ITIN: 'US ITIN',
  US_PASSPORT: 'US Passport Number',
  US_SSN: 'US Social Security Number',
  UK_NHS: 'UK NHS Number',
  UK_NINO: 'UK National Insurance Number',
  ES_NIF: 'Spanish NIF',
  ES_NIE: 'Spanish NIE',
  IT_FISCAL_CODE: 'Italian Fiscal Code',
  IT_DRIVER_LICENSE: 'Italian Driver License',
  IT_VAT_CODE: 'Italian VAT Code',
  IT_PASSPORT: 'Italian Passport Number',
  IT_IDENTITY_CARD: 'Italian Identity Card',
  PL_PESEL: 'Polish PESEL',
  SG_NRIC_FIN: 'Singapore NRIC/FIN',
  SG_UEN: 'Singapore UEN',
  AU_ABN: 'Australian Business Number',
  AU_ACN: 'Australian Company Number',
  AU_TFN: 'Australian Tax File Number',
  AU_MEDICARE: 'Australian Medicare Number',
  FI_PERSONAL_IDENTITY_CODE: 'Finnish Personal Identity Code',
  // India-specific entities
  IN_PAN: 'PAN Number',
  IN_AADHAR: 'Aadhar Number',
  IN_VEHICLE_REGISTRATION: 'Vehicle Registration Number',
  IN_VOTER: 'Voter ID',
  IN_PASSPORT: 'Indian Passport Number',
  IN_PHONE_NUMBER: 'Indian Phone Number',
  IN_CREDIT_CARD: 'Indian Credit Card Number',
  IN_AADHAR_CARD_CUSTOM: 'Custom Aadhar Number',
  IN_PASSPORT_CUSTOM: 'Custom Indian Passport Number',
  IN_VEHICLE_REGISTRATION_CUSTOM: 'Custom Vehicle Registration Number',
  IN_VOTER_ID_CUSTOM: 'Custom Voter ID',
  IN_PAN_CUSTOM: 'Custom PAN Number',
  IN_GST_NUMBER: 'GST Number',
  IN_UPI_ID: 'UPI ID',
  IN_BANK_ACCOUNT: 'Bank Account Number',
  IN_IFSC_CODE: 'IFSC Code',
  IN_DRIVING_LICENSE: 'Indian Driving License',
};

// Updated useEffect to apply user-friendly entity names
useEffect(() => {
  console.log('Results.tsx: Raw location.state:', JSON.stringify({
    ...state,
    files: files.map((f: any) => f.name || 'Unknown'),
    cloudFiles,
    analysisResult: {
      ...analysisResult,
      data: analysisResult.data ? '[Data]' : 'undefined',
      csv_file_paths: analysisResult.csv_file_paths || 'undefined',
    },
    categoryMapping,
    userPrompt,
  }, null, 2));

  if (analysisResult.status !== 'success') {
    console.error('Results.tsx: Invalid analysisResult status');
    toast.error('Failed to load analysis results', { duration: 2000 });
    return;
  }

  if (processType === 'classification') {
    if (!analysisResult.data || !Array.isArray(analysisResult.data)) {
      console.error('Results.tsx: Invalid analysisResult data for classification');
      toast.error('Failed to load classification results', { duration: 2000 });
      return;
    }

    const fileNames = processingLocation === 'cloud'
      ? cloudFiles.map((f: { name: string }) => f.name)
      : files.map((f: any, index: number) => f.name || `File_${index + 1}`);

    const mappedResults = analysisResult.data.map((item: any, index: number) => {
      const fileName = item['File Name'] || item.file_name || fileNames[index] || `File_${index + 1}`;
      const hasPii = item.has_pii === 'yes' || item.has_pii === true || (item.entities && Object.keys(item.entities).length > 0);

      const categoriesData: Categories = {
        Confidential: [],
        Private: [],
        Restricted: [],
        Other: [],
      };

      // Store all entities in a flat structure
      const allEntities: CategoryEntity[] = [];

      if (item.entities) {
        Object.entries(item.entities).forEach(([category, entities]: [string, any]) => {
          const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() as keyof Categories;

          if (entities && typeof entities === 'object') {
            Object.entries(entities).forEach(([entityType, values]: [string, any]) => {
              const entityValues = Array.isArray(values) ? values : [];
              const displayEntityType = entityDisplayNames[entityType] || entityType; // Use display name
              const entityObj: CategoryEntity = {
                count: entityValues.length,
                entity_type: displayEntityType, // Store display name
                values: entityValues,
              };

              // Add to all entities
              allEntities.push(entityObj);

              // Add to specific category
              if (categories.includes(normalizedCategory)) {
                categoriesData[normalizedCategory].push(entityObj);
              } else {
                // Map entities to categories using categoryMapping or default to 'Other'
                const mappedCategory = categoryMapping[entityType] || 'Other';
                categoriesData[mappedCategory as keyof Categories].push(entityObj);
              }
            });
          }
        });
      }

      const result: ClassificationResult = {
        id: index + 1,
        fileName,
        hasPii,
        category: hasPii ? 'Confidential' : '', // Default category
        categoriesData,
        allEntities,
      };

      console.log(`Results.tsx: Mapped classification result for ${fileName}:`, JSON.stringify(result, null, 2));
      return result;
    });

    if (mappedResults.length === 0) {
      console.warn('Results.tsx: mappedResults is empty');
      toast.warning('No classification results to display', { duration: 2000 });
    } else if (mappedResults.every(result => !result.hasPii)) {
      console.warn('Results.tsx: All classification results have hasPii: false');
      toast.warning('No PII detected', { duration: 2000 });
    }

    setClassificationResults(mappedResults);
  }
}, [analysisResult, files, cloudFiles, processingLocation, selectedCountry, processType, categoryMapping, userPrompt]);

  const handleCategoryChange = (resultId: number, newCategory: string) => {
    console.log(`Results.tsx: Changing category for result ID ${resultId} to ${newCategory}`);
    
    setClassificationResults(prev =>
      prev.map(result => {
        if (result.id === resultId) {
          const updatedResult = { ...result, category: newCategory };
          console.log(`Results.tsx: Updated result:`, updatedResult);
          return updatedResult;
        }
        return result;
      })
    );
    
    toast.success(`Category set to ${newCategory}`, { duration: 1000 });
  };

  const getEntitiesForCategory = (result: ClassificationResult, category: string): CategoryEntity[] => {
    if (!category) return [];

    // Get entities from the specific category
    const categoryEntities = result.categoriesData[category as keyof Categories] || [];

    // If no entities found in the specific category, show all entities
    if (categoryEntities.length === 0) {
      return result.allEntities;
    }

    return categoryEntities;
  };

  const handleViewExcel = async (path: string) => {
    let fileName = '';
    try {
      fileName = path.split(/[\\/]/).pop() || 'Unknown.xlsx';
      console.log(`Results.tsx: Fetching Excel file: ${fileName}`);
      const response = await fetch(`${BASE_URL}/files/${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ${fileName}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellText: true, cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error(`No sheets found in ${fileName}`);
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' }) as string[][];

      if (jsonData.length === 0 || jsonData.every(row => row.every(cell => cell === ''))) {
        console.warn(`Results.tsx: No valid data in file ${fileName}`);
        toast.warning(`No valid data found in ${fileName}`, { duration: 2000 });
        return;
      }

      setSelectedExcelData(jsonData);
      setSelectedFileName(fileName);
      setIsModalOpen(true);
      toast.success(`Loaded ${fileName}`, { duration: 2000 });
    } catch (error) {
      console.error(`Results.tsx: Error processing ${path}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error loading ${fileName}: ${errorMessage}`, { duration: 2000 });
    }
  };

  const handleDownloadExcel = () => {
    if (processType === 'classification') {
      const headers = ['File Name', 'Has PII', 'Category', 'Detected Content'];
      const rows = classificationResults.map(result => {
        const selectedCategory = result.category;
        const entities = getEntitiesForCategory(result, selectedCategory);
        const content = entities
          .map(entity => `${entity.entity_type}: ${entity.values.join(', ')}`)
          .join('; ');
        return [
          result.fileName,
          result.hasPii ? 'Yes' : 'No',
          result.category || 'None',
          content || 'No sensitive data found',
        ];
      });
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'analysis_results.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const csvFilePaths = Array.isArray(analysisResult.csv_file_paths) ? analysisResult.csv_file_paths : [];
      if (csvFilePaths.length === 0) {
        toast.error('No Excel files available to download', { duration: 2000 });
        return;
      }
      csvFilePaths.forEach(path => {
        const fileName = path.split(/[\\/]/).pop() || 'Unknown.xlsx';
        const fileUrl = `${BASE_URL}/files/${encodeURIComponent(fileName)}`;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.click();
      });
      toast.success('Downloaded XLSX files', { duration: 1000 });
    }
  };

  const handleOpenHeaderFile = async (fileName: string) => {
    try {
      const markResponse = await markDocument(fileName);
      console.log('handleOpenHeaderFile: markResponse:', JSON.stringify(markResponse, null, 2));
      if (markResponse.status !== 'success' || !markResponse.header_path) {
        throw new Error(markResponse.message || 'Failed to retrieve header path');
      }
      const fileExtension = markResponse.file_name?.split('.').pop()?.toLowerCase() || fileName.split('.').pop()?.toLowerCase();
      const filename = markResponse.header_path.split(/[\\/]/).pop() || markResponse.file_name || fileName;
      const fileUrl = `${BASE_URL}/files/${encodeURIComponent(filename)}`;
      console.log('handleOpenHeaderFile: Opening URL:', fileUrl);
      if (!fileExtension) {
        return handleDownloadFile(filename, fileUrl);
      }
      if (DOWNLOAD_ONLY_EXTENSIONS.includes(fileExtension)) {
        return handleDownloadFile(filename, fileUrl);
      }
      if (VIEWABLE_EXTENSIONS.includes(fileExtension)) {
        const newTab = window.open(fileUrl, '_blank');
        if (!newTab) {
          console.warn('Failed to open new tab. Popup blocker may be enabled.');
          toast.warning('Unable to open file in new tab. Please allow popups and try again.', { duration: 2000 });
          return;
        }
        toast.success(`Opened ${filename} in a new tab`, { duration: 2000 });
      } else {
        handleDownloadFile(filename, fileUrl);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error handling header file:', error);
      toast.error(`Failed to open header file: ${errorMessage}`, { duration: 3000 });
    }
  };

  const handleDownloadFile = (filename: string, fileUrl: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    link.click();
    toast.success(`Downloading ${filename}`, { duration: 2000 });
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Analysis Results</h1>
        <p className="text-gray-600 text-base">
          {processType === 'classification'
            ? `Review and classify analyzed documents for ${selectedCountry || 'No country selected'}${userPrompt ? ` (Query: "${userPrompt}")` : ''}`
            : 'Review extracted tables from documents'}
        </p>
      </div>

      <Card className="w-full">
        <CardHeader className="bg-gray-100 rounded-t-lg border-b">
          <CardTitle className="text-blue-600">
            {processType === 'classification' ? 'Data Classification Results' : 'Table Extraction Results'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {analysisResult.status !== 'success' ? (
            <div className="bg-red-200 text-red-800 p-4 rounded-md text-lg font-bold">
              Error: {analysisResult.message || 'No analysis results available'}
            </div>
          ) : processType === 'classification' ? (
            classificationResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead className="w-24">Has PII</TableHead>
                    <TableHead className="w-40">Category</TableHead>
                    <TableHead>Detected Content</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classificationResults.map(result => {
                    const selectedEntities = getEntitiesForCategory(result, result.category);
                    
                    return (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.fileName}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              result.hasPii
                                ? 'bg-red-100 text-red-600 hover:bg-red-100'
                                : 'bg-green-100 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {result.hasPii ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={result.category}
                            onValueChange={(value) => handleCategoryChange(result.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {categories.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {result.hasPii && result.category ? (
                            <div className="max-h-64 overflow-y-auto pr-2">
                              {selectedEntities.length > 0 ? (
                                selectedEntities.map((entity, idx) => (
                                  <div
                                    key={`${entity.entity_type}-${idx}`}
                                    className="mb-4 last:mb-0 bg-gray-50 p-3 rounded-md"
                                  >
                                    <h4 className="font-semibold text-sm mb-2">{entity.entity_type}</h4>
                                    <ul className="list-disc pl-5 text-sm text-gray-600">
                                      {entity.values.length > 0 ? (
                                        entity.values.map((value, valueIdx) => (
                                          <li key={`${entity.entity_type}-${idx}-${valueIdx}`} className="mb-1">
                                            {value}
                                          </li>
                                        ))
                                      ) : (
                                        <li>No values detected</li>
                                      )}
                                    </ul>
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-500">No entities found for this category</span>
                              )}
                            </div>
                          ) : result.hasPii ? (
                            <span className="text-gray-500">Select a category to view content</span>
                          ) : (
                            <span className="text-gray-500">No sensitive data found</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.hasPii && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenHeaderFile(result.fileName)}
                              title="Open Header File"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View/Download
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="bg-yellow-200 text-yellow-800 p-4 rounded-md text-lg font-bold">
                No classification results available. Check console logs for details.
              </div>
            )
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4">Extracted Excel Files</h3>
              {Array.isArray(analysisResult.csv_file_paths) && analysisResult.csv_file_paths.length > 0 ? (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {analysisResult.csv_file_paths.map((path, index) => {
                    const fileName = path.split(/[\\/]/).pop() || `File_${index + 1}.xlsx`;
                    return (
                      <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md hover:bg-gray-100">
                        <span
                          className="text-blue-600 hover:underline cursor-pointer"
                          onClick={() => handleViewExcel(path)}
                        >
                          {fileName}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(fileName, `${BASE_URL}/files/${encodeURIComponent(fileName)}`)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="bg-yellow-200 text-yellow-800 p-4 rounded-md text-lg font-bold">
                  No table extraction results available. Please ensure files are processed correctly.
                </div>
              )}
            </div>
          )}

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-5xl w-full max-h-[80vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>{selectedFileName}</DialogTitle>
              </DialogHeader>
              {selectedExcelData && selectedExcelData.length > 0 ? (
                <div className="flex-grow overflow-auto">
                  <Table className="w-full border-collapse">
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                      <TableRow>
                        {selectedExcelData[0]?.map((header, i) => (
                          <TableHead
                            key={i}
                            className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-100 border-b border-gray-200"
                            style={{ minWidth: '120px' }}
                          >
                            {header || `Column ${i + 1}`}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedExcelData.slice(1).map((row, rowIndex) => (
                        <TableRow key={rowIndex} className="hover:bg-gray-50">
                          {row.map((cell, cellIndex) => (
                            <TableCell
                              key={cellIndex}
                              className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis"
                              style={{ maxWidth: '200px' }}
                            >
                              {cell || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No data available in this file.
                </div>
              )}
              <div className="flex-shrink-0 mt-4 flex justify-end">
                <DialogClose asChild>
                  <Button variant="outline">
                    Close
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="space-x-3">
              <Button
                variant="outline"
                onClick={handleDownloadExcel}
                className="flex items-center gap-2"
                disabled={processType === 'classification' ? classificationResults.length === 0 : !Array.isArray(analysisResult.csv_file_paths) || analysisResult.csv_file_paths.length === 0}
              >
                <Download className="h-4 w-4" />
                Download XLSX
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
