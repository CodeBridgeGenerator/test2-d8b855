import React, { useRef, useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Steps } from 'primereact/steps';
import { Message } from 'primereact/message';
import excelLogo from '../assets/media/excelLogo.svg';
import client from './restClient';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { requestOptions } from '../utils';
import _ from 'lodash';
import { Buffer } from 'buffer';

export default function UploadService({ serviceName, user, onUploadComplete, disabled }) {
    const fileUploadRef = useRef(null);
    const [totalSize, setTotalSize] = useState(0);
    const [fileDetails, setFileDetails] = useState({});
    const [serviceFields, setServiceFields] = useState([]);
    const [requiredFields, setRequiredFields] = useState([]);
    const [referenceServices, setReferenceServices] = useState({});
    const [processingFiles, setProcessingFiles] = useState(new Set());
    const [currentProgress, setCurrentProgress] = useState({});
    const [excelColumns, setExcelColumns] = useState([]);
    const [excelData, setExcelData] = useState([]);
    const [fieldMapping, setFieldMapping] = useState({});
    const [referenceFieldMapping, setReferenceFieldMapping] = useState({});
    const [showMappingDialog, setShowMappingDialog] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [validationResults, setValidationResults] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const toast = useRef(null);
    const dateFormat = process.env.REACT_APP_DATE;

    const steps = [{ label: 'Upload File' }, { label: 'Map Fields' }, { label: 'Validate & Upload' }];

    // Function to update progress for a file
    const updateProgress = (fileName, progress) => {
        setCurrentProgress((prev) => ({
            ...prev,
            [fileName]: progress
        }));
    };

    // Function to extract reference service information from schema
    const extractReferenceServices = (schema) => {
        const refServices = {};

        schema.forEach((field) => {
            if (field.type === 'ObjectId' && field.ref) {
                const refServiceName = field.ref
                    .split('_')
                    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
                    .join('');

                refServices[field.field] = {
                    refService: refServiceName,
                    refModel: field.ref,
                    refFields: []
                };
            }
        });

        return refServices;
    };

    const fetchServiceFields = async (serviceName) => {
        try {
            const exclude = ['_id', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'];
            const serviceSchema = await axios(requestOptions(`${serviceName}Schema`, {}));

            let schema = serviceSchema.data;
            if (Array.isArray(schema)) {
                schema = schema.filter((field) => !exclude.includes(field.field));
            } else if (schema.fields) {
                schema = Object.values(schema.fields).filter((field) => !exclude.includes(field.field));
            }

            const req = schema.filter((field) => field.required === true);

            const refServices = extractReferenceServices(schema);

            // Fetch reference service fields for ObjectId fields
            for (const [fieldName, refInfo] of Object.entries(refServices)) {
                try {
                    const refSchema = await axios(requestOptions(`${refInfo.refService}Schema`, {}));
                    let refFields = refSchema.data;
                    if (Array.isArray(refFields)) {
                        refFields = refFields.filter((field) => !exclude.includes(field.field));
                    } else if (refFields.fields) {
                        refFields = Object.values(refFields.fields).filter((field) => !exclude.includes(field.field));
                    }
                    refServices[fieldName].refFields = refFields;
                } catch (error) {
                    console.error(`Failed to fetch schema for ${refInfo.refService}:`, error);
                }
            }

            setServiceFields(schema);
            setRequiredFields(req);
            setReferenceServices(refServices);
        } catch (error) {
            console.error('Failed to fetch service schema:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to fetch service schema'
            });
        }
    };

    useEffect(() => {
        fetchServiceFields(serviceName);
    }, [serviceName]);

    // Function to find reference record based on composite search criteria
    const findReferenceRecord = async (refService, searchCriteria) => {
        try {
            const cleanCriteria = Object.fromEntries(Object.entries(searchCriteria).filter(([_, value]) => value !== null && value !== undefined && value !== ''));

            if (Object.keys(cleanCriteria).length === 0) {
                throw new Error('No valid search criteria provided');
            }

            const query = {
                $and: Object.keys(cleanCriteria).map((key) => ({
                    [key]: cleanCriteria[key]
                }))
            };

            console.log(`Searching ${refService} with query:`, query);
            const result = await client.service(refService).find({ query });

            if (result.data.length === 0) {
                throw new Error(`No matching record found in ${refService} for criteria: ${JSON.stringify(cleanCriteria)}`);
            }

            if (result.data.length > 1) {
                throw new Error(`Multiple records found in ${refService} for criteria: ${JSON.stringify(cleanCriteria)}. Make search criteria more specific.`);
            }

            return result.data[0]._id;
        } catch (error) {
            console.error(`Error finding reference record in ${refService}:`, error);
            throw error;
        }
    };

    // Function to process ObjectId fields with reference lookups based on user mapping
    const processObjectIdFields = async (row) => {
        const processedRow = { ...row };

        // Process reference field mappings for ObjectId fields
        for (const [serviceField, refMappings] of Object.entries(referenceFieldMapping)) {
            if (referenceServices[serviceField] && Object.keys(refMappings).length > 0) {
                const searchCriteria = {};
                let hasValidCriteria = false;

                // Build search criteria from reference field mappings
                for (const [refField, excelColumn] of Object.entries(refMappings)) {
                    if (excelColumn && row[excelColumn] !== undefined && row[excelColumn] !== '') {
                        searchCriteria[refField] = row[excelColumn];
                        hasValidCriteria = true;
                    }
                }

                // Only attempt lookup if we have at least one search criteria
                if (hasValidCriteria) {
                    try {
                        const refService = referenceServices[serviceField].refService;
                        console.log(`Looking up ${refService} with criteria:`, searchCriteria);
                        const objectId = await findReferenceRecord(refService, searchCriteria);
                        console.log(`Found record with ObjectId: ${objectId}`);

                        // Set the resolved ObjectId
                        processedRow[serviceField] = objectId;

                        // Remove the reference mapping columns from the final row
                        Object.values(refMappings).forEach((col) => {
                            if (col && col in processedRow) {
                                delete processedRow[col];
                            }
                        });
                    } catch (error) {
                        console.error(`Failed to resolve ${serviceField}:`, error);
                        throw new Error(`Failed to resolve ${serviceField}: ${error.message}`);
                    }
                }
            }
        }

        return processedRow;
    };

    // Improved date parsing function
    const parseDate = (value) => {
        if (!value) return null;

        if (value instanceof Date && !isNaN(value.getTime())) {
            return value;
        }

        if (typeof value === 'string') {
            if (value.includes('-00') || value.endsWith('00')) {
                return null;
            }

            const ddMMyyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (ddMMyyyyMatch) {
                const day = parseInt(ddMMyyyyMatch[1], 10);
                const month = parseInt(ddMMyyyyMatch[2], 10) - 1;
                const year = parseInt(ddMMyyyyMatch[3], 10);
                const date = new Date(year, month, day);

                if (!isNaN(date.getTime()) && date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                    return date;
                }
            }

            const yyyyMMddMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (yyyyMMddMatch) {
                const year = parseInt(yyyyMMddMatch[1], 10);
                const month = parseInt(yyyyMMddMatch[2], 10) - 1;
                const day = parseInt(yyyyMMddMatch[3], 10);
                const date = new Date(year, month, day);

                if (!isNaN(date.getTime()) && date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                    return date;
                }
            }

            const fallbackDate = new Date(value);
            return !isNaN(fallbackDate.getTime()) ? fallbackDate : null;
        }

        if (typeof value === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            const date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
            return !isNaN(date.getTime()) ? date : null;
        }

        return null;
    };

    const isValidDate = (value) => {
        const parsedDate = parseDate(value);
        return parsedDate !== null && !isNaN(parsedDate.getTime());
    };

    const convertToDate = (value) => {
        return parseDate(value);
    };

    const onTemplateSelect = (e) => {
        try {
            let _totalSize = totalSize;
            let files = e.files;

            Object.keys(files).forEach(async (key) => {
                _totalSize += files[key].size || 0;
                const fileName = files[key].name;

                setCurrentProgress((prev) => ({ ...prev, [fileName]: { step: 'Reading file...', percentage: 0 } }));
                setProcessingFiles((prev) => new Set([...prev, fileName]));

                await processExcelFile(files[key]);
            });
            setTotalSize(_totalSize);
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to calculate total size'
            });
        }
    };

    const onTemplateUpload = (e) => {
        try {
            let _totalSize = 0;

            e.files.forEach((file) => {
                _totalSize += file.size || 0;
            });

            setTotalSize(_totalSize);
            toast.current.show({
                severity: 'info',
                summary: 'Success',
                detail: 'File Uploaded'
            });
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to upload file'
            });
        }
    };

    const onTemplateRemove = (file, callback) => {
        try {
            setTotalSize(totalSize - file.size);
            setFileDetails((prev) => {
                const newDetails = { ...prev };
                delete newDetails[file.name];
                return newDetails;
            });
            setCurrentProgress((prev) => {
                const newProgress = { ...prev };
                delete newProgress[file.name];
                return newProgress;
            });
            callback();
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to remove file'
            });
        }
    };

    const onTemplateClear = () => {
        try {
            setTotalSize(0);
            setFileDetails({});
            setProcessingFiles(new Set());
            setCurrentProgress({});
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to clear files'
            });
        }
    };

    const processExcelFile = async (file) => {
        try {
            const reader = new FileReader();

            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    try {
                        const base64data = reader.result.split(',')[1];
                        const wb = XLSX.read(base64data, {
                            type: 'base64',
                            cellDates: true,
                            cellText: false
                        });

                        let allSheetData = [];
                        for (let i in wb.SheetNames) {
                            const wsname = wb.SheetNames[i];
                            const ws = wb.Sheets[wsname];
                            const sheetData = XLSX.utils.sheet_to_json(ws, {
                                raw: false,
                                defval: ''
                            });
                            allSheetData.push(...sheetData);
                        }

                        const columns = allSheetData.length > 0 ? Object.keys(allSheetData[0]) : [];

                        setExcelColumns(columns);
                        setExcelData(allSheetData);
                        setCurrentFile(file);
                        setShowMappingDialog(true);
                        setActiveStep(1);

                        const initialMapping = {};
                        serviceFields.forEach((field) => {
                            initialMapping[field.field] = null;
                        });
                        setFieldMapping(initialMapping);

                        // Initialize reference field mapping for ObjectId fields
                        const initialRefMapping = {};
                        Object.keys(referenceServices).forEach((fieldName) => {
                            initialRefMapping[fieldName] = {};
                        });
                        setReferenceFieldMapping(initialRefMapping);

                        setProcessingFiles((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(file.name);
                            return newSet;
                        });

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };

                reader.onerror = () => reject(new Error('Failed to read file'));

                fetch(file.objectURL)
                    .then((r) => r.blob())
                    .then((blob) => {
                        reader.readAsDataURL(blob);
                    })
                    .catch(reject);
            });
        } catch (error) {
            console.error('File processing error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'An error occurred during file processing'
            });
            throw error;
        }
    };

    const handleFieldMappingChange = (serviceField, excelColumn) => {
        setFieldMapping((prev) => ({
            ...prev,
            [serviceField]: excelColumn
        }));
    };

    const handleReferenceFieldMappingChange = (serviceField, refField, excelColumn) => {
        setReferenceFieldMapping((prev) => ({
            ...prev,
            [serviceField]: {
                ...prev[serviceField],
                [refField]: excelColumn
            }
        }));
    };

    // Function to add a new reference field mapping
    const addReferenceFieldMapping = (serviceField) => {
        const refFields = referenceServices[serviceField]?.refFields || [];
        const availableRefFields = refFields.filter((refField) => !referenceFieldMapping[serviceField] || !referenceFieldMapping[serviceField][refField.field]);

        if (availableRefFields.length > 0) {
            const firstAvailableField = availableRefFields[0].field;
            handleReferenceFieldMappingChange(serviceField, firstAvailableField, null);
        }
    };

    // Function to remove a reference field mapping
    const removeReferenceFieldMapping = (serviceField, refField) => {
        setReferenceFieldMapping((prev) => {
            const updated = { ...prev };
            if (updated[serviceField]) {
                delete updated[serviceField][refField];
                if (Object.keys(updated[serviceField]).length === 0) {
                    delete updated[serviceField];
                }
            }
            return updated;
        });
    };

    const validateFieldType = (fieldName, value, schemaType, isArray = false) => {
        if (value === null || value === undefined || value === '') {
            return { isValid: true };
        }

        let actualType = schemaType;
        if (typeof schemaType === 'object' && schemaType !== null) {
            actualType = schemaType.type || schemaType.name || 'Unknown';
        }

        const typeStr = String(actualType).toLowerCase();

        if (isArray) {
            if (!Array.isArray(value)) {
                return { isValid: false, expectedType: `Array of ${actualType}` };
            }
            for (let item of value) {
                const result = validateFieldType(fieldName, item, actualType);
                if (!result.isValid) {
                    return result;
                }
            }
            return { isValid: true };
        }

        switch (typeStr) {
            case 'string':
            case 'str':
                return typeof value === 'string' || typeof value === 'number' ? { isValid: true } : { isValid: false, expectedType: 'String' };
            case 'number':
            case 'num':
                return !isNaN(Number(value)) && value !== '' ? { isValid: true } : { isValid: false, expectedType: 'Number' };
            case 'boolean':
            case 'bool':
                return typeof value === 'boolean' || value === 'true' || value === 'false' || value === 1 || value === 0 ? { isValid: true } : { isValid: false, expectedType: 'Boolean' };
            case 'date':
                return isValidDate(value) ? { isValid: true } : { isValid: false, expectedType: 'Date' };
            case 'objectid':
            case 'objectid(string)':
                // For ObjectId fields, we'll handle validation separately in the main validation logic
                return { isValid: true };
            case 'mixed':
            case 'object':
                return { isValid: true };
            default:
                return { isValid: true, expectedType: actualType || 'Unknown' };
        }
    };

    const validateAndProcessData = async () => {
        console.log('Starting validation...');
        setIsValidating(true);
        setActiveStep(2);
        updateProgress(currentFile.name, { step: 'Validating data...', percentage: 0 });

        const failRecords = [];
        let successCount = 0;
        const validRowsWithIndex = [];

        try {
            console.log('Excel data length:', excelData.length);
            console.log('Field mapping:', fieldMapping);
            console.log('Reference field mapping:', referenceFieldMapping);

            for (let globalIndex = 0; globalIndex < excelData.length; globalIndex++) {
                const row = excelData[globalIndex];
                let remarks = [];

                const progress = Math.floor((globalIndex / excelData.length) * 80);
                updateProgress(currentFile.name, {
                    step: `Processing row ${globalIndex + 1} of ${excelData.length}`,
                    percentage: progress
                });

                try {
                    // Step 1: Create processed row based on field mapping
                    const processedRow = {};
                    for (const [serviceField, excelColumn] of Object.entries(fieldMapping)) {
                        if (excelColumn && row[excelColumn] !== undefined) {
                            processedRow[serviceField] = row[excelColumn];
                        }
                    }

                    console.log(`Row ${globalIndex} - Processed row:`, processedRow);

                    // Step 2: Process ObjectId fields with reference lookups FIRST
                    const finalRow = await processObjectIdFields(row);
                    console.log(`Row ${globalIndex} - After reference processing:`, finalRow);

                    // Step 3: Merge the mapped fields with the resolved ObjectId fields
                    const mergedRow = { ...processedRow, ...finalRow };

                    // Step 4: Check for empty required fields in the final row (after reference resolution)
                    const missingRequiredFields = requiredFields
                        .filter((field) => {
                            return !mergedRow[field.field] || mergedRow[field.field] === '';
                        })
                        .map((field) => field.field);

                    if (missingRequiredFields.length > 0) {
                        remarks.push(`Required fields empty: ${missingRequiredFields.join(', ')}`);
                    }

                    // Step 5: Validate field types for present fields
                    serviceFields.forEach((field) => {
                        const value = mergedRow[field.field];
                        if (value !== undefined && value !== null && value !== '') {
                            const schemaType = field.type;
                            const isArray = Array.isArray(field.type);

                            // Special handling for date fields
                            if (String(schemaType).toLowerCase() === 'date') {
                                const dateValue = convertToDate(value);
                                if (dateValue) {
                                    mergedRow[field.field] = dateValue;
                                } else if (value) {
                                    remarks.push(`Field '${field.field}' must be a valid Date`);
                                }
                            }
                            // Skip ObjectId validation for fields that were resolved through reference lookup
                            else if (String(schemaType).toLowerCase() === 'objectid') {
                                // Only validate if it's not a resolved ObjectId (should be 24-character hex string)
                                if (typeof value === 'string' && !/^[0-9a-fA-F]{24}$/.test(value)) {
                                    // Check if this field was supposed to be resolved but failed
                                    if (referenceServices[field.field] && Object.keys(referenceFieldMapping[field.field] || {}).length > 0) {
                                        remarks.push(`Field '${field.field}' could not be resolved to a valid record`);
                                    } else {
                                        remarks.push(`Field '${field.field}' must be a ObjectId (24-character hex string)`);
                                    }
                                }
                            } else {
                                // Regular validation for non-date, non-ObjectId fields
                                const validation = validateFieldType(field.field, value, schemaType, isArray);
                                if (!validation.isValid) {
                                    remarks.push(`Field '${field.field}' must be a ${validation.expectedType}`);
                                }
                            }
                        }
                    });

                    if (remarks.length > 0) {
                        failRecords.push({
                            id: globalIndex,
                            row: mergedRow,
                            remarks: remarks.join('; ')
                        });
                    } else {
                        successCount++;
                        validRowsWithIndex.push({ row: mergedRow, originalIndex: globalIndex });
                    }
                } catch (error) {
                    console.error(`Error processing row ${globalIndex}:`, error);
                    failRecords.push({
                        id: globalIndex,
                        row,
                        remarks: `Processing failed: ${error.message}`
                    });
                }
            }

            console.log('Basic validation completed. Success:', successCount, 'Failures:', failRecords.length);

            // Check for duplicate records among valid rows
            const getCanonicalKey = (row) => {
                const sortedObj = Object.keys(row)
                    .sort()
                    .reduce((acc, key) => {
                        acc[key] = row[key];
                        return acc;
                    }, {});
                return JSON.stringify(sortedObj);
            };

            const groups = _.groupBy(validRowsWithIndex, ({ row }) => getCanonicalKey(row));

            let internalDupCount = 0;
            for (let key in groups) {
                const group = groups[key];
                if (group.length > 1) {
                    internalDupCount += group.length;
                    group.forEach(({ row, originalIndex }) => {
                        failRecords.push({
                            id: originalIndex,
                            row,
                            remarks: 'Duplicate record'
                        });
                    });
                }
            }
            successCount -= internalDupCount;

            console.log('After duplicate check. Success:', successCount, 'Failures:', failRecords.length);

            // Check for duplicates with existing records in DB
            try {
                const currentData = await client.service(serviceName).find({});
                const isDuplicateWithExisting = (row) => {
                    const busRow = serviceFields.reduce((acc, field) => {
                        acc[field.field] = row[field.field];
                        return acc;
                    }, {});
                    return currentData.data.some((existing) => {
                        const exBus = serviceFields.reduce((acc, field) => {
                            acc[field.field] = existing[field.field];
                            return acc;
                        }, {});
                        return _.isEqual(busRow, exBus);
                    });
                };

                const postInternalValidWithIndex = [];
                for (let key in groups) {
                    const group = groups[key];
                    if (group.length === 1) {
                        postInternalValidWithIndex.push(group[0]);
                    }
                }

                const dbDuplicates = postInternalValidWithIndex
                    .filter(({ row }) => isDuplicateWithExisting(row))
                    .map(({ originalIndex, row }) => ({
                        id: originalIndex,
                        row,
                        remarks: 'Duplicate with existing record'
                    }));

                failRecords.push(...dbDuplicates);
                successCount -= dbDuplicates.length;

                const dbFailIds = new Set(dbDuplicates.map((d) => d.id));
                const finalValid = postInternalValidWithIndex.filter((v) => !dbFailIds.has(v.originalIndex)).map((v) => v.row);

                const validRecords = finalValid.map((row) => ({
                    ...row,
                    createdBy: user?._id,
                    updatedBy: user?._id
                }));

                updateProgress(currentFile.name, { step: 'Validation complete', percentage: 100 });

                const details = {};
                details[currentFile.name] = {
                    successCount,
                    failRecords,
                    validRecords,
                    failedCount: failRecords.length
                };
                setFileDetails((prev) => ({ ...prev, ...details }));
                setValidationResults({ successCount, failRecords, validRecords });

                console.log('Final validation results:', { successCount, failedCount: failRecords.length, validRecords: validRecords.length });

                toast.current.show({
                    severity: failRecords.length > 0 ? 'warn' : 'info',
                    summary: 'Validation Complete',
                    detail: `${successCount} valid, ${failRecords.length} invalid records.`
                });
            } catch (dbError) {
                console.error('Error checking database duplicates:', dbError);
                throw new Error(`Database check failed: ${dbError.message}`);
            }
        } catch (error) {
            console.error('Validation error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: error.message || 'An unexpected error occurred during validation'
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleUpload = async () => {
        const details = fileDetails[currentFile.name];
        if (!details) {
            toast.current.show({
                severity: 'error',
                summary: 'Upload Failed',
                detail: 'No validation results found. Please validate the data first.'
            });
            return;
        }

        const { validRecords, failRecords } = details;

        try {
            updateProgress(currentFile.name, { step: 'Uploading records', percentage: 0 });

            if (failRecords.length > 0) {
                await sendFailureEmail(failRecords, currentFile.name, user, serviceName);
            }

            if (validRecords && validRecords.length > 0) {
                updateProgress(currentFile.name, { step: 'Creating records...', percentage: 75 });

                const recordsToUpload = validRecords.map((record) => {
                    const processedRecord = { ...record };
                    serviceFields.forEach((field) => {
                        if (String(field.type).toLowerCase() === 'date' && processedRecord[field.field]) {
                            const dateValue = processedRecord[field.field];
                            if (typeof dateValue === 'string') {
                                const convertedDate = convertToDate(dateValue);
                                if (convertedDate) {
                                    processedRecord[field.field] = convertedDate;
                                }
                            }
                        }
                    });
                    return processedRecord;
                });

                const results = await client.service(serviceName).create(recordsToUpload);

                updateProgress(currentFile.name, { step: 'Upload complete', percentage: 100 });

                if (failRecords.length === 0) {
                    toast.current.show({
                        severity: 'success',
                        summary: `Upload Summary`,
                        detail: `Upload succeeded: ${results.length} records`
                    });
                } else {
                    toast.current.show({
                        severity: 'info',
                        summary: `Upload Summary`,
                        detail: `Uploaded ${results.length} valid records. ${failRecords.length} invalid records sent to ${user.email}.`
                    });
                }

                setShowMappingDialog(false);
                setActiveStep(0);
                setTimeout(() => onUploadComplete(), 3000);
            } else {
                toast.current.show({
                    severity: 'warn',
                    summary: 'No Valid Records',
                    detail: 'There are no valid records to upload.'
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.current.show({
                severity: 'error',
                summary: `Upload Failed`,
                detail: error.message
            });
        }
    };

    const sendFailureEmail = async (failRecords, fileName, user, serviceName) => {
        try {
            const columns = Array.from(new Set(failRecords.flatMap((record) => Object.keys(record.row)))).filter((col) => col !== 'remarks');
            const orderedColumns = [...columns, 'remarks'];
            const orderedData = failRecords.map((record) => {
                const row = {};
                orderedColumns.forEach((col) => {
                    row[col] = col === 'remarks' ? record.remarks || '' : record.row[col] || '';
                });
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(orderedData, { header: orderedColumns });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            const csvBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'array' });
            const csvBase64 = Buffer.from(csvBuffer).toString('base64');

            const mailData = {
                name: 'onUploadFailure',
                type: 'uploadFailure',
                from: "no-reply@atlasirms.com.my",
                recipients: [user.email],
                status: true,
                data: {
                    name: user.name || 'User',
                    serviceName,
                    failedCount: failRecords.length,
                    projectLabel: process.env.REACT_APP_PROJECT_LABEL || process.env.REACT_APP_PROJECT_NAME
                },
                subject: `CSV Upload Failed for ${serviceName}`,
                templateId: 'onUploadFailure',
                attachments: [
                    {
                        filename: `error_${fileName.split('.')[0]}.csv`,
                        content: csvBase64,
                        contentType: 'text/csv'
                    }
                ]
            };

            await client.service('mailQues').create(mailData);
        } catch (error) {
            console.error('Failed to queue email:', error);
        }
    };

    const headerTemplate = (options) => {
        const { className, chooseButton, uploadButton, cancelButton } = options;
        const value = totalSize / 10000;
        const formattedValue = fileUploadRef && fileUploadRef.current ? fileUploadRef.current.formatSize(totalSize) : '0 B';

        return (
            <div
                className={className}
                style={{
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                {chooseButton}
                {uploadButton}
                {cancelButton}
                <div className="flex align-items-center gap-3 ml-auto">
                    <span>{formattedValue} / 10 MB</span>
                    <ProgressBar value={value} showValue={false} style={{ width: '10rem', height: '12px' }}></ProgressBar>
                </div>
            </div>
        );
    };

    const itemTemplate = (file, props) => {
        const isProcessing = processingFiles.has(file.name);
        const fileProgress = currentProgress[file.name] || { step: 'Waiting to process...', percentage: 0 };

        return (
            <div className="flex align-items-center flex-wrap">
                <div className="flex align-items-center" style={{ width: '40%' }}>
                    <img alt="Excel Icon" src={excelLogo} width={50} />
                    <span className="flex flex-column text-left ml-3">
                        {file.name}
                        <small>{new Date().toLocaleDateString()}</small>
                        {isProcessing && (
                            <div className="mt-2">
                                <div className="text-sm font-medium" style={{ color: 'var(--primary-color)' }}>
                                    {fileProgress.step} ({fileProgress.percentage}%)
                                </div>
                                <ProgressBar value={fileProgress.percentage} showValue={false} style={{ height: '6px', width: '200px' }} className="mt-1" />
                            </div>
                        )}
                    </span>
                </div>

                <div className="ml-auto flex align-items-center">
                    <Tag value={fileDetails[file.name]?.successCount || 0} severity="success" className="px-3 py-2 mr-3" />
                    <Tag value={fileDetails[file.name]?.failRecords?.length || 0} severity="danger" className="px-3 py-2 mr-3" />
                    <Tag value={props.formatSize} severity="warning" className="px-3 py-2 mr-3" />
                    <Button type="button" icon="pi pi-times" className="p-button-outlined p-button-rounded p-button-danger" onClick={() => onTemplateRemove(file, props.onRemove)} disabled={isProcessing} />
                </div>
            </div>
        );
    };

    const emptyTemplate = () => {
        return (
            <div className="flex align-items-center flex-column">
                <i
                    className="pi pi-file-excel mt-3 p-5"
                    style={{
                        fontSize: '5em',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface-b)',
                        color: 'var(--surface-d)'
                    }}
                ></i>
                <span style={{ fontSize: '1.2em', color: 'var(--text-color-secondary)' }} className="my-5">
                    Drag and Drop Excel File Here
                </span>
            </div>
        );
    };

    const renderFieldMappingStep = () => (
        <div className="p-fluid">
            <h3>Map Excel Columns to Service Fields</h3>
            <p>Please map each service field to the corresponding Excel column.</p>

            <div className="grid">
                {serviceFields.map((field) => (
                    <div className="col-12 md:col-6 lg:col-4" key={field.field}>
                        <Card className="mb-3">
                            <div className="field">
                                <label htmlFor={field.field} className="font-bold">
                                    {field.field} {field.required && <span style={{ color: 'red' }}>*</span>}
                                </label>
                                <div className="text-sm text-color-secondary mb-2">
                                    Type: {field.type}
                                    {referenceServices[field.field] && <div className="text-blue-600 mt-1">References: {referenceServices[field.field].refService}</div>}
                                </div>
                                <Dropdown
                                    id={field.field}
                                    value={fieldMapping[field.field]}
                                    options={[{ label: '-- Select Excel Column --', value: null }, ...excelColumns.map((col) => ({ label: col, value: col }))]}
                                    onChange={(e) => handleFieldMappingChange(field.field, e.value)}
                                    placeholder="Select Excel Column"
                                    className="w-full"
                                />
                            </div>

                            {/* Reference field mapping for ObjectId fields */}
                            {referenceServices[field.field] && (
                                <div className="mt-3 p-2 border-round border-1 surface-border">
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <small className="font-bold">Reference Search Fields for {referenceServices[field.field].refService}:</small>
                                        <Button
                                            icon="pi pi-plus"
                                            className="p-button-rounded p-button-text p-button-sm"
                                            onClick={() => addReferenceFieldMapping(field.field)}
                                            tooltip="Add reference search field"
                                            tooltipOptions={{ position: 'top' }}
                                            disabled={referenceServices[field.field].refFields.length <= Object.keys(referenceFieldMapping[field.field] || {}).length}
                                        />
                                    </div>
                                    <p className="text-xs text-color-secondary mb-2">Select Excel columns that contain data to search for in {referenceServices[field.field].refService}. The system will find records that match ALL selected fields.</p>

                                    {/* Show existing reference field mappings */}
                                    {referenceFieldMapping[field.field] &&
                                        Object.entries(referenceFieldMapping[field.field]).map(([refField, excelColumn]) => (
                                            <div key={refField} className="field mt-2 flex align-items-center">
                                                <div className="flex-1">
                                                    <label htmlFor={`${field.field}-${refField}`} className="text-sm block mb-1">
                                                        Search by {refField}
                                                    </label>
                                                    <Dropdown
                                                        id={`${field.field}-${refField}`}
                                                        value={excelColumn}
                                                        options={[{ label: '-- Select Excel Column --', value: null }, ...excelColumns.map((col) => ({ label: col, value: col }))]}
                                                        onChange={(e) => handleReferenceFieldMappingChange(field.field, refField, e.value)}
                                                        placeholder="Select Excel Column"
                                                        className="w-full text-sm"
                                                    />
                                                </div>
                                                <Button icon="pi pi-times" className="p-button-rounded p-button-text p-button-danger ml-2 mt-3" onClick={() => removeReferenceFieldMapping(field.field, refField)} tooltip="Remove this search field" tooltipOptions={{ position: 'top' }} />
                                            </div>
                                        ))}

                                    {/* Show available fields that haven't been mapped yet */}
                                    {(() => {
                                        const mappedRefFields = referenceFieldMapping[field.field] ? Object.keys(referenceFieldMapping[field.field]) : [];
                                        const availableRefFields = referenceServices[field.field].refFields.filter((refField) => !mappedRefFields.includes(refField.field));

                                        if (availableRefFields.length > 0 && mappedRefFields.length === 0) {
                                            return (
                                                <div className="mt-2">
                                                    <small className="text-500">Available search fields: {availableRefFields.map((f) => f.field).join(', ')}</small>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </Card>
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <Message severity="info" text="Required fields are marked with *. For ObjectId fields, use the + button to add reference search fields. The system will find records that match ALL selected search criteria." />
            </div>
        </div>
    );

    const renderValidationStep = () => (
        <div>
            <h3>Validation Results</h3>
            {isValidating ? (
                <div className="text-center">
                    <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
                    <p className="mt-2">Validating data, please wait...</p>
                </div>
            ) : validationResults ? (
                <>
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <Card title="Valid Records" className="text-center">
                                <div className="text-green-500 font-bold text-2xl">{validationResults.successCount}</div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-4">
                            <Card title="Invalid Records" className="text-center">
                                <div className="text-red-500 font-bold text-2xl">{validationResults.failRecords.length}</div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-4">
                            <Card title="Total Records" className="text-center">
                                <div className="text-blue-500 font-bold text-2xl">{excelData.length}</div>
                            </Card>
                        </div>
                    </div>

                    {validationResults.failRecords.length > 0 && (
                        <div className="mt-4">
                            <h4>Error Details (First 10 errors)</h4>
                            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                                {validationResults.failRecords.slice(0, 10).map((record, index) => (
                                    <Message key={index} severity="error" text={`Row ${record.id + 1}: ${record.remarks}`} className="mb-2" />
                                ))}
                                {validationResults.failRecords.length > 10 && <Message severity="warn" text={`... and ${validationResults.failRecords.length - 10} more errors`} />}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <Message severity="info" text="No validation results available. Please click 'Validate Data' to start validation." />
            )}
        </div>
    );

    const mappingDialogFooter = (
        <div className="flex justify-content-between">
            <div>
                <Button label="Back to Mapping" icon="pi pi-arrow-left" className="p-button-text" onClick={() => setActiveStep(1)} disabled={activeStep === 1 || isValidating} />
            </div>
            <div>
                <Button label="Validate Data" icon="pi pi-check" onClick={validateAndProcessData} disabled={activeStep !== 1 || isValidating} className="p-button-success" loading={isValidating} />
                <Button label="Upload Valid Records" icon="pi pi-upload" onClick={handleUpload} disabled={!validationResults || activeStep !== 2 || isValidating} className="p-button-primary ml-2" />
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    className="p-button-text ml-2"
                    onClick={() => {
                        setShowMappingDialog(false);
                        setActiveStep(0);
                    }}
                    disabled={isValidating}
                />
            </div>
        </div>
    );

    return (
        <div className="card flex justify-content-center">
            <Toast ref={toast}></Toast>

            <div>
                <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
                <Tooltip target=".custom-upload-btn" content="Upload" position="bottom" />
                <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />

                <FileUpload
                    ref={fileUploadRef}
                    name="demo[]"
                    url="/api/upload"
                    accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    maxFileSize={25000000}
                    onUpload={onTemplateUpload}
                    onSelect={onTemplateSelect}
                    onError={onTemplateClear}
                    onClear={onTemplateClear}
                    headerTemplate={headerTemplate}
                    itemTemplate={itemTemplate}
                    emptyTemplate={emptyTemplate}
                    chooseOptions={{
                        icon: 'pi pi-fw pi-file',
                        iconOnly: true,
                        className: 'custom-choose-btn p-button-rounded p-button-outlined'
                    }}
                    uploadOptions={{
                        icon: 'pi pi-fw pi-cloud-upload',
                        iconOnly: true,
                        className: 'custom-upload-btn p-button-success p-button-rounded p-button-outlined',
                        disabled: processingFiles.size > 0
                    }}
                    cancelOptions={{
                        icon: 'pi pi-fw pi-times',
                        iconOnly: true,
                        className: 'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined'
                    }}
                    customUpload
                    uploadHandler={() => { }}
                    disabled={disabled ? disabled : false}
                />
            </div>

            <Dialog
                header={`Field Mapping - ${serviceName}`}
                visible={showMappingDialog}
                style={{ width: '95vw', maxWidth: '1400px' }}
                footer={mappingDialogFooter}
                onHide={() => {
                    if (!isValidating) {
                        setShowMappingDialog(false);
                        setActiveStep(0);
                    }
                }}
                closable={!isValidating}
            >
                <Steps model={steps} activeIndex={activeStep} />

                <div className="mt-4">
                    {activeStep === 1 && renderFieldMappingStep()}
                    {activeStep === 2 && renderValidationStep()}
                </div>
            </Dialog>
        </div>
    );
}
