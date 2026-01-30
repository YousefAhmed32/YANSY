import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, File } from 'lucide-react';
import api from '../utils/api';

const FileUpload = ({ projectId, onUploaded, onFilesUploaded, multiple = false }) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (multiple) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    } else {
      setFiles(selectedFiles);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      if (projectId) {
        formData.append('project', projectId);
      }

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      const uploadedFiles = response.data.files || [];
      setFiles([]);
      setProgress(0);
      if (onUploaded) {
        onUploaded(uploadedFiles);
      }
      if (onFilesUploaded) {
        onFilesUploaded(uploadedFiles);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <div className="mb-4">
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-white/20 border-dashed rounded cursor-pointer bg-white/5 hover:bg-white/10 hover:border-[#d4af37]/50 transition-all duration-300">
          <div className="flex flex-col items-center justify-center pt-4 pb-4">
            <Upload className="w-6 h-6 mb-2 text-white/60" />
            <p className="mb-1 text-xs font-light text-white/60">
              <span className="text-[#d4af37]">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-white/40">
              Images, PDF, DOC (MAX. 10MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={uploading}
            accept="image/*,.pdf,.doc,.docx"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="mb-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded"
            >
              <div className="flex items-center flex-1 min-w-0">
                <File className="h-4 w-4 text-white/60 mr-2 flex-shrink-0" />
                <span className="text-xs text-white/70 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-white/40 ml-2">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 text-white/60 hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className="bg-[#d4af37] h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-white/50 mt-1 text-center font-light">
            {progress}% Uploading...
          </p>
        </div>
      )}

      {files.length > 0 && !uploading && (
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="px-4 py-2 bg-[#d4af37] text-black hover:bg-[#f4d03f] transition-colors text-xs font-light tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

