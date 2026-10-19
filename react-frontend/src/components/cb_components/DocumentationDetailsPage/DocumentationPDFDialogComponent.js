// DocumentationPDFDialogComponent.js
import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Document, Page, Text, View, Image, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import client from '../../../services/restClient';
import S3GenerateFile from '../../../services/s3generateFile';
import moment from 'moment';

// Register fonts
Font.register({
    family: 'Helvetica'
});

const DocumentationPDFDialogComponent = ({ show, onHide, user, onGenerateComplete, projectName = 'Project' }) => {
    const [pdfContent, setPdfContent] = useState([]);
    const [apiEndpoints, setApiEndpoints] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingAPIs, setIsFetchingAPIs] = useState(false);
    const [fileName, setFileName] = useState(`${projectName}-Technical-Documentation`);
    const [pdfReady, setPdfReady] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const fileUploadRef = useRef(null);
    const [documentStorageId, setDocumentStorageId] = useState(null);
    const [documentationType, setDocumentationType] = useState('both'); // 'process-flow', 'api', 'both'
    const [generationProgress, setGenerationProgress] = useState(0);
    const [selectedServices, setSelectedServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [includeIntroduction, setIncludeIntroduction] = useState(true);
    const [includeAppendix, setIncludeAppendix] = useState(true);

    // Generic introduction text
    const INTRODUCTION_TEXT = {
        title: 'Introduction',
        content: `This application is a comprehensive platform designed to streamline workflows and operational management. It provides a structured approach to handle tasks, ensuring smooth operations across all stakeholders.

By integrating robust workflows for task creation, job sequencing, and resolution, the application facilitates seamless coordination among users, supervisors, and administrators. It ensures that all aspects of management are handled efficiently, reducing downtime and enhancing service quality.

Key highlights of the workflows include:
\u2022 End-to-End Process Management: Covers the full lifecycle of operations, from initiation to completion.
\u2022 Streamlined Task Processes: Simplifies the reporting of issues and tracks their resolution in real-time.
\u2022 Role-Based Collaboration: Enables efficient communication and task allocation between roles.
\u2022 Automated Notifications: Provides real-time alerts for new tasks, status updates, and escalations.
\u2022 Data Transparency: Tracks all updates and actions, creating a clear and auditable workflow history.

This document provides an in-depth look into the workflows that drive the application, focusing on how they simplify operations while maintaining accountability and transparency.`
    };

    // Enhanced PDF styles with professional formatting
    const styles = StyleSheet.create({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            padding: 50,
            fontFamily: 'Helvetica',
            position: 'relative'
        },
        coverPage: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 50,
            height: '100%'
        },
        header: {
            position: 'absolute',
            top: 30,
            left: 50,
            right: 50,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 10,
            borderBottom: '1pt solid #e0e0e0'
        },
        footer: {
            position: 'absolute',
            bottom: 30,
            left: 50,
            right: 50,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1pt solid #e0e0e0',
            paddingTop: 10
        },
        coverTitle: {
            fontSize: 36,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 20,
            color: '#1a365d'
        },
        coverSubtitle: {
            fontSize: 20,
            textAlign: 'center',
            marginBottom: 30,
            color: '#4a5568',
            fontStyle: 'italic'
        },
        companyTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 40,
            color: '#2c5282'
        },
        coverMeta: {
            fontSize: 14,
            textAlign: 'center',
            color: '#718096',
            marginTop: 40,
            marginBottom: 10
        },
        coverDate: {
            fontSize: 12,
            textAlign: 'center',
            color: '#a0aec0',
            marginTop: 20
        },
        tocContainer: {
            marginBottom: 30,
            padding: 20,
            backgroundColor: '#f8fafc',
            borderRadius: 8,
            borderLeft: '4pt solid #4299e1'
        },
        tocTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 15,
            color: '#2d3748'
        },
        tocItem: {
            fontSize: 11,
            marginBottom: 8,
            color: '#4a5568',
            marginLeft: 10
        },
        tocDotLeader: {
            fontSize: 10,
            color: '#cbd5e0'
        },
        sectionContainer: {
            marginBottom: 30,
            pageBreak: 'auto'
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
            paddingBottom: 15,
            borderBottom: '2pt solid #e2e8f0'
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#2c5282',
            flex: 1
        },
        sectionMeta: {
            fontSize: 10,
            color: '#718096',
            fontStyle: 'italic',
            marginLeft: 10
        },
        contentContainer: {
            marginTop: 10
        },
        h1: {
            fontSize: 22,
            fontWeight: 'bold',
            marginTop: 25,
            marginBottom: 15,
            color: '#2c5282',
            paddingBottom: 5,
            borderBottom: '1pt solid #e2e8f0'
        },
        h2: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: 20,
            marginBottom: 12,
            color: '#2c5282',
            backgroundColor: '#f7fafc',
            padding: 8,
            borderRadius: 4
        },
        h3: {
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 16,
            marginBottom: 10,
            color: '#4a5568'
        },
        h4: {
            fontSize: 14,
            fontWeight: 'bold',
            marginTop: 14,
            marginBottom: 8,
            color: '#4a5568'
        },
        paragraph: {
            fontSize: 12,
            lineHeight: 1.6,
            marginBottom: 12,
            color: '#2d3748'
        },
        bold: {
            fontWeight: 'bold'
        },
        italic: {
            fontStyle: 'italic'
        },
        code: {
            fontFamily: 'Helvetica',
            fontSize: 11,
            backgroundColor: '#f7fafc',
            padding: 8,
            borderRadius: 4,
            marginVertical: 8,
            border: '1pt solid #e2e8f0'
        },
        inlineCode: {
            fontFamily: 'Helvetica',
            fontSize: 11,
            backgroundColor: '#f7fafc',
            padding: '2px 4px',
            borderRadius: 3
        },
        bulletListContainer: {
            marginLeft: 20,
            marginBottom: 12
        },
        bulletListItem: {
            fontSize: 12,
            lineHeight: 1.6,
            marginBottom: 6,
            color: '#2d3748',
            flexDirection: 'row'
        },
        bulletPoint: {
            marginRight: 8
        },
        orderedListContainer: {
            marginLeft: 25,
            marginBottom: 12
        },
        orderedListItem: {
            fontSize: 12,
            lineHeight: 1.6,
            marginBottom: 6,
            color: '#2d3748',
            flexDirection: 'row'
        },
        orderedNumber: {
            marginRight: 8,
            fontWeight: 'bold'
        },
        pageNumber: {
            fontSize: 10,
            color: '#a0aec0',
            position: 'absolute',
            bottom: 30,
            left: 0,
            right: 0,
            textAlign: 'center'
        },
        table: {
            display: 'flex',
            width: '100%',
            marginVertical: 10,
            border: '1pt solid #e2e8f0'
        },
        tableRow: {
            flexDirection: 'row',
            borderBottom: '1pt solid #e2e8f0'
        },
        tableHeader: {
            backgroundColor: '#2c5282',
            color: 'white',
            fontWeight: 'bold',
            padding: 8
        },
        tableCell: {
            padding: 8,
            fontSize: 11,
            flex: 1
        },
        endpointBadge: {
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 'bold',
            marginRight: 8
        },
        getBadge: {
            backgroundColor: '#48bb78',
            color: 'white'
        },
        postBadge: {
            backgroundColor: '#4299e1',
            color: 'white'
        },
        putBadge: {
            backgroundColor: '#ed8936',
            color: 'white'
        },
        deleteBadge: {
            backgroundColor: '#f56565',
            color: 'white'
        },
        patchBadge: {
            backgroundColor: '#9f7aea',
            color: 'white'
        },
        sectionDivider: {
            height: 1,
            backgroundColor: '#e2e8f0',
            marginVertical: 25
        },
        infoBox: {
            backgroundColor: '#ebf8ff',
            border: '1pt solid #bee3f8',
            borderRadius: 5,
            padding: 12,
            marginVertical: 15
        },
        warningBox: {
            backgroundColor: '#feebc8',
            border: '1pt solid #fbd38d',
            borderRadius: 5,
            padding: 12,
            marginVertical: 15
        },
        note: {
            fontSize: 11,
            fontStyle: 'italic',
            color: '#718096',
            marginTop: 10,
            paddingLeft: 10,
            borderLeft: '2pt solid #cbd5e0'
        }
    });

    // Fetch all helpSidebarContents
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await client.service('helpSidebarContents').find({
                    query: {
                        $sort: { serviceName: 1 }
                    }
                });
                setPdfContent(response.data);
                const uniqueServices = [...new Set(response.data.map((item) => item.serviceName))];
                setFilteredServices(uniqueServices);
            } catch (error) {
                console.error('Error fetching helpSidebarContents:', error);
            }
        };

        if (show) {
            fetchContent();
            setPdfReady(false);
            setFileName(`${projectName}-Technical-Documentation`);
            setDocumentStorageId(null);
            setDocumentationType('both');
            setGenerationProgress(0);
            setSelectedServices([]);
            setSearchTerm('');
        }
    }, [show, projectName]);

    // Filter services based on search term
    useEffect(() => {
        if (!pdfContent || pdfContent.length === 0) return;

        if (searchTerm.trim() === '') {
            const uniqueServices = [...new Set(pdfContent.map((item) => item.serviceName))];
            setFilteredServices(uniqueServices);
        } else {
            const filtered = [...new Set(pdfContent.filter((item) => item.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) || formatServiceName(item.serviceName).toLowerCase().includes(searchTerm.toLowerCase())).map((item) => item.serviceName))];
            setFilteredServices(filtered);
        }
    }, [searchTerm, pdfContent]);

    // Handle service selection
    const onServiceSelect = (service) => {
        const newSelectedServices = [...selectedServices];
        if (newSelectedServices.includes(service)) {
            setSelectedServices(newSelectedServices.filter((s) => s !== service));
        } else {
            newSelectedServices.push(service);
            setSelectedServices(newSelectedServices);
        }
    };

    // Select all filtered services
    const selectAllFilteredServices = () => {
        if (selectedServices.length === filteredServices.length) {
            setSelectedServices(selectedServices.filter((service) => !filteredServices.includes(service)));
        } else {
            const allFilteredSelected = [...new Set([...selectedServices, ...filteredServices])];
            setSelectedServices(allFilteredSelected);
        }
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
    };

    // Format service name for display
    const formatServiceName = (str) => {
        if (!str) return '';
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase())
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Get selected services count in filtered view
    const getSelectedFilteredCount = () => {
        return filteredServices.filter((service) => selectedServices.includes(service)).length;
    };

    // Pre-fetch API endpoints when dialog shows and type includes API
    useEffect(() => {
        if (show && (documentationType === 'api' || documentationType === 'both')) {
            fetchApiEndpoints();
        }
    }, [show, documentationType]);

    // Fetch API endpoints from OpenAPI documentation
    const fetchApiEndpoints = async () => {
        setIsFetchingAPIs(true);
        try {
            const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3030';
            const response = await fetch(`${backendUrl}/api-docs/json`);
            const swaggerData = await response.json();

            if (swaggerData && swaggerData.paths && Object.keys(swaggerData.paths).length > 0) {
                const apiDocs = processSwaggerData(swaggerData);
                setApiEndpoints(apiDocs);
            } else {
                throw new Error('Invalid or empty Swagger data');
            }
        } catch (error) {
            console.error('Error fetching API endpoints:', error);
            const manualDocs = generateManualApiDocumentation();
            setApiEndpoints(manualDocs);
        } finally {
            setIsFetchingAPIs(false);
        }
    };

    // Process Swagger/OpenAPI data into our format
    const processSwaggerData = (swaggerData) => {
        const paths = swaggerData.paths || {};
        const servicesByTag = {};

        Object.entries(paths).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, endpoint]) => {
                const tags = endpoint.tags || ['General'];
                const tag = tags[0] || 'General';

                if (!servicesByTag[tag]) {
                    servicesByTag[tag] = { service: tag, endpoints: [] };
                }

                servicesByTag[tag].endpoints.push({
                    method: method.toUpperCase(),
                    path: path,
                    description: endpoint.summary || endpoint.description || 'No description available',
                    parameters: endpoint.parameters || [],
                    responses: endpoint.responses || {},
                    security: endpoint.security || []
                });
            });
        });

        return Object.values(servicesByTag).sort((a, b) => a.service.localeCompare(b.service));
    };

    // Generate manual API documentation as fallback
    const generateManualApiDocumentation = () => {
        return [
            {
                service: 'authentication',
                endpoints: [
                    {
                        method: 'POST',
                        path: '/authentication',
                        description: 'Authenticate user and get JWT token',
                        parameters: [],
                        responses: {
                            201: { description: 'Authentication successful' },
                            401: { description: 'Invalid credentials' }
                        }
                    }
                ]
            },
            {
                service: 'users',
                endpoints: [
                    {
                        method: 'GET',
                        path: '/users',
                        description: 'Get all users',
                        parameters: [
                            { name: '$limit', in: 'query', description: 'Limit results' },
                            { name: '$skip', in: 'query', description: 'Skip records' }
                        ],
                        responses: {
                            200: { description: 'List of users' },
                            401: { description: 'Unauthorized' }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/users',
                        description: 'Create a new user',
                        parameters: [],
                        responses: {
                            201: { description: 'User created' },
                            400: { description: 'Validation error' }
                        }
                    }
                ]
            }
        ];
    };

    // HTML parsing functions
    const parseHtmlContent = (html) => {
        if (!html) return [];

        const elements = [];
        let cleanHtml = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p><br><\/p>/gi, '\n')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        const headingRegex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi;
        let headingMatch;
        while ((headingMatch = headingRegex.exec(cleanHtml)) !== null) {
            const level = parseInt(headingMatch[1]);
            const content = parseInlineHtml(headingMatch[2]);
            elements.push({
                type: 'heading',
                level: level,
                content: content,
                style: styles[`h${level}`] || styles.h2
            });
            cleanHtml = cleanHtml.replace(headingMatch[0], '');
        }

        const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
        let paraMatch;
        while ((paraMatch = paragraphRegex.exec(cleanHtml)) !== null) {
            const content = parseInlineHtml(paraMatch[1]).trim();
            if (content) {
                elements.push({ type: 'paragraph', content: content, style: styles.paragraph });
            }
            cleanHtml = cleanHtml.replace(paraMatch[0], '');
        }

        const ulRegex = /<ul[^>]*>(.*?)<\/ul>/gis;
        let ulMatch;
        while ((ulMatch = ulRegex.exec(cleanHtml)) !== null) {
            const listContent = ulMatch[1];
            const liRegex = /<li[^>]*>(.*?)<\/li>/gis;
            const items = [];
            let liMatch;
            while ((liMatch = liRegex.exec(listContent)) !== null) {
                const itemContent = parseInlineHtml(liMatch[1]);
                if (itemContent) items.push(itemContent);
            }
            if (items.length > 0) elements.push({ type: 'bulletList', items: items });
            cleanHtml = cleanHtml.replace(ulMatch[0], '');
        }

        const olRegex = /<ol[^>]*>(.*?)<\/ol>/gis;
        let olMatch;
        while ((olMatch = olRegex.exec(cleanHtml)) !== null) {
            const listContent = olMatch[1];
            const liRegex = /<li[^>]*>(.*?)<\/li>/gis;
            const items = [];
            let liMatch;
            let itemIndex = 1;
            while ((liMatch = liRegex.exec(listContent)) !== null) {
                const itemContent = parseInlineHtml(liMatch[1]);
                if (itemContent) items.push({ content: itemContent, number: itemIndex++ });
            }
            if (items.length > 0) elements.push({ type: 'orderedList', items: items });
            cleanHtml = cleanHtml.replace(olMatch[0], '');
        }

        const remainingText = stripHtmlTags(cleanHtml).trim();
        if (remainingText) {
            const lines = remainingText.split(/\n+/).filter((line) => line.trim());
            lines.forEach((line) => {
                const parsedLine = parseInlineHtml(line.trim());
                if (parsedLine) {
                    elements.push({ type: 'paragraph', content: parsedLine, style: styles.paragraph });
                }
            });
        }

        return elements;
    };

    const parseInlineHtml = (html) => {
        if (!html) return '';
        let result = html;
        result = result.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**');
        result = result.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*');
        result = result.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
        result = stripHtmlTags(result);
        return result.replace(/\s+/g, ' ').trim();
    };

    const stripHtmlTags = (html) => {
        return html.replace(/<[^>]*>?/gm, '').trim();
    };

    const parseFormattedText = (text) => {
        if (!text) return [];
        const parts = [];
        let currentIndex = 0;
        const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > currentIndex) {
                const plainText = text.substring(currentIndex, match.index);
                if (plainText.trim()) parts.push({ type: 'text', content: plainText });
            }
            const formattedText = match[0];
            if (formattedText.startsWith('**') && formattedText.endsWith('**')) {
                parts.push({ type: 'bold', content: formattedText.slice(2, -2) });
            } else if (formattedText.startsWith('*') && formattedText.endsWith('*')) {
                parts.push({ type: 'italic', content: formattedText.slice(1, -1) });
            }
            currentIndex = match.index + match[0].length;
        }
        if (currentIndex < text.length) {
            const remainingText = text.substring(currentIndex);
            if (remainingText.trim()) parts.push({ type: 'text', content: remainingText });
        }
        if (parts.length === 0 && text.trim()) parts.push({ type: 'text', content: text });
        return parts;
    };

    const renderTextParts = (textParts) =>
        textParts.map((part, idx) => {
            if (part.type === 'bold')
                return (
                    <Text key={idx} style={styles.bold}>
                        {part.content}
                    </Text>
                );
            if (part.type === 'italic')
                return (
                    <Text key={idx} style={styles.italic}>
                        {part.content}
                    </Text>
                );
            return <Text key={idx}>{part.content}</Text>;
        });

    const renderHtmlElements = (elements) => {
        if (!elements || elements.length === 0) return null;
        return elements.map((element, index) => {
            switch (element.type) {
                case 'heading':
                case 'paragraph': {
                    const textParts = parseFormattedText(element.content);
                    return (
                        <Text key={index} style={element.style}>
                            {renderTextParts(textParts)}
                        </Text>
                    );
                }
                case 'bulletList':
                    return (
                        <View key={index} style={styles.bulletListContainer}>
                            {element.items.map((item, idx) => (
                                <View key={idx} style={styles.bulletListItem}>
                                    <Text style={styles.bulletPoint}>{'\u2022'}</Text>
                                    <Text style={styles.paragraph}>{renderTextParts(parseFormattedText(item))}</Text>
                                </View>
                            ))}
                        </View>
                    );
                case 'orderedList':
                    return (
                        <View key={index} style={styles.orderedListContainer}>
                            {element.items.map((item, idx) => (
                                <View key={idx} style={styles.orderedListItem}>
                                    <Text style={styles.orderedNumber}>{item.number}.</Text>
                                    <Text style={styles.paragraph}>{renderTextParts(parseFormattedText(item.content))}</Text>
                                </View>
                            ))}
                        </View>
                    );
                default:
                    return null;
            }
        });
    };

    // Render Introduction section (generic)
    const renderIntroductionSection = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.h1}>{INTRODUCTION_TEXT.title}</Text>

            <Text style={styles.paragraph}>This application is a comprehensive platform designed to streamline workflows and operational management. It provides a structured approach to handle tasks, ensuring smooth operations across all stakeholders.</Text>

            <Text style={styles.paragraph}>
                By integrating robust workflows for task creation, job sequencing, and resolution, the application facilitates seamless coordination among users, supervisors, and administrators. It ensures all aspects of management are handled efficiently, reducing downtime and enhancing service
                quality.
            </Text>

            <Text style={[styles.paragraph, styles.bold]}>Key highlights of the workflows include:</Text>

            <View style={styles.bulletListContainer}>
                {[
                    ['End-to-End Process Management:', 'Covers the full lifecycle of operations, from initiation to completion.'],
                    ['Streamlined Task Processes:', 'Simplifies issue reporting and tracks resolution in real-time.'],
                    ['Role-Based Collaboration:', 'Enables efficient communication and task allocation between roles.'],
                    ['Automated Notifications:', 'Provides real-time alerts for new tasks, status updates, and escalations.'],
                    ['Data Transparency:', 'Tracks all updates and actions, creating a clear and auditable workflow history.']
                ].map(([label, desc], idx) => (
                    <View key={idx} style={styles.bulletListItem}>
                        <Text style={styles.bulletPoint}>{'\u2022'}</Text>
                        <Text style={styles.paragraph}>
                            <Text style={styles.bold}>{label}</Text> {desc}
                        </Text>
                    </View>
                ))}
            </View>

            <Text style={styles.paragraph}>This document provides an in-depth look into the workflows that drive the application, focusing on how they simplify operations while maintaining accountability and transparency.</Text>
        </View>
    );

    // PDF Document Component
    const PDFDocument = ({ processFlowContent, apiEndpointsData, docType }) => {
        let pageCount = 1; // Cover page
        if (includeIntroduction) pageCount += 1;

        const processFlowPages = processFlowContent.filter((item) => selectedServices.includes(item.serviceName)).length || 0;
        if (docType !== 'api' && selectedServices.length > 0) pageCount += processFlowPages + 1;

        const apiPages = apiEndpointsData.length || 0;
        if (docType !== 'process-flow') pageCount += apiPages + 1;

        if (includeAppendix) pageCount += 1;

        const tocItems = [];
        let currentPage = 2;

        if (includeIntroduction) {
            tocItems.push({ title: '1. Introduction', page: currentPage });
            currentPage++;
        }

        if (docType !== 'api' && selectedServices.length > 0) {
            tocItems.push({ title: '2. Process Flow Documentation', page: currentPage });
            currentPage += processFlowPages + 1;
        }

        if (docType !== 'process-flow') {
            const sectionNumber = docType === 'both' && selectedServices.length > 0 ? '3' : '2';
            tocItems.push({ title: `${sectionNumber}. API Endpoints Documentation`, page: currentPage });
            currentPage += apiPages + 1;
        }

        if (includeAppendix) {
            const sectionNumber = docType === 'both' ? '4' : docType === 'process-flow' && selectedServices.length > 0 ? '3' : docType === 'api' ? '3' : '2';
            tocItems.push({ title: `${sectionNumber}. Appendix`, page: currentPage });
        }

        const docTypeLabel = docType === 'both' ? 'Process Flow & API Documentation' : docType === 'process-flow' ? 'Process Flow Documentation' : 'API Endpoints Documentation';

        return (
            <Document>
                {/* Cover Page */}
                <Page size="A4" style={styles.coverPage}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Image src="/assets/logo/cb-logo-256.png" style={{ width: 150, height: 150, marginBottom: 30 }} />
                        <Text style={styles.coverTitle}>{projectName}</Text>
                        <Text style={styles.coverSubtitle}>Technical Documentation</Text>

                        <View style={{ marginTop: 50, padding: 20, backgroundColor: '#f8fafc', borderRadius: 10, width: '80%' }}>
                            <Text style={styles.coverMeta}>Technical Documentation</Text>
                            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 10 }}>{docTypeLabel}</Text>
                            <Text style={{ fontSize: 12, textAlign: 'center', color: '#718096' }}>
                                Version 1.0 {'\u2022'} {moment().format('MMMM DD, YYYY')}
                            </Text>
                        </View>

                        <View style={{ marginTop: 40 }}>
                            <Text style={styles.coverDate}>Generated: {moment().format('DD/MM/YYYY HH:mm')}</Text>
                            <Text style={[styles.coverDate, { marginTop: 5 }]}>Generated by: {user?.name || user?.email || 'System Administrator'}</Text>
                        </View>
                    </View>
                    <Text style={styles.pageNumber}>Page 1 of {pageCount}</Text>
                </Page>

                {/* Table of Contents */}
                <Page size="A4" style={styles.page}>
                    <View style={styles.tocContainer}>
                        <Text style={styles.tocTitle}>Table of Contents</Text>
                        {tocItems.map((item, index) => (
                            <View key={index} style={{ flexDirection: 'row', marginBottom: 8 }}>
                                <Text style={styles.tocItem}>{item.title}</Text>
                                <Text style={[styles.tocItem, { flex: 1, textAlign: 'right' }]}>{item.page}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ marginTop: 30 }}>
                        <Text style={styles.h4}>Document Information</Text>
                        <View style={[styles.table, { marginTop: 10 }]}>
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.bold]}>Document Type:</Text>
                                <Text style={styles.tableCell}>{docTypeLabel}</Text>
                            </View>
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.bold]}>Generated:</Text>
                                <Text style={styles.tableCell}>{moment().format('DD/MM/YYYY HH:mm')}</Text>
                            </View>
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.bold]}>Generated By:</Text>
                                <Text style={styles.tableCell}>{user?.name || user?.email || 'System Administrator'}</Text>
                            </View>
                            {docType !== 'api' && selectedServices.length > 0 && (
                                <View style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.bold]}>Process Flows:</Text>
                                    <Text style={styles.tableCell}>{selectedServices.length} service(s)</Text>
                                </View>
                            )}
                            {docType !== 'process-flow' && (
                                <View style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.bold]}>API Endpoints:</Text>
                                    <Text style={styles.tableCell}>{apiEndpointsData.length} service(s)</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <Text style={styles.pageNumber}>Page 2 of {pageCount}</Text>
                </Page>

                {/* Introduction Section */}
                {includeIntroduction && (
                    <Page size="A4" style={styles.page}>
                        {renderIntroductionSection()}
                        <Text style={styles.pageNumber}>Page 3 of {pageCount}</Text>
                    </Page>
                )}

                {/* Process Flow Section */}
                {docType !== 'api' && selectedServices.length > 0 && (
                    <>
                        <Page size="A4" style={styles.page}>
                            <View style={styles.sectionContainer}>
                                <Text style={styles.h1}>2. Process Flow Documentation</Text>
                                <Text style={styles.paragraph}>This section provides detailed documentation of the process flows within the application. Each service includes step-by-step instructions, workflow descriptions, and operational procedures.</Text>

                                <View style={styles.infoBox}>
                                    <Text style={[styles.paragraph, styles.bold]}>Section Overview:</Text>
                                    <Text style={styles.paragraph}>
                                        {'\u2022'} {selectedServices.length} documented service(s)
                                    </Text>
                                    <Text style={styles.paragraph}>{'\u2022'} Covers all major workflow processes</Text>
                                    <Text style={styles.paragraph}>{'\u2022'} Includes operational procedures and best practices</Text>
                                </View>
                            </View>
                            <Text style={styles.pageNumber}>
                                Page {includeIntroduction ? '4' : '3'} of {pageCount}
                            </Text>
                        </Page>

                        {processFlowContent
                            .filter((item) => selectedServices.includes(item.serviceName))
                            .sort((a, b) => a.serviceName.localeCompare(b.serviceName))
                            .map((item, index) => {
                                const htmlElements = parseHtmlContent(item.content);
                                return (
                                    <Page key={`process-${index}`} size="A4" style={styles.page}>
                                        <View style={styles.sectionContainer}>
                                            <View style={styles.sectionHeader}>
                                                <Text style={styles.sectionTitle}>{formatServiceName(item.serviceName)}</Text>
                                                <Text style={styles.sectionMeta}>
                                                    Service {index + 1} of {selectedServices.length}
                                                </Text>
                                            </View>

                                            <View style={styles.contentContainer}>{renderHtmlElements(htmlElements)}</View>

                                            {item.updatedAt && (
                                                <View style={styles.note}>
                                                    <Text>Last updated: {moment(item.updatedAt).format('DD/MM/YYYY')}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.pageNumber}>
                                            Page {includeIntroduction ? index + 5 : index + 4} of {pageCount}
                                        </Text>
                                    </Page>
                                );
                            })}
                    </>
                )}

                {/* API Endpoints Section */}
                {docType !== 'process-flow' && (
                    <>
                        <Page size="A4" style={styles.page}>
                            <View style={styles.sectionContainer}>
                                <Text style={styles.h1}>
                                    {docType === 'both' && selectedServices.length > 0 ? '3. ' : '2. '}
                                    API Endpoints Documentation
                                </Text>
                                <Text style={styles.paragraph}>This section provides comprehensive API documentation for the application backend. The API follows RESTful conventions and returns JSON responses.</Text>

                                <Text style={styles.h3}>Base URL</Text>
                                <Text style={styles.code}>{typeof window !== 'undefined' ? window.location.origin : ''}/api/v1</Text>

                                <Text style={styles.h3}>Authentication</Text>
                                <Text style={styles.paragraph}>Most endpoints require JWT authentication. Include the token in the Authorization header:</Text>
                                <Text style={styles.code}>{'Authorization: Bearer <your_jwt_token>'}</Text>

                                <View style={styles.infoBox}>
                                    <Text style={[styles.paragraph, styles.bold]}>API Conventions:</Text>
                                    <Text style={styles.paragraph}>{'\u2022'} GET: Retrieve data</Text>
                                    <Text style={styles.paragraph}>{'\u2022'} POST: Create new resources</Text>
                                    <Text style={styles.paragraph}>{'\u2022'} PUT: Update existing resources</Text>
                                    <Text style={styles.paragraph}>{'\u2022'} DELETE: Remove resources</Text>
                                    <Text style={styles.paragraph}>{'\u2022'} PATCH: Partial updates</Text>
                                </View>
                            </View>
                            <Text style={styles.pageNumber}>
                                Page {(includeIntroduction ? 1 : 0) + (docType !== 'api' && selectedServices.length > 0 ? selectedServices.length + 2 : 1)} of {pageCount}
                            </Text>
                        </Page>

                        {apiEndpointsData.map((service, serviceIndex) => (
                            <Page key={`api-${serviceIndex}`} size="A4" style={styles.page}>
                                <View style={styles.sectionContainer}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>{service.service}</Text>
                                        <Text style={styles.sectionMeta}>{service.endpoints.length} endpoint(s)</Text>
                                    </View>

                                    {service.endpoints.map((endpoint, endpointIndex) => (
                                        <View
                                            key={endpointIndex}
                                            style={{
                                                marginBottom: 15,
                                                padding: 10,
                                                backgroundColor: '#f8fafc',
                                                borderRadius: 4,
                                                borderLeft: '3pt solid #4299e1'
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                <View style={[styles.endpointBadge, styles[`${endpoint.method.toLowerCase()}Badge`]]}>
                                                    <Text>{endpoint.method}</Text>
                                                </View>
                                                <Text style={{ fontFamily: 'Helvetica', fontSize: 11 }}>{endpoint.path}</Text>
                                            </View>

                                            <Text style={[styles.paragraph, styles.bold]}>{endpoint.description}</Text>

                                            {endpoint.parameters && endpoint.parameters.length > 0 && (
                                                <View style={{ marginTop: 8 }}>
                                                    <Text style={styles.h4}>Parameters:</Text>
                                                    <View style={styles.bulletListContainer}>
                                                        {endpoint.parameters.slice(0, 5).map((param, idx) => (
                                                            <View key={idx} style={styles.bulletListItem}>
                                                                <Text style={styles.bulletPoint}>{'\u2022'}</Text>
                                                                <Text style={styles.paragraph}>
                                                                    <Text style={styles.bold}>{param.name || 'N/A'}</Text>: {param.description || 'No description'} ({param.schema?.type || 'string'}){param.required ? ' (Required)' : ' (Optional)'}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                        {endpoint.parameters.length > 5 && <Text style={[styles.paragraph, styles.italic]}>...and {endpoint.parameters.length - 5} more parameters</Text>}
                                                    </View>
                                                </View>
                                            )}

                                            <View style={{ marginTop: 8 }}>
                                                <Text style={styles.h4}>Responses:</Text>
                                                {Object.entries(endpoint.responses || {})
                                                    .slice(0, 3)
                                                    .map(([code, response], idx) => (
                                                        <View key={idx} style={{ marginBottom: 4 }}>
                                                            <Text style={[styles.paragraph, styles.bold]}>
                                                                {code}: {response.description || 'Success/Error'}
                                                            </Text>
                                                        </View>
                                                    ))}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                                <Text style={styles.pageNumber}>
                                    Page {(includeIntroduction ? 1 : 0) + (docType !== 'api' && selectedServices.length > 0 ? selectedServices.length + 2 : 1) + serviceIndex + 1} of {pageCount}
                                </Text>
                            </Page>
                        ))}
                    </>
                )}

                {/* Appendix Page */}
                {includeAppendix && (
                    <Page size="A4" style={styles.page}>
                        <View style={styles.sectionContainer}>
                            <Text style={styles.h1}>
                                {docType === 'both' && selectedServices.length > 0 ? '4. ' : docType === 'process-flow' && selectedServices.length > 0 ? '3. ' : docType === 'api' ? '3. ' : '2. '}
                                Appendix
                            </Text>

                            <Text style={styles.h3}>Document Information</Text>
                            <View style={styles.table}>
                                <View style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.tableHeader]}>Property</Text>
                                    <Text style={[styles.tableCell, styles.tableHeader]}>Value</Text>
                                </View>
                                {[
                                    ['Document Title:', `${projectName} Technical Documentation`],
                                    ['Document Type:', docTypeLabel],
                                    ['Generated Date:', moment().format('DD/MM/YYYY HH:mm')],
                                    ['Generated By:', user?.name || user?.email || 'System Administrator'],
                                    ['Total Pages:', String(pageCount)]
                                ].map(([label, value], idx) => (
                                    <View key={idx} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, styles.bold]}>{label}</Text>
                                        <Text style={styles.tableCell}>{value}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={{ marginTop: 25 }}>
                                <Text style={styles.h3}>Standard HTTP Response Codes</Text>
                                <View style={styles.table}>
                                    <View style={styles.tableRow}>
                                        <Text style={[styles.tableCell, styles.tableHeader]}>HTTP Code</Text>
                                        <Text style={[styles.tableCell, styles.tableHeader]}>Description</Text>
                                    </View>
                                    {[
                                        ['200', 'OK - Request successful'],
                                        ['201', 'Created - Resource created successfully'],
                                        ['400', 'Bad Request - Invalid input'],
                                        ['401', 'Unauthorized - Invalid or missing token'],
                                        ['404', 'Not Found - Resource not found'],
                                        ['500', 'Internal Server Error']
                                    ].map(([code, desc], idx) => (
                                        <View key={idx} style={styles.tableRow}>
                                            <Text style={[styles.tableCell, styles.bold]}>{code}</Text>
                                            <Text style={styles.tableCell}>{desc}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View style={{ marginTop: 25 }}>
                                <Text style={styles.h3}>Document History</Text>
                                <View style={styles.table}>
                                    <View style={styles.tableRow}>
                                        <Text style={[styles.tableCell, styles.bold]}>Version</Text>
                                        <Text style={[styles.tableCell, styles.bold]}>Date</Text>
                                        <Text style={[styles.tableCell, styles.bold]}>Changes</Text>
                                    </View>
                                    <View style={styles.tableRow}>
                                        <Text style={styles.tableCell}>1.0</Text>
                                        <Text style={styles.tableCell}>{moment().format('DD/MM/YYYY')}</Text>
                                        <Text style={styles.tableCell}>Initial Release</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.infoBox, { marginTop: 25 }]}>
                                <Text style={[styles.paragraph, styles.bold]}>For Support and Questions:</Text>
                                <Text style={styles.paragraph}>{'\u2022'} Contact: IT Support Team</Text>
                                <Text style={styles.paragraph}>{'\u2022'} Email: support@codebridge.com</Text>
                                <Text style={styles.paragraph}>{'\u2022'} Phone: +1 (555) 123-4567</Text>
                            </View>
                        </View>
                        <Text style={styles.pageNumber}>
                            Page {pageCount} of {pageCount}
                        </Text>
                    </Page>
                )}
            </Document>
        );
    };

    // Generate PDF
    const generatePDF = async () => {
        if ((documentationType !== 'api' && selectedServices.length === 0) || (documentationType !== 'process-flow' && apiEndpoints.length === 0)) {
            console.warn('No content selected for generation');
            return;
        }

        setIsGenerating(true);
        setGenerationProgress(10);

        for (let i = 0; i < 5; i++) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            setGenerationProgress(20 + i * 16);
        }

        try {
            const filteredContent = pdfContent.filter((item) => selectedServices.includes(item.serviceName));

            const blob = await pdf(<PDFDocument processFlowContent={filteredContent} apiEndpointsData={apiEndpoints} docType={documentationType} />).toBlob();

            setGenerationProgress(100);

            const timestamp = moment().format('YYYYMMDD-HHmmss');
            let fullFileName;
            if (documentationType === 'process-flow') {
                fullFileName = `${projectName}-Process-Flow-${timestamp}.pdf`;
            } else if (documentationType === 'api') {
                fullFileName = `${projectName}-API-Documentation-${timestamp}.pdf`;
            } else {
                fullFileName = `${projectName}-Technical-Documentation-${timestamp}.pdf`;
            }

            const file = new File([blob], fullFileName, { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            if (fileUploadRef.current) {
                fileUploadRef.current.uploadProgrammatic([file]);
            } else {
                console.error('S3GenerateFile ref not available');
            }

            setPdfReady(true);
        } catch (error) {
            console.error('Error generating PDF:', error);
            setGenerationProgress(0);
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle S3 upload complete
    const handleUploadComplete = async (ids) => {
        if (!ids || ids.length === 0) {
            console.error('No document IDs returned from upload');
            return;
        }

        try {
            const uploadedId = ids[0];
            setDocumentStorageId(uploadedId);

            const newDetail = await client.service('documentationDetails').create({
                fileName: `${fileName}.pdf`,
                documentationFile: uploadedId,
                documentationType: documentationType,
                createdBy: user._id,
                updatedBy: user._id
            });

            if (onGenerateComplete) {
                const populatedDetail = await client.service('documentationDetails').get(newDetail._id, {
                    query: {
                        $populate: [
                            {
                                path: 'documentationFile',
                                service: 'document_storages',
                                select: ['name', 'url']
                            }
                        ]
                    }
                });
                onGenerateComplete(populatedDetail);
            }

            setPdfReady(false);
            setGenerationProgress(0);
            onHide();
        } catch (error) {
            console.error('Error creating documentationDetails record:', error);
        }
    };

    const handleDownload = () => {
        if (downloadUrl) {
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${fileName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
            setDownloadUrl('');
        }
    };

    const docTypeLabel = documentationType === 'both' ? 'Process Flow & API' : documentationType === 'process-flow' ? 'Process Flow Only' : 'API Endpoints Only';

    const dialogFooter = (
        <div>
            {!pdfReady ? (
                <div className="flex justify-content-end gap-2">
                    <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" />
                    <Button label="Generate &amp; Store PDF" icon="pi pi-file-pdf" onClick={generatePDF} disabled={(documentationType !== 'api' && selectedServices.length === 0) || isGenerating || (documentationType !== 'process-flow' && isFetchingAPIs)} loading={isGenerating} />
                </div>
            ) : (
                <div className="flex justify-content-between">
                    <Button
                        label="Back"
                        icon="pi pi-arrow-left"
                        onClick={() => {
                            setPdfReady(false);
                            setDownloadUrl('');
                        }}
                        className="p-button-text"
                    />
                    <div className="flex gap-2">
                        <Button label="Preview" icon="pi pi-eye" onClick={() => window.open(downloadUrl, '_blank')} className="p-button-info" />
                        <Button label="Download" icon="pi pi-download" onClick={handleDownload} className="p-button-success" />
                        <Button label="Close" icon="pi pi-times" onClick={onHide} />
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <S3GenerateFile type="create" user={user} id={null} serviceName="documentationDetails" onUploadComplete={handleUploadComplete} style={{ display: 'none' }} ref={fileUploadRef} />
            <Dialog header={pdfReady ? 'PDF Generated &amp; Stored Successfully' : `Generate ${projectName} Technical Documentation`} visible={show} onHide={onHide} style={{ width: '55vw', minWidth: '500px' }} footer={dialogFooter} draggable={false} resizable={false}>
                {!pdfReady ? (
                    <div className="p-fluid">
                        <div className="field mb-4">
                            <label htmlFor="fileName" className="font-bold block mb-2">
                                File Name
                            </label>
                            <InputText id="fileName" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Enter file name (without extension)" className="w-full" />
                            <small className="text-gray-500">.pdf extension will be added automatically</small>
                        </div>

                        <div className="field mb-4">
                            <label className="font-bold block mb-2">Documentation Type</label>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { value: 'both', label: 'Both (Process Flow & API)' },
                                    { value: 'process-flow', label: 'Process Flow Only' },
                                    { value: 'api', label: 'API Endpoints Only' }
                                ].map(({ value, label }) => (
                                    <div key={value} className="flex align-items-center">
                                        <input type="radio" id={value} name="docType" value={value} checked={documentationType === value} onChange={(e) => setDocumentationType(e.target.value)} className="mr-2" />
                                        <label htmlFor={value}>{label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="field mb-4">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex align-items-center">
                                    <Checkbox inputId="includeIntroduction" checked={includeIntroduction} onChange={(e) => setIncludeIntroduction(e.checked)} />
                                    <label htmlFor="includeIntroduction" className="ml-2 cursor-pointer">
                                        Include Introduction
                                    </label>
                                </div>
                                <div className="flex align-items-center">
                                    <Checkbox inputId="includeAppendix" checked={includeAppendix} onChange={(e) => setIncludeAppendix(e.checked)} />
                                    <label htmlFor="includeAppendix" className="ml-2 cursor-pointer">
                                        Include Appendix
                                    </label>
                                </div>
                            </div>
                        </div>

                        {documentationType !== 'api' && (
                            <div className="field mb-4">
                                <div className="flex justify-content-between align-items-center mb-3">
                                    <label className="font-bold block">Select Process Flow Services ({filteredServices.length} available)</label>
                                    <div className="flex gap-2">
                                        <Button label={`${getSelectedFilteredCount() === filteredServices.length ? 'Deselect' : 'Select'} All`} onClick={selectAllFilteredServices} className="p-button-outlined p-button-sm" disabled={filteredServices.length === 0} />
                                        <Button label="Clear All" onClick={() => setSelectedServices([])} className="p-button-text p-button-sm" disabled={selectedServices.length === 0} />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">
                                            <i className="pi pi-search" />
                                        </span>
                                        <InputText value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search services by name..." className="w-full" />
                                        {searchTerm && <Button icon="pi pi-times" className="p-button-text" onClick={clearSearch} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} />}
                                    </div>
                                    {searchTerm && (
                                        <small className="text-gray-500 mt-1 block">
                                            Found {filteredServices.length} service(s) matching &quot;{searchTerm}&quot;
                                        </small>
                                    )}
                                </div>

                                <div className="border-1 border-300 p-3 rounded" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    {filteredServices.length === 0 ? (
                                        <Message severity="info" text={searchTerm ? `No services found matching "${searchTerm}"` : 'No services found in the database'} className="w-full" />
                                    ) : (
                                        <div className="grid">
                                            {filteredServices.map((service, index) => (
                                                <div key={index} className="col-12 md:col-6">
                                                    <div className={`flex align-items-center mb-3 p-2 hover:bg-gray-100 rounded cursor-pointer ${selectedServices.includes(service) ? 'bg-blue-50 border-1 border-blue-200' : ''}`} onClick={() => onServiceSelect(service)}>
                                                        <Checkbox inputId={`service-${index}`} checked={selectedServices.includes(service)} onChange={() => onServiceSelect(service)} className="mr-2" />
                                                        <label htmlFor={`service-${index}`} className="cursor-pointer flex-1">
                                                            <div className="font-medium">{formatServiceName(service)}</div>
                                                            <div className="text-sm text-gray-500">{service}</div>
                                                        </label>
                                                        {selectedServices.includes(service) && <i className="pi pi-check text-green-500 ml-2" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedServices.length > 0 && (
                                    <div className="mt-3 p-3 bg-blue-50 border-round">
                                        <div className="flex align-items-center justify-content-between">
                                            <div className="flex align-items-center">
                                                <i className="pi pi-info-circle text-blue-500 mr-2" />
                                                <span className="font-medium">{selectedServices.length} service(s) selected</span>
                                            </div>
                                            <span className="text-sm text-blue-600">
                                                {getSelectedFilteredCount()}/{filteredServices.length} in current view
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mb-4">
                            <p className="font-medium mb-2">Document Includes:</p>
                            <div className="bg-gray-50 p-3 rounded">
                                <ul className="list-disc pl-5">
                                    <li>Professional cover page with project branding</li>
                                    <li>Detailed table of contents with page numbers</li>
                                    {includeIntroduction && <li>Comprehensive introduction section</li>}
                                    {documentationType !== 'api' && selectedServices.length > 0 && <li>Process Flow documentation for {selectedServices.length} service(s)</li>}
                                    {documentationType !== 'process-flow' && <li>API Endpoints documentation for {isFetchingAPIs ? 'fetching...' : `${apiEndpoints.length}`} service(s)</li>}
                                    {includeAppendix && <li>Appendix with error codes and document history</li>}
                                </ul>
                            </div>
                        </div>

                        {isGenerating && (
                            <div className="text-center p-4 border-round bg-gray-50">
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                <p className="mt-3 font-medium">Generating PDF... {generationProgress}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${generationProgress}%` }} />
                                </div>
                                <p className="text-sm text-gray-600 mt-2">Creating professional documentation with table of contents and formatted content...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <i className="pi pi-check-circle text-6xl text-green-500 mb-3" />
                        <h3 className="mb-2">PDF Generated &amp; Stored!</h3>
                        <p className="text-gray-600 mb-4">Technical Documentation has been generated with professional formatting.</p>
                        <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
                            <h4 className="mb-3">Document Details</h4>
                            <div className="grid">
                                <div className="col-6">
                                    <p>
                                        <strong>File:</strong> {fileName}.pdf
                                    </p>
                                    <p>
                                        <strong>Type:</strong> {docTypeLabel}
                                    </p>
                                    <p>
                                        <strong>Includes:</strong> Cover Page, TOC, Formatted Content
                                    </p>
                                </div>
                                <div className="col-6">
                                    <p>
                                        <strong>Generated:</strong> {moment().format('DD/MM/YYYY HH:mm')}
                                    </p>
                                    <p>
                                        <strong>Storage:</strong> S3 &amp; Documentation Details
                                    </p>
                                    <p>
                                        <strong>Generated By:</strong> {user?.name || 'System'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-left bg-green-50 p-3 rounded border-1 border-green-200">
                            <div className="flex align-items-center">
                                <i className="pi pi-check text-green-500 mr-2" />
                                <span className="font-medium">Professional features included:</span>
                            </div>
                            <ul className="mt-2 ml-4">
                                <li>Table of contents with page numbers</li>
                                <li>Proper header/footer on each page</li>
                                <li>Section headers and organized content</li>
                                <li>Formatted API endpoints with badges</li>
                                <li>Appendix with standard error responses</li>
                            </ul>
                        </div>
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default DocumentationPDFDialogComponent;
