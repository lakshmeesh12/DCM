
// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { PageContainer } from '@/components/layout/PageContainer';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogClose,
// } from "@/components/ui/dialog";
// import { Download, ArrowLeft, MessageSquare, ExternalLink } from 'lucide-react';
// import { toast } from 'sonner';
// import { Badge } from "@/components/ui/badge";
// import {
//   Drawer,
//   DrawerContent,
//   DrawerTrigger,
// } from "@/components/ui/drawer";
// import { markDocument } from '@/api/api';
// import * as XLSX from 'xlsx';
 
// const BASE_URL = 'http://localhost:8001';
 
// const categories = ["Confidential", "Private", "Restricted", "Other"];
 
// interface CategoryEntity {
//   count: number;
//   entity_type: string;
//   values: string[];
// }
 
// interface Categories {
//   Confidential: CategoryEntity[];
//   Private: CategoryEntity[];
//   Restricted: CategoryEntity[];
//   Other: CategoryEntity[];
// }
 
// interface ClassificationResult {
//   id: number;
//   fileName: string;
//   hasPii: boolean;
//   category: string;
//   categoriesData: Categories;
// }
 
// interface AnalysisResult {
//   status: 'success' | 'error';
//   message?: string;
//   data?: any[];
//   country?: string;
//   entities_used?: string[];
//   styles?: { primary_color: string; secondary_color: string };
//   csv_file_paths?: string[];
// }
 
// const VIEWABLE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt'];
// const DOWNLOAD_ONLY_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
 
// export default function Results() {
//   const location = useLocation();
//   const navigate = useNavigate();
 
//   const analysisResult: AnalysisResult = location.state?.analysisResult || { status: 'error', message: 'No analysis results available' };
//   const processType = location.state?.processType || 'classification';
//   const processingLocation = location.state?.processingLocation || 'local';
//   const files = location.state?.files || [];
//   const cloudFiles = location.state?.cloudFiles || [];
//   const selectedCountry = location.state?.selectedCountry || '';
 
//   const [classificationResults, setClassificationResults] = useState<ClassificationResult[]>([]);
//   const [chatOpen, setChatOpen] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedExcelData, setSelectedExcelData] = useState<string[][] | null>(null);
//   const [selectedFileName, setSelectedFileName] = useState<string>('');
 
//   useEffect(() => {
//     console.log('Results.tsx: Raw location.state:', JSON.stringify({
//       ...location.state,
//       files: files.map((f: any) => f.name || 'Unknown'),
//       cloudFiles,
//     }, null, 2));
//     console.log('Results.tsx: Raw analysisResult:', JSON.stringify(analysisResult, null, 2));
//     console.log('Results.tsx: csv_file_paths:', analysisResult.csv_file_paths || 'undefined');
//     console.log('Results.tsx: processingLocation:', processingLocation);
//     console.log('Results.tsx: files from state:', files.map((f: any) => f.name || 'Unknown'));
//     console.log('Results.tsx: cloudFiles from state:', cloudFiles);
//     console.log('Results.tsx: selectedCountry:', selectedCountry);
 
//     if (analysisResult.status !== 'success') {
//       console.error('Results.tsx: Invalid analysisResult status');
//       toast.error('Failed to load analysis results', { duration: 2000 });
//       return;
//     }
 
//     if (processType === 'classification') {
//       if (!analysisResult.data || !Array.isArray(analysisResult.data)) {
//         console.error('Results.tsx: Invalid analysisResult data for classification');
//         toast.error('Failed to load classification results', { duration: 2000 });
//         return;
//       }
 
//       const fileNames = processingLocation === 'cloud'
//         ? cloudFiles.map((f: { name: string }) => f.name)
//         : files.map((f: any, index: number) => f.name || `File_${index + 1}`);
 
//       const mappedResults = analysisResult.data.map((item: any, index: number) => {
//         const fileName = item['File Name'] || item.file_name || fileNames[index] || `File_${index + 1}`;
//         const hasPii =
//           item['Has PII ?'] === 'yes' ||
//           item['Has PII ?'] === true ||
//           item.has_pii === true ||
//           (item.Categories && Object.values(item.Categories).some((arr: any[]) => arr.length > 0));
 
//         const normalizeKey = (key: string) => key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
//         const normalizeEntityType = (type: string) => type.toUpperCase();
 
//         const categoriesData: Categories = {
//           Confidential: [],
//           Private: [],
//           Restricted: [],
//           Other: [],
//         };
 
//         if (item.Categories) {
//           Object.keys(item.Categories).forEach((key: string) => {
//             const normalizedKey = normalizeKey(key) as keyof Categories;
//             if (categories.includes(normalizedKey)) {
//               categoriesData[normalizedKey] = item.Categories[key].map((e: any) => ({
//                 ...e,
//                 entity_type: normalizeEntityType(e.entity_type),
//                 values: e.values || [],
//               }));
//             }
//           });
//         }
 
//         const result = {
//           id: index + 1,
//           fileName,
//           hasPii,
//           category: hasPii ? 'Confidential' : '',
//           categoriesData,
//         };
 
//         console.log(`Results.tsx: Mapped classification result for ${fileName}:`, JSON.stringify(result, null, 2));
//         return result;
//       });
 
//       if (mappedResults.length === 0) {
//         console.warn('Results.tsx: mappedResults is empty');
//         toast.warning('No classification results to display', { duration: 2000 });
//       } else if (mappedResults.every(result => !result.hasPii)) {
//         console.warn('Results.tsx: All classification results have hasPii: false');
//         toast.warning('No PII detected', { duration: 2000 });
//       }
 
//       setClassificationResults(mappedResults);
//     }
//   }, [analysisResult, files, cloudFiles, processingLocation, selectedCountry, processType]);
 
//   const handleViewExcel = async (path: string) => {
//     let fileName = '';
//     try {
//       fileName = path.split(/[\\/]/).pop() || 'Unknown.xlsx';
//       console.log(`Results.tsx: Fetching Excel file: ${fileName}`);
//       const response = await fetch(`${BASE_URL}/files/${encodeURIComponent(fileName)}`);
//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: Failed to fetch ${fileName}`);
//       }
//       const arrayBuffer = await response.arrayBuffer();
//       const workbook = XLSX.read(arrayBuffer, { type: 'array' });
//       const firstSheetName = workbook.SheetNames[0];
//       if (!firstSheetName) {
//         throw new Error(`No sheets found in ${fileName}`);
//       }
//       const worksheet = workbook.Sheets[firstSheetName];
//       const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
//       if (jsonData.length === 0) {
//         console.warn(`Results.tsx: No data in file ${fileName}`);
//         toast.warning(`No data found in ${fileName}`, { duration: 2000 });
//         return;
//       }
//       setSelectedExcelData(jsonData);
//       setSelectedFileName(fileName);
//       setIsModalOpen(true);
//       toast.success(`Loaded ${fileName}`, { duration: 2000 });
//     } catch (error) {
//       console.error(`Results.tsx: Error processing ${path}:`, error);
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       toast.error(`Error loading ${fileName}: ${errorMessage}`, { duration: 2000 });
//     }
//   };
 
//   const handleDownloadExcel = () => {
//     if (processType === 'classification') {
//       const headers = ['File Name', 'Has PII', 'Category', 'Detected Content'];
//       const rows = classificationResults.map(result => {
//         const selectedCategory = result.category;
//         const entities = selectedCategory ? result.categoriesData[selectedCategory as keyof Categories] : [];
//         const content = entities
//           .map(entity => `${entity.entity_type}: ${entity.values.join(', ')}`)
//           .join('; ');
//         return [
//           result.fileName,
//           result.hasPii ? 'Yes' : 'No',
//           result.category || 'None',
//           content || 'No sensitive data found',
//         ];
//       });
//       const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
//       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//       const link = document.createElement('a');
//       link.href = URL.createObjectURL(blob);
//       link.download = 'analysis_results.csv';
//       link.click();
//       URL.revokeObjectURL(link.href);
//     } else {
//       analysisResult.csv_file_paths?.forEach(path => {
//         const fileName = path.split(/[\\/]/).pop() || 'Unknown.xlsx';
//         const fileUrl = `${BASE_URL}/files/${encodeURIComponent(fileName)}`;
//         const link = document.createElement('a');
//         link.href = fileUrl;
//         link.download = fileName;
//         link.click();
//       });
//       toast.success('Downloaded XLSX files', { duration: 1000 });
//     }
//     toast.success('Downloaded results', { duration: 1000 });
//   };
 
//   const handleOpenHeaderFile = async (fileName: string) => {
//     try {
//       const markResponse = await markDocument(fileName);
//       console.log('handleOpenHeaderFile: markResponse:', JSON.stringify(markResponse, null, 2));
//       if (markResponse.status !== 'success' || !markResponse.header_path) {
//         throw new Error(markResponse.message || 'Failed to retrieve header path');
//       }
//       const fileExtension = markResponse.file_name?.split('.').pop()?.toLowerCase() || fileName.split('.').pop()?.toLowerCase();
//       const filename = markResponse.header_path.split(/[\\/]/).pop() || markResponse.file_name || fileName;
//       const fileUrl = `${BASE_URL}/files/${encodeURIComponent(filename)}`;
//       console.log('handleOpenHeaderFile: Opening URL:', fileUrl);
//       if (!fileExtension) {
//         return handleDownloadFile(filename, fileUrl);
//       }
//       if (DOWNLOAD_ONLY_EXTENSIONS.includes(fileExtension)) {
//         return handleDownloadFile(filename, fileUrl);
//       }
//       if (VIEWABLE_EXTENSIONS.includes(fileExtension)) {
//         const newTab = window.open(fileUrl, '_blank');
//         if (!newTab) {
//           console.warn('Failed to open new tab. Popup blocker may be enabled.');
//           toast.warning('Unable to open file in new tab. Please allow popups and try again.', { duration: 2000 });
//           return;
//         }
//         toast.success(`Opened ${filename} in a new tab`, { duration: 2000 });
//       } else {
//         handleDownloadFile(filename, fileUrl);
//       }
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       console.error('Error handling header file:', error);
//       toast.error(`Failed to open header file: ${errorMessage}`, { duration: 3000 });
//     }
//   };
 
//   const handleDownloadFile = (filename: string, fileUrl: string) => {
//     const link = document.createElement('a');
//     link.href = fileUrl;
//     link.download = filename;
//     link.click();
//     toast.success(`Downloading ${filename}`, { duration: 2000 });
//   };
 
//   const handleBack = () => {
//     navigate('/dashboard');
//   };
 
//   const handleChatToggle = () => {
//     setChatOpen(!chatOpen);
//   };
 
//   return (
//     <PageContainer>
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold mb-1">Analysis Results</h1>
//         <p className="text-gray-600 text-base">
//           {processType === 'classification'
//             ? `Review and classify analyzed documents for ${selectedCountry || 'No country selected'}`
//             : 'Review extracted tables from documents'}
//         </p>
//       </div>
 
//       <Card className="w-full">
//         <CardHeader className="bg-gray-100 rounded-t-lg border-b">
//           <CardTitle className="text-blue-600">
//             {processType === 'classification' ? 'Data Classification Results' : 'Table Extraction Results'}
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-6">
//           {analysisResult.status === 'error' ? (
//             <div className="bg-red-200 text-red-800 p-4 rounded-md text-lg font-bold">
//               Error: {analysisResult.message}
//             </div>
//           ) : processType === 'classification' ? (
//             classificationResults.length > 0 ? (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>File Name</TableHead>
//                     <TableHead className="w-24">Has PII</TableHead>
//                     <TableHead className="w-40">Category</TableHead>
//                     <TableHead>Detected Content</TableHead>
//                     <TableHead className="w-32">Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {classificationResults.map(result => (
//                     <TableRow key={result.id}>
//                       <TableCell className="font-medium">{result.fileName}</TableCell>
//                       <TableCell>
//                         <Badge
//                           className={`${
//                             result.hasPii
//                               ? 'bg-red-100 text-red-600 hover:bg-red-100'
//                               : 'bg-green-100 text-green-600 hover:bg-green-100'
//                           }`}
//                         >
//                           {result.hasPii ? 'Yes' : 'No'}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         <Select
//                           value={result.category}
//                           onValueChange={value => {
//                             console.log(`Results.tsx: Setting category ${value} for result ID ${result.id}`);
//                             setClassificationResults(prev =>
//                               prev.map(r => (r.id === result.id ? { ...r, category: value } : r))
//                             );
//                             toast.success(`Category set to ${value}`, { duration: 1000 });
//                           }}
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select Category" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectGroup>
//                               {categories.map(category => (
//                                 <SelectItem key={category} value={category}>
//                                   {category}
//                                 </SelectItem>
//                               ))}
//                             </SelectGroup>
//                           </SelectContent>
//                         </Select>
//                       </TableCell>
//                       <TableCell>
//                         {result.hasPii && result.category ? (
//                           <div className="max-h-64 overflow-y-auto pr-2">
//                             {result.categoriesData[result.category as keyof Categories]?.map((entity, idx) => (
//                               <div
//                                 key={`${entity.entity_type}-${idx}`}
//                                 className="mb-4 last:mb-0 bg-gray-50 p-3 rounded-md"
//                               >
//                                 <h4 className="font-semibold text-sm mb-2">{entity.entity_type}</h4>
//                                 <ul className="list-disc pl-5 text-sm text-gray-600">
//                                   {entity.values.length > 0 ? (
//                                     entity.values.map((value, valueIdx) => (
//                                       <li key={`${entity.entity_type}-${idx}-${valueIdx}`} className="mb-1">
//                                         {value}
//                                       </li>
//                                     ))
//                                   ) : (
//                                     <li>No values detected</li>
//                                   )}
//                                 </ul>
//                               </div>
//                             ))}
//                             {result.categoriesData[result.category as keyof Categories]?.length === 0 && (
//                               <span className="text-gray-500">No entities found for this category</span>
//                             )}
//                           </div>
//                         ) : result.hasPii ? (
//                           <span className="text-gray-500">Select a category to view content</span>
//                         ) : (
//                           <span className="text-gray-500">No sensitive data found</span>
//                         )}
//                       </TableCell>
//                       <TableCell>
//                         {result.hasPii && (
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => handleOpenHeaderFile(result.fileName)}
//                             title="Open Header File"
//                           >
//                             <ExternalLink className="h-4 w-4 mr-2" />
//                             View/Download
//                           </Button>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             ) : (
//               <div className="bg-yellow-200 text-yellow-800 p-4 rounded-md text-lg font-bold">
//                 No classification results available. Check console logs for details.
//               </div>
//             )
//           ) : Array.isArray(analysisResult.csv_file_paths) && analysisResult.csv_file_paths.length > 0 ? (
//             <div>
//               <h3 className="text-lg font-medium mb-4">Extracted Excel Files</h3>
//               <ul className="list-disc pl-5">
//                 {analysisResult.csv_file_paths.map((path, index) => {
//                   const fileName = path.split(/[\\/]/).pop() || `File_${index + 1}.xlsx`;
//                   return (
//                     <li key={index} className="mb-2">
//                       <button
//                         className="text-blue-600 hover:underline"
//                         onClick={() => handleViewExcel(path)}
//                       >
//                         {fileName}
//                       </button>
//                     </li>
//                   );
//                 })}
//               </ul>
//             </div>
//           ) : (
//             <div className="bg-yellow-200 text-yellow-800 p-4 rounded-md text-lg font-bold">
//               No table extraction results available. Please try again or check console logs for details.
//             </div>
//           )}
 
//           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//             <DialogContent className="max-w-4xl">
//               <DialogHeader>
//                 <DialogTitle>{selectedFileName}</DialogTitle>
//               </DialogHeader>
//               {selectedExcelData && (
//                 <div className="max-h-[60vh] overflow-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         {selectedExcelData[0]?.map((header, i) => (
//                           <TableHead key={i}>{header || `Column ${i + 1}`}</TableHead>
//                         ))}
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {selectedExcelData.slice(1).map((row, rowIndex) => (
//                         <TableRow key={rowIndex}>
//                           {row.map((cell, cellIndex) => (
//                             <TableCell key={cellIndex}>{cell}</TableCell>
//                           ))}
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//               <DialogClose asChild>
//                 <Button variant="outline" className="mt-4">
//                   Close
//                 </Button>
//               </DialogClose>
//             </DialogContent>
//           </Dialog>
 
//           <div className="flex justify-between mt-6">
//             <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
//               <ArrowLeft className="h-4 w-4" />
//               Back
//             </Button>
//             <div className="space-x-3">
//               <Button
//                 variant="outline"
//                 onClick={handleDownloadExcel}
//                 className="flex items-center gap-2"
//                 disabled={processType === 'classification' ? classificationResults.length === 0 : !Array.isArray(analysisResult.csv_file_paths) || analysisResult.csv_file_paths.length === 0}
//               >
//                 <Download className="h-4 w-4" />
//                 Download XLSX
//               </Button>
//               {/* <Drawer open={chatOpen} onOpenChange={setChatOpen}>
//                 <DrawerTrigger asChild>
//                   <Button onClick={handleChatToggle} className="flex items-center gap-2">
//                     <MessageSquare className="h-4 w-4" />
//                     Chat
//                   </Button>
//                 </DrawerTrigger>
//                 <DrawerContent>
//                   <div className="p-4">
//                     <h2 className="text-lg font-bold">Chat</h2>
//                     <p>Chat functionality coming soon...</p>
//                   </div>
//                 </DrawerContent>
//               </Drawer> */}
//             </div>
//           </div>
//         </CardContent>
//       </Card>
 
//       {/* <ChatBubble /> */}
//     </PageContainer>
//   );
// }
 
// // function ChatBubble() {
// //   const navigate = useNavigate();
 
// //   const handleChatClick = () => {
// //     navigate('/chat');
// //   };
 
// //   return (
// //     <div className="fixed bottom-8 right-8 z-50">
// //       <Button
// //         onClick={handleChatClick}
// //         size="lg"
// //         className="rounded-full h-14 w-14 shadow-lg"
// //       >
// //         <MessageSquare className="h-6 w-6" />
// //       </Button>
// //     </div>
// //   );
// // }
 





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

const VIEWABLE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt'];
const DOWNLOAD_ONLY_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const analysisResult: AnalysisResult = location.state?.analysisResult || { status: 'error', message: 'No analysis results available' };
  const processType = location.state?.processType || 'classification';
  const processingLocation = location.state?.processingLocation || 'local';
  const files = location.state?.files || [];
  const cloudFiles = location.state?.cloudFiles || [];
  const selectedCountry = location.state?.selectedCountry || '';

  const [classificationResults, setClassificationResults] = useState<ClassificationResult[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExcelData, setSelectedExcelData] = useState<string[][] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  useEffect(() => {
    console.log('Results.tsx: Raw location.state:', JSON.stringify({
      ...location.state,
      files: files.map((f: any) => f.name || 'Unknown'),
      cloudFiles,
    }, null, 2));
    console.log('Results.tsx: Raw analysisResult:', JSON.stringify(analysisResult, null, 2));
    console.log('Results.tsx: csv_file_paths:', analysisResult.csv_file_paths || 'undefined');
    console.log('Results.tsx: processingLocation:', processingLocation);
    console.log('Results.tsx: files from state:', files.map((f: any) => f.name || 'Unknown'));
    console.log('Results.tsx: cloudFiles from state:', cloudFiles);
    console.log('Results.tsx: selectedCountry:', selectedCountry);

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
        const hasPii =
          item['Has PII ?'] === 'yes' ||
          item['Has PII ?'] === true ||
          item.has_pii === true ||
          (item.Categories && Object.values(item.Categories).some((arr: any[]) => arr.length > 0));

        const normalizeKey = (key: string) => key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        const normalizeEntityType = (type: string) => type.toUpperCase();

        const categoriesData: Categories = {
          Confidential: [],
          Private: [],
          Restricted: [],
          Other: [],
        };

        if (item.Categories) {
          Object.keys(item.Categories).forEach((key: string) => {
            const normalizedKey = normalizeKey(key) as keyof Categories;
            if (categories.includes(normalizedKey)) {
              categoriesData[normalizedKey] = item.Categories[key].map((e: any) => ({
                ...e,
                entity_type: normalizeEntityType(e.entity_type),
                values: e.values || [],
              }));
            }
          });
        }

        const result = {
          id: index + 1,
          fileName,
          hasPii,
          category: hasPii ? 'Confidential' : '',
          categoriesData,
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
  }, [analysisResult, files, cloudFiles, processingLocation, selectedCountry, processType]);

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
        const entities = selectedCategory ? result.categoriesData[selectedCategory as keyof Categories] : [];
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
            ? `Review and classify analyzed documents for ${selectedCountry || 'No country selected'}`
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
                  {classificationResults.map(result => (
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
                          onValueChange={value => {
                            console.log(`Results.tsx: Setting category ${value} for result ID ${result.id}`);
                            setClassificationResults(prev =>
                              prev.map(r => (r.id === result.id ? { ...r, category: value } : r))
                            );
                            toast.success(`Category set to ${value}`, { duration: 1000 });
                          }}
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
                            {result.categoriesData[result.category as keyof Categories]?.map((entity, idx) => (
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
                            ))}
                            {result.categoriesData[result.category as keyof Categories]?.length === 0 && (
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
                  ))}
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