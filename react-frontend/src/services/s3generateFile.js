import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';

const S3GenerateFile = (props, ref) => {
    const toast = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const uploadURL = `${process.env.REACT_APP_SERVER_URL}/s3uploader`;

    const maxFileSize = 25000000; // 25MB
    const allowedFileTypes = ['application/pdf'];
    const allowedExtensions = ['.pdf'];

    // Expose uploadProgrammatic method to parent via ref
    useImperativeHandle(ref, () => ({
        uploadProgrammatic: (files) => {
            uploadFile({ files });
        }
    }));

    const validateFile = (file) => {
        if (!allowedFileTypes.includes(file.type)) {
            return {
                valid: false,
                message: `File type ${file.type} is not allowed. Only PDFs are accepted.`
            };
        }

        const fileName = file.name.toLowerCase();
        const isValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));
        if (!isValidExtension) {
            return {
                valid: false,
                message: `File extension not allowed. Only ${allowedExtensions.join(', ')} are accepted.`
            };
        }

        if (file.size > maxFileSize) {
            return {
                valid: false,
                message: `File is too large. Maximum size is 25MB.`
            };
        }

        return { valid: true };
    };

    const uploadFile = async (e) => {
        const filesToUpload = e.files;

        if (filesToUpload.length > 0) {
            setIsUploading(true);
            try {
                const validFiles = filesToUpload.filter((file) => {
                    const validation = validateFile(file);
                    if (!validation.valid) {
                        props.parentToastRef?.current?.show({
                            severity: 'error',
                            summary: 'Invalid File',
                            detail: `${file.name}: ${validation.message}`,
                            life: 5000
                        });
                        return false;
                    }
                    return true;
                });

                if (validFiles.length === 0) {
                    props.parentToastRef?.current?.show({
                        severity: 'warn',
                        summary: 'No Valid Files',
                        detail: 'No valid files provided for upload.',
                        life: 3000
                    });
                    return;
                }

                const formData = new FormData();
                validFiles.forEach((file) => {
                    formData.append('files', file, file.name); // Include original filename
                });
                formData.append('tableId', props.id);
                formData.append('tableName', props.serviceName);
                formData.append('user', JSON.stringify(props.user ? props.user : {}));

                console.log(`Uploading ${validFiles.length} files`);
                const response = await fetch(uploadURL, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    let errorDetail = `HTTP error! status: ${response.status}`;
                    if (response.status === 413) {
                        errorDetail = `File is too large. Maximum size allowed is 25MB.`;
                    } else {
                        try {
                            const errorResult = await response.json();
                            errorDetail = errorResult.message || errorResult.error || JSON.stringify(errorResult);
                        } catch (jsonError) {
                            errorDetail = response.statusText || errorDetail;
                        }
                    }
                    throw new Error(errorDetail);
                }

                const result = await response.json();

                if (result?.results && result.results.length > 0) {
                    const documentIds = result.results.map((res) => res.documentId).filter((id) => id);
                    if (props.onUploadComplete) {
                        props.onUploadComplete(documentIds);
                    }
                    props.parentToastRef?.current?.show({
                        severity: 'success',
                        summary: 'Upload Successful',
                        detail: `${documentIds.length} file${documentIds.length === 1 ? '' : 's'} uploaded successfully.`,
                        life: 3000
                    });
                } else {
                    throw new Error('Upload completed but received unexpected response.');
                }
            } catch (error) {
                console.error('Upload error:', error);
                props.parentToastRef?.current?.show({
                    severity: 'error',
                    summary: 'Upload Failed',
                    detail: error.message || 'Failed to upload file. Please try again.',
                    life: 5000
                });
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div>
            <Toast ref={toast} />
            {isUploading && <ProgressBar mode="indeterminate" style={{ height: '6px', marginTop: '10px' }} />}
        </div>
    );
};

export default forwardRef(S3GenerateFile);
