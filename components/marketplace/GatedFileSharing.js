'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, File, AlertTriangle, CheckCircle, XCircle, Shield, Eye, Download } from 'lucide-react';

const GatedFileSharing = ({ 
  conversationId, 
  onFileUpload, 
  onFileShare, 
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedFileTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  enableContactScanning = true,
  showSecurityNotice = true,
  adminMode = false
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Simulated contact detection patterns (in production, this would call the backend)
  const contactPatterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    social: /@[A-Za-z0-9._]+|instagram\.com\/|twitter\.com\/|facebook\.com\/|linkedin\.com\/in\//gi,
    website: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
  };

  const validateFileType = (file) => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    
    // Check against allowed types
    return allowedFileTypes.some(type => {
      if (type.includes('*')) {
        return fileType.startsWith(type.replace('*', ''));
      } else if (type.startsWith('.')) {
        return fileName.endsWith(type);
      } else {
        return fileType === type;
      }
    });
  };

  const validateFileSize = (file) => {
    return file.size <= maxFileSize;
  };

  const scanFileName = (fileName) => {
    const violations = [];
    let riskScore = 0;
    
    Object.entries(contactPatterns).forEach(([type, pattern]) => {
      const matches = fileName.match(pattern);
      if (matches) {
        violations.push({
          type: type,
          matches: matches,
          severity: type === 'email' || type === 'phone' ? 'HIGH' : 'MEDIUM'
        });
        riskScore += type === 'email' || type === 'phone' ? 3 : 2;
      }
    });

    return {
      violations,
      riskScore: Math.min(riskScore, 4),
      isClean: violations.length === 0
    };
  };

  const scanFileContent = async (file) => {
    // For text files and PDFs, we would scan content
    // For images, we would use OCR or metadata scanning
    // This is a simplified simulation
    
    if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          const violations = [];
          let riskScore = 0;
          
          Object.entries(contactPatterns).forEach(([type, pattern]) => {
            const matches = content.match(pattern);
            if (matches) {
              violations.push({
                type: type,
                matches: matches.slice(0, 5), // Limit to first 5 matches
                severity: type === 'email' || type === 'phone' ? 'HIGH' : 'MEDIUM'
              });
              riskScore += type === 'email' || type === 'phone' ? 3 : 2;
            }
          });

          resolve({
            violations,
            riskScore: Math.min(riskScore, 4),
            isClean: violations.length === 0,
            scannedContent: true
          });
        };
        reader.readAsText(file);
      });
    }
    
    // For other file types, only scan filename and metadata
    return Promise.resolve({
      violations: [],
      riskScore: 0,
      isClean: true,
      scannedContent: false
    });
  };

  const handleFileSelection = async (selectedFiles) => {
    setError('');
    setSuccess('');
    
    const validFiles = [];
    const errors = [];

    for (let file of selectedFiles) {
      // Validate file type
      if (!validateFileType(file)) {
        errors.push(`${file.name}: File type not allowed`);
        continue;
      }

      // Validate file size
      if (!validateFileSize(file)) {
        errors.push(`${file.name}: File too large (max ${(maxFileSize / 1024 / 1024).toFixed(1)}MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length === 0) return;

    // Scan files if contact scanning is enabled
    if (enableContactScanning) {
      setScanning(true);
      const results = {};

      for (let file of validFiles) {
        const fileNameScan = scanFileName(file.name);
        const contentScan = await scanFileContent(file);
        
        results[file.name] = {
          fileName: fileNameScan,
          content: contentScan,
          overallRisk: Math.max(fileNameScan.riskScore, contentScan.riskScore),
          isBlocked: Math.max(fileNameScan.riskScore, contentScan.riskScore) >= 3
        };
      }

      setScanResults(results);
      setScanning(false);
    }

    setFiles(validFiles);
  };

  const handleFileUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      // Filter out blocked files
      const allowedFiles = files.filter(file => {
        const result = scanResults[file.name];
        return !result || !result.isBlocked;
      });

      if (allowedFiles.length === 0) {
        setError('All files blocked due to policy violations');
        setUploading(false);
        return;
      }

      // Simulate upload process
      for (let file of allowedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversation_id', conversationId);
        formData.append('scan_results', JSON.stringify(scanResults[file.name] || {}));

        // In production, this would call the backend API
        // const response = await fetch('/api/files/upload', {
        //   method: 'POST',
        //   body: formData
        // });
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setSuccess(`${allowedFiles.length} file(s) uploaded successfully`);
      
      if (onFileUpload) {
        onFileUpload(allowedFiles, scanResults);
      }

      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
        setScanResults({});
        setSuccess('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);

    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getRiskBadge = (riskScore) => {
    if (riskScore === 0) return <Badge className="bg-green-500">Clean</Badge>;
    if (riskScore === 1) return <Badge className="bg-yellow-500">Low Risk</Badge>;
    if (riskScore === 2) return <Badge className="bg-orange-500">Medium Risk</Badge>;
    if (riskScore >= 3) return <Badge className="bg-red-500">High Risk</Badge>;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Secure File Sharing</span>
        </CardTitle>
        {showSecurityNotice && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Files are automatically scanned for contact information to prevent platform bypass. 
              Suspicious files may be blocked or reviewed by admins.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">Click to select files or drag and drop</p>
          <p className="text-sm text-gray-500 mt-1">
            Max {(maxFileSize / 1024 / 1024).toFixed(1)}MB • {allowedFileTypes.join(', ')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={allowedFileTypes.join(',')}
            onChange={(e) => handleFileSelection(Array.from(e.target.files || []))}
          />
        </div>

        {/* Error Messages */}
        {error && (
          <Alert className="border-red-500">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Messages */}
        {success && (
          <Alert className="border-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Scanning Status */}
        {scanning && (
          <Alert>
            <Shield className="h-4 w-4 animate-spin" />
            <AlertDescription>Scanning files for contact information...</AlertDescription>
          </Alert>
        )}

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Selected Files</h4>
            {files.map((file, index) => {
              const scanResult = scanResults[file.name];
              const isBlocked = scanResult?.isBlocked || false;
              
              return (
                <Card key={index} className={`p-3 ${isBlocked ? 'border-red-500 bg-red-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <File className="w-4 h-4" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {scanResult && getRiskBadge(scanResult.overallRisk)}
                      {isBlocked && (
                        <Badge className="bg-red-500">Blocked</Badge>
                      )}
                    </div>
                  </div>

                  {/* Scan Results Details */}
                  {scanResult && (adminMode || scanResult.overallRisk > 0) && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs space-y-1">
                        {scanResult.fileName.violations.length > 0 && (
                          <p className="text-red-600">
                            <strong>Filename violations:</strong> {
                              scanResult.fileName.violations.map(v => v.type).join(', ')
                            }
                          </p>
                        )}
                        {scanResult.content.violations.length > 0 && (
                          <p className="text-red-600">
                            <strong>Content violations:</strong> {
                              scanResult.content.violations.map(v => v.type).join(', ')
                            }
                          </p>
                        )}
                        {isBlocked && (
                          <p className="text-red-600 font-medium">
                            This file is blocked due to policy violations
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="flex space-x-2">
            <Button 
              onClick={handleFileUpload} 
              disabled={uploading || scanning}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Shield className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setFiles([]);
                setScanResults({});
                setError('');
                setSuccess('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Clear
            </Button>
          </div>
        )}

        {/* File Sharing Controls */}
        {onFileShare && files.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Sharing Options</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" onClick={() => onFileShare('platform_only')}>
                <Shield className="w-4 h-4 mr-2" />
                Platform-Only Sharing
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFileShare('admin_review')}>
                <Eye className="w-4 h-4 mr-2" />
                Request Admin Review
              </Button>
            </div>
          </div>
        )}

        {/* Security Information */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>🔒 All files are scanned for security compliance</p>
          <p>🛡️ Contact information sharing is monitored</p>
          <p>👨‍💼 Suspicious activity is reviewed by administrators</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GatedFileSharing;